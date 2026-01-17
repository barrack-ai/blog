// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

const config = {
  title: 'Barrack.ai',
  tagline: 'Personalized GPU Computing for AI Workloads',
  favicon: 'img/favicon.ico',
  url: 'https://blog.barrack.ai',
  baseUrl: '/',
  organizationName: 'barrack-ai',
  projectName: 'blog',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      ({
        docs: false,
        blog: {
          routeBasePath: '/',
          showReadingTime: true,
          blogTitle: 'Barrack.ai Blog',
          blogDescription: 'Insights on GPU computing, AI infrastructure, and cloud cost optimization',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'Recent posts',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themeConfig: ({
    navbar: {
      title: 'Barrack',
      items: [
        {to: '/', label: 'Blog', position: 'left'},
        {href: 'https://barrack.ai/deploy', label: 'Platform', position: 'left'},
        {href: 'https://docs.barrack.ai', label: 'Docs', position: 'left'},
      ],
    },
    footer: {
      style: 'light',
      copyright: `Copyright © ${new Date().getFullYear()} Barrack.ai.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
  }),
};

module.exports = config;
