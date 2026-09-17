/// <reference types="@kanjou/plugin/client" />

import type { DefaultMessageValue } from '@kanjou/react'

declare module '@kanjou/react' {
  export interface Register {
    locale: 'en' | 'uk'
    messages: {
      'title.main': {}
      'text.welcome': { name: DefaultMessageValue }
      'text.apples': { count: { __fn: 'number' } }
      'title.counter': {}
      'button.reset': {}
      'input.select-locale': {}
      'title.statistics': {}
      'label.price': {}
      'label.date': {}
    }
  }
}
