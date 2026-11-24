export default {
  'title.main': 'Kanjou Next.js Example',
  'text.welcome': {
    parts: (v) => [
      { type: 'text', value: 'Hello, ' },
      { type: 'markup', kind: 'open', name: 'strong' },
      { type: 'text', value: String(v?.name ?? '{$name}') },
      { type: 'markup', kind: 'close', name: 'strong' },
      { type: 'text', value: '!' },
    ],
  },
  'text.apples': (v, r) => {
    const _d0 = v?.count
    const _n0 = r.numberForSelection(_d0)
    if (r.selectPlural(_n0) === 'one') {
      return `You have ${r.number(_d0)} apple.`
    }
    return `You have ${r.number(_d0)} apples.`
  },
  'title.counter': 'Click count',
  'button.reset': 'Reset',
  'input.select-locale': 'Select locale',
  'title.statistics': 'Statistics',
  'label.price': 'Price',
  'label.date': 'Current date',
}
