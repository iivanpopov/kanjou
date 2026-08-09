import type { DefaultTheme } from 'vitepress'

import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

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
      copyright: 'Copyright © 2026-PRESENT Ivan Popov.',
    },
    nav: nav(),
    sidebar: {
      '/guide/': sidebarGuide(),
      '/reference/': sidebarReference(),
    },
  },
  base: '/kanjou/',
  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },
  vite: {
    plugins: [groupIconVitePlugin()],
  },
})

function nav(): DefaultTheme.NavItem[] {
  return [
    { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
    { text: 'Reference', link: '/reference/react', activeMatch: '/reference/' },
    {
      text: 'v0',
      items: [
        { text: 'v0', link: 'https://github.com/iivanpopov/kanjou/tree/main' },
        { text: 'Releases', link: 'https://github.com/iivanpopov/kanjou/releases' },
      ],
    },
  ]
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      items: [
        { text: 'Philosophy', link: '/guide/philosophy' },
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Syntax', link: '/guide/syntax' },
        { text: 'TypeScript', link: '/guide/typescript' },
        { text: 'Limitations', link: '/guide/limitations' },
      ],
    },
    {
      text: 'Essentials',
      items: [
        { text: 'Client', link: '/guide/client' },
        { text: 'Server', link: '/guide/server' },
        { text: 'Components', link: '/guide/components' },
        { text: 'Vite Plugin', link: '/guide/vite-plugin' },
        { text: 'CLI', link: '/guide/cli' },
      ],
    },
    { text: 'API Reference', link: '/reference/react' },
  ]
}

function sidebarReference(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Reference',
      items: [
        { text: 'React', link: '/reference/react' },
        { text: 'Vite Plugin', link: '/reference/vite-plugin' },
        { text: 'CLI', link: '/reference/cli' },
      ],
    },
  ]
}
