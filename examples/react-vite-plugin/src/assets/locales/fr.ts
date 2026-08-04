export default {
  greet: `Bonjour, {$name}!`,
  apples: `.input {$count :number}
.match $count
one {{Vous avez {$count} pomme.}}
* {{Vous avez {$count} pommes.}}`,
  richText: `Bienvenue sur {#b}Kanjou{/b}! Consultez la {#link}documentation{/link} ou le statut {#badge /}.`,
  customCard: `{#card}Important: Le {#i}formatage rich{/i} fonctionne avec des composants personnalisés!{/card}`,
} as const
