export default {
  'title.main': {
    type: 'message',
    declarations: [],
    pattern: ['Kanjou Next.js Example'],
  },
  'text.welcome': {
    type: 'message',
    declarations: [],
    pattern: [
      'Hello, ',
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
          'You have ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' apple.',
        ],
      },
      {
        keys: [
          {
            type: '*',
          },
        ],
        value: [
          'You have ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' apples.',
        ],
      },
    ],
  },
  'title.counter': {
    type: 'message',
    declarations: [],
    pattern: ['Click count'],
  },
  'button.reset': {
    type: 'message',
    declarations: [],
    pattern: ['Reset'],
  },
  'input.select-locale': {
    type: 'message',
    declarations: [],
    pattern: ['Select locale'],
  },
  'title.statistics': {
    type: 'message',
    declarations: [],
    pattern: ['Statistics'],
  },
  'label.price': {
    type: 'message',
    declarations: [],
    pattern: ['Price'],
  },
  'label.date': {
    type: 'message',
    declarations: [],
    pattern: ['Current date'],
  },
}
