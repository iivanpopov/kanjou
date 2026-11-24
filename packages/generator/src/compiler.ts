import type { Model } from 'messageformat'

const SIMPLE_IDENT_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
const TEMPLATE_ESCAPE_RE = /[\\`\r\n]|\$\{/g
const TEMPLATE_OPEN = '$' + '{'

const TEMPLATE_ESCAPES: Readonly<Record<string, string>> = {
  '\\': '\\\\',
  '`': '\\`',
  '\r': '\\r',
  '\n': '\\n',
  [TEMPLATE_OPEN]: '\\' + TEMPLATE_OPEN,
}

const BUILTIN_FUNCTIONS = new Set([
  'string',
  'number',
  'integer',
  'offset',
  'currency',
  'percent',
  'unit',
  'date',
  'time',
  'datetime',
])

const NUMBER_INT_OPTIONS = new Set([
  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
  'roundingIncrement',
])

const NUMBER_STR_OPTIONS = new Set([
  'roundingMode',
  'roundingPriority',
  'signDisplay',
  'trailingZeroDisplay',
  'useGrouping',
])

const PLURAL_KEYS = new Set(['zero', 'one', 'two', 'few', 'many', 'other'])

const DATE_FIELDS_VALUES = new Set([
  'weekday',
  'day-weekday',
  'month-day',
  'month-day-weekday',
  'year-month-day',
  'year-month-day-weekday',
])

const DATE_LENGTH_VALUES = new Set(['long', 'medium', 'short'])
const TIME_PRECISION_VALUES = new Set(['hour', 'minute', 'second'])
const TIME_ZONE_STYLE_VALUES = new Set(['long', 'short'])

const DIRECT_DATE_OPTIONS = new Set([
  'dateStyle',
  'timeStyle',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'weekday',
  'era',
  'timeZoneName',
  'hourCycle',
  'formatMatcher',
])

const DIRECT_DATE_FIELDS = new Set(['year', 'month', 'day', 'weekday', 'era'])
const DIRECT_TIME_FIELDS = new Set(['hour', 'minute', 'second', 'timeZoneName'])

interface LocalBinding {
  kind: 'raw' | 'number' | 'date' | 'string' | 'custom'
  rawExpr: string
  fallbackName?: string | undefined
  intlOptsExpr?: string | undefined
  selectOptsExpr?: string | undefined
}

interface CompileContext {
  scope: Map<string, LocalBinding>
  tempCounter: number
  needsRuntime: boolean
  hoist: (expr: string) => string
}

export function createConstantPool() {
  const constants = new Map<string, string>()
  return {
    hoist(this: void, expr: string): string {
      let name = constants.get(expr)
      if (name === undefined) {
        name = `_c${constants.size}`
        constants.set(expr, name)
      }
      return name
    },
    emit(): string {
      return [...constants].map(([expr, name]) => `const ${name}=${expr};\n`).join('')
    },
  }
}

function escapeTemplateChunk(str: string): string {
  return str.replace(TEMPLATE_ESCAPE_RE, (ch) => TEMPLATE_ESCAPES[ch] ?? ch)
}

function buildOwnRootAccess(name: string): string {
  const key = JSON.stringify(name)
  if (name in Object.prototype) {
    if (SIMPLE_IDENT_RE.test(name)) {
      return `(v&&Object.hasOwn(v,${key})?v.${name}:undefined)`
    }
    return `(v&&Object.hasOwn(v,${key})?v[${key}]:undefined)`
  }
  return SIMPLE_IDENT_RE.test(name) ? `v?.${name}` : `v?.[${key}]`
}

function buildVarAccess(name: string): string {
  if (!name.includes('.')) return buildOwnRootAccess(name)

  const segments = name.split('.')
  const first = segments[0]
  if (first === undefined) return buildOwnRootAccess(name)

  const rest = segments.slice(1)
  const root = buildOwnRootAccess(first)
  const nestedTail = rest.every((s) => SIMPLE_IDENT_RE.test(s))
    ? rest.map((s) => `?.${s}`).join('')
    : rest.map((s) => `?.[${JSON.stringify(s)}]`).join('')

  return `(${buildOwnRootAccess(name)}??${root}${nestedTail})`
}

function isSimplePatternMessage(ast: Model.Message): boolean {
  if (ast.type !== 'message' || ast.declarations.length > 0) return false
  return ast.pattern.every(
    (part) =>
      typeof part === 'string' ||
      (part.type === 'expression' && part.arg?.type === 'variable' && !part.functionRef),
  )
}

function patternHasMarkup(pattern: Model.Pattern): boolean {
  return pattern.some((part) => typeof part !== 'string' && part.type === 'markup')
}

function messageHasMarkup(ast: Model.Message): boolean {
  if (ast.type === 'message') return patternHasMarkup(ast.pattern)
  return ast.variants.some((variant) => patternHasMarkup(variant.value))
}

function compileSimpleMessage(ast: Model.PatternMessage): string {
  const chunks = ast.pattern.map((part) => {
    if (typeof part === 'string') return escapeTemplateChunk(part)
    const name = (part as Model.Expression & { arg: Model.VariableRef }).arg.name
    const fallback = JSON.stringify(`{$${name}}`)
    return `${TEMPLATE_OPEN}${buildVarAccess(name)}??${fallback}}`
  })
  return `(v)=>\`${chunks.join('')}\``
}

function resolveVarRaw(
  name: string,
  scope: ReadonlyMap<string, LocalBinding>,
  fromInputOnly: boolean,
): string {
  if (!fromInputOnly) {
    const binding = scope.get(name)
    if (binding) return binding.rawExpr
  }
  return buildVarAccess(name)
}

function resolveArgRaw(
  arg: Model.Literal | Model.VariableRef | undefined,
  scope: ReadonlyMap<string, LocalBinding>,
  fromInputOnly: boolean,
): string {
  if (!arg) return 'undefined'
  if (arg.type === 'literal') return JSON.stringify(arg.value)
  return resolveVarRaw(arg.name, scope, fromInputOnly)
}

function resolveOptionValueExpr(
  opt: Model.Literal | Model.VariableRef,
  scope: ReadonlyMap<string, LocalBinding>,
): string {
  if (opt.type === 'literal') return JSON.stringify(opt.value)
  return resolveVarRaw(opt.name, scope, false)
}

function buildObjectLiteral(entries: readonly [string, string][]): string {
  if (entries.length === 0) return '{}'
  const props = entries.map(([k, valExpr]) => {
    const key = SIMPLE_IDENT_RE.test(k) ? k : JSON.stringify(k)
    return `${key}:${valExpr}`
  })
  return `{${props.join(',')}}`
}

function compileCustomOptions(options: Model.Options | undefined, ctx: CompileContext): string {
  if (!options || Object.keys(options).length === 0) return ''
  const entries: [string, string][] = []
  const literalKeys: string[] = []
  for (const [key, val] of Object.entries(options)) {
    if (val.type === 'literal') literalKeys.push(key)
    entries.push([key, resolveOptionValueExpr(val, ctx.scope)])
  }
  const expr = buildObjectLiteral(entries)
  const optsExpr =
    literalKeys.length === entries.length ? ctx.hoist(`Object.freeze(${expr})`) : expr
  return literalKeys.length
    ? `,${optsExpr},${ctx.hoist(JSON.stringify(literalKeys))}`
    : `,${optsExpr}`
}

function compileNumberLikeOptions(
  fnName: 'number' | 'integer' | 'offset' | 'currency' | 'percent' | 'unit',
  options: Model.Options | undefined,
  ctx: CompileContext,
): { intlOptsExpr: string | undefined; selectOptsExpr: string | undefined } {
  const intlEntries: [string, string][] = []
  const selectEntries: [string, string][] = []
  let hasVariableIntlOptions = false
  let hasVariableSelectOptions = false

  if (fnName === 'currency') {
    intlEntries.push(['style', '"currency"'])
  } else if (fnName === 'percent') {
    intlEntries.push(['style', '"percent"'])
    selectEntries.push(['style', '"percent"'])
  } else if (fnName === 'unit') {
    intlEntries.push(['style', '"unit"'])
  } else if (fnName === 'integer') {
    intlEntries.push(['maximumFractionDigits', '0'])
  }

  if (options) {
    for (const [key, val] of Object.entries(options)) {
      if (key === 'select') {
        if (val.type === 'literal') {
          if (val.value === 'exact') {
            selectEntries.push(['select', '"exact"'])
          } else if (val.value === 'ordinal' || val.value === 'cardinal') {
            selectEntries.push(['type', JSON.stringify(val.value)])
          }
        }
        continue
      }

      if (key === 'useGrouping') {
        if (val.type === 'literal') {
          intlEntries.push([
            'useGrouping',
            val.value === 'never' ? 'false' : JSON.stringify(val.value),
          ])
        } else {
          hasVariableIntlOptions = true
          const vExpr = resolveVarRaw(val.name, ctx.scope, false)
          intlEntries.push(['useGrouping', `(${vExpr}==="never"?false:${vExpr})`])
        }
        continue
      }

      if (fnName === 'currency' && key === 'fractionDigits') {
        if (val.type === 'literal' && val.value !== 'auto') {
          const n = Number(val.value)
          if (Number.isInteger(n) && n >= 0) {
            intlEntries.push(['minimumFractionDigits', String(n)])
            intlEntries.push(['maximumFractionDigits', String(n)])
          }
        }
        continue
      }

      if (NUMBER_INT_OPTIONS.has(key)) {
        if (val.type === 'literal') {
          const n = Number(val.value)
          if (Number.isInteger(n) && n >= 0) {
            intlEntries.push([key, String(n)])
            if (
              key === 'minimumFractionDigits' ||
              key === 'maximumFractionDigits' ||
              key === 'minimumSignificantDigits' ||
              key === 'maximumSignificantDigits'
            ) {
              selectEntries.push([key, String(n)])
            }
          }
        } else {
          hasVariableIntlOptions = true
          const numExpr = `Number(${resolveVarRaw(val.name, ctx.scope, false)})`
          intlEntries.push([key, numExpr])
          if (
            key === 'minimumFractionDigits' ||
            key === 'maximumFractionDigits' ||
            key === 'minimumSignificantDigits' ||
            key === 'maximumSignificantDigits'
          ) {
            hasVariableSelectOptions = true
            selectEntries.push([key, numExpr])
          }
        }
        continue
      }

      const isAllowedStr =
        NUMBER_STR_OPTIONS.has(key) ||
        (fnName === 'currency' &&
          (key === 'currency' || key === 'currencyDisplay' || key === 'currencySign')) ||
        (fnName === 'unit' && (key === 'unit' || key === 'unitDisplay'))

      if (isAllowedStr) {
        hasVariableIntlOptions ||= val.type === 'variable'
        intlEntries.push([key, resolveOptionValueExpr(val, ctx.scope)])
      }
    }
  }

  return {
    intlOptsExpr: compileIntlOptions(intlEntries, hasVariableIntlOptions, ctx),
    selectOptsExpr: compileIntlOptions(selectEntries, hasVariableSelectOptions, ctx),
  }
}

function compileIntlOptions(
  entries: readonly [string, string][],
  hasVariableOptions: boolean,
  ctx: CompileContext,
): string | undefined {
  if (entries.length === 0) return undefined
  const expr = buildObjectLiteral(entries)
  if (hasVariableOptions) return expr

  const options = new Map(entries)
  const sortedKeys = [...options.keys()].sort()
  const cacheKey = `{${sortedKeys.map((key) => `${JSON.stringify(key)}:${options.get(key)}`).join(',')}}`
  return ctx.hoist(`[${expr},${JSON.stringify(cacheKey)}]`)
}

function compileDateTimeOptions(
  fnName: 'date' | 'time' | 'datetime',
  options: Model.Options | undefined,
  ctx: CompileContext,
): string | undefined {
  const opts = options ?? {}
  const entries: [string, string][] = []
  let hasDirectStyle = false
  let hasDirectDateField = false
  let hasDirectTimeField = false
  let hasVariableOptions = false

  for (const [key, val] of Object.entries(opts)) {
    if (key === 'dateStyle' || key === 'timeStyle') hasDirectStyle = true
    if (DIRECT_DATE_FIELDS.has(key)) hasDirectDateField = true
    if (DIRECT_TIME_FIELDS.has(key)) hasDirectTimeField = true
    if (key === 'calendar' || key === 'timeZone') {
      if (val.type === 'literal' && val.value === 'input') continue
      hasVariableOptions ||= val.type === 'variable'
      entries.push([key, resolveOptionValueExpr(val, ctx.scope)])
    } else if (key === 'hour12' && fnName !== 'date') {
      if (val.type === 'literal') {
        entries.push(['hour12', val.value === 'true' ? 'true' : 'false'])
      } else {
        hasVariableOptions = true
        entries.push(['hour12', `Boolean(${resolveVarRaw(val.name, ctx.scope, false)})`])
      }
    } else if (DIRECT_DATE_OPTIONS.has(key)) {
      hasVariableOptions ||= val.type === 'variable'
      entries.push([key, resolveOptionValueExpr(val, ctx.scope)])
    }
  }

  if (!hasDirectStyle) {
    if (fnName !== 'time' && !hasDirectDateField) {
      const dfKey = fnName === 'date' ? 'fields' : 'dateFields'
      const dlKey = fnName === 'date' ? 'length' : 'dateLength'
      const dfOpt = opts[dfKey]
      const dlOpt = opts[dlKey]
      const dfVal =
        dfOpt?.type === 'literal' && DATE_FIELDS_VALUES.has(dfOpt.value)
          ? dfOpt.value
          : 'year-month-day'
      const dlVal =
        dlOpt?.type === 'literal' && DATE_LENGTH_VALUES.has(dlOpt.value) ? dlOpt.value : undefined

      const fields = new Set(dfVal.split('-'))
      if (fields.has('year')) entries.push(['year', '"numeric"'])
      if (fields.has('month')) {
        let m = '"short"'
        if (dlVal === 'long') m = '"long"'
        else if (dlVal === 'short') m = '"numeric"'
        entries.push(['month', m])
      }
      if (fields.has('day')) entries.push(['day', '"numeric"'])
      if (fields.has('weekday')) {
        entries.push(['weekday', dlVal === 'long' ? '"long"' : '"short"'])
      }
    }

    if (fnName !== 'date' && !hasDirectTimeField) {
      const tpKey = fnName === 'time' ? 'precision' : 'timePrecision'
      const tpOpt = opts[tpKey]
      const tpVal =
        tpOpt?.type === 'literal' && TIME_PRECISION_VALUES.has(tpOpt.value) ? tpOpt.value : 'minute'

      entries.push(['hour', '"numeric"'])
      if (tpVal !== 'hour') entries.push(['minute', '"numeric"'])
      if (tpVal === 'second') entries.push(['second', '"numeric"'])

      const tzStyle = opts.timeZoneStyle
      if (tzStyle?.type === 'literal' && TIME_ZONE_STYLE_VALUES.has(tzStyle.value)) {
        entries.push(['timeZoneName', JSON.stringify(tzStyle.value)])
      }
    }
  }

  return compileIntlOptions(entries, hasVariableOptions, ctx)
}

function buildOffsetRawExpr(
  operandExpr: string,
  options: Model.Options | undefined,
  scope: ReadonlyMap<string, LocalBinding>,
): string {
  const terms: string[] = []
  if (options?.add) terms.push(`Number(${resolveOptionValueExpr(options.add, scope)})`)
  if (options?.subtract) terms.push(`-Number(${resolveOptionValueExpr(options.subtract, scope)})`)
  if (options?.offset) terms.push(`Number(${resolveOptionValueExpr(options.offset, scope)})`)
  if (terms.length === 0) return operandExpr
  const delta = terms.join('+')
  return `((_n,_d)=>typeof _n==="bigint"?_n+BigInt(Math.trunc(_d)):Number(_n)+_d)(${operandExpr},${delta})`
}

function compileFunctionBinding(
  fnName: string,
  operandExpr: string,
  options: Model.Options | undefined,
  ctx: CompileContext,
): LocalBinding {
  ctx.needsRuntime = true
  if (fnName === 'string') {
    return { kind: 'string', rawExpr: `r.str(${operandExpr})` }
  }

  if (fnName === 'integer') {
    const rounded = `((_n)=>{const _x=typeof _n==="string"&&_n.trim()!==""?Number(_n):_n;return typeof _x==="number"&&Number.isFinite(_x)?Math.round(_x):_x})(${operandExpr})`
    const { intlOptsExpr, selectOptsExpr } = compileNumberLikeOptions('integer', options, ctx)
    return { kind: 'number', rawExpr: rounded, intlOptsExpr, selectOptsExpr }
  }

  if (fnName === 'offset') {
    const adjusted = buildOffsetRawExpr(operandExpr, options, ctx.scope)
    const { intlOptsExpr, selectOptsExpr } = compileNumberLikeOptions('offset', options, ctx)
    return { kind: 'number', rawExpr: adjusted, intlOptsExpr, selectOptsExpr }
  }

  if (fnName === 'number' || fnName === 'currency' || fnName === 'percent' || fnName === 'unit') {
    const { intlOptsExpr, selectOptsExpr } = compileNumberLikeOptions(fnName, options, ctx)
    return { kind: 'number', rawExpr: operandExpr, intlOptsExpr, selectOptsExpr }
  }

  if (fnName === 'date' || fnName === 'time' || fnName === 'datetime') {
    const intlOptsExpr = compileDateTimeOptions(fnName, options, ctx)
    return { kind: 'date', rawExpr: operandExpr, intlOptsExpr }
  }

  const optsExpr = compileCustomOptions(options, ctx)
  return {
    kind: 'custom',
    rawExpr: `r.fn(${JSON.stringify(fnName)},${operandExpr}${optsExpr})`,
  }
}

function formatBindingToString(binding: LocalBinding): string {
  if (binding.kind === 'number') {
    return binding.intlOptsExpr
      ? `r.number(${binding.rawExpr},${binding.intlOptsExpr})`
      : `r.number(${binding.rawExpr})`
  }
  if (binding.kind === 'date') {
    return binding.intlOptsExpr
      ? `r.date(${binding.rawExpr},${binding.intlOptsExpr})`
      : `r.date(${binding.rawExpr})`
  }
  if (binding.kind === 'string') return binding.rawExpr
  if (binding.kind === 'custom') return `r.str(${binding.rawExpr})`
  if (binding.fallbackName !== undefined) {
    return `(${binding.rawExpr}??${JSON.stringify(`{$${binding.fallbackName}}`)})`
  }
  return binding.rawExpr
}

function compileExpressionToString(expr: Model.Expression, ctx: CompileContext): string {
  if (!expr.functionRef) {
    if (expr.arg?.type === 'variable') {
      const binding = ctx.scope.get(expr.arg.name)
      if (binding) return formatBindingToString(binding)
      const fallback = JSON.stringify(`{$${expr.arg.name}}`)
      return `(${buildVarAccess(expr.arg.name)}??${fallback})`
    }
    return expr.arg?.type === 'literal' ? JSON.stringify(expr.arg.value) : '""'
  }

  const operandExpr = resolveArgRaw(expr.arg, ctx.scope, false)
  const binding = compileFunctionBinding(
    expr.functionRef.name,
    operandExpr,
    expr.functionRef.options,
    ctx,
  )
  return formatBindingToString(binding)
}

function compilePatternToString(pattern: Model.Pattern, ctx: CompileContext): string {
  if (pattern.length === 0) return '""'
  const chunks: string[] = []
  for (const part of pattern) {
    if (typeof part === 'string') {
      chunks.push(escapeTemplateChunk(part))
    } else if (part.type === 'expression') {
      chunks.push(`${TEMPLATE_OPEN}${compileExpressionToString(part, ctx)}}`)
    }
  }
  return `\`${chunks.join('')}\``
}

function compileMarkupPart(markup: Model.Markup, scope: ReadonlyMap<string, LocalBinding>): string {
  const fields: string[] = [
    `type:"markup"`,
    `kind:${JSON.stringify(markup.kind)}`,
    `name:${JSON.stringify(markup.name)}`,
  ]
  if (markup.options && Object.keys(markup.options).length > 0) {
    const optEntries: [string, string][] = Object.entries(markup.options).map(([k, val]) => [
      k,
      resolveOptionValueExpr(val, scope),
    ])
    fields.push(`options:${buildObjectLiteral(optEntries)}`)
  }
  return `{${fields.join(',')}}`
}

function compilePatternToParts(pattern: Model.Pattern, ctx: CompileContext): string {
  if (pattern.length === 0) return '[]'
  const items: string[] = []
  for (const part of pattern) {
    if (typeof part === 'string') {
      if (part !== '') items.push(`{type:"text",value:${JSON.stringify(part)}}`)
      continue
    }
    if (part.type === 'markup') {
      items.push(compileMarkupPart(part, ctx.scope))
      continue
    }
    if (part.functionRef) {
      const operandExpr = resolveArgRaw(part.arg, ctx.scope, false)
      const binding = compileFunctionBinding(
        part.functionRef.name,
        operandExpr,
        part.functionRef.options,
        ctx,
      )
      if (binding.kind === 'custom') {
        items.push(`...r.parts(${binding.rawExpr})`)
      } else {
        items.push(`{type:"text",value:${formatBindingToString(binding)}}`)
      }
      continue
    }
    if (part.arg?.type === 'variable') {
      const binding = ctx.scope.get(part.arg.name)
      if (binding) {
        if (binding.kind === 'custom') {
          items.push(`...r.parts(${binding.rawExpr})`)
        } else if (binding.fallbackName !== undefined) {
          items.push(`{type:"text",value:String(${formatBindingToString(binding)})}`)
        } else {
          items.push(`{type:"text",value:${formatBindingToString(binding)}}`)
        }
      } else {
        const fallback = JSON.stringify(`{$${part.arg.name}}`)
        items.push(`{type:"text",value:String(${buildVarAccess(part.arg.name)}??${fallback})}`)
      }
    } else if (part.arg?.type === 'literal') {
      items.push(`{type:"text",value:${JSON.stringify(part.arg.value)}}`)
    }
  }
  return `[${items.join(',')}]`
}

function compileDeclarations(
  declarations: readonly Model.Declaration[],
  ctx: CompileContext,
): string[] {
  const stmts: string[] = []
  for (const decl of declarations) {
    const isInput = decl.type === 'input'
    const expr = decl.value
    const id = `_d${ctx.tempCounter++}`

    if (expr.functionRef) {
      const operandExpr = resolveArgRaw(expr.arg, ctx.scope, isInput)
      const binding = compileFunctionBinding(
        expr.functionRef.name,
        operandExpr,
        expr.functionRef.options,
        ctx,
      )
      stmts.push(`const ${id}=${binding.rawExpr};`)
      ctx.scope.set(decl.name, {
        kind: binding.kind,
        rawExpr: id,
        intlOptsExpr: binding.intlOptsExpr,
        selectOptsExpr: binding.selectOptsExpr,
      })
    } else {
      const rawExpr = resolveArgRaw(expr.arg, ctx.scope, isInput)
      stmts.push(`const ${id}=${rawExpr};`)
      ctx.scope.set(decl.name, {
        kind: 'raw',
        rawExpr: id,
        fallbackName: expr.arg?.type === 'variable' ? decl.name : undefined,
      })
    }
  }
  return stmts
}

function dispatchVariants(
  operand: string,
  branches: readonly [string, string][],
  guard?: string,
): string {
  const needsTemp = branches.length > 1 && !SIMPLE_IDENT_RE.test(operand)
  const keyExpr = needsTemp ? '_key' : operand
  const prefix = guard && !needsTemp ? `${guard}&&` : ''
  const code = branches
    .map(([key, body]) => `if(${prefix}${keyExpr}===${JSON.stringify(key)}){${body}}`)
    .join('')
  return needsTemp ? `${guard ? `if(${guard})` : ''}{const _key=${operand};${code}}` : code
}

function compileVariants(
  selectors: readonly Model.VariableRef[],
  variants: readonly Model.Variant[],
  index: number,
  ctx: CompileContext,
  compilePattern: (pattern: Model.Pattern) => string,
): string {
  if (index === selectors.length) return `return ${compilePattern(variants[0].value)};`

  const groups = new Map<string, Model.Variant[]>()
  const fallback: Model.Variant[] = []
  for (const variant of variants) {
    const key = variant.keys[index]
    if (key.type === '*') {
      fallback.push(variant)
    } else {
      const group = groups.get(key.value)
      if (group) group.push(variant)
      else groups.set(key.value, [variant])
    }
  }

  const compileGroup = (group: Model.Variant[]) =>
    compileVariants(selectors, group, index + 1, ctx, compilePattern)
  if (!groups.size) return fallback.length ? compileGroup(fallback) : ''

  ctx.needsRuntime = true
  const selector = selectors[index]
  const binding = ctx.scope.get(selector.name)
  const operand = binding?.rawExpr ?? buildVarAccess(selector.name)
  const branches: [string, string][] = [...groups].map(([key, group]) => [key, compileGroup(group)])
  const defaultBranch = fallback.length ? compileGroup(fallback) : ''

  if (binding?.kind === 'string') {
    return dispatchVariants(operand, branches) + defaultBranch
  }

  if (binding?.kind === 'number') {
    const num = `_n${index}`
    const opt = `_o${index}`
    const options = binding.selectOptsExpr
    const args = options ? `,${opt}` : ''
    const exact: [string, string][] = []
    const plural: [string, string][] = []
    for (const branch of branches) {
      if (PLURAL_KEYS.has(branch[0])) plural.push(branch)
      else exact.push(branch)
    }
    const declaration = options ? `const ${opt}=${options};` : ''
    return (
      `${declaration}const ${num}=r.numberForSelection(${operand}${args});` +
      dispatchVariants(`String(${num})`, exact, `${num}!==null`) +
      dispatchVariants(`r.selectPlural(${num}${args})`, plural) +
      defaultBranch
    )
  }

  const keys = ctx.hoist(`new Set(${JSON.stringify([...groups.keys()])})`)
  const selected = `_s${index}`

  if (index === selectors.length - 1 || groups.size === 1) {
    return dispatchVariants(`r.select(${operand},${keys})`, branches) + defaultBranch
  }

  const remaining = `_k${index}`
  return `{let ${remaining}=${keys};while(${remaining}.size){const ${selected}=r.select(${operand},${remaining});if(${selected}===null)break;${dispatchVariants(selected, branches)}if(${remaining}===${keys})${remaining}=new Set(${keys});${remaining}.delete(${selected});}}${defaultBranch}`
}

function hasCustomParts(pattern: Model.Pattern, scope: ReadonlyMap<string, LocalBinding>): boolean {
  return pattern.some((part) => {
    if (typeof part === 'string' || part.type !== 'expression') return false
    if (part.functionRef) return !BUILTIN_FUNCTIONS.has(part.functionRef.name)
    return part.arg?.type === 'variable' && scope.get(part.arg.name)?.kind === 'custom'
  })
}

export function compileMessage(ast: Model.Message, hoist: CompileContext['hoist']): string {
  if (ast.type === 'message' && ast.declarations.length === 0) {
    if (ast.pattern.length === 0) return '""'
    if (ast.pattern.length === 1 && typeof ast.pattern[0] === 'string') {
      return JSON.stringify(ast.pattern[0])
    }
    if (isSimplePatternMessage(ast)) {
      return compileSimpleMessage(ast)
    }
  }

  const markup = messageHasMarkup(ast)
  const ctx: CompileContext = { scope: new Map(), tempCounter: 0, needsRuntime: false, hoist }
  const stmts = compileDeclarations(ast.declarations, ctx)
  const customParts =
    !markup &&
    (ast.type === 'message'
      ? hasCustomParts(ast.pattern, ctx.scope)
      : ast.variants.some(({ value }) => hasCustomParts(value, ctx.scope)))

  const compilePattern = (pattern: Model.Pattern): string => {
    if (markup) return compilePatternToParts(pattern, ctx)
    const text = compilePatternToString(pattern, ctx)
    return customParts ? `p?${compilePatternToParts(pattern, ctx)}:${text}` : text
  }

  let body: string
  if (ast.type === 'message') {
    const expr = compilePattern(ast.pattern)
    body = stmts.length ? `{${stmts.join('')}return ${expr};}` : expr
  } else {
    body = `{${stmts.join('')}${compileVariants(ast.selectors, ast.variants, 0, ctx, compilePattern)}}`
  }

  if (customParts) return `{render:(v,r,p)=>${body}}`
  const params = ctx.needsRuntime ? '(v,r)' : '(v)'
  const render = `${params}=>${body}`
  return markup ? `{parts:${render}}` : render
}
