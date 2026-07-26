export default {
  greet: {
    type: 'message',
    declarations: [],
    pattern: [
      'Bonjour, ',
      {
        type: 'expression',
        arg: {
          type: 'variable',
          name: 'name',
        },
      },
      '!',
    ],
  },
  apples: {
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
          'Vous avez ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' pomme.',
        ],
      },
      {
        keys: [
          {
            type: '*',
          },
        ],
        value: [
          'Vous avez ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' pommes.',
        ],
      },
    ],
  },
}
