import type { LoadConfigResult } from 'unconfig'

import consola from 'consola'
import { toMerged } from 'es-toolkit'
import { createConfigLoader } from 'unconfig'

export interface DtsOptions {
  outDir?: string
}

export interface CompileOptions {
  outDir?: string
}

export interface UserConfig {
  baseLocale?: string
  localesDir?: string
  compile?: CompileOptions
  dts?: boolean | DtsOptions
  prettier?: boolean | Record<string, any>
}

export type { LoadConfigResult }

export async function loadConfig(inlineConfig?: UserConfig): Promise<LoadConfigResult<UserConfig>> {
  const loader = createConfigLoader<UserConfig>({
    sources: [{ files: ['kanjou.config'] }],
  })

  const result = await loader.load()

  result.config = toMerged(result.config ?? {}, inlineConfig ?? {})

  return result
}

export function defineConfig(config: UserConfig): UserConfig {
  return config
}

export function createRecoveryConfigLoader(): (
  inlineConfig?: UserConfig,
) => Promise<LoadConfigResult<UserConfig>> {
  let lastResolved: LoadConfigResult<UserConfig>

  return async (inlineConfig?: UserConfig) => {
    try {
      const config = await loadConfig(inlineConfig)
      lastResolved = config
      return config
    } catch (error) {
      if (lastResolved) {
        consola.error('[@kanjou/config] Error loading config:', error)
        return lastResolved
      }
      throw error
    }
  }
}
