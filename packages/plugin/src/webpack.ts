import type { UserConfig } from '@kanjou/config'
import type { WebpackPluginInstance } from 'unplugin'

import { kanjou } from './index'

const plugin: (options?: UserConfig) => WebpackPluginInstance = kanjou.webpack
export default plugin
