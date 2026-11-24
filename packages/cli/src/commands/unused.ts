import type {
  CallExpression,
  Identifier,
  Node,
  SourceFile,
  TemplateExpression,
} from 'typescript/unstable/ast'
import type { Checker, Symbol as TsSymbol, Type } from 'typescript/unstable/sync'

import { compareStrings, getConfig, loadMergedLocale, readAllLocales } from '@kanjou/generator'
import consola from 'consola'
import { parse } from 'jsonc-parser'
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  isAsExpression,
  isCallExpression,
  isIdentifier,
  isImportDeclaration,
  isImportSpecifier,
  isNamedImports,
  isNamespaceImport,
  isNonNullExpression,
  isNoSubstitutionTemplateLiteral,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isSatisfiesExpression,
  isShorthandPropertyAssignment,
  isStringLiteral,
  isTemplateExpression,
  isVariableDeclaration,
} from 'typescript/unstable/ast'
import { API, SymbolFlags } from 'typescript/unstable/sync'

import { KanjouCliError } from '../errors.ts'

const KANJOU_MODULES = new Set(['@kanjou/react', '@kanjou/react/server', '@kanjou/core'])
const TRANSLATOR_FACTORIES = new Set(['useTranslate', 'createTranslate'])
const DEFINE_TRANSLATE = 'defineTranslate'
const FORMATTER_FUNCTIONS = new Set(['formatMessage', 'formatMessageParts'])

interface FileKanjouAliases {
  factories: Set<string>
  defineTranslates: Set<string>
  formatters: Set<string>
  namespaces: Set<string>
}

function collectFileKanjouAliases(file: SourceFile): FileKanjouAliases {
  const factories = new Set<string>()
  const defineTranslates = new Set<string>()
  const formatters = new Set<string>()
  const namespaces = new Set<string>()

  for (const stmt of file.statements) {
    if (!isImportDeclaration(stmt) || !stmt.importClause) continue
    if (!isStringLiteral(stmt.moduleSpecifier)) continue
    if (!KANJOU_MODULES.has(stmt.moduleSpecifier.text)) continue

    const bindings = stmt.importClause.namedBindings
    if (!bindings) continue

    if (isNamedImports(bindings)) {
      for (const spec of bindings.elements) {
        if (!isImportSpecifier(spec) || spec.isTypeOnly) continue
        const imported = spec.propertyName ?? spec.name
        if (!isIdentifier(imported) && !isStringLiteral(imported)) continue

        if (TRANSLATOR_FACTORIES.has(imported.text)) {
          factories.add(spec.name.text)
        } else if (imported.text === DEFINE_TRANSLATE) {
          defineTranslates.add(spec.name.text)
        } else if (FORMATTER_FUNCTIONS.has(imported.text)) {
          formatters.add(spec.name.text)
        }
      }
    } else if (isNamespaceImport(bindings)) {
      namespaces.add(bindings.name.text)
    }
  }

  return { factories, defineTranslates, formatters, namespaces }
}

function isNamedOrNamespaceCall(
  expr: Node,
  named: ReadonlySet<string>,
  namespaces: ReadonlySet<string>,
  exportNames: ReadonlySet<string>,
): boolean {
  const unwrapped = unwrapExpression(expr)
  if (isIdentifier(unwrapped)) {
    return named.has(unwrapped.text)
  }
  if (isPropertyAccessExpression(unwrapped) && isIdentifier(unwrapped.expression)) {
    return namespaces.has(unwrapped.expression.text) && exportNames.has(unwrapped.name.text)
  }
  return false
}

function isKanjouDeclaration(symbol: TsSymbol): boolean {
  return symbol.declarations.some((decl) => {
    const normalized = decl.path.replace(/\\/g, '/')
    return (
      normalized.includes('/@kanjou/core/') ||
      normalized.includes('/@kanjou/react/') ||
      normalized.includes('/packages/core/') ||
      normalized.includes('/packages/react/')
    )
  })
}

function unwrapAliasedSymbol(symbol: TsSymbol, checker: Checker): TsSymbol {
  let current = symbol
  while (current.flags & SymbolFlags.Alias) {
    const target = checker.getAliasedSymbol(current)
    if (checker.isUnknownSymbol(target) || target.id === current.id) break
    current = target
  }
  return current
}

function intrinsicTypeToPattern(intrinsicName: string): string | null {
  switch (intrinsicName) {
    case 'string':
    case 'any':
    case 'unknown':
      return '.*'
    case 'number':
    case 'bigint':
      return '-?\\d+(?:\\.\\d+)?'
    case 'boolean':
      return '(?:true|false)'
    default:
      return null
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function unwrapExpression(node: Node): Node {
  let current = node
  while (
    isParenthesizedExpression(current) ||
    isAsExpression(current) ||
    isNonNullExpression(current) ||
    isSatisfiesExpression(current)
  ) {
    current = current.expression
  }
  return current
}

function typeToPattern(type: Type, checker: Checker, visited = new Set<number>()): string | null {
  if (visited.has(type.id) || type.isErrorType()) return null
  visited.add(type.id)

  try {
    if (type.isStringLiteralType()) return escapeRegex(type.value)
    if (type.isNumberLiteralType() || type.isBigIntLiteralType() || type.isBooleanLiteralType()) {
      return escapeRegex(String(type.value))
    }

    if (type.isUnionType()) {
      const parts: string[] = []
      for (const member of type.getTypes()) {
        const part = typeToPattern(member, checker, visited)
        if (part !== null) parts.push(part)
      }
      if (parts.length === 0) return null
      if (parts.length === 1) return parts[0] ?? null
      return `(?:${parts.join('|')})`
    }

    if (type.isIntersectionType()) {
      const parts: string[] = []
      for (const member of type.getTypes()) {
        const part = typeToPattern(member, checker, visited)
        if (part !== null) parts.push(part)
      }
      if (parts.length === 0) return null
      const constrained = parts.filter((part) => part !== '.*')
      if (constrained.length === 0) return '.*'
      return constrained[0] ?? null
    }

    if (type.isTemplateLiteralType()) {
      return templateToPattern(type.texts, type.getTypes(), checker, visited)
    }

    if (type.isTypeParameter()) {
      const constraint =
        checker.getConstraintOfTypeParameter(type) ?? checker.getBaseConstraintOfType(type)
      return constraint ? typeToPattern(constraint, checker, visited) : '.*'
    }

    if (type.isIntrinsicType()) {
      return intrinsicTypeToPattern(type.intrinsicName)
    }

    return null
  } finally {
    visited.delete(type.id)
  }
}

function templateToPattern(
  texts: readonly string[],
  spanTypes: readonly (Type | undefined)[],
  checker: Checker,
  visited = new Set<number>(),
): string | null {
  if (!texts.some((text) => text.length > 0)) return null

  let pattern = escapeRegex(texts[0] ?? '')
  for (let i = 0; i < spanTypes.length; i++) {
    const spanType = spanTypes[i]
    const spanPattern = spanType ? typeToPattern(spanType, checker, visited) : '.*'
    pattern += spanPattern ?? '.*'
    pattern += escapeRegex(texts[i + 1] ?? '')
  }
  return pattern
}

function deleteMatchingKeys(pattern: string, unusedKeys: Set<string>): void {
  const regex = new RegExp(`^${pattern}$`)
  for (const key of unusedKeys) {
    if (regex.test(key)) unusedKeys.delete(key)
  }
}

interface ResolvedKeyConstraints {
  exactKeys: Set<string>
  patterns: Set<string>
}

function matchesAnyPattern(key: string, regexes: readonly RegExp[]): boolean {
  for (const regex of regexes) {
    if (regex.test(key)) return true
  }
  return false
}

function intersectKeyConstraints(
  left: ResolvedKeyConstraints,
  right: ResolvedKeyConstraints,
): ResolvedKeyConstraints {
  const leftRegexes = Array.from(left.patterns, (pattern) => new RegExp(`^${pattern}$`))
  const rightRegexes = Array.from(right.patterns, (pattern) => new RegExp(`^${pattern}$`))

  const exactKeys = new Set<string>()
  for (const key of left.exactKeys) {
    if (right.exactKeys.has(key) || matchesAnyPattern(key, rightRegexes)) {
      exactKeys.add(key)
    }
  }
  for (const key of right.exactKeys) {
    if (left.exactKeys.has(key) || matchesAnyPattern(key, leftRegexes)) {
      exactKeys.add(key)
    }
  }

  const patterns = new Set<string>()
  if (left.patterns.size > 0 && right.patterns.size > 0) {
    for (const leftPattern of left.patterns) {
      for (const rightPattern of right.patterns) {
        patterns.add(`(?=${leftPattern}$)${rightPattern}`)
      }
    }
  }

  return { exactKeys, patterns }
}

function collectExactKeysFromType(
  type: Type,
  checker: Checker,
  outKeys: Set<string>,
  outPatterns: Set<string>,
  visited = new Set<number>(),
): boolean {
  if (visited.has(type.id) || type.isErrorType()) return false
  visited.add(type.id)

  try {
    if (
      type.isStringLiteralType() ||
      type.isNumberLiteralType() ||
      type.isBigIntLiteralType() ||
      type.isBooleanLiteralType()
    ) {
      outKeys.add(String(type.value))
      return true
    }

    if (type.isUnionType()) {
      let resolvedAny = false
      for (const member of type.getTypes()) {
        if (collectExactKeysFromType(member, checker, outKeys, outPatterns, visited)) {
          resolvedAny = true
        }
      }
      return resolvedAny
    }

    if (type.isIntersectionType()) {
      let intersected: ResolvedKeyConstraints | null = null
      for (const member of type.getTypes()) {
        const memberKeys = new Set<string>()
        const memberPatterns = new Set<string>()
        if (!collectExactKeysFromType(member, checker, memberKeys, memberPatterns, visited)) {
          continue
        }
        const current: ResolvedKeyConstraints = {
          exactKeys: memberKeys,
          patterns: memberPatterns,
        }
        intersected = intersected ? intersectKeyConstraints(intersected, current) : current
      }

      if (!intersected) return false
      for (const key of intersected.exactKeys) outKeys.add(key)
      for (const pattern of intersected.patterns) outPatterns.add(pattern)
      return true
    }

    if (type.isTypeParameter()) {
      const constraint =
        checker.getConstraintOfTypeParameter(type) ?? checker.getBaseConstraintOfType(type)
      return constraint
        ? collectExactKeysFromType(constraint, checker, outKeys, outPatterns, visited)
        : false
    }

    if (type.isTemplateLiteralType()) {
      const pattern = templateToPattern(type.texts, type.getTypes(), checker, visited)
      if (pattern) {
        outPatterns.add(pattern)
        return true
      }
      return false
    }

    return false
  } finally {
    visited.delete(type.id)
  }
}

function extractObjectIdProperty(arg: Node): Node | undefined {
  const unwrapped = unwrapExpression(arg)
  if (!isObjectLiteralExpression(unwrapped)) return undefined

  for (const prop of unwrapped.properties) {
    if (
      isPropertyAssignment(prop) &&
      (isIdentifier(prop.name) || isStringLiteral(prop.name)) &&
      prop.name.text === 'id'
    ) {
      return prop.initializer
    }
    if (isShorthandPropertyAssignment(prop) && isIdentifier(prop.name) && prop.name.text === 'id') {
      return prop.name
    }
  }

  return undefined
}

function extractFormatterKeyNodes(call: CallExpression, checker: Checker): Node[] {
  if (call.arguments.length === 1) {
    const first = call.arguments[0]
    if (!first) return []
    const idNode = extractObjectIdProperty(first)
    return idNode ? [idNode] : []
  }

  if (call.arguments.length < 3) return []

  const sig = checker.getResolvedSignature(call)
  if (sig) {
    const params = sig.getParameters()
    for (let i = 0; i < params.length; i++) {
      if (params[i]?.name === 'id') {
        const arg = call.arguments[i]
        return arg ? [arg] : []
      }
    }
  }

  if (call.arguments.length === 3) {
    const arg = call.arguments[2]
    return arg ? [arg] : []
  }

  const keys: Node[] = []
  if (call.arguments[2]) keys.push(call.arguments[2])
  if (call.arguments[3]) keys.push(call.arguments[3])
  return keys
}

export interface FindUnusedOptions {
  tsconfigPath?: string | undefined
  allKeys: Iterable<string>
  ignoreFullCatalogUnion?: boolean | undefined
}

export function findUnusedKeys(options: FindUnusedOptions): string[] {
  const allKeys = new Set(options.allKeys)
  const unusedKeys = new Set(allKeys)
  const ignoreFullCatalogUnion = options.ignoreFullCatalogUnion ?? false
  const resolvedTsconfigPath = path.resolve(options.tsconfigPath ?? 'tsconfig.json')
  const api = new API()

  try {
    const projects = new Set<string>()

    function addProject(fileName: string) {
      let stats
      try {
        stats = statSync(fileName)
      } catch {
        return
      }
      if (stats.isDirectory()) fileName = path.join(fileName, 'tsconfig.json')
      if (projects.has(fileName)) return
      projects.add(fileName)
      let config: { references?: { path: string }[] } | undefined
      try {
        config = parse(readFileSync(fileName, 'utf8'))
      } catch {
        return
      }
      for (const reference of config?.references ?? []) {
        addProject(path.resolve(path.dirname(fileName), reference.path))
      }
    }

    addProject(resolvedTsconfigPath)
    if (projects.size === 0) {
      throw new KanjouCliError(`No tsconfig project found at "${resolvedTsconfigPath}"`, {
        tsconfigPath: resolvedTsconfigPath,
      })
    }

    using snapshot = api.updateSnapshot({ openProjects: [...projects] })
    const loadedProjects = snapshot.getProjects()
    if (loadedProjects.length === 0) {
      throw new KanjouCliError(`No TypeScript project loaded from "${resolvedTsconfigPath}"`, {
        tsconfigPath: resolvedTsconfigPath,
      })
    }

    for (const { program, checker } of loadedProjects) {
      const files: SourceFile[] = []
      for (const fileName of program.getSourceFileNames()) {
        if (fileName.replace(/\\/g, '/').includes('/node_modules/')) continue
        const file = program.getSourceFile(fileName)
        if (file && !file.isDeclarationFile) {
          files.push(file)
        }
      }

      const fileAliases = new Map<SourceFile, FileKanjouAliases>()
      const factoryDeclNodes: Node[] = []
      const factoryNames = new Set<string>()
      const translatorDeclNodes: Node[] = []
      const translatorNames = new Set<string>()
      const fallbackVarCandidates: { declName: Identifier; callee: Node }[] = []

      for (const file of files) {
        const aliases = collectFileKanjouAliases(file)
        fileAliases.set(file, aliases)

        function collectDeclarations(node: Node) {
          if (
            isVariableDeclaration(node) &&
            isIdentifier(node.name) &&
            node.initializer &&
            isCallExpression(node.initializer)
          ) {
            const callee = unwrapExpression(node.initializer.expression)
            if (
              isNamedOrNamespaceCall(
                callee,
                aliases.defineTranslates,
                aliases.namespaces,
                new Set([DEFINE_TRANSLATE]),
              )
            ) {
              factoryDeclNodes.push(node.name)
              factoryNames.add(node.name.text)
            } else if (
              isNamedOrNamespaceCall(
                callee,
                aliases.factories,
                aliases.namespaces,
                TRANSLATOR_FACTORIES,
              )
            ) {
              translatorDeclNodes.push(node.name)
              translatorNames.add(node.name.text)
            } else if (isIdentifier(callee) || isPropertyAccessExpression(callee)) {
              fallbackVarCandidates.push({ declName: node.name, callee })
            }
          }
          node.forEachChild(collectDeclarations)
        }

        collectDeclarations(file)
      }

      const factorySymbolIds = new Set<number>()
      if (factoryDeclNodes.length > 0) {
        for (const sym of checker.getSymbolAtLocation(factoryDeclNodes)) {
          if (sym) factorySymbolIds.add(sym.id)
        }
      }

      if (fallbackVarCandidates.length > 0) {
        const calleeSymbols = checker.getSymbolAtLocation(
          fallbackVarCandidates.map((candidate) => candidate.callee),
        )
        for (let i = 0; i < fallbackVarCandidates.length; i++) {
          const candidate = fallbackVarCandidates[i]
          const sym = calleeSymbols[i]
          if (!candidate || !sym) continue

          const target = unwrapAliasedSymbol(sym, checker)
          if (checker.isUnknownSymbol(target)) continue

          if (
            factorySymbolIds.has(target.id) ||
            (isKanjouDeclaration(target) && TRANSLATOR_FACTORIES.has(target.name))
          ) {
            translatorDeclNodes.push(candidate.declName)
            translatorNames.add(candidate.declName.text)
          } else if (isKanjouDeclaration(target) && target.name === DEFINE_TRANSLATE) {
            factoryDeclNodes.push(candidate.declName)
            factoryNames.add(candidate.declName.text)
          }
        }
      }

      const translators = new Set<number>()
      if (translatorDeclNodes.length > 0) {
        for (const symbol of checker.getSymbolAtLocation(translatorDeclNodes)) {
          if (symbol) translators.add(symbol.id)
        }
      }

      // Refresh factory symbols in case fallbackVarCandidates discovered a defineTranslate alias
      if (factoryDeclNodes.length > factorySymbolIds.size) {
        for (const sym of checker.getSymbolAtLocation(factoryDeclNodes)) {
          if (sym) factorySymbolIds.add(sym.id)
        }
      }

      // Track aliased imports of translators (e.g. `import { t as tr } from './i18n'`)
      for (const file of files) {
        for (const stmt of file.statements) {
          if (!isImportDeclaration(stmt) || !stmt.importClause?.namedBindings) continue
          const bindings = stmt.importClause.namedBindings
          if (!isNamedImports(bindings)) continue
          for (const spec of bindings.elements) {
            if (!isImportSpecifier(spec) || spec.isTypeOnly || !spec.propertyName) continue
            if (translatorNames.has(spec.propertyName.text)) {
              translatorNames.add(spec.name.text)
            }
          }
        }
      }

      const directKeys: Node[] = []
      const directFormatterCalls: CallExpression[] = []
      const candidateTranslatorExprs: Node[] = []
      const candidateTranslatorKeys: Node[] = []
      const candidateInlineCallees: Node[] = []
      const candidateInlineKeys: Node[] = []
      const candidateFormatterCallees: Node[] = []
      const candidateFormatterCalls: CallExpression[] = []

      for (const file of files) {
        const currentAliases = fileAliases.get(file)
        if (!currentAliases) continue

        function collectCalls(node: Node, aliases: FileKanjouAliases) {
          if (isCallExpression(node)) {
            let expression: Node = node.expression
            let hadTranslatorMethod = false
            while (
              isPropertyAccessExpression(expression) &&
              (expression.name.text === 'rich' ||
                expression.name.text === 'unsafe' ||
                expression.name.text === 'parts')
            ) {
              hadTranslatorMethod = true
              expression = expression.expression
            }

            const unwrappedExpr = unwrapExpression(expression)
            const firstArg = node.arguments[0]

            if (
              isIdentifier(unwrappedExpr) &&
              firstArg &&
              translatorNames.has(unwrappedExpr.text)
            ) {
              candidateTranslatorExprs.push(unwrappedExpr)
              candidateTranslatorKeys.push(firstArg)
            } else if (isCallExpression(unwrappedExpr) && firstArg) {
              const innerCallee = unwrapExpression(unwrappedExpr.expression)
              if (
                isNamedOrNamespaceCall(
                  innerCallee,
                  aliases.factories,
                  aliases.namespaces,
                  TRANSLATOR_FACTORIES,
                )
              ) {
                directKeys.push(firstArg)
              } else if (isIdentifier(innerCallee) || isPropertyAccessExpression(innerCallee)) {
                candidateInlineCallees.push(innerCallee)
                candidateInlineKeys.push(firstArg)
              }
            } else if (
              !hadTranslatorMethod &&
              (node.arguments.length === 1 || node.arguments.length >= 3)
            ) {
              if (
                isNamedOrNamespaceCall(
                  unwrappedExpr,
                  aliases.formatters,
                  aliases.namespaces,
                  FORMATTER_FUNCTIONS,
                )
              ) {
                directFormatterCalls.push(node)
              } else if (isIdentifier(unwrappedExpr) || isPropertyAccessExpression(unwrappedExpr)) {
                candidateFormatterCallees.push(unwrappedExpr)
                candidateFormatterCalls.push(node)
              }
            }
          }
          node.forEachChild((child) => collectCalls(child, aliases))
        }

        collectCalls(file, currentAliases)
      }

      const dynamicKeys: Node[] = []

      function recordUsedKey(key: Node) {
        if (isStringLiteral(key) || isNoSubstitutionTemplateLiteral(key)) {
          unusedKeys.delete(key.text)
        } else {
          dynamicKeys.push(key)
        }
      }

      for (const key of directKeys) {
        recordUsedKey(key)
      }

      for (const call of directFormatterCalls) {
        for (const key of extractFormatterKeyNodes(call, checker)) {
          recordUsedKey(key)
        }
      }

      if (candidateTranslatorExprs.length > 0 && translators.size > 0) {
        const exprSymbols = checker.getSymbolAtLocation(candidateTranslatorExprs)
        for (let i = 0; i < candidateTranslatorExprs.length; i++) {
          const symbol = exprSymbols[i]
          const key = candidateTranslatorKeys[i]
          if (!symbol || !key) continue

          const resolved = unwrapAliasedSymbol(symbol, checker)
          if (!translators.has(resolved.id)) continue
          recordUsedKey(key)
        }
      }

      if (candidateInlineCallees.length > 0) {
        const inlineSymbols = checker.getSymbolAtLocation(candidateInlineCallees)
        for (let i = 0; i < candidateInlineCallees.length; i++) {
          const symbol = inlineSymbols[i]
          const key = candidateInlineKeys[i]
          if (!symbol || !key) continue

          const resolved = unwrapAliasedSymbol(symbol, checker)
          if (checker.isUnknownSymbol(resolved)) continue

          if (
            factorySymbolIds.has(resolved.id) ||
            (isKanjouDeclaration(resolved) && TRANSLATOR_FACTORIES.has(resolved.name))
          ) {
            recordUsedKey(key)
          }
        }
      }

      if (candidateFormatterCallees.length > 0) {
        const formatterSymbols = checker.getSymbolAtLocation(candidateFormatterCallees)
        for (let i = 0; i < candidateFormatterCallees.length; i++) {
          const symbol = formatterSymbols[i]
          const call = candidateFormatterCalls[i]
          if (!symbol || !call) continue

          const resolved = unwrapAliasedSymbol(symbol, checker)
          if (checker.isUnknownSymbol(resolved)) continue

          if (isKanjouDeclaration(resolved) && FORMATTER_FUNCTIONS.has(resolved.name)) {
            for (const key of extractFormatterKeyNodes(call, checker)) {
              recordUsedKey(key)
            }
          }
        }
      }

      if (dynamicKeys.length === 0) continue

      const dynamicTypes = checker.getTypeAtLocation(dynamicKeys)
      const templateFallbacks: TemplateExpression[] = []

      for (let i = 0; i < dynamicKeys.length; i++) {
        const keyNode = dynamicKeys[i]
        if (!keyNode) continue

        const keyType = dynamicTypes[i]
        const unwrapped = unwrapExpression(keyNode)

        if (keyType) {
          const exactKeys = new Set<string>()
          const patterns = new Set<string>()
          const resolved = collectExactKeysFromType(keyType, checker, exactKeys, patterns)

          const isFullCatalog =
            ignoreFullCatalogUnion && exactKeys.size >= allKeys.size && patterns.size === 0

          if (isFullCatalog) {
            if (isTemplateExpression(unwrapped)) {
              templateFallbacks.push(unwrapped)
            }
            continue
          }

          if (resolved) {
            for (const k of exactKeys) unusedKeys.delete(k)
            for (const p of patterns) deleteMatchingKeys(p, unusedKeys)
            continue
          }
        }

        if (isTemplateExpression(unwrapped)) {
          templateFallbacks.push(unwrapped)
        }
      }

      if (templateFallbacks.length > 0) {
        const spanExprs: Node[] = []
        for (const tpl of templateFallbacks) {
          for (const span of tpl.templateSpans) {
            spanExprs.push(span.expression)
          }
        }
        const spanTypes = spanExprs.length > 0 ? checker.getTypeAtLocation(spanExprs) : []
        let offset = 0
        for (const tpl of templateFallbacks) {
          const texts = [tpl.head.text, ...tpl.templateSpans.map((s) => s.literal.text)]
          const types = spanTypes.slice(offset, offset + tpl.templateSpans.length)
          offset += tpl.templateSpans.length
          const pattern = templateToPattern(texts, types, checker)
          if (pattern) deleteMatchingKeys(pattern, unusedKeys)
        }
      }
    }
  } finally {
    api.close()
  }

  return [...unusedKeys].sort(compareStrings)
}

export interface UnusedOptions {
  tsconfigPath?: string | undefined
  ignoreFullCatalogUnion?: boolean | undefined
}

export async function unused(options: UnusedOptions = {}): Promise<void> {
  const config = getConfig()
  const { localeFiles, localeNamespaces } = await readAllLocales(config.localesDir)
  const baseFile = localeFiles.find((file) => file.name === config.baseLocale)
  const baseNamespaces = localeNamespaces[config.baseLocale] ?? []

  if (!baseFile && baseNamespaces.length === 0) {
    throw new KanjouCliError(`Base locale "${config.baseLocale}" not found`, {
      localesDir: config.localesDir,
    })
  }

  const messages = await loadMergedLocale(baseFile, baseNamespaces)
  const unusedKeys = findUnusedKeys({
    tsconfigPath: options.tsconfigPath,
    allKeys: Object.keys(messages),
    ignoreFullCatalogUnion: options.ignoreFullCatalogUnion,
  })
  if (unusedKeys.length > 0) {
    consola.log(unusedKeys.join('\n'))
  }
}
