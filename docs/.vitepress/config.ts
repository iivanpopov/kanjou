import type { DefaultTheme } from 'vitepress'

import { defineConfig } from 'vitepress'

const sidebars = (): DefaultTheme.SidebarItem[] => [
  {
    text: 'Concepts',
    collapsed: true,
    items: [
      { text: 'Why Kanjou', link: '/docs/concepts/why-kanjou' },
      { text: 'MessageFormat 2', link: '/docs/concepts/messageformat2' },
      { text: 'Type Safety', link: '/docs/concepts/type-safety' },
      { text: 'State & Loading', link: '/docs/concepts/state-and-loading' },
    ],
  },
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Installation', link: '/docs/getting-started/installation' },
      { text: 'React + Vite', link: '/docs/getting-started/react-vite' },
      {
        text: 'React + Vite Plugin',
        link: '/docs/getting-started/react-vite-plugin',
      },
      { text: 'Next.js', link: '/docs/getting-started/nextjs' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      {
        text: 'React',
        collapsed: true,
        items: [
          { text: 'KanjouProvider', link: '/docs/api/react/provider' },
          { text: 'useKanjou', link: '/docs/api/react/use-kanjou' },
          { text: 'Components', link: '/docs/api/react/components' },
          { text: 'Server', link: '/docs/api/react/server' },
        ],
      },
      {
        text: 'CLI',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/docs/api/cli/' },
          { text: 'compile', link: '/docs/api/cli/compile' },
          { text: 'generate', link: '/docs/api/cli/generate' },
          { text: 'compare', link: '/docs/api/cli/compare' },
          { text: 'missing', link: '/docs/api/cli/missing' },
          { text: 'unused', link: '/docs/api/cli/unused' },
        ],
      },
      { text: 'Vite Plugin', link: '/docs/api/vite-plugin' },
      { text: 'Config', link: '/docs/api/config' },
    ],
  },
  {
    text: 'Guides',
    collapsed: true,
    items: [
      { text: 'Locale Files', link: '/docs/guides/locale-files' },
      { text: 'MF2 Syntax', link: '/docs/guides/mf2-syntax' },
      {
        text: 'React Components in Templates',
        link: '/docs/guides/react-components',
      },
      { text: 'Functions', link: '/docs/guides/functions' },
      { text: 'SSR', link: '/docs/guides/ssr' },
      { text: 'HMR', link: '/docs/guides/hmr' },
    ],
  },
]

const sidebarsExamples = (): DefaultTheme.SidebarItem[] => [
  { text: 'React', link: '/examples/react' },
  { text: 'React Vite Plugin', link: '/examples/react-vite-plugin' },
  { text: 'Next.js', link: '/examples/nextjs' },
]

export default defineConfig({
  title: 'Kanjou',
  description: 'Next-generation i18n for React powered by MessageFormat 2 and E2E type safety.',
  lastUpdated: true,
  cleanUrls: true,
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
  themeConfig: {
    socialLinks: [{ icon: 'github', link: 'https://github.com/iivanpopov/kanjou' }],
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/iivanpopov/kanjou/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2026-present Ivan Popov.',
    },
    nav: [
      { text: 'Docs', link: '/docs/' },
      { text: 'Examples', link: '/examples/' },
    ],
    sidebar: {
      '/': sidebars(),
      '/examples/': sidebarsExamples(),
    },
  },
  base: '/kanjou/',
  titleTemplate: ':title - Kanjou',
})
