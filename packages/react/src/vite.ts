import type { KanjouOptions } from '@kanjou/config'
import type { Plugin } from 'vite'

export function kanjou(_options?: KanjouOptions): Plugin {
  return {
    name: 'kanjou',
  }
}
