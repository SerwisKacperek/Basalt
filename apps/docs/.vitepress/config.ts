import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Basalt',
  description: 'Basalt documentation',
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Reference', link: '/reference/' },
    ],
    sidebar: [
      {
        text: 'Guide',
        collapsed: false,
        items: [
          { text: 'Introduction', link: '/guide/' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Configuration', link: '/guide/configuration' },
        ],
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/reference/' },
          {
            text: 'Packages',
            collapsed: true,
            items: [
              { text: 'ESLint Config', link: '/reference/eslint-config' },
              { text: 'TypeScript Config', link: '/reference/typescript-config' },
            ],
          },
        ],
      },
    ],
    socialLinks: [],
  },
})
