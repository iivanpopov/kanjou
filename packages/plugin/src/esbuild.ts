import type { UserConfig } from '@kanjou/config'
import type { Plugin } from 'esbuild'

import { kanjou } from './index'

const plugin: (options?: UserConfig) => Plugin = kanjou.esbuild
export default plugin
