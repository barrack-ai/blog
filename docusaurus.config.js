// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

const config = {
  title: 'Barrack.ai',
  tagline: 'Personalized GPU Computing for AI Workloads',
  favicon: 'img/favicon.svg',
  url: 'https://blog.barrack.ai',
  baseUrl: '/',
  organizationName: 'barrack-ai',
  projectName: 'blog',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  trailingSlash: true,

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Delay-loaded analytics — no render-blocking gtag plugin
  clientModules: [
    './src/modules/delayedAnalytics.js',
  ],

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
        // gtag removed — loaded via clientModules with delay
        gtag: false,
      }),
    ],
  ],

  // No gtag plugin — handled by clientModules
  plugins: [],

  themeConfig: ({
    navbar: {
      title: 'Barrack',
      logo: {
        alt: 'Barrack.ai',
        src: 'img/logo.jpg',
        href: 'https://barrack.ai',
      },
      items: [
        {href: 'https://docs.barrack.ai', label: 'Docs', position: 'right'},
        {href: 'https://barrack.ai/pricing', label: 'Pricing', position: 'right'},
        {href: 'https://barrack.ai/signup', label: 'Signup', position: 'right'},
        {
          href: 'https://barrack.ai/deploy',
          label: 'Deploy',
          position: 'right',
          className: 'navbar-deploy-button',
        },
      ],
    },
    footer: {
      style: 'light',
      copyright: `Copyright © ${new Date().getFullYear()} Barrack.ai. All rights reserved.`,
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
