import type { Node, TemplateExpression } from 'typescript/unstable/ast'
import type { Checker, Type } from 'typescript/unstable/sync'

import { getConfig, load, readLocaleFiles, readLocaleNamespaces } from '@kanjou/generator'
import consola from 'consola'
import { parse } from 'jsonc-parser'
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  isAsExpression,
  isCallExpression,
  isIdentifier,
  isNonNullExpression,
  isNoSubstitutionTemplateLiteral,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isSatisfiesExpression,
  isStringLiteral,
  isTemplateExpression,
  isVariableDeclaration,
} from 'typescript/unstable/ast'
import { API } from 'typescript/unstable/sync'

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

  if (type.isStringLiteralType()) return escapeRegex(type.value)
  if (type.isNumberLiteralType() || type.isBigIntLiteralType() || type.isBooleanLiteralType()) {
    return escapeRegex(String(type.value))
  }

  if (type.isUnionType()) {
    const parts: string[] = []
    for (const member of type.getTypes()) {
      const part = typeToPattern(member, checker, new Set(visited))
      if (part !== null) parts.push(part)
    }
    if (parts.length === 0) return null
    if (parts.length === 1) return parts[0]
    return `(?:${parts.join('|')})`
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
    switch (type.intrinsicName) {
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

  return null
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
    const spanPattern = spanType ? typeToPattern(spanType, checker, new Set(visited)) : '.*'
    pattern += spanPattern ?? '.*'
    pattern += escapeRegex(texts[i + 1] ?? '')
  }
  return pattern
}

function deleteMatchingKeys(pattern: string, unusedKeys: Set<string>) {
  const regex = new RegExp(`^${pattern}$`)
  for (const key of unusedKeys) {
    if (regex.test(key)) unusedKeys.delete(key)
  }
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

  if (type.isStringLiteralType()) {
    outKeys.add(type.value)
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
}

export interface FindUnusedOptions {
  tsconfigPath?: string
  allKeys: Iterable<string>
  ignoreFullCatalogUnion?: boolean
}

export function findUnusedKeys(options: FindUnusedOptions): string[] {
  const allKeys = new Set(options.allKeys)
  const unusedKeys = new Set(allKeys)
  const ignoreFullCatalogUnion = options.ignoreFullCatalogUnion ?? allKeys.size > 20
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

    addProject(path.resolve(options.tsconfigPath ?? 'tsconfig.json'))
    using snapshot = api.updateSnapshot({ openProjects: [...projects] })

    for (const { program, checker } of snapshot.getProjects()) {
      const files = program.getSourceFileNames().flatMap((fileName) => {
        if (fileName.includes('/node_modules/')) return []
        const file = program.getSourceFile(fileName)
        return file && !file.isDeclarationFile ? [file] : []
      })

      const translatorDeclNodes: Node[] = []
      const translatorNames = new Set<string>()

      function collectTranslators(node: Node) {
        if (
          isVariableDeclaration(node) &&
          isIdentifier(node.name) &&
          node.initializer &&
          isCallExpression(node.initializer) &&
          isIdentifier(node.initializer.expression) &&
          (node.initializer.expression.text === 'useTranslate' ||
            node.initializer.expression.text === 'createTranslate')
        ) {
          translatorDeclNodes.push(node.name)
          translatorNames.add(node.name.text)
        }
        node.forEachChild(collectTranslators)
      }

      files.forEach(collectTranslators)
      if (translatorDeclNodes.length === 0) continue

      const translators = new Set<number>()
      for (const symbol of checker.getSymbolAtLocation(translatorDeclNodes)) {
        if (symbol) translators.add(symbol.id)
      }

      const candidateExprs: Node[] = []
      const candidateKeys: Node[] = []

      function collectCalls(node: Node) {
        if (isCallExpression(node)) {
          let expression = node.expression
          while (
            isPropertyAccessExpression(expression) &&
            (expression.name.text === 'rich' ||
              expression.name.text === 'unsafe' ||
              expression.name.text === 'parts')
          ) {
            expression = expression.expression
          }
          const key = node.arguments[0]
          if (isIdentifier(expression) && key && translatorNames.has(expression.text)) {
            candidateExprs.push(expression)
            candidateKeys.push(key)
          }
        }
        node.forEachChild(collectCalls)
      }

      files.forEach(collectCalls)
      if (candidateExprs.length === 0) continue

      const exprSymbols = checker.getSymbolAtLocation(candidateExprs)
      const dynamicKeys: Node[] = []

      for (let i = 0; i < candidateExprs.length; i++) {
        const symbol = exprSymbols[i]
        if (!symbol || !translators.has(symbol.id)) continue

        const key = candidateKeys[i]
        if (isStringLiteral(key) || isNoSubstitutionTemplateLiteral(key)) {
          unusedKeys.delete(key.text)
        } else {
          dynamicKeys.push(key)
        }
      }

      if (dynamicKeys.length === 0) continue

      const dynamicTypes = checker.getTypeAtLocation(dynamicKeys)
      const templateFallbacks: TemplateExpression[] = []

      for (let i = 0; i < dynamicKeys.length; i++) {
        const keyNode = dynamicKeys[i]
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

  return [...unusedKeys].sort()
}

async function loadBaseLocaleMessages(
  localesDir: string,
  baseLocale: string,
): Promise<Record<string, string> | null> {
  const [localeFiles, localeNamespaces] = await Promise.all([
    readLocaleFiles(localesDir),
    readLocaleNamespaces(localesDir),
  ])

  const baseFile = localeFiles.find((file) => file.name === baseLocale)
  if (baseFile) {
    return await load<Record<string, string>>(baseFile)
  }

  const baseNamespaces = localeNamespaces[baseLocale] ?? []
  if (baseNamespaces.length > 0) {
    const loaded = await Promise.all(
      baseNamespaces.map((file) => load<Record<string, string>>(file)),
    )
    return Object.assign({}, ...loaded)
  }

  return null
}

export async function unused() {
  const config = getConfig()
  const messages = await loadBaseLocaleMessages(config.localesDir, config.baseLocale)
  if (!messages) throw new Error(`Base locale "${config.baseLocale}" not found`)

  const unusedKeys = findUnusedKeys({ allKeys: Object.keys(messages) })
  consola.log(unusedKeys.join('\n'))
}
