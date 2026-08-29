import type { LoadConfigResult, UserConfig } from '@kanjou/config'

import { createRecoveryConfigLoader } from '@kanjou/config'

export interface KanjouPluginContext {
  ready: Promise<LoadConfigResult<UserConfig>>
  reloadConfig: (inlineConfig?: UserConfig) => Promise<LoadConfigResult<UserConfig>>
  getConfig: () => Promise<UserConfig>
}

export function createContext(inlineConfig?: UserConfig): KanjouPluginContext {
  const loadConfig = createRecoveryConfigLoader()

  let _config = {} as UserConfig
  const _ready = reloadConfig()

  async function reloadConfig() {
    const result = await loadConfig(inlineConfig)
    _config = result.config
    return { ...result, config: _config }
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
