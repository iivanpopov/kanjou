import type { LoadConfigResult } from 'unconfig'

import consola from 'consola'
import { createConfigLoader as createLoader } from 'unconfig'

export interface UserConfig {
  sourceLocalePath: string
  outputDirectory: string
}

export function defineConfig(config: UserConfig): UserConfig {
  return config
}

export async function loadConfig<Config = UserConfig>(
  cwd: string = process.cwd(),
  defaults: UserConfig,
): Promise<LoadConfigResult<Config>> {
  const loader = createLoader<Config>({
    sources: [{ files: ['kanjou.config'] }],
    cwd,
  })

  const result = await loader.load()

  if (!result.config) consola.error('[@kanjou/config] Config file not found - loading defaults')

  result.config = Object.assign(defaults, result.config)

  return result
}

export function createRecoveryConfigLoader<Config extends UserConfig = UserConfig>(): (
  cwd: string | undefined,
  defaults: UserConfig,
) => Promise<LoadConfigResult<Config>> {
  let lastResolved: LoadConfigResult<Config>

  return async function (
    cwd: string = process.cwd(),
    defaults: UserConfig,
  ): Promise<LoadConfigResult<Config>> {
    try {
      const config = await loadConfig<Config>(cwd, defaults)
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
