import type { UserConfig } from '@kanjou/config'
import type { Plugin } from 'vite'

import { kanjou } from './index'

const plugin = kanjou.vite as (options?: UserConfig) => Plugin
export default plugin
