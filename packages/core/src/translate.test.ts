import { compileMessages } from '@kanjou/generator'
import { describe, expect, expectTypeOf, it } from 'vitest'

import type {
  BuiltinFunctions,
  Functions,
  InferPartsType,
  Message,
  MessageContext,
  MessageFunction,
  MessageMarkupPart,
  MessagePart,
  MessageTextPart,
  MessageValue,
} from './types'

import { createTranslateCache } from './cache'
import { KanjouFormatError } from './errors'
import { getIntlFormatter } from './formatters'
import * as coreRuntime from './runtime'
import {
  formatMessage,
  formatMessageParts,
  rtCurrencyOpts,
  rtDate,
  rtDateOpts,
  rtInteger,
  rtNumber,
  rtOffset,
  rtSelect,
  rtSelectPlural,
} from './runtime'
import { createTranslate } from './translate'

const mf2KitchenSinkMessages: Record<string, string> = {
  // 1. Plain & escaping
  'plain.empty': '',
  'plain.text': 'Hello, world!',
  'plain.escapes':
    'Backtick `code`, template $\\{notEvaluated\\}, backslash \\\\ and newline\nnext',
  'plain.vWordWithMarkup': 'Version {#b}v{/b} 2',

  // 2. Simple interpolation & variable access
  'simple.basic': 'Hi, {$name}!',
  'simple.multiple': '{$first} and {$second}',
  'simple.dotted': 'Hello, {$user.profile.name}!',
  'simple.hyphenated': 'Value: {$user-name}',
  'simple.escapes': 'Template $\\{safe\\} `{$name}` \\\\',
  'simple.proto': 'Proto: {$toString} / {$constructor}',

  // 3. Built-in functions
  'fn.string.var': 'Str: {$val :string}',
  'fn.string.lit': 'Lit: {|hello| :string}',
  'fn.number.default': 'Count: {$count :number}',
  'fn.number.options':
    'Num: {$count :number minimumIntegerDigits=2 minimumFractionDigits=2 maximumFractionDigits=2 useGrouping=never signDisplay=always}',
  'fn.number.significant':
    'Sig: {$count :number minimumSignificantDigits=2 maximumSignificantDigits=4}',
  'fn.number.dynamic': 'Dyn: {$count :number maximumFractionDigits=$digits}',
  'fn.integer.basic': 'Int: {$n :integer}',
  'fn.offset.basic': 'Offset: {$n :offset add=1}',
  'fn.offset.offsetProp': 'OffsetProp: {$n :offset offset=5}',
  'fn.offset.dynamic': 'OffsetDyn: {$n :offset add=$delta}',

  // 4. Draft Intl functions
  'fn.currency.usd': 'Price: {$amount :currency currency=USD}',
  'fn.currency.zeroDigits': 'Price0: {$amount :currency currency=USD fractionDigits=0}',
  'fn.currency.autoDigits': 'PriceAuto: {$amount :currency currency=JPY fractionDigits=auto}',
  'fn.currency.dynamic': 'PriceDyn: {$amount :currency currency=$cur currencyDisplay=code}',
  'fn.percent.basic': 'Rate: {$rate :percent}',
  'fn.unit.km': 'Dist: {$dist :unit unit=kilometer unitDisplay=long}',
  'fn.date.default': 'Date: {$d :date timeZone=UTC}',
  'fn.date.draft': 'DateDraft: {$d :date fields=month-day-weekday length=long timeZone=UTC}',
  'fn.time.default': 'Time: {$d :time timeZone=UTC}',
  'fn.time.draft':
    'TimeDraft: {$d :time precision=second timeZoneStyle=short hour12=false timeZone=UTC}',
  'fn.datetime.default': 'DT: {$d :datetime timeZone=UTC}',
  'fn.datetime.style': 'DTStyle: {$d :datetime dateStyle=short timeStyle=short timeZone=UTC}',
  'fn.datetime.direct': 'DTDirect: {$d :datetime hour=2-digit minute=2-digit timeZone=UTC}',

  // 5. Declarations (.input & .local)
  'decl.inputFormatted': '.input {$count :number maximumFractionDigits=1}\n{{Total: {$count}}}',
  'decl.localOffset': '.local $next = {$n :offset add=1}\n{{Next: {$next}}}',
  'decl.localChained':
    '.local $a = {$x :offset add=1}\n.local $b = {$a :offset add=2}\n{{Chained: {$b}}}',
  'decl.localRawFallback': '.local $alias = {$missing}\n{{Alias: {$alias}}}',
  'decl.inputShadowing': '.input {$x :offset add=10}\n{{Shadowed: {$x} / {$x :number}}}',

  // 6. .match selection
  'match.pluralUk': `.input {$count :number}
.match $count
* {{{$count} яблука (default)}}
many {{{$count} яблук}}
few {{{$count} яблука}}
one {{{$count} яблуко}}
0 {{Нічого}}`,
  'match.pluralEn': `.input {$count :number}
.match $count
* {{{$count} apples}}
one {{{$count} apple}}
1 {{Just one apple}}
0 {{No apples}}`,
  'match.pluralFraction': `.input {$count :number minimumFractionDigits=1}
.match $count
one {{{$count} item}}
* {{{$count} items}}`,
  'match.ordinalEn': `.input {$pos :number select=ordinal}
.match $pos
one {{{$pos}st}}
two {{{$pos}nd}}
few {{{$pos}rd}}
* {{{$pos}th}}`,
  'match.exact': `.input {$count :number select=exact}
.match $count
2 {{Exact two}}
one {{Plural one}}
* {{Fallback}}`,
  'match.stringEnum': `.input {$role :string}
.match $role
admin {{Administrator}}
editor {{Editor}}
* {{Guest}}`,
  'match.offset': `.input {$others :offset subtract=1}
.match $others
0 {{Only you}}
one {{You and 1 other}}
* {{You and {$others} others}}`,
  'match.percent': `.input {$ratio :percent}
.match $ratio
100 {{Complete ({$ratio})}}
* {{Progress: {$ratio}}}`,
  'match.multiSelector': `.input {$role :string}
.input {$count :number}
.match $role $count
* * {{User: {$count}}}
admin * {{Admin: {$count}}}
admin one {{Admin: 1 item}}
admin 1 {{Admin: exact 1}}`,

  // 7. Markup (#tag)
  'markup.static': '{#br/}Static text',
  'markup.nested': 'Have account?{#br/}{#a to=$to}{#strong}Login{/strong}{/a}',
  'markup.inMatch': `.input {$count :number}
.match $count
one {{You have {#b}{$count}{/b} coin}}
* {{You have {#b}{$count}{/b} coins}}`,
  'markup.localRaw': '.local $alias = {$missing}\n{{Hi {#b}{$alias}{/b}}}',

  // 8. Custom functions
  'custom.coinsMatch': `.input {$count :coins}
.match $count
one {{You have {$count} {#coin/} robokoin}}
few {{You have {$count} {#coin/} robokoins}}
many {{You have {$count} {#coin/} robokoins}}
* {{You have {$count} {#coin/} robokoin}}`,
  'custom.optionsMeta': 'Meta: {$x :inspect literalOpt=abc varOpt=$dyn}',
  'custom.plainReturn': 'PlainFn: {$x :plainFn}',
  'custom.unknown': 'Bad: {$x :doesNotExist}',
}

function compileBundle(messages: Record<string, string>): Record<string, Message> {
  const compiledCode = compileMessages(messages)
  const importMatch = compiledCode.match(/^import \{([^}]+)\} from '@kanjou\/core';\n/)
  const body = (importMatch ? compiledCode.slice(importMatch[0].length) : compiledCode).replace(
    /^export default /m,
    'return ',
  )
  if (!importMatch) {
    // oxlint-disable-next-line typescript/no-implied-eval
    return new Function(body)() as Record<string, Message>
  }
  const specifiers = importMatch[1].split(',').map((spec) => {
    const [exported, alias] = spec.trim().split(/\s+as\s+/)
    return { exported, alias: alias ?? exported }
  })
  // oxlint-disable-next-line typescript/no-implied-eval
  return new Function(...specifiers.map((s) => s.alias), body)(
    ...specifiers.map((s) => (coreRuntime as Record<string, unknown>)[s.exported]),
  ) as Record<string, Message>
}

const runtimeMessages = compileBundle(mf2KitchenSinkMessages)

const coins: MessageFunction<Record<string, unknown>, number, 'coins', 'string'> = (
  context,
  options,
  operand,
) => {
  const formatted = `${context.number(operand, options)}RC`
  return {
    type: 'coins',
    value: formatted,
    selectKey: (keys) => context.select(operand, keys),
    toString: () => formatted,
    toParts: () => [{ type: 'string', value: formatted }],
  }
}

const plainFn: MessageFunction = (context, _options, operand) =>
  context.number(operand, { maximumFractionDigits: 1 })

const inspect: MessageFunction = (context, options, operand) => {
  const summary = `${String(operand)}|${String(options.literalOpt)}|${String(options.varOpt)}|lit:${[...context.literalOptionKeys].join(',')}`
  return {
    type: 'inspect',
    toString: () => summary,
    toParts: () => [{ type: 'inspect', value: summary }],
  }
}

const tUk = createTranslate({
  locale: 'uk',
  messages: runtimeMessages,
  options: { functions: { coins, inspect, plainFn } },
})

const tEn = createTranslate({
  locale: 'en',
  messages: runtimeMessages,
  options: { functions: { coins, inspect, plainFn } },
})

const sampleDate = new Date('2026-03-15T14:30:45Z')

// 1. Default / base behavior
it('Should return empty string for empty messages', () => {
  expect(tEn('plain.empty')).toBe('')
})

it('Should return plain text messages unchanged', () => {
  expect(tEn('plain.text')).toBe('Hello, world!')
})

it('Should interpolate simple variable placeholders', () => {
  expect(tEn('simple.basic', { name: 'Ada' })).toBe('Hi, Ada!')
})

// 2. Inputs & variable forms
it('Should interpolate multiple variables in a single message', () => {
  expect(tEn('simple.multiple', { first: 'One', second: 'Two' })).toBe('One and Two')
})

it('Should resolve nested dotted object paths and flat dotted keys', () => {
  expect(tEn.unsafe('simple.dotted', { user: { profile: { name: 'Nested' } } })).toBe(
    'Hello, Nested!',
  )
  expect(tEn('simple.dotted', { 'user.profile.name': 'Flat' })).toBe('Hello, Flat!')
})

it('Should resolve hyphenated variable names', () => {
  expect(tEn('simple.hyphenated', { 'user-name': 'dash' })).toBe('Value: dash')
})

it('Should escape backticks, template syntax, backslashes, and newlines', () => {
  const tplA = '$' + '{notEvaluated}'
  const tplB = '$' + '{safe}'
  expect(tEn('plain.escapes')).toBe(
    `Backtick \`code\`, template ${tplA}, backslash \\ and newline\nnext`,
  )
  expect(tEn('simple.escapes', { name: 'Ivan' })).toBe(`Template ${tplB} \`Ivan\` \\`)
})

it('Should fall back to placeholder syntax when a variable is missing or null', () => {
  expect(tEn('simple.basic', {})).toBe('Hi, {$name}!')
  expect(tEn.unsafe('simple.basic', { name: null })).toBe('Hi, {$name}!')
})

// 3. Built-in and draft functions
describe('built-in and draft functions', () => {
  it('Should format :string with variable and literal operands', () => {
    expect(tEn('fn.string.var', { val: 42 })).toBe('Str: 42')
    expect(tEn.unsafe('fn.string.var', { val: null })).toBe('Str: ')
    expect(tEn('fn.string.lit')).toBe('Lit: hello')
  })

  it('Should format :number with default, static, significant, dynamic options, and numeric strings', () => {
    expect(tEn('fn.number.default', { count: 1234.5 })).toBe('Count: 1,234.5')
    expect(tEn('fn.number.options', { count: 5.1 })).toBe('Num: +05.10')
    expect(tEn('fn.number.significant', { count: 12345 })).toBe('Sig: 12,350')
    expect(tEn('fn.number.dynamic', { count: 1.2345, digits: 2 })).toBe('Dyn: 1.23')
    expect(tEn('fn.number.default', { count: '42.5' })).toBe('Count: 42.5')
  })

  ;[
    [3.7, 'Int: 4'],
    [-3.7, 'Int: -4'],
    ['3.7', 'Int: 4'],
    [42n, 'Int: 42'],
  ].forEach(([input, expected]) => {
    it(`Should format :integer for ${String(input)}`, () => {
      expect(tEn.unsafe('fn.integer.basic', { n: input })).toBe(expected)
    })
  })

  it('Should format :offset with add, subtract, offset, dynamic delta, and bigint', () => {
    expect(tEn('fn.offset.basic', { n: 10 })).toBe('Offset: 11')
    expect(tEn('fn.offset.offsetProp', { n: 10 })).toBe('OffsetProp: 15')
    expect(tEn('fn.offset.dynamic', { n: 10, delta: 3 })).toBe('OffsetDyn: 13')
    expect(tEn.unsafe('fn.offset.basic', { n: 10n })).toBe('Offset: 11')
  })

  it('Should format :currency with default, zero, auto, and dynamic currency options', () => {
    expect(tEn('fn.currency.usd', { amount: 12.5 })).toBe('Price: $12.50')
    expect(tEn('fn.currency.zeroDigits', { amount: 12.5 })).toBe('Price0: $13')
    expect(tEn('fn.currency.autoDigits', { amount: 100 })).toBe('PriceAuto: ¥100')
    expect(tEn('fn.currency.dynamic', { amount: 50, cur: 'EUR' })).toBe('PriceDyn: EUR\u00A050.00')
  })

  it('Should format :percent and :unit values', () => {
    expect(tEn('fn.percent.basic', { rate: 0.25 })).toBe('Rate: 25%')
    expect(tEn('fn.unit.km', { dist: 5 })).toBe('Dist: 5 kilometers')
  })

  it('Should format :date with default and MF2 draft options', () => {
    expect(tEn.unsafe('fn.date.default', { d: sampleDate })).toBe('Date: Mar 15, 2026')
    expect(tEn.unsafe('fn.date.draft', { d: sampleDate })).toBe('DateDraft: Sunday, March 15')
  })

  it('Should format :time with default and MF2 draft options', () => {
    expect(tEn.unsafe('fn.time.default', { d: sampleDate })).toBe('Time: 2:30 PM')
    expect(tEn.unsafe('fn.time.draft', { d: sampleDate })).toBe('TimeDraft: 14:30:45 UTC')
  })

  it('Should format :datetime with default, style, and direct Intl field options', () => {
    expect(tEn.unsafe('fn.datetime.default', { d: sampleDate })).toBe('DT: Mar 15, 2026, 2:30 PM')
    expect(tEn.unsafe('fn.datetime.style', { d: sampleDate })).toBe('DTStyle: 3/15/26, 2:30 PM')
    expect(tEn.unsafe('fn.datetime.direct', { d: sampleDate })).toBe(
      'DTDirect: Mar 15, 2026, 02:30 PM',
    )
  })
})

// 4. Declarations
describe('declarations', () => {
  it('Should apply .input formatting when referenced in pattern', () => {
    expect(tEn('decl.inputFormatted', { count: 2.34 })).toBe('Total: 2.3')
  })

  it('Should evaluate .local and chained .local declarations', () => {
    expect(tEn('decl.localOffset', { n: 9 })).toBe('Next: 10')
    expect(tEn('decl.localChained', { x: 10 })).toBe('Chained: 13')
  })

  it('Should preserve placeholder fallback for raw .local aliases when missing', () => {
    expect(tEn('decl.localRawFallback', {})).toBe('Alias: {$alias}')
    expect(tEn('decl.localRawFallback', { missing: 'ok' })).toBe('Alias: ok')
  })

  it('Should evaluate .input against original input while .local uses current scope', () => {
    expect(tEn('decl.inputShadowing', { x: 5 })).toBe('Shadowed: 15 / 15')
  })
})

// 5. Match selection
describe('match selection', () => {
  ;[
    [0, 'Нічого'],
    [1, '1 яблуко'],
    [2, '2 яблука'],
    [5, '5 яблук'],
    [21, '21 яблуко'],
  ].forEach(([count, expected]) => {
    it(`Should select Ukrainian plural variant for count=${String(count)}`, () => {
      expect(tUk('match.pluralUk', { count })).toBe(expected)
    })
  })

  ;[
    [0, 'No apples'],
    [1, 'Just one apple'],
    [3, '3 apples'],
  ].forEach(([count, expected]) => {
    it(`Should prioritize exact literal keys over plural categories for count=${String(count)}`, () => {
      expect(tEn('match.pluralEn', { count })).toBe(expected)
    })
  })

  it('Should respect fractionDigits in plural selection', () => {
    expect(tEn('match.pluralFraction', { count: 1 })).toBe('1.0 items')
  })

  it('Should match numbers without trying plural categories in exact mode', () => {
    expect(tEn('match.exact', { count: 2 })).toBe('Exact two')
    expect(tEn('match.exact', { count: 1 })).toBe('Fallback')
  })

  it('Should not match an invalid numeric operand to a literal key', () => {
    const messages = compileBundle({
      message: `.input {$n :number}
.match $n
1 {{One}}
null {{Literal null}}
* {{Fallback}}`,
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t('message', { n: '1' })).toBe('One')
    expect(t('message', { n: 'null' })).toBe('Fallback')
    expect(t('message')).toBe('Fallback')
  })

  it('Should select plural categories for numeric string operands', () => {
    expect(tUk('match.pluralUk', { count: '1' })).toBe('1 яблуко')
    expect(tUk('match.pluralUk', { count: '2' })).toBe('2 яблука')
  })

  it('Should use literal string keys rather than plural categories with :string selectors', () => {
    const runtimeMessages = compileBundle({
      message: '.input {$v :string}\n.match $v\none {{word}}\n* {{fallback}}',
    })
    const t = createTranslate({ locale: 'en', messages: runtimeMessages })

    expect(t('message', { v: '1' })).toBe('fallback')
    expect(t('message', { v: 'one' })).toBe('word')
  })

  it('Should retry less specific keys when later selectors rule out the exact match', () => {
    const runtimeMessages = compileBundle({
      message: `.input {$count :number}
.input {$role :string}
.match $count $role
1 admin {{exact admin}}
one guest {{plural guest}}
* guest {{any guest}}
* * {{fallback}}`,
    })
    const t = createTranslate({ locale: 'en', messages: runtimeMessages })

    expect(t('message', { count: 1, role: 'admin' })).toBe('exact admin')
    expect(t('message', { count: 1, role: 'guest' })).toBe('plural guest')
    expect(t('message', { count: 2, role: 'guest' })).toBe('any guest')
    expect(t('message', { count: 1, role: 'other' })).toBe('fallback')
  })

  it('Should use current plural options when a third selector rules out an exact match', () => {
    const messages = compileBundle({
      message: `.input {$n :number minimumFractionDigits=$digits}
.input {$role :string}
.input {$lang :string}
.match $n $role $lang
1 admin uk {{Exact}}
one admin en {{Plural}}
* admin en {{Language fallback}}
* * * {{Fallback}}`,
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t('message', { n: '1', digits: 2, role: 'admin', lang: 'uk' })).toBe('Exact')
    expect(t('message', { n: '1', digits: 0, role: 'admin', lang: 'en' })).toBe('Plural')
    expect(t('message', { n: '1', digits: 2, role: 'admin', lang: 'en' })).toBe('Language fallback')
    expect(t('message', { n: '1', digits: 0, role: 'admin', lang: 'fr' })).toBe('Fallback')
  })

  ;[
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
  ].forEach(([pos, expected]) => {
    it(`Should select English ordinal suffix for pos=${String(pos)}`, () => {
      expect(tEn('match.ordinalEn', { pos })).toBe(expected)
    })
  })

  ;[
    ['admin', 'Administrator'],
    ['editor', 'Editor'],
    ['other', 'Guest'],
  ].forEach(([role, expected]) => {
    it(`Should select string enum variant for role=${role}`, () => {
      expect(tEn('match.stringEnum', { role })).toBe(expected)
    })
  })

  ;[
    [1, 'Only you'],
    [2, 'You and 1 other'],
    [5, 'You and 4 others'],
  ].forEach(([others, expected]) => {
    it(`Should select :offset variant for others=${String(others)}`, () => {
      expect(tEn('match.offset', { others })).toBe(expected)
    })
  })

  it('Should select :percent variant against scaled percentage', () => {
    expect(tEn('match.percent', { ratio: 1 })).toBe('Complete (100%)')
    expect(tEn('match.percent', { ratio: 0.4 })).toBe('Progress: 40%')
  })

  ;[
    [{ role: 'admin', count: 1 }, 'Admin: exact 1'],
    [{ role: 'admin', count: 5 }, 'Admin: 5'],
    [{ role: 'guest', count: 5 }, 'User: 5'],
  ].forEach(([values, expected]) => {
    it(`Should sort multi-selector variants by specificity for ${JSON.stringify(values)}`, () => {
      expect(tEn('match.multiSelector', values as Record<string, string | number>)).toBe(expected)
    })
  })
})

// 6. Markup & parts
describe('markup and parts', () => {
  it('Should strip standalone markup in string mode and preserve it in parts mode', () => {
    expect(tEn('markup.static')).toBe('Static text')
    expect(tEn.parts('markup.static')).toEqual([
      { type: 'markup', kind: 'standalone', name: 'br' },
      { type: 'text', value: 'Static text' },
    ])
  })

  it('Should preserve nested markup tags and dynamic options in parts mode', () => {
    expect(tEn('markup.nested', { to: '/login' })).toBe('Have account?Login')
    expect(tEn.parts('markup.nested', { to: '/login' })).toEqual([
      { type: 'text', value: 'Have account?' },
      { type: 'markup', kind: 'standalone', name: 'br' },
      { type: 'markup', kind: 'open', name: 'a', options: { to: '/login' } },
      { type: 'markup', kind: 'open', name: 'strong' },
      { type: 'text', value: 'Login' },
      { type: 'markup', kind: 'close', name: 'strong' },
      { type: 'markup', kind: 'close', name: 'a' },
    ])
  })

  it('Should support markup inside .match variants', () => {
    expect(tEn('markup.inMatch', { count: 1 })).toBe('You have 1 coin')
    expect(tEn.parts('markup.inMatch', { count: 2 })).toEqual([
      { type: 'text', value: 'You have ' },
      { type: 'markup', kind: 'open', name: 'b' },
      { type: 'text', value: '2' },
      { type: 'markup', kind: 'close', name: 'b' },
      { type: 'text', value: ' coins' },
    ])
  })

  it('Should preserve raw .local fallback inside markup messages', () => {
    expect(tEn('markup.localRaw', {})).toBe('Hi {$alias}')
  })
})

// 7. Custom functions & errors
describe('custom functions and errors', () => {
  it('Should run custom functions inside .match and markup messages', () => {
    expect(tUk('custom.coinsMatch', { count: 1 })).toBe('You have 1RC  robokoin')
    expect(tUk('custom.coinsMatch', { count: 2 })).toBe('You have 2RC  robokoins')
    expect(tUk.parts('custom.coinsMatch', { count: 5 })).toEqual([
      { type: 'text', value: 'You have ' },
      { type: 'string', value: '5RC' },
      { type: 'text', value: ' ' },
      { type: 'markup', kind: 'standalone', name: 'coin' },
      { type: 'text', value: ' robokoins' },
    ])
  })

  it('Should let a custom selector inspect and modify its candidate set without affecting retries', () => {
    const messages = compileBundle({
      message: `.input {$tier :tier}
.input {$role :string}
.match $tier $role
gold admin {{Gold}}
silver guest {{Silver}}
* * {{Fallback}}`,
    })
    const tier: MessageFunction = () => ({
      selectKey(keys) {
        if (keys.has('gold')) {
          keys.delete('silver')
          return 'gold'
        }
        return keys.has('silver') ? 'silver' : null
      },
    })
    const t = createTranslate({ locale: 'en', messages, options: { functions: { tier } } })

    expect(t('message', { role: 'guest' })).toBe('Silver')
    expect(t('message', { role: 'admin' })).toBe('Gold')
  })

  it('Should pass literalOptionKeys only for literal options on custom functions', () => {
    expect(tEn('custom.optionsMeta', { x: 7, dyn: 'xyz' })).toBe('Meta: 7|abc|xyz|lit:literalOpt')
  })

  it('Should support custom functions returning a string directly', () => {
    expect(tEn('custom.plainReturn', { x: 12.345 })).toBe('PlainFn: 12.3')
    expect(tEn.parts('custom.plainReturn', { x: 12.345 })).toEqual([
      { type: 'text', value: 'PlainFn: ' },
      { type: 'text', value: '12.3' },
    ])
  })

  it('Should use a custom function’s parts without requiring markup', () => {
    const runtimeMessages = compileBundle({
      inline: 'Prefix {$x :custom}',
      local: '.local $result = {$x :custom}\n{{Prefix {$result}}}',
      match: `.input {$role :string}
.match $role
yes {{Prefix {$x :custom}}}
* {{No}}`,
    })
    const custom: MessageFunction = () => ({
      value: 'text',
      toParts: () => [{ type: 'custom', value: 'part' }],
    })
    const t = createTranslate({
      locale: 'en',
      messages: runtimeMessages,
      options: { functions: { custom } },
    })

    for (const id of ['inline', 'local', 'match']) {
      expect(t(id, { x: 1, role: 'yes' })).toBe('Prefix text')
      expect(t.parts(id, { x: 1, role: 'yes' })).toEqual([
        { type: 'text', value: 'Prefix ' },
        { type: 'custom', value: 'part' },
      ])
    }
    expect(t.parts('match', { role: 'no' })).toEqual([{ type: 'text', value: 'No' }])
  })

  it('Should keep literal option metadata separate from changing variable options', () => {
    const runtimeMessages = compileBundle({
      plain: '{$v :custom precision=$n}',
      mixed: '{$v :custom style=usd precision=$n}',
    })
    const custom: MessageFunction = (ctx, opts) =>
      `${[...ctx.literalOptionKeys].join(',')}:${String(opts.precision)}`
    const t = createTranslate({
      locale: 'en',
      messages: runtimeMessages,
      options: { functions: { custom } },
    })
    expect(t('mixed', { v: 1, n: 2 })).toBe('style:2')
    expect(t('plain', { v: 1, n: 3 })).toBe(':3')
    expect(t('mixed', { v: 1, n: 4 })).toBe('style:4')
  })
})

it('Should render interpolation and static markup without accessing cache', () => {
  const unavailableContext: MessageContext = {
    locale: 'en',
    get cache(): never {
      throw new Error('No cache is available')
    },
  }

  expect(
    formatMessage('en', runtimeMessages, 'simple.basic', { name: 'Ada' }, unavailableContext),
  ).toBe('Hi, Ada!')
  expect(
    formatMessageParts(
      'en',
      runtimeMessages,
      'plain.vWordWithMarkup',
      undefined,
      unavailableContext,
    ),
  ).toEqual([
    { type: 'text', value: 'Version ' },
    { type: 'markup', kind: 'open', name: 'b' },
    { type: 'text', value: 'v' },
    { type: 'markup', kind: 'close', name: 'b' },
    { type: 'text', value: ' 2' },
  ])
})

it('Should apply time zone options from the values on each call', () => {
  const messages = compileBundle({
    time: '{$d :time hour12=false timeZone=$tz}',
  })
  const t = createTranslate({ locale: 'en', messages })

  expect(t.unsafe('time', { d: sampleDate, tz: 'UTC' })).toBe('14:30')
  expect(t.unsafe('time', { d: sampleDate, tz: 'America/New_York' })).toBe('10:30')
})

it('Should keep compiled formatter results separate by locale with a shared cache', () => {
  const messages = compileBundle({ total: '{$n :number minimumFractionDigits=2}' })
  const cache = createTranslateCache({ maxSize: 1 })
  const en = createTranslate({ locale: 'en', messages, cache })
  const uk = createTranslate({ locale: 'uk', messages, cache })

  expect(en('total', { n: 1 })).toBe('1.00')
  expect(uk('total', { n: 1 })).toBe('1,00')
  expect(en('total', { n: 1 })).toBe('1.00')
})

it('Should share a formatter between compiled and equivalent direct number options', () => {
  const messages = compileBundle({
    total: '{$n :number minimumFractionDigits=2 maximumFractionDigits=2}',
  })
  const cache = createTranslateCache()
  const numberCache = cache.number
  const added: string[] = []
  const t = createTranslate({
    locale: 'en',
    messages,
    cache: {
      ...cache,
      number: {
        get: (key) => numberCache.get(key),
        set(key, formatter) {
          added.push(key)
          numberCache.set(key, formatter)
        },
      },
    },
  })

  expect(t('total', { n: 1 })).toBe('1.00')
  expect(t.number(2.5, { maximumFractionDigits: 2, minimumFractionDigits: 2 })).toBe('2.50')
  expect(added).toHaveLength(1)
})

it('Should read current options on direct number calls', () => {
  const options = { maximumFractionDigits: 1 }

  expect(tEn.number(1.234, options)).toBe('1.2')
  options.maximumFractionDigits = 2
  expect(tEn.number(1.234, options)).toBe('1.23')
})

// 8. Edge & error cases
it('Should not leak Object.prototype properties as variable values', () => {
  expect(tEn('simple.proto', {})).toBe('Proto: {$toString} / {$constructor}')
})

it('Should throw KanjouFormatError when an unknown runtime function is called', () => {
  expect(() => tEn('custom.unknown', { x: 1 })).toThrow(KanjouFormatError)
  expect(() => tEn.parts('custom.unknown', { x: 1 })).toThrow(KanjouFormatError)
})

describe('runtime safety and fallbacks', () => {
  it('Should render custom MessageValue with only toParts()', () => {
    const messages = compileBundle({
      onlyParts: '{$x :onlyParts}',
    })
    const onlyParts: MessageFunction = () => ({
      type: 'custom',
      toParts: () => [
        { type: 'text', value: 'hello ' },
        { type: 'custom', value: 'world' },
      ],
    })
    const t = createTranslate({
      locale: 'en',
      messages,
      options: { functions: { onlyParts } },
    })
    expect(t('onlyParts', { x: 1 })).toBe('hello world')
  })

  it('Should fall back to part.value when a part has an empty parts array', () => {
    const messages = compileBundle({
      withMarkup: '{#b}{$x :emptyParts}{/b}',
    })
    const emptyParts: MessageFunction = () => ({
      type: 'x',
      value: 'VALUE',
      toParts: () => [{ type: 'x', value: 'VALUE', parts: [] }],
    })
    const t = createTranslate({
      locale: 'en',
      messages,
      options: { functions: { emptyParts } },
    })
    expect(t('withMarkup', { x: 1 })).toBe('VALUE')
  })

  it('Should not poison bare locale cache entries with malformed compiled-options tuples', () => {
    const cache = createTranslateCache()
    const ctx: MessageContext = { cache, locale: 'en' }
    const malformed = [{ maximumFractionDigits: 2 }] as any

    expect(rtNumber(ctx, 1.2345, malformed)).toBe('1.23')
    expect(getIntlFormatter(cache.number, 'en', undefined, Intl.NumberFormat).format(1.2345)).toBe(
      '1.235',
    )

    const t = createTranslate({ locale: 'en', messages: {}, cache })
    expect(t.number(1.2345)).toBe('1.235')

    const malformedDate = [{ year: 'numeric' }] as any
    expect(rtDate(ctx, sampleDate, malformedDate)).toBe('2026')
    expect(t.date(sampleDate)).toBe(new Intl.DateTimeFormat('en').format(sampleDate))

    expect(rtSelectPlural(ctx, 2, [{ type: 'ordinal' }] as any)).toBe('two')
    expect(rtSelectPlural(ctx, 2)).toBe('other')
  })

  it('Should pass runtime context to hand-written renderers with default or rest parameters', () => {
    const messages: Record<string, Message> = {
      defaultParams: (values = {}, runtime) =>
        `${String(values.prefix ?? '')}${rtNumber(runtime!, 2)}`,
      restParams: (...args: any[]) => rtNumber(args[1] as MessageContext, 3),
      partsDefault: {
        parts: (_values = {}, runtime) => [{ type: 'text', value: rtNumber(runtime!, 4) }],
      },
    }
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('defaultParams', { prefix: '#' })).toBe('#2')
    expect(t.unsafe('restParams')).toBe('3')
    expect(t.unsafe('partsDefault')).toBe('4')
    expect(t.parts.unsafe('partsDefault')).toEqual([{ type: 'text', value: '4' }])
  })

  it('Should fall back to id or [] for null and primitive message entries', () => {
    const messages = {
      nullMsg: null,
      numMsg: 123,
      boolMsg: false,
    } as unknown as Record<string, Message>
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('nullMsg')).toBe('nullMsg')
    expect(t.unsafe('numMsg')).toBe('numMsg')
    expect(t.unsafe('boolMsg')).toBe('boolMsg')
    expect(t.parts.unsafe('nullMsg')).toEqual([])
    expect(t.parts.unsafe('numMsg')).toEqual([])
    expect(t.parts.unsafe('boolMsg')).toEqual([])
  })

  it('Should normalize Unicode strings in rtSelect for NFD vs NFC matching', () => {
    const ctx: MessageContext = { cache: createTranslateCache(), locale: 'en' }
    const keys = new Set(['caf\u00e9'])

    expect(rtSelect(ctx, 'cafe\u0301', keys)).toBe('caf\u00e9')
    expect(rtSelect(ctx, 'caf\u00e9', keys)).toBe('caf\u00e9')
    expect(rtSelect(ctx, 'other', keys)).toBeNull()
  })

  it('Should validate numeric and date operands in rtNumber, rtDate, rtInteger, and rtOffset', () => {
    const ctx: MessageContext = { cache: createTranslateCache(), locale: 'en' }
    const invalidNumbers = [
      undefined,
      null,
      '',
      '   ',
      '0x10',
      '0b101',
      '0o17',
      'Infinity',
      '+1',
      '01',
      '.5',
      '1.',
      Number.NaN,
    ]

    for (const invalid of invalidNumbers) {
      expect(rtNumber(ctx, invalid)).toBe('{:number}')
      expect(rtNumber(ctx, invalid, undefined, '{$x}')).toBe('{$x}')
      expect(rtInteger(invalid)).toBeNull()
      expect(rtOffset(invalid, 1)).toBeNull()
    }

    expect(rtNumber(ctx, '42.5')).toBe('42.5')
    expect(rtNumber(ctx, '1e3')).toBe('1,000')
    expect(rtNumber(ctx, '-0')).toBe('-0')
    expect(rtOffset(10, 1.5)).toBeNull()
    expect(rtOffset(10, 'abc')).toBeNull()
    expect(rtOffset(10, 2, true)).toBe(8)

    expect(rtDate(ctx, undefined)).toBe('{:date}')
    expect(rtDate(ctx, null, undefined, '{$d}')).toBe('{$d}')
    expect(rtDate(ctx, new Date(Number.NaN))).toBe('{:date}')
    expect(rtDate(ctx, 'not-a-date')).toBe('{:date}')
    expect(rtDate(ctx, '')).toBe('{:date}')
    expect(rtDate(ctx, sampleDate, { timeZone: 'UTC' })).toBe('3/15/2026')
  })

  it('Should compute dynamic rtCurrencyOpts and rtDateOpts cleanly', () => {
    expect(rtCurrencyOpts({ style: 'currency', currency: 'USD' }, 0)).toEqual({
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    expect(rtCurrencyOpts({ style: 'currency', currency: 'JPY' }, 'auto')).toEqual({
      style: 'currency',
      currency: 'JPY',
    })
    expect(
      rtDateOpts(
        { timeZone: 'UTC' },
        { kind: 'date', fields: 'month-day-weekday', length: 'long' },
      ),
    ).toEqual({
      timeZone: 'UTC',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
    expect(
      rtDateOpts(
        { timeZone: 'UTC' },
        { kind: 'time', precision: 'second', timeZoneStyle: 'short', hour12: 'false' },
      ),
    ).toEqual({
      timeZone: 'UTC',
      hour12: false,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short',
    })
  })

  it('Should exclude MessageFormattedPart from MessagePart<never> and built-in PartsType', () => {
    type NumberFnParts =
      BuiltinFunctions['number'] extends MessageFunction<any, any, any, infer PartsType>
        ? PartsType
        : never
    type MappedNumberParts = {
      count: { __fn: 'number' }
    }['count'] extends { __fn: infer FunctionName extends keyof Functions }
      ? Functions[FunctionName] extends MessageFunction<any, any, any, infer PartsType>
        ? PartsType
        : never
      : never

    expectTypeOf<NumberFnParts>().toBeNever()
    expectTypeOf<MappedNumberParts>().toBeNever()
    expectTypeOf<InferPartsType<'any'>>().toBeNever()
    expectTypeOf<MessagePart<never>>().toEqualTypeOf<MessageTextPart | MessageMarkupPart>()
    expectTypeOf<MessageValue<'x', 'y'>>().not.toBeNever()
  })
})

describe('compiler edge cases and MF2 compliance', () => {
  it('Should emit fallback placeholders for missing, null, and invalid built-in operands', () => {
    const messages = compileBundle({
      num: '{$n :number}',
      int: '{$n :integer}',
      pct: '{$n :percent}',
      cur: '{$n :currency currency=USD}',
      unit: '{$n :unit unit=kilometer}',
      off: '{$n :offset add=1}',
      date: '{$d :date timeZone=UTC}',
      time: '{$d :time timeZone=UTC}',
      dt: '{$d :datetime timeZone=UTC}',
      litNum: '{|abc| :number}',
      noArgNum: '{:number}',
      inputNum: '.input {$n :number}\n{{V: {$n}}}',
      localNum: '.local $x = {$n :number}\n{{V: {$x}}}',
      localNumMarkup: '.local $x = {$n :number}\n{{V: {#b}{$x}{/b}}}',
    })
    const t = createTranslate({ locale: 'en', messages })

    for (const id of ['num', 'int', 'pct', 'cur', 'unit', 'off'] as const) {
      expect(t.unsafe(id, {})).toBe('{$n}')
      expect(t.unsafe(id, { n: null })).toBe('{$n}')
      expect(t.unsafe(id, { n: 'abc' })).toBe('{$n}')
      expect(t.parts.unsafe(id, {})).toEqual([{ type: 'text', value: '{$n}' }])
    }

    for (const id of ['date', 'time', 'dt'] as const) {
      expect(t.unsafe(id, {})).toBe('{$d}')
      expect(t.unsafe(id, { d: null })).toBe('{$d}')
      expect(t.unsafe(id, { d: 'not-a-date' })).toBe('{$d}')
      expect(t.parts.unsafe(id, {})).toEqual([{ type: 'text', value: '{$d}' }])
    }

    expect(t.unsafe('litNum')).toBe('{|abc|}')
    expect(t.unsafe('noArgNum')).toBe('{:number}')
    expect(t.unsafe('inputNum', {})).toBe('V: {$n}')
    expect(t.unsafe('localNum', {})).toBe('V: {$x}')
    expect(t.parts.unsafe('localNum', {})).toEqual([{ type: 'text', value: 'V: {$x}' }])
    expect(t.parts.unsafe('localNumMarkup', {})).toEqual([
      { type: 'text', value: 'V: ' },
      { type: 'markup', kind: 'open', name: 'b' },
      { type: 'text', value: '{$x}' },
      { type: 'markup', kind: 'close', name: 'b' },
    ])
  })

  it('Should reject non-JSON numeric strings and accept valid numeric strings in :number', () => {
    const messages = compileBundle({
      num: '{$n :number}',
    })
    const t = createTranslate({ locale: 'en', messages })

    for (const invalid of ['0x10', '0b101', '0o17', 'Infinity', '+1', '01', '.5', '1.']) {
      expect(t.unsafe('num', { n: invalid })).toBe('{$n}')
    }
    expect(t.unsafe('num', { n: '42.5' })).toBe('42.5')
    expect(t.unsafe('num', { n: '1e3' })).toBe('1,000')
    expect(t.unsafe('num', { n: ' 1 ' })).toBe('1')
  })

  it('Should fall back cleanly in :offset for invalid deltas or null operands', () => {
    const messages = compileBundle({
      dyn: '{$n :offset add=$delta}',
      fracLit: '{$n :offset add=1.5}',
      negDyn: '{$n :offset subtract=$delta}',
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('dyn', { n: 10 })).toBe('{$n}')
    expect(t.unsafe('dyn', { n: 10, delta: 'abc' })).toBe('{$n}')
    expect(t.unsafe('dyn', { n: 10, delta: 1.5 })).toBe('{$n}')
    expect(t.unsafe('dyn', { n: null, delta: 2 })).toBe('{$n}')
    expect(t.unsafe('fracLit', { n: 10 })).toBe('{$n}')
    expect(t.unsafe('negDyn', { n: 10, delta: 3 })).toBe('7')
  })

  it('Should preserve formatting, selection, and custom parts across .local aliases', () => {
    const messages = compileBundle({
      numAlias: '.local $a = {$n :number minimumFractionDigits=2}\n.local $b = {$a}\n{{{$b}}}',
      curAlias: '.local $a = {$n :currency currency=USD}\n.local $b = {$a}\n{{{$b}}}',
      dateAlias: '.local $a = {$d :date timeZone=UTC}\n.local $b = {$a}\n{{{$b}}}',
      pctAlias: '.local $a = {$n :percent}\n.local $b = {$a}\n{{{$b}}}',
      offAlias: '.local $a = {$n :offset add=2}\n.local $b = {$a}\n{{{$b}}}',
      pluralAlias: `.local $a = {$n :number}
.local $b = {$a}
.match $b
one {{{$b} item}}
* {{{$b} items}}`,
      wrapAlias: '.local $a = {$n :wrap}\n.local $b = {$a}\n{{{$b}}}',
    })
    const wrap: MessageFunction = (_ctx, _opts, operand) => ({
      type: 'wrap',
      value: `[${String(operand)}]`,
      toParts: () => [{ type: 'wrap', value: String(operand) }],
    })
    const t = createTranslate({ locale: 'en', messages, options: { functions: { wrap } } })

    expect(t.unsafe('numAlias', { n: 3 })).toBe('3.00')
    expect(t.unsafe('numAlias', {})).toBe('{$b}')
    expect(t.unsafe('curAlias', { n: 12.5 })).toBe('$12.50')
    expect(t.unsafe('dateAlias', { d: sampleDate })).toBe('Mar 15, 2026')
    expect(t.unsafe('pctAlias', { n: 0.25 })).toBe('25%')
    expect(t.unsafe('offAlias', { n: 5 })).toBe('7')
    expect(t.unsafe('pluralAlias', { n: 1 })).toBe('1 item')
    expect(t.unsafe('pluralAlias', { n: 2 })).toBe('2 items')
    expect(t.unsafe('wrapAlias', { n: 'hi' })).toBe('[hi]')
    expect(t.parts.unsafe('wrapAlias', { n: 'hi' })).toEqual([{ type: 'wrap', value: 'hi' }])
  })

  it('Should support re-annotation and :string on formatted declarations', () => {
    const messages = compileBundle({
      intToStr: '.input {$n :integer}\n{{{$n :string}}}',
      numToStr: '.input {$n :number minimumFractionDigits=2}\n{{{$n :string}}}',
      numToNum:
        '.input {$n :number minimumFractionDigits=2}\n{{{$n :number maximumFractionDigits=3}}}',
      curToStr: '.input {$a :currency currency=USD}\n{{{$a :string}}}',
      dateToStr: '.input {$d :date timeZone=UTC}\n{{{$d :string}}}',
      dateToTime: '.input {$d :date timeZone=UTC}\n{{{$d :time}}}',
      offToStr: '.input {$n :offset add=5}\n{{{$n :string}}}',
      inheritedMatch: `.input {$n :number minimumFractionDigits=$fd}
.local $b = {$n :number}
.match $b
one {{{$b} item}}
* {{{$b} items}}`,
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('intToStr', { n: 3.7 })).toBe('4')
    expect(t.unsafe('numToStr', { n: 3 })).toBe('3.00')
    expect(t.unsafe('numToNum', { n: 3.1234 })).toBe('3.123')
    expect(t.unsafe('curToStr', { a: 12.5 })).toBe('$12.50')
    expect(t.unsafe('dateToStr', { d: sampleDate })).toBe('Mar 15, 2026')
    expect(t.unsafe('dateToTime', { d: sampleDate })).toBe('2:30 PM')
    expect(t.unsafe('offToStr', { n: 10 })).toBe('15')
    expect(t.unsafe('inheritedMatch', { n: 1, fd: 0 })).toBe('1 item')
    expect(t.unsafe('inheritedMatch', { n: 1, fd: 1 })).toBe('1.0 items')
  })

  it('Should evaluate declarations lazily and at most once when shared', () => {
    let unusedCalls = 0
    let throwingCalls = 0
    let sharedCalls = 0

    const messages = compileBundle({
      unusedCustom: '.local $u = {$x :unusedFn}\n{{OK: {$name}}}',
      unusedUnknown: '.local $u = {$x :doesNotExist}\n{{Safe}}',
      branchLazy: `.local $boom = {$x :throwFn}
.input {$role :string}
.match $role
admin {{{$boom}}}
* {{Safe}}`,
      shared: '.local $s = {$x :sharedFn}\n{{{$s} / {$s}}}',
    })

    const unusedFn: MessageFunction = () => {
      unusedCalls++
      return 'unused'
    }
    const throwFn: MessageFunction = () => {
      throwingCalls++
      throw new Error('boom')
    }
    const sharedFn: MessageFunction = (_ctx, _opts, operand) => {
      sharedCalls++
      return `v:${String(operand)}`
    }

    const t = createTranslate({
      locale: 'en',
      messages,
      options: { functions: { unusedFn, throwFn, sharedFn } },
    })

    expect(t.unsafe('unusedCustom', { name: 'Ada' })).toBe('OK: Ada')
    expect(unusedCalls).toBe(0)
    expect(t.unsafe('unusedUnknown', {})).toBe('Safe')
    expect(t.unsafe('branchLazy', { role: 'guest' })).toBe('Safe')
    expect(throwingCalls).toBe(0)
    expect(() => t.unsafe('branchLazy', { role: 'admin' })).toThrow(KanjouFormatError)
    expect(throwingCalls).toBe(1)
    expect(t.unsafe('shared', { x: 7 })).toBe('v:7 / v:7')
    expect(sharedCalls).toBe(1)
  })

  it('Should forward roundingMode, roundingIncrement, and trailingZeroDisplay to plural selection', () => {
    const messages = compileBundle({
      ceil: `.input {$n :number maximumFractionDigits=0 roundingMode=ceil}
.match $n
one {{one ({$n})}}
* {{other ({$n})}}`,
      floor: `.input {$n :number maximumFractionDigits=0 roundingMode=floor}
.match $n
one {{one ({$n})}}
* {{other ({$n})}}`,
      inc: `.input {$n :number roundingIncrement=5 minimumFractionDigits=0 maximumFractionDigits=0}
.match $n
one {{one ({$n})}}
* {{other ({$n})}}`,
      strip: `.input {$n :number minimumFractionDigits=2 trailingZeroDisplay=stripIfInteger}
.match $n
one {{one ({$n})}}
* {{other ({$n})}}`,
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('ceil', { n: 0.4 })).toBe('one (1)')
    expect(t.unsafe('floor', { n: 1.9 })).toBe('one (1)')
    expect(t.unsafe('inc', { n: 1 })).toBe('other (0)')
    expect(t.unsafe('strip', { n: 1 })).toBe('one (1)')
    expect(t.unsafe('strip', { n: 1.5 })).toBe('other (1.50)')
  })

  it('Should ignore minimumFractionDigits on :integer without throwing RangeError', () => {
    const messages = compileBundle({
      intWithMinFrac: '{$n :integer minimumFractionDigits=2}',
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('intWithMinFrac', { n: 3.7 })).toBe('4')
  })

  it('Should support variable draft options for :date, :time, :datetime, and :currency', () => {
    const messages = compileBundle({
      dateVar: '{$d :date fields=$f length=$l timeZone=UTC}',
      timeVar: '{$d :time precision=$p timeZoneStyle=$s hour12=false timeZone=UTC}',
      dtVar:
        '{$d :datetime dateFields=$df dateLength=$dl timePrecision=$tp hour12=false timeZone=UTC}',
      curVar: '{$a :currency currency=USD fractionDigits=$fd}',
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('dateVar', { d: sampleDate, f: 'month-day-weekday', l: 'long' })).toBe(
      'Sunday, March 15',
    )
    expect(t.unsafe('timeVar', { d: sampleDate, p: 'second', s: 'short' })).toBe('14:30:45 UTC')
    expect(t.unsafe('dtVar', { d: sampleDate, df: 'month-day', dl: 'short', tp: 'hour' })).toBe(
      '3/15, 14',
    )
    expect(t.unsafe('curVar', { a: 12.5, fd: 0 })).toBe('$13')
    expect(t.unsafe('curVar', { a: 12.5, fd: 'auto' })).toBe('$12.50')
  })

  it('Should apply timeZoneStyle=short alongside direct hour=2-digit', () => {
    const messages = compileBundle({
      directHourTz: '{$d :time hour=2-digit timeZoneStyle=short hour12=false timeZone=UTC}',
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('directHourTz', { d: sampleDate })).toBe('14 UTC')
  })

  it('Should handle hour12 invalid literals and boolean/string variables cleanly', () => {
    const messages = compileBundle({
      litYes: '{$d :time hour12=yes timeZone=UTC}',
      litOne: '{$d :time hour12=1 timeZone=UTC}',
      varH12: '{$d :time hour12=$h timeZone=UTC}',
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('litYes', { d: sampleDate })).toBe('2:30 PM')
    expect(t.unsafe('litOne', { d: sampleDate })).toBe('2:30 PM')
    expect(t.unsafe('varH12', { d: sampleDate, h: 'false' })).toBe('14:30')
    expect(t.unsafe('varH12', { d: sampleDate, h: 'true' })).toBe('2:30 PM')
    expect(t.unsafe('varH12', { d: sampleDate, h: undefined })).toBe('2:30 PM')
    expect(t.unsafe('varH12', { d: sampleDate, h: false })).toBe('14:30')
    expect(t.unsafe('varH12', { d: sampleDate, h: true })).toBe('2:30 PM')
  })

  it('Should normalize Unicode NFD/NFC keys in :string selection while keeping original output', () => {
    const messages = compileBundle({
      matchNfc: `.input {$word :string}
.match $word
caf\u00e9 {{Matched: {$word}}}
* {{Other: {$word}}}`,
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('matchNfc', { word: 'cafe\u0301' })).toBe('Matched: cafe\u0301')
    expect(t.unsafe('matchNfc', { word: 'caf\u00e9' })).toBe('Matched: caf\u00e9')
  })

  it('Should not box primitives or traverse Object.prototype on dotted variable access', () => {
    const messages = compileBundle({
      nameLen: '{$name.length}',
      numCtor: '{$a.constructor}',
      numMethod: '{$n.toFixed}',
      arrLen: '{$arr.length}',
      objProto: '{$obj.toString}',
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('nameLen', { name: 'Ada' })).toBe('{$name.length}')
    expect(t.unsafe('numCtor', { a: 42 })).toBe('{$a.constructor}')
    expect(t.unsafe('numMethod', { n: 42 })).toBe('{$n.toFixed}')
    expect(t.unsafe('arrLen', { arr: ['a', 'b', 'c'] })).toBe('3')
    expect(t.unsafe('objProto', { obj: {} })).toBe('{$obj.toString}')
  })

  it('Should support string mode toString and parts mode toParts when markup and custom functions coexist', () => {
    const messages = compileBundle({
      rich: 'Before {#b}{$x :badge}{/b} After',
      richAlias: '.local $b = {$x :badge}\n{{Before {#i}{$b}{/i} After}}',
    })
    const badge: MessageFunction = (_ctx, _opts, operand) => ({
      type: 'badge',
      toString: () => `[${String(operand)}]`,
      toParts: () => [{ type: 'badge', value: String(operand) }],
    })
    const t = createTranslate({
      locale: 'en',
      messages,
      options: { functions: { badge } },
    })

    expect(t.unsafe('rich', { x: 'VIP' })).toBe('Before [VIP] After')
    expect(t.parts.unsafe('rich', { x: 'VIP' })).toEqual([
      { type: 'text', value: 'Before ' },
      { type: 'markup', kind: 'open', name: 'b' },
      { type: 'badge', value: 'VIP' },
      { type: 'markup', kind: 'close', name: 'b' },
      { type: 'text', value: ' After' },
    ])

    expect(t.unsafe('richAlias', { x: 'PRO' })).toBe('Before [PRO] After')
    expect(t.parts.unsafe('richAlias', { x: 'PRO' })).toEqual([
      { type: 'text', value: 'Before ' },
      { type: 'markup', kind: 'open', name: 'i' },
      { type: 'badge', value: 'PRO' },
      { type: 'markup', kind: 'close', name: 'i' },
      { type: 'text', value: ' After' },
    ])
  })

  it('Should format unannotated number and bigint values using :number', () => {
    const messages = compileBundle({
      bareNum: 'Count: {$n}',
      bareParts: '{#b}{$n}{/b}',
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('bareNum', { n: 1234 })).toBe('Count: 1,234')
    expect(t.unsafe('bareNum', { n: 1234567n })).toBe('Count: 1,234,567')
    expect(t.unsafe('bareNum', {})).toBe('Count: {$n}')
    expect(t.parts.unsafe('bareParts', { n: 1234 })).toEqual([
      { type: 'markup', kind: 'open', name: 'b' },
      { type: 'text', value: '1,234' },
      { type: 'markup', kind: 'close', name: 'b' },
    ])
  })

  it('Should coerce plain objects with String() in :string', () => {
    const messages = compileBundle({ strObj: '{$x :string}' })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('strObj', { x: { a: 1 } })).toBe('[object Object]')
  })

  it('Should strip u:* attributes from markup and custom function options', () => {
    const captureOpts: MessageFunction = (_ctx, opts, val) => JSON.stringify({ opts, val })
    const messages = compileBundle({
      uMarkup: '{#a u:id=docs href=|/docs| u:dir=ltr}Docs{/a}',
      uCustom: '{$x :captureOpts u:id=c1 u:dir=rtl tag=ok}',
      uOnlyCustom: '{$x :captureOpts u:id=c1}',
    })
    const t = createTranslate({
      locale: 'en',
      messages,
      options: { functions: { captureOpts } },
    })

    expect(t.parts.unsafe('uMarkup', {})).toEqual([
      { type: 'markup', kind: 'open', name: 'a', options: { href: '/docs' } },
      { type: 'text', value: 'Docs' },
      { type: 'markup', kind: 'close', name: 'a' },
    ])
    expect(t.unsafe('uCustom', { x: 'v' })).toBe('{"opts":{"tag":"ok"},"val":"v"}')
    expect(t.unsafe('uOnlyCustom', { x: 'v' })).toBe('{"opts":{},"val":"v"}')
  })

  it('Should fall back in :offset when both add and subtract are provided or delta is negative', () => {
    const messages = compileBundle({
      offsetBoth: '{$n :offset add=2 subtract=1}',
      offsetNeg: '{$n :offset add=-1}',
      offsetDynNeg: '{$n :offset add=$d}',
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('offsetBoth', { n: 10 })).toBe('{$n}')
    expect(t.unsafe('offsetNeg', { n: 10 })).toBe('{$n}')
    expect(t.unsafe('offsetDynNeg', { n: 10, d: -2 })).toBe('{$n}')
  })

  it('Should select the fallback variant when matching on non-selectable built-ins', () => {
    const messages = compileBundle({
      curMatch: '.input {$c :currency currency=USD}\n.match $c\n1 {{exact}}\n* {{fallback}}',
      dateMatch: '.input {$d :date timeZone=UTC}\n.match $d\n0 {{epoch}}\n* {{fallback}}',
    })
    const t = createTranslate({ locale: 'en', messages })

    expect(t.unsafe('curMatch', { c: 1 })).toBe('fallback')
    expect(t.unsafe('dateMatch', { d: 0 })).toBe('fallback')
  })

  it('Should emit only the needed @kanjou/core runtime imports per compiled namespace', () => {
    const staticCode = compileMessages({ title: 'Hello', subtitle: 'World' })
    expect(staticCode.startsWith('export default ')).toBe(true)
    expect(staticCode).not.toContain('import ')

    const numberCode = compileMessages({ count: '{$n :number}' })
    expect(numberCode).toContain("import {rtNumber as _rn} from '@kanjou/core';\n")
    expect(numberCode).not.toContain('rtDate')
    expect(numberCode).not.toContain('rtCurrencyOpts')
    expect(numberCode).not.toContain('rtSelect')
  })
})
