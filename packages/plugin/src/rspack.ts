import type { ConfigInput } from '@kanjou/generator'
import type { RspackPluginInstance } from 'unplugin'

import { kanjou } from './index'

const plugin: (options?: ConfigInput) => RspackPluginInstance = kanjou.rspack
export default plugin
