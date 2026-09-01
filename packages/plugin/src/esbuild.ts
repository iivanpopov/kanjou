import type { ConfigInput } from '@kanjou/generator'
import type { UnpluginInstance } from 'unplugin'

import { kanjou } from './index'

const plugin: UnpluginInstance<ConfigInput | undefined, false>['esbuild'] = kanjou.esbuild
export default plugin
