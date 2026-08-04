export default {
  greet: `¡Hola, {$name}!`,
  apples: `.input {$count :number}
.match $count
one {{Tienes {$count} manzana.}}
* {{Tienes {$count} manzanas.}}`,
  richText: `¡Bienvenido a {#b}Kanjou{/b}! Consulta la {#link}documentación{/link} o el estado {#badge /}.`,
  customCard: `{#card}Importante: ¡El {#i}formato rich{/i} funciona con componentes personalizados!{/card}`,
} as const
