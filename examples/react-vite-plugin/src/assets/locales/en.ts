export default {
  greet: `Hello, {$name}!`,
  apples: `.input {$count :number}
.match $count
one {{You have {$count} apple.}}
* {{You have {$count} apples.}}`,
} as const
