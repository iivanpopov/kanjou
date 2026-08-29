import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

export default defineConfig({
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/kanjou/logo.svg' }]],
  cleanUrls: true,
  base: '/kanjou/',
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      title: 'Kanjou',
      description: 'Internationalization for React powered by MessageFormat 2',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
          {
            text: 'Reference',
            link: '/reference/react/KanjouProvider',
            activeMatch: '/reference/',
          },
          {
            text: 'v0',
            items: [
              { text: 'v0', link: 'https://github.com/iivanpopov/kanjou/tree/main' },
              {
                text: 'Changelog',
                link: 'https://github.com/iivanpopov/kanjou/blob/main/packages/react/CHANGELOG.md',
              },
              { text: 'Releases', link: 'https://github.com/iivanpopov/kanjou/releases' },
            ],
          },
        ],
        sidebar: {
          '/': [
            {
              text: 'Guide',
              items: [
                { text: 'Introduction', link: '/guide/introduction' },
                { text: 'TypeScript', link: '/guide/typescript' },
              ],
            },
            {
              text: 'Quick Start',
              items: [
                { text: 'React', link: '/guide/react' },
                { text: 'Svelte', link: '/guide/svelte' },
              ],
            },
            {
              text: 'API Reference',
              items: [
                {
                  text: 'React',
                  items: [
                    { text: 'KanjouProvider', link: '/reference/react/kanjou-provider' },
                    { text: 'useFormatMessage', link: '/reference/react/use-format-message' },
                  ],
                  collapsed: true,
                },
                {
                  text: 'Svelte',
                  items: [],
                  collapsed: true,
                },
                { text: 'Vite Plugin', link: '/reference/vite-plugin' },
                { text: 'CLI', link: '/reference/cli' },
              ],
            },
          ],
        },
        editLink: {
          pattern: 'https://github.com/iivanpopov/kanjou/edit/main/docs/:path',
          text: 'Edit this page on GitHub',
        },
      },
    },
    //   uk: {
    //     label: 'Українська',
    //     lang: 'uk',
    //     title: 'Kanjou',
    //     description: 'Інтернаціоналізація для React на базі MessageFormat 2',
    //     themeConfig: {
    //       nav: [
    //         { text: 'Гайд', link: '/uk/guide/getting-started', activeMatch: '/uk/guide/' },
    //         { text: 'Референс', link: '/uk/reference/react', activeMatch: '/uk/reference/' },
    //         {
    //           text: 'v0',
    //           items: [
    //             { text: 'v0', link: 'https://github.com/iivanpopov/kanjou/tree/main' },
    //             {
    //               text: 'Зміни',
    //               link: 'https://github.com/iivanpopov/kanjou/blob/main/packages/react/CHANGELOG.md',
    //             },
    //             { text: 'Релізи', link: 'https://github.com/iivanpopov/kanjou/releases' },
    //           ],
    //         },
    //       ],
    //       sidebar: {
    //         '/uk/guide/': [
    //           {
    //             text: 'Гайд',
    //             items: [
    //               { text: 'Початок роботи', link: '/uk/guide/getting-started' },
    //               { text: 'TypeScript', link: '/uk/guide/typescript' },
    //               { text: 'Форматери', link: '/uk/guide/formatters' },
    //               { text: 'Rich Text', link: '/uk/guide/rich-text' },
    //               { text: 'Vite Plugin', link: '/uk/guide/vite-plugin' },
    //               { text: 'CLI', link: '/uk/guide/cli' },
    //             ],
    //           },
    //           { text: 'API Референс', link: '/uk/reference/react' },
    //         ],
    //         '/uk/reference/': [
    //           {
    //             text: 'Референс',
    //             items: [
    //               { text: 'React', link: '/uk/reference/react' },
    //               { text: 'Vite Plugin', link: '/uk/reference/vite-plugin' },
    //               { text: 'CLI', link: '/uk/reference/cli' },
    //             ],
    //           },
    //         ],
    //       },
    //       editLink: {
    //         pattern: 'https://github.com/iivanpopov/kanjou/edit/main/docs/:path',
    //         text: 'Редагувати на GitHub',
    //       },
    //       outline: {
    //         label: 'На цій сторінці',
    //       },
    //       lastUpdated: {
    //         text: 'Оновлено',
    //       },
    //       docFooter: {
    //         prev: 'Попередня',
    //         next: 'Наступна',
    //       },
    //       footer: {
    //         message: 'Розповсюджується під ліцензією ISC.',
    //         copyright: 'Авторські права © 2026-PRESENT Іван Попов.',
    //       },
    //     },
    //   },
  },
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/iivanpopov/kanjou' },
      { icon: 'npm', link: 'https://npmx.dev/org/kanjou' },
    ],
    search: { provider: 'local' },
    lastUpdated: {},
    footer: {
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2026-PRESENT Ivan Popov.',
    },
    outline: {
      level: [2, 3],
    },
  },
  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },
  vite: {
    plugins: [groupIconVitePlugin()],
  },
})
