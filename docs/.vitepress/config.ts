import type { DefaultTheme } from 'vitepress'

import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Kanjou',
  description: 'Internationalization for React powered by MessageFormat 2',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/kanjou/logo.svg' }]],
  cleanUrls: true,
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/iivanpopov/kanjou' },
      { icon: 'npm', link: 'https://npmx.dev/org/kanjou' },
    ],
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/iivanpopov/kanjou/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2026-present Ivan Popov.',
    },
    nav: nav(),
    sidebar: {
      '/introduction/': sidebar(),
      '/reference/': sidebarReference(),
    },
  },
  base: '/kanjou/',
})

function nav(): DefaultTheme.NavItem[] {
  return [
    { text: 'Introduction', link: '/introduction/getting-started', activeMatch: '/introduction/' },
    { text: 'Reference', link: '/reference/', activeMatch: '/reference/' },
    {
      text: 'v0',
      items: [
        { text: 'v0', link: 'https://github.com/iivanpopov/kanjou/tree/main' },
        { text: 'Releases', link: 'https://github.com/iivanpopov/kanjou/releases' },
      ],
    },
  ]
}

function sidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      items: [
        { text: 'Philosophy', link: '/introduction/philosophy' },
        { text: 'Getting Started', link: '/introduction/getting-started' },
        { text: 'Syntax', link: '/introduction/syntax' },
        { text: 'TypeScript', link: '/introduction/typescript' },
        { text: 'Limitations', link: '/introduction/limitations' },
      ],
    },
  ]
}

function sidebarReference(): DefaultTheme.SidebarItem[] {
  return []
}
