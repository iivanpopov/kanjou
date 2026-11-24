import {
  rtNumber as _rn,
  rtNumberForSelection as _rnfs,
  rtSelectPlural as _rsp,
  rtVal as _rv,
} from '@kanjou/core'

export default {
  'title.main': 'Kanjou Next.js Example',
  'text.welcome': {
    parts: (v, r) => [
      { type: 'text', value: 'Hello, ' },
      { type: 'markup', kind: 'open', name: 'strong' },
      { type: 'text', value: _rv(r, v?.name, '{$name}') },
      { type: 'markup', kind: 'close', name: 'strong' },
      { type: 'text', value: '!' },
    ],
  },
  'text.apples': (v, r) => {
    const _d0 = v?.count
    const _n0 = _rnfs(_d0)
    if (_rsp(r, _n0) === 'one') {
      return `You have ${_rn(r, _d0, undefined, '{$count}')} apple.`
    }
    return `You have ${_rn(r, _d0, undefined, '{$count}')} apples.`
  },
  'title.counter': 'Click count',
  'button.reset': 'Reset',
  'input.select-locale': 'Select locale',
  'title.statistics': 'Statistics',
  'label.price': 'Price',
  'label.date': 'Current date',
}
