import type { Model } from 'messageformat'

const SIMPLE_IDENT_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
const TEMPLATE_ESCAPE_RE = /[\\`\r\n]|\$\{/g
const TEMPLATE_OPEN = '$' + '{'
const JSON_NUMBER_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/
const DOTTED_GET_HELPER =
  '(o,p)=>{if(!o||typeof o!=="object")return;if(Object.hasOwn(o,p)&&o[p]!==undefined)return o[p];let c=o,s=0;for(let i=0;i<=p.length;i++){if(i===p.length||p.charCodeAt(i)===46){const k=p.slice(s,i);if(!c||typeof c!=="object"||!Object.hasOwn(c,k))return;c=c[k];s=i+1}}return c}'

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

const NUMBER_LIKE_FUNCTIONS = new Set([
  'number',
  'integer',
  'offset',
  'currency',
  'percent',
  'unit',
])

const DATE_LIKE_FUNCTIONS = new Set(['date', 'time', 'datetime'])
const OFFSET_ONLY_OPTIONS = new Set(['add', 'subtract', 'offset'])

const NUMBER_INT_OPTIONS = new Set([
  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
  'roundingIncrement',
])

const INTEGER_INT_OPTIONS = new Set(['minimumIntegerDigits', 'maximumSignificantDigits'])

const NUMBER_SELECT_INT_OPTIONS = new Set([
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

const NUMBER_SELECT_STR_OPTIONS = new Set([
  'roundingMode',
  'roundingPriority',
  'trailingZeroDisplay',
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
  fallbackName: string
  fnName?: string | undefined
  sourceOptions?: Model.Options | undefined
  intlOptsExpr?: string | undefined
  selectOptsExpr?: string | undefined
  declIndex?: number | undefined
}

interface CompiledDecl {
  index: number
  stmt: string
  deps: Set<number>
  needsRuntime: boolean
}

interface CompileContext {
  scope: Map<string, LocalBinding>
  tempCounter: number
  needsRuntime: boolean
  hoist: (expr: string) => string
  activeUsed: Set<number>
  activeNeedsRuntime: boolean
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

function buildVarAccess(name: string, hoist: CompileContext['hoist']): string {
  if (!name.includes('.')) return buildOwnRootAccess(name)
  return `${hoist(DOTTED_GET_HELPER)}(v,${JSON.stringify(name)})`
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

function compileSimpleMessage(ast: Model.PatternMessage, hoist: CompileContext['hoist']): string {
  const chunks = ast.pattern.map((part) => {
    if (typeof part === 'string') return escapeTemplateChunk(part)
    const name = (part as Model.Expression & { arg: Model.VariableRef }).arg.name
    const fallback = JSON.stringify(`{$${name}}`)
    return `${TEMPLATE_OPEN}${buildVarAccess(name, hoist)}??${fallback}}`
  })
  return `(v)=>\`${chunks.join('')}\``
}

function useBinding(binding: LocalBinding, ctx: CompileContext): LocalBinding {
  if (binding.declIndex !== undefined) {
    ctx.activeUsed.add(binding.declIndex)
  }
  return binding
}

function resolveVarRaw(name: string, ctx: CompileContext, fromInputOnly: boolean): string {
  if (!fromInputOnly) {
    const binding = ctx.scope.get(name)
    if (binding) return useBinding(binding, ctx).rawExpr
  }
  return buildVarAccess(name, ctx.hoist)
}

function resolveArgRaw(
  arg: Model.Literal | Model.VariableRef | undefined,
  ctx: CompileContext,
  fromInputOnly: boolean,
): string {
  if (!arg) return 'undefined'
  if (arg.type === 'literal') return JSON.stringify(arg.value)
  return resolveVarRaw(arg.name, ctx, fromInputOnly)
}

function resolveOptionValueExpr(
  opt: Model.Literal | Model.VariableRef,
  ctx: CompileContext,
): string {
  if (opt.type === 'literal') return JSON.stringify(opt.value)
  return resolveVarRaw(opt.name, ctx, false)
}

function fallbackSourceForExpr(
  arg: Model.Literal | Model.VariableRef | undefined,
  fnName?: string,
): string {
  if (arg?.type === 'variable') return `{$${arg.name}}`
  if (arg?.type === 'literal') return `{|${arg.value}|}`
  if (fnName) return `{:${fnName}}`
  return ''
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
    entries.push([key, resolveOptionValueExpr(val, ctx)])
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
  let dynamicCurrencyFdExpr: string | undefined

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

  const allowedIntOptions = fnName === 'integer' ? INTEGER_INT_OPTIONS : NUMBER_INT_OPTIONS

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
          const vExpr = resolveVarRaw(val.name, ctx, false)
          intlEntries.push(['useGrouping', `(${vExpr}==="never"?false:${vExpr})`])
        }
        continue
      }

      if (fnName === 'currency' && key === 'fractionDigits') {
        if (val.type === 'literal') {
          if (val.value !== 'auto') {
            const trimmed = val.value.trim()
            const n = Number(trimmed)
            if (trimmed !== '' && JSON_NUMBER_RE.test(trimmed) && Number.isInteger(n) && n >= 0) {
              intlEntries.push(['minimumFractionDigits', String(n)])
              intlEntries.push(['maximumFractionDigits', String(n)])
            }
          }
        } else {
          hasVariableIntlOptions = true
          dynamicCurrencyFdExpr = resolveVarRaw(val.name, ctx, false)
        }
        continue
      }

      if (allowedIntOptions.has(key)) {
        if (val.type === 'literal') {
          const trimmed = val.value.trim()
          const n = Number(trimmed)
          if (trimmed !== '' && JSON_NUMBER_RE.test(trimmed) && Number.isInteger(n) && n >= 0) {
            intlEntries.push([key, String(n)])
            if (NUMBER_SELECT_INT_OPTIONS.has(key)) {
              selectEntries.push([key, String(n)])
            }
          }
        } else {
          hasVariableIntlOptions = true
          const numExpr = `Number(${resolveVarRaw(val.name, ctx, false)})`
          intlEntries.push([key, numExpr])
          if (NUMBER_SELECT_INT_OPTIONS.has(key)) {
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
        const isVar = val.type === 'variable'
        const optExpr = resolveOptionValueExpr(val, ctx)
        hasVariableIntlOptions ||= isVar
        intlEntries.push([key, optExpr])
        if (NUMBER_SELECT_STR_OPTIONS.has(key)) {
          hasVariableSelectOptions ||= isVar
          selectEntries.push([key, optExpr])
        }
      }
    }
  }

  const intlOptsExpr =
    dynamicCurrencyFdExpr !== undefined
      ? `r.currencyOpts(${buildObjectLiteral(intlEntries)},${dynamicCurrencyFdExpr})`
      : compileIntlOptions(intlEntries, hasVariableIntlOptions, ctx)

  return {
    intlOptsExpr,
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
  let hasDirectTimeZoneName = false
  let hasVariableOptions = false
  let dynamicHour12Expr: string | undefined

  for (const [key, val] of Object.entries(opts)) {
    if (key === 'dateStyle' || key === 'timeStyle') hasDirectStyle = true
    if (DIRECT_DATE_FIELDS.has(key)) hasDirectDateField = true
    if (DIRECT_TIME_FIELDS.has(key)) hasDirectTimeField = true
    if (key === 'timeZoneName') hasDirectTimeZoneName = true
    if (key === 'calendar' || key === 'timeZone') {
      if (val.type === 'literal' && val.value === 'input') continue
      hasVariableOptions ||= val.type === 'variable'
      entries.push([key, resolveOptionValueExpr(val, ctx)])
    } else if (key === 'hour12' && fnName !== 'date') {
      if (val.type === 'literal') {
        if (val.value === 'true' || val.value === 'false') {
          entries.push(['hour12', val.value])
        }
      } else {
        hasVariableOptions = true
        dynamicHour12Expr = resolveVarRaw(val.name, ctx, false)
      }
    } else if (DIRECT_DATE_OPTIONS.has(key)) {
      hasVariableOptions ||= val.type === 'variable'
      entries.push([key, resolveOptionValueExpr(val, ctx)])
    }
  }

  const dfKey = fnName === 'date' ? 'fields' : 'dateFields'
  const dlKey = fnName === 'date' ? 'length' : 'dateLength'
  const tpKey = fnName === 'time' ? 'precision' : 'timePrecision'

  const dfOpt = fnName !== 'time' ? opts[dfKey] : undefined
  const dlOpt = fnName !== 'time' ? opts[dlKey] : undefined
  const tpOpt = fnName !== 'date' ? opts[tpKey] : undefined
  const tzStyleOpt = fnName !== 'date' ? opts.timeZoneStyle : undefined

  const hasDynamicDraft =
    dynamicHour12Expr !== undefined ||
    (!hasDirectStyle &&
      ((fnName !== 'time' &&
        !hasDirectDateField &&
        (dfOpt?.type === 'variable' || dlOpt?.type === 'variable')) ||
        (fnName !== 'date' &&
          ((!hasDirectTimeField && tpOpt?.type === 'variable') ||
            (!hasDirectTimeZoneName && tzStyleOpt?.type === 'variable')))))

  if (hasDynamicDraft) {
    const baseExpr = entries.length ? buildObjectLiteral(entries) : 'undefined'
    const inputEntries: [string, string][] = [['kind', JSON.stringify(fnName)]]
    if (hasDirectStyle) inputEntries.push(['hasDirectStyle', 'true'])
    if (hasDirectDateField) inputEntries.push(['hasDirectDateField', 'true'])
    if (hasDirectTimeField) inputEntries.push(['hasDirectTimeField', 'true'])
    if (hasDirectTimeZoneName) inputEntries.push(['hasDirectTimeZoneName', 'true'])
    if (dfOpt) inputEntries.push(['fields', resolveOptionValueExpr(dfOpt, ctx)])
    if (dlOpt) inputEntries.push(['length', resolveOptionValueExpr(dlOpt, ctx)])
    if (tpOpt) inputEntries.push(['precision', resolveOptionValueExpr(tpOpt, ctx)])
    if (tzStyleOpt) inputEntries.push(['timeZoneStyle', resolveOptionValueExpr(tzStyleOpt, ctx)])
    if (dynamicHour12Expr !== undefined) inputEntries.push(['hour12', dynamicHour12Expr])
    return `r.dateOpts(${baseExpr},${buildObjectLiteral(inputEntries)})`
  }

  if (!hasDirectStyle) {
    if (fnName !== 'time' && !hasDirectDateField) {
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
      const tpVal =
        tpOpt?.type === 'literal' && TIME_PRECISION_VALUES.has(tpOpt.value) ? tpOpt.value : 'minute'

      entries.push(['hour', '"numeric"'])
      if (tpVal !== 'hour') entries.push(['minute', '"numeric"'])
      if (tpVal === 'second') entries.push(['second', '"numeric"'])
    }

    if (fnName !== 'date' && !hasDirectTimeZoneName) {
      if (tzStyleOpt?.type === 'literal' && TIME_ZONE_STYLE_VALUES.has(tzStyleOpt.value)) {
        entries.push(['timeZoneName', JSON.stringify(tzStyleOpt.value)])
      }
    }
  }

  return compileIntlOptions(entries, hasVariableOptions, ctx)
}

function buildOffsetRawExpr(
  operandExpr: string,
  options: Model.Options | undefined,
  ctx: CompileContext,
): string {
  const dynamicDeltas: { expr: string; negate: boolean }[] = []
  let staticDelta = 0

  const entries: readonly [Model.Literal | Model.VariableRef | undefined, boolean][] = [
    [options?.add, false],
    [options?.subtract, true],
    [options?.offset, false],
  ]

  for (const [val, negate] of entries) {
    if (!val) continue
    if (val.type === 'literal') {
      const trimmed = val.value.trim()
      if (!JSON_NUMBER_RE.test(trimmed)) return 'null'
      const n = Number(trimmed)
      if (!Number.isInteger(n)) return 'null'
      staticDelta += negate ? -n : n
    } else {
      dynamicDeltas.push({ expr: resolveOptionValueExpr(val, ctx), negate })
    }
  }

  let expr = operandExpr
  if (staticDelta !== 0) {
    expr = `r.offset(${expr},${staticDelta})`
  }
  for (const d of dynamicDeltas) {
    expr = `r.offset(${expr},${d.expr}${d.negate ? ',true' : ''})`
  }
  return expr
}

function mergeDeclarationOptions(
  source: LocalBinding,
  targetFnName: string,
  ownOptions: Model.Options | undefined,
): Model.Options | undefined {
  const sourceFn = source.fnName
  const sourceOpts = source.sourceOptions
  if (!sourceFn || !sourceOpts) return ownOptions

  const isNumberPair =
    NUMBER_LIKE_FUNCTIONS.has(targetFnName) && NUMBER_LIKE_FUNCTIONS.has(sourceFn)
  const isDatePair = DATE_LIKE_FUNCTIONS.has(targetFnName) && DATE_LIKE_FUNCTIONS.has(sourceFn)
  if (!isNumberPair && !isDatePair) return ownOptions

  const merged: Model.Options = ownOptions ? { ...ownOptions } : {}
  let added = false

  if (isNumberPair) {
    for (const [key, val] of Object.entries(sourceOpts)) {
      if (OFFSET_ONLY_OPTIONS.has(key) || (ownOptions && Object.hasOwn(ownOptions, key))) continue
      merged[key] = val
      added = true
    }
  } else if (targetFnName === sourceFn) {
    for (const [key, val] of Object.entries(sourceOpts)) {
      if (ownOptions && Object.hasOwn(ownOptions, key)) continue
      merged[key] = val
      added = true
    }
  } else {
    for (const key of ['timeZone', 'calendar'] as const) {
      if (Object.hasOwn(sourceOpts, key) && !(ownOptions && Object.hasOwn(ownOptions, key))) {
        merged[key] = sourceOpts[key]
        added = true
      }
    }
  }

  return added ? merged : ownOptions
}

function compileFunctionBinding(
  fnName: string,
  arg: Model.Literal | Model.VariableRef | undefined,
  options: Model.Options | undefined,
  fallbackSource: string,
  ctx: CompileContext,
  allowArgBinding: boolean,
): LocalBinding {
  ctx.activeNeedsRuntime = true
  const argBinding =
    allowArgBinding && arg?.type === 'variable' ? ctx.scope.get(arg.name) : undefined

  if (fnName === 'string' && argBinding && argBinding.kind !== 'raw') {
    useBinding(argBinding, ctx)
    return {
      kind: 'string',
      rawExpr: formatBindingToString(argBinding, fallbackSource, ctx),
      fallbackName: fallbackSource,
      fnName,
      sourceOptions: options,
    }
  }

  const operandExpr = argBinding
    ? useBinding(argBinding, ctx).rawExpr
    : resolveArgRaw(arg, ctx, !allowArgBinding)
  const effectiveOptions = argBinding
    ? mergeDeclarationOptions(argBinding, fnName, options)
    : options

  if (fnName === 'string') {
    return {
      kind: 'string',
      rawExpr: `r.str(${operandExpr})`,
      fallbackName: fallbackSource,
      fnName,
      sourceOptions: effectiveOptions,
    }
  }

  if (fnName === 'integer') {
    const { intlOptsExpr, selectOptsExpr } = compileNumberLikeOptions(
      'integer',
      effectiveOptions,
      ctx,
    )
    return {
      kind: 'number',
      rawExpr: `r.integer(${operandExpr})`,
      fallbackName: fallbackSource,
      fnName,
      sourceOptions: effectiveOptions,
      intlOptsExpr,
      selectOptsExpr,
    }
  }

  if (fnName === 'offset') {
    const adjusted = buildOffsetRawExpr(operandExpr, effectiveOptions, ctx)
    const { intlOptsExpr, selectOptsExpr } = compileNumberLikeOptions(
      'offset',
      effectiveOptions,
      ctx,
    )
    return {
      kind: 'number',
      rawExpr: adjusted,
      fallbackName: fallbackSource,
      fnName,
      sourceOptions: effectiveOptions,
      intlOptsExpr,
      selectOptsExpr,
    }
  }

  if (fnName === 'number' || fnName === 'currency' || fnName === 'percent' || fnName === 'unit') {
    const { intlOptsExpr, selectOptsExpr } = compileNumberLikeOptions(fnName, effectiveOptions, ctx)
    return {
      kind: 'number',
      rawExpr: operandExpr,
      fallbackName: fallbackSource,
      fnName,
      sourceOptions: effectiveOptions,
      intlOptsExpr,
      selectOptsExpr,
    }
  }

  if (fnName === 'date' || fnName === 'time' || fnName === 'datetime') {
    const intlOptsExpr = compileDateTimeOptions(fnName, effectiveOptions, ctx)
    return {
      kind: 'date',
      rawExpr: operandExpr,
      fallbackName: fallbackSource,
      fnName,
      sourceOptions: effectiveOptions,
      intlOptsExpr,
    }
  }

  const optsExpr = compileCustomOptions(effectiveOptions, ctx)
  return {
    kind: 'custom',
    rawExpr: `r.fn(${JSON.stringify(fnName)},${operandExpr}${optsExpr})`,
    fallbackName: fallbackSource,
    fnName,
    sourceOptions: effectiveOptions,
  }
}

function formatBindingToString(
  binding: LocalBinding,
  siteFallbackName?: string,
  ctx?: CompileContext,
): string {
  const fb = siteFallbackName ?? binding.fallbackName
  const fbLiteral = fb ? JSON.stringify(fb) : undefined
  if (binding.kind === 'number') {
    if (ctx) ctx.activeNeedsRuntime = true
    if (binding.intlOptsExpr) {
      return `r.number(${binding.rawExpr},${binding.intlOptsExpr}${fbLiteral ? `,${fbLiteral}` : ''})`
    }
    return fbLiteral
      ? `r.number(${binding.rawExpr},undefined,${fbLiteral})`
      : `r.number(${binding.rawExpr})`
  }
  if (binding.kind === 'date') {
    if (ctx) ctx.activeNeedsRuntime = true
    if (binding.intlOptsExpr) {
      return `r.date(${binding.rawExpr},${binding.intlOptsExpr}${fbLiteral ? `,${fbLiteral}` : ''})`
    }
    return fbLiteral
      ? `r.date(${binding.rawExpr},undefined,${fbLiteral})`
      : `r.date(${binding.rawExpr})`
  }
  if (binding.kind === 'string') return binding.rawExpr
  if (binding.kind === 'custom') {
    if (ctx) ctx.activeNeedsRuntime = true
    return `r.str(${binding.rawExpr})`
  }
  if (fbLiteral) {
    return `(${binding.rawExpr}??${fbLiteral})`
  }
  return binding.rawExpr
}

function compileExpressionToString(expr: Model.Expression, ctx: CompileContext): string {
  if (!expr.functionRef) {
    if (expr.arg?.type === 'variable') {
      const binding = ctx.scope.get(expr.arg.name)
      if (binding) return formatBindingToString(useBinding(binding, ctx), undefined, ctx)
      const fallback = JSON.stringify(`{$${expr.arg.name}}`)
      return `(${buildVarAccess(expr.arg.name, ctx.hoist)}??${fallback})`
    }
    return expr.arg?.type === 'literal' ? JSON.stringify(expr.arg.value) : '""'
  }

  const fallbackSource = fallbackSourceForExpr(expr.arg, expr.functionRef.name)
  const binding = compileFunctionBinding(
    expr.functionRef.name,
    expr.arg,
    expr.functionRef.options,
    fallbackSource,
    ctx,
    true,
  )
  return formatBindingToString(binding, undefined, ctx)
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

function compileMarkupPart(markup: Model.Markup, ctx: CompileContext): string {
  const fields: string[] = [
    `type:"markup"`,
    `kind:${JSON.stringify(markup.kind)}`,
    `name:${JSON.stringify(markup.name)}`,
  ]
  if (markup.options && Object.keys(markup.options).length > 0) {
    const optEntries: [string, string][] = Object.entries(markup.options).map(([k, val]) => [
      k,
      resolveOptionValueExpr(val, ctx),
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
      items.push(compileMarkupPart(part, ctx))
      continue
    }
    if (part.functionRef) {
      const fallbackSource = fallbackSourceForExpr(part.arg, part.functionRef.name)
      const binding = compileFunctionBinding(
        part.functionRef.name,
        part.arg,
        part.functionRef.options,
        fallbackSource,
        ctx,
        true,
      )
      if (binding.kind === 'custom') {
        ctx.activeNeedsRuntime = true
        items.push(`...r.parts(${binding.rawExpr})`)
      } else {
        items.push(`{type:"text",value:${formatBindingToString(binding, undefined, ctx)}}`)
      }
      continue
    }
    if (part.arg?.type === 'variable') {
      const binding = ctx.scope.get(part.arg.name)
      if (binding) {
        useBinding(binding, ctx)
        if (binding.kind === 'custom') {
          ctx.activeNeedsRuntime = true
          items.push(`...r.parts(${binding.rawExpr})`)
        } else if (binding.kind === 'raw') {
          items.push(
            `{type:"text",value:String(${formatBindingToString(binding, undefined, ctx)})}`,
          )
        } else {
          items.push(`{type:"text",value:${formatBindingToString(binding, undefined, ctx)}}`)
        }
      } else {
        const fallback = JSON.stringify(`{$${part.arg.name}}`)
        items.push(
          `{type:"text",value:String(${buildVarAccess(part.arg.name, ctx.hoist)}??${fallback})}`,
        )
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
): CompiledDecl[] {
  const decls: CompiledDecl[] = []
  for (const decl of declarations) {
    const isInput = decl.type === 'input'
    const expr = decl.value

    if (!expr.functionRef && !isInput && expr.arg?.type === 'variable') {
      const sourceBinding = ctx.scope.get(expr.arg.name)
      if (sourceBinding) {
        ctx.scope.set(decl.name, {
          ...sourceBinding,
          fallbackName: `{$${decl.name}}`,
        })
        continue
      }
    }

    const index = decls.length
    const id = `_d${ctx.tempCounter++}`
    const deps = new Set<number>()
    ctx.activeUsed = deps
    ctx.activeNeedsRuntime = false

    if (expr.functionRef) {
      const declFallback = `{$${decl.name}}`
      const binding = compileFunctionBinding(
        expr.functionRef.name,
        expr.arg,
        expr.functionRef.options,
        declFallback,
        ctx,
        !isInput,
      )
      decls.push({
        index,
        stmt: `const ${id}=${binding.rawExpr};`,
        deps,
        needsRuntime: ctx.activeNeedsRuntime,
      })
      ctx.scope.set(decl.name, {
        kind: binding.kind,
        rawExpr: id,
        fallbackName: declFallback,
        fnName: binding.fnName,
        sourceOptions: binding.sourceOptions,
        intlOptsExpr: binding.intlOptsExpr,
        selectOptsExpr: binding.selectOptsExpr,
        declIndex: index,
      })
    } else {
      const rawExpr = resolveArgRaw(expr.arg, ctx, isInput)
      decls.push({
        index,
        stmt: `const ${id}=${rawExpr};`,
        deps,
        needsRuntime: ctx.activeNeedsRuntime,
      })
      ctx.scope.set(decl.name, {
        kind: 'raw',
        rawExpr: id,
        fallbackName: expr.arg?.type === 'variable' ? `{$${decl.name}}` : '',
        declIndex: index,
      })
    }
  }
  return decls
}

function expandDeclDeps(
  decls: readonly CompiledDecl[],
  roots: ReadonlySet<number>,
  exclude?: ReadonlySet<number>,
): number[] {
  const visited = new Set<number>()
  const stack = [...roots]
  while (stack.length > 0) {
    const idx = stack.pop()!
    if (visited.has(idx) || exclude?.has(idx)) continue
    visited.add(idx)
    const decl = decls[idx]
    if (decl) {
      for (const dep of decl.deps) {
        if (!visited.has(dep) && !exclude?.has(dep)) {
          stack.push(dep)
        }
      }
    }
  }
  return [...visited].sort((a, b) => a - b)
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
  decls: readonly CompiledDecl[],
  topSet: ReadonlySet<number>,
): string {
  if (index === selectors.length) {
    const leafUsed = new Set<number>()
    const prevUsed = ctx.activeUsed
    const prevNeedsRuntime = ctx.activeNeedsRuntime
    ctx.activeUsed = leafUsed
    ctx.activeNeedsRuntime = false
    const patternExpr = compilePattern(variants[0].value)
    const leafNeedsRuntime = ctx.activeNeedsRuntime
    ctx.activeUsed = prevUsed
    ctx.activeNeedsRuntime = prevNeedsRuntime
    const leafDecls = expandDeclDeps(decls, leafUsed, topSet)
    let totalNeedsRuntime = leafNeedsRuntime
    let leafStmts = ''
    for (const idx of leafDecls) {
      totalNeedsRuntime ||= decls[idx].needsRuntime
      leafStmts += decls[idx].stmt
    }
    if (totalNeedsRuntime) ctx.needsRuntime = true
    return `${leafStmts}return ${patternExpr};`
  }

  const selector = selectors[index]
  const binding = ctx.scope.get(selector.name)
  const isStringSelector = binding?.kind === 'string'

  const groups = new Map<string, Model.Variant[]>()
  const fallback: Model.Variant[] = []
  for (const variant of variants) {
    const key = variant.keys[index]
    if (key.type === '*') {
      fallback.push(variant)
    } else {
      const groupKey = isStringSelector ? key.value.normalize() : key.value
      const group = groups.get(groupKey)
      if (group) group.push(variant)
      else groups.set(groupKey, [variant])
    }
  }

  const compileGroup = (group: Model.Variant[]) =>
    compileVariants(selectors, group, index + 1, ctx, compilePattern, decls, topSet)
  if (!groups.size) return fallback.length ? compileGroup(fallback) : ''

  ctx.needsRuntime = true
  const operand = binding
    ? useBinding(binding, ctx).rawExpr
    : buildVarAccess(selector.name, ctx.hoist)
  const branches: [string, string][] = [...groups].map(([key, group]) => [key, compileGroup(group)])
  const defaultBranch = fallback.length ? compileGroup(fallback) : ''

  if (binding?.kind === 'string') {
    return dispatchVariants(`${operand}.normalize()`, branches) + defaultBranch
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
      return compileSimpleMessage(ast, hoist)
    }
  }

  const markup = messageHasMarkup(ast)
  const ctx: CompileContext = {
    scope: new Map(),
    tempCounter: 0,
    needsRuntime: false,
    hoist,
    activeUsed: new Set(),
    activeNeedsRuntime: false,
  }
  const decls = compileDeclarations(ast.declarations, ctx)
  const customParts =
    ast.type === 'message'
      ? hasCustomParts(ast.pattern, ctx.scope)
      : ast.variants.some(({ value }) => hasCustomParts(value, ctx.scope))

  const compilePattern = (pattern: Model.Pattern): string => {
    if (customParts) {
      const text = compilePatternToString(pattern, ctx)
      const parts = compilePatternToParts(pattern, ctx)
      return `p?${parts}:${text}`
    }
    return markup ? compilePatternToParts(pattern, ctx) : compilePatternToString(pattern, ctx)
  }

  let body: string
  if (ast.type === 'message') {
    const patternUsed = new Set<number>()
    ctx.activeUsed = patternUsed
    ctx.activeNeedsRuntime = false
    const expr = compilePattern(ast.pattern)
    ctx.needsRuntime = ctx.activeNeedsRuntime
    const needed = expandDeclDeps(decls, patternUsed)
    for (const idx of needed) {
      ctx.needsRuntime ||= decls[idx].needsRuntime
    }
    const stmts = needed.map((idx) => decls[idx].stmt)
    body = stmts.length ? `{${stmts.join('')}return ${expr};}` : expr
  } else {
    const selectorRoots = new Set<number>()
    for (const sel of ast.selectors) {
      const declIdx = ctx.scope.get(sel.name)?.declIndex
      if (declIdx !== undefined) selectorRoots.add(declIdx)
    }
    const topSet = new Set(expandDeclDeps(decls, selectorRoots))
    const topDecls = [...topSet].sort((a, b) => a - b)
    ctx.needsRuntime = false
    for (const idx of topDecls) {
      ctx.needsRuntime ||= decls[idx].needsRuntime
    }
    const variantsCode = compileVariants(
      ast.selectors,
      ast.variants,
      0,
      ctx,
      compilePattern,
      decls,
      topSet,
    )
    const topStmts = topDecls.map((idx) => decls[idx].stmt).join('')
    body = `{${topStmts}${variantsCode}}`
  }

  if (customParts) return `{render:(v,r,p)=>${body}}`
  const params = ctx.needsRuntime ? '(v,r)' : '(v)'
  const render = `${params}=>${body}`
  return markup ? `{parts:${render}}` : render
}
