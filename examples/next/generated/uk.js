export default {
  'title.main': {
    type: 'message',
    declarations: [],
    pattern: ['Приклад Kanjou Next.js'],
  },
  'text.welcome': {
    type: 'message',
    declarations: [],
    pattern: [
      'Привіт, ',
      {
        type: 'markup',
        kind: 'open',
        name: 'strong',
      },
      {
        type: 'expression',
        arg: {
          type: 'variable',
          name: 'name',
        },
      },
      {
        type: 'markup',
        kind: 'close',
        name: 'strong',
      },
      '!',
    ],
  },
  'text.apples': {
    type: 'select',
    declarations: [
      {
        type: 'input',
        name: 'count',
        value: {
          type: 'expression',
          arg: {
            type: 'variable',
            name: 'count',
          },
          functionRef: {
            type: 'function',
            name: 'number',
          },
        },
      },
    ],
    selectors: [
      {
        type: 'variable',
        name: 'count',
      },
    ],
    variants: [
      {
        keys: [
          {
            type: 'literal',
            value: 'one',
          },
        ],
        value: [
          'У вас є ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' яблуко.',
        ],
      },
      {
        keys: [
          {
            type: 'literal',
            value: 'few',
          },
        ],
        value: [
          'У вас є ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' яблука.',
        ],
      },
      {
        keys: [
          {
            type: 'literal',
            value: 'many',
          },
        ],
        value: [
          'У вас є ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' яблук.',
        ],
      },
      {
        keys: [
          {
            type: '*',
          },
        ],
        value: [
          'У вас є ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' яблук.',
        ],
      },
    ],
  },
  'title.counter': {
    type: 'message',
    declarations: [],
    pattern: ['Кількість кліків'],
  },
  'button.reset': {
    type: 'message',
    declarations: [],
    pattern: ['Скинути'],
  },
  'input.select-locale': {
    type: 'message',
    declarations: [],
    pattern: ['Виберіть мову'],
  },
  'title.statistics': {
    type: 'message',
    declarations: [],
    pattern: ['Статистика'],
  },
  'label.price': {
    type: 'message',
    declarations: [],
    pattern: ['Ціна'],
  },
  'label.date': {
    type: 'message',
    declarations: [],
    pattern: ['Поточна дата'],
  },
}
