import type { Node } from 'typescript/unstable/ast'

import { getConfig, loadMessages } from '@kanjou/generator'
import consola from 'consola'
import { parse } from 'jsonc-parser'
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  isCallExpression,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isPropertyAccessExpression,
  isStringLiteral,
  isVariableDeclaration,
} from 'typescript/unstable/ast'
import { API } from 'typescript/unstable/sync'

export async function unused() {
  const config = getConfig()
  const messages = (await loadMessages(config))[config.baseLocale]
  if (!messages) throw new Error(`Base locale "${config.baseLocale}" not found`)

  const unusedKeys = new Set(Object.keys(messages))
  const api = new API()

  try {
    const projects = new Set<string>()

    function addProject(fileName: string) {
      if (statSync(fileName).isDirectory()) fileName = path.join(fileName, 'tsconfig.json')
      if (projects.has(fileName)) return
      projects.add(fileName)
      const config = parse(readFileSync(fileName, 'utf8'))
      for (const reference of config.references ?? []) {
        addProject(path.resolve(path.dirname(fileName), reference.path))
      }
    }

    addProject(path.resolve('tsconfig.json'))
    using snapshot = api.updateSnapshot({ openProjects: [...projects] })

    for (const { program, checker } of snapshot.getProjects()) {
      const translators = new Set<number>()
      const files = program.getSourceFileNames().flatMap((fileName) => {
        if (fileName.includes('/node_modules/')) return []
        const file = program.getSourceFile(fileName)
        return file && !file.isDeclarationFile ? [file] : []
      })

      function findTranslators(node: Node) {
        if (
          isVariableDeclaration(node) &&
          isIdentifier(node.name) &&
          node.initializer &&
          isCallExpression(node.initializer) &&
          isIdentifier(node.initializer.expression) &&
          node.initializer.expression.text === 'useTranslate'
        ) {
          const symbol = checker.getSymbolAtLocation(node.name)
          if (symbol) translators.add(symbol.id)
        }
        node.forEachChild(findTranslators)
      }

      function findKeys(node: Node) {
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
          if (
            isIdentifier(expression) &&
            key &&
            (isStringLiteral(key) || isNoSubstitutionTemplateLiteral(key))
          ) {
            const symbol = checker.getSymbolAtLocation(expression)
            if (symbol && translators.has(symbol.id)) unusedKeys.delete(key.text)
          }
        }
        node.forEachChild(findKeys)
      }

      files.forEach(findTranslators)
      files.forEach(findKeys)
    }
  } finally {
    api.close()
  }

  consola.log([...unusedKeys].sort().join('\n'))
}
