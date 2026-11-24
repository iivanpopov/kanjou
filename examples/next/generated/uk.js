export default {
  'title.main': 'Приклад Kanjou Next.js',
  'text.welcome': {
    parts: (v) => [
      { type: 'text', value: 'Привіт, ' },
      { type: 'markup', kind: 'open', name: 'strong' },
      { type: 'text', value: String(v?.name ?? '{$name}') },
      { type: 'markup', kind: 'close', name: 'strong' },
      { type: 'text', value: '!' },
    ],
  },
  'text.apples': (v, r) => {
    const _d0 = v?.count
    const _n0 = r.numberForSelection(_d0)
    {
      const _key = r.selectPlural(_n0)
      if (_key === 'one') {
        return `У вас є ${r.number(_d0, undefined, '{$count}')} яблуко.`
      }
      if (_key === 'few') {
        return `У вас є ${r.number(_d0, undefined, '{$count}')} яблука.`
      }
      if (_key === 'many') {
        return `У вас є ${r.number(_d0, undefined, '{$count}')} яблук.`
      }
    }
    return `У вас є ${r.number(_d0, undefined, '{$count}')} яблук.`
  },
  'title.counter': 'Кількість кліків',
  'button.reset': 'Скинути',
  'input.select-locale': 'Виберіть мову',
  'title.statistics': 'Статистика',
  'label.price': 'Ціна',
  'label.date': 'Поточна дата',
}
