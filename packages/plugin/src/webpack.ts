import type { ConfigInput } from '@kanjou/generator'
import type { WebpackPluginInstance } from 'unplugin'

import { kanjou } from './index'

const plugin: (options?: ConfigInput) => WebpackPluginInstance = kanjou.webpack
export default plugin
