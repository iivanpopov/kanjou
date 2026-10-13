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
          { text: 'Docs', link: '/getting-started/react' },
          {
            text: 'Examples',
            link: 'https://github.com/iivanpopov/kanjou/tree/main/examples',
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
              text: 'Getting Started',
              items: [
                { text: 'React', link: '/getting-started/react' },
                { text: 'TanStack Start', link: '/getting-started/tanstack-start' },
                { text: 'Next.js', link: '/getting-started/nextjs' },
              ],
            },
            {
              text: 'Guides',
              items: [
                { text: 'TypeScript', link: '/guides/typescript' },
                { text: 'Pluralization', link: '/guides/pluralization' },
                { text: 'Agent Skills', link: '/guides/skills' },
              ],
            },
            {
              text: 'API',
              items: [{ text: 'Syntax', link: '/api/syntax' }],
            },
          ],
        },
        editLink: {
          pattern: 'https://github.com/iivanpopov/kanjou/edit/main/docs/:path',
          text: 'Edit this page on GitHub',
        },
      },
    },
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
