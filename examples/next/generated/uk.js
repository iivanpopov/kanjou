import {
  rtNumber as _rn,
  rtNumberForSelection as _rnfs,
  rtSelectPlural as _rsp,
  rtVal as _rv,
} from '@kanjou/core'

export default {
  'title.main': 'Приклад Kanjou Next.js',
  'text.welcome': {
    parts: (v, r) => [
      { type: 'text', value: 'Привіт, ' },
      { type: 'markup', kind: 'open', name: 'strong' },
      { type: 'text', value: _rv(r, v?.name, '{$name}') },
      { type: 'markup', kind: 'close', name: 'strong' },
      { type: 'text', value: '!' },
    ],
  },
  'text.apples': (v, r) => {
    const _d0 = v?.count
    const _n0 = _rnfs(_d0)
    {
      const _key = _rsp(r, _n0)
      if (_key === 'one') {
        return `У вас є ${_rn(r, _d0, undefined, '{$count}')} яблуко.`
      }
      if (_key === 'few') {
        return `У вас є ${_rn(r, _d0, undefined, '{$count}')} яблука.`
      }
      if (_key === 'many') {
        return `У вас є ${_rn(r, _d0, undefined, '{$count}')} яблук.`
      }
    }
    return `У вас є ${_rn(r, _d0, undefined, '{$count}')} яблук.`
  },
  'title.counter': 'Кількість кліків',
  'button.reset': 'Скинути',
  'input.select-locale': 'Виберіть мову',
  'title.statistics': 'Статистика',
  'label.price': 'Ціна',
  'label.date': 'Поточна дата',
}
