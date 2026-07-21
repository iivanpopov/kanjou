export default {
  greet: `Bonjour, {$name}!`,
  apples: `.input {$count :number}
.match $count
one {{Vous avez {$count} pomme.}}
* {{Vous avez {$count} pommes.}}`,
} as const
