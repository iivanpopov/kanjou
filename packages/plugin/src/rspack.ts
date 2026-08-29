import type { UserConfig } from '@kanjou/config'
import type { RspackPluginInstance } from 'unplugin'

import { kanjou } from './index'

const plugin: (options?: UserConfig) => RspackPluginInstance = kanjou.rspack
export default plugin
