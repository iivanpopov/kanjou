import consola from 'consola'
import fs from 'node:fs/promises'
import path from 'node:path'

export interface DtsOptions {
  sourceLocalePath: string
  outputDirectory: string
}

const virtualMessagesDtsContent = `/* eslint-disable */
declare module 'virtual:kanjou/*' {
  const messages: Partial<import('@kanjou/react').Messages>
  export default messages
}`

export async function generateVirtualMessagesDts(outputDirectory: string) {
  try {
    await fs.writeFile(
      path.resolve(outputDirectory, 'virtual-messages.d.ts'),
      virtualMessagesDtsContent,
    )
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to to generate virtual-messages.d.ts', error)
  }
}

export async function generateMessagesDts({ outputDirectory, sourceLocalePath }: DtsOptions) {
  try {
    const jsonRaw = await fs.readFile(sourceLocalePath)!
    const messagesRaw = jsonRaw.toString()

    await fs.writeFile(
      path.resolve(outputDirectory, 'messages.d.ts'),
      `/* eslint-disable */\nexport {}\ndeclare module '@kanjou/react' {\n  export interface Messages  ${messagesRaw}}`,
    )
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to to generate messages.d.ts', error)
  }
}
