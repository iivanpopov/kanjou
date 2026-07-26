export default {
  greet: {
    type: 'message',
    declarations: [],
    pattern: [
      '¡Hola, ',
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
          'Tienes ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' manzana.',
        ],
      },
      {
        keys: [
          {
            type: '*',
          },
        ],
        value: [
          'Tienes ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' manzanas.',
        ],
      },
    ],
  },
}
