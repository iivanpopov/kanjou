import type { Message } from '@kanjou/react'

export default {
  greet: `Hello, {$name}!`,
  apples: `
.input {$count :number}
.match $count
one {{You have {$count} apple.}}
* {{You have {$count} apples.}}`,
} as const satisfies Record<string, Message>
