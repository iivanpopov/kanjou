import type { LoadUserConfigResult, UserConfig } from '@kanjou/config'

import { createRecoveryConfigLoader } from '@kanjou/config'

export interface KanjouPluginContext<Config extends UserConfig = UserConfig> {
  ready: Promise<LoadUserConfigResult<Config>>
  reloadConfig: (inlineConfig?: Partial<UserConfig>) => Promise<LoadUserConfigResult<Config>>
  getConfig: () => Promise<Config>
}

export function createContext<Config extends UserConfig = UserConfig>(
  inlineConfig: Partial<UserConfig> = {},
  defaults?: Partial<UserConfig>,
): KanjouPluginContext<Config> {
  const root = process.cwd()

  const loadConfig = createRecoveryConfigLoader<Config>()

  let _config = {} as Config
  const _ready = reloadConfig()

  async function reloadConfig() {
    const result = await loadConfig(root, inlineConfig, defaults)
    _config = result.config
    return result
  }

  async function getConfig() {
    await _ready
    return _config
  }

  return {
    get ready() {
      return _ready
    },
    reloadConfig,
    getConfig,
  }
}
