export default {
  greet: {
    type: 'message',
    declarations: [],
    pattern: [
      'Hello, ',
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
          ' You have ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' apple. ',
        ],
      },
      {
        keys: [
          {
            type: '*',
          },
        ],
        value: [
          ' You have ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' apples. ',
        ],
      },
    ],
  },
  test: {
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
            value: '1',
          },
        ],
        value: [
          'Hello, ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'userName',
            },
          },
          '! You have ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' message.',
        ],
      },
      {
        keys: [
          {
            type: '*',
          },
        ],
        value: [
          'Hello, ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'userName',
            },
          },
          '! You have ',
          {
            type: 'expression',
            arg: {
              type: 'variable',
              name: 'count',
            },
          },
          ' messages.',
        ],
      },
    ],
  },
  date1: {
    type: 'message',
    declarations: [],
    pattern: [
      'Date: ',
      {
        type: 'expression',
        arg: {
          type: 'variable',
          name: 'date',
        },
        functionRef: {
          type: 'function',
          name: 'fmtDate',
          options: {
            style: {
              type: 'literal',
              value: 'cool',
            },
          },
        },
      },
    ],
  },
}
