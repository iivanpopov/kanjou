import type { ConfigInput } from '@kanjou/generator'
import type { VitePlugin } from 'unplugin'

import { kanjou } from './index'

const plugin: (options?: ConfigInput) => VitePlugin = kanjou.vite
export default plugin
