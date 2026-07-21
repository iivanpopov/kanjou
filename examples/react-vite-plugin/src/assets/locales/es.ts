export default {
  greet: `¡Hola, {$name}!`,
  apples: `.input {$count :number}
.match $count
one {{Tienes {$count} manzana.}}
* {{Tienes {$count} manzanas.}}`,
} as const
