import type { UserConfig } from '@kanjou/config'
import type { LoadConfigResult } from 'unconfig'

import { createRecoveryConfigLoader } from '@kanjou/config'

export interface KanjouPluginContext<Config extends UserConfig = UserConfig> {
  ready: Promise<LoadConfigResult<Config>>
  reloadConfig: () => Promise<LoadConfigResult<Config>>
  getConfig: () => Promise<Config>
}

export function createContext<Config extends UserConfig = UserConfig>(
  defaults: UserConfig,
): KanjouPluginContext<Config> {
  const root = process.cwd()

  const loadConfig = createRecoveryConfigLoader<Config>()

  const _ready = reloadConfig()
  let _config = {} as Config

  async function reloadConfig() {
    const result = await loadConfig(root, defaults)
    _config = result.config
    return result as LoadConfigResult<Config>
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
