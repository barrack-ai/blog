// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Barrack.ai',
  tagline: 'Personalized GPU Computing for AI Workloads',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://blog.barrack.ai',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config
  organizationName: 'barrack-ai',
  projectName: 'blog',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false, // Disable docs for blog-only site
        blog: {
          routeBasePath: '/', // Serve the blog at the site's root
          showReadingTime: true,
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} Barrack.ai`,
            createFeedItems: async (params) => {
              const {blogPosts, defaultCreateFeedItems, ...rest} = params;
              return defaultCreateFeedItems({
                // keep only the 10 most recent blog posts in the feed
                blogPosts: blogPosts.filter((item, index) => index < 10),
                ...rest,
              });
            },
          },
          // Please change this to your repo.
          editUrl: 'https://github.com/barrack-ai/blog/tree/main/',
          blogTitle: 'Barrack.ai Blog',
          blogDescription: 'Insights on GPU computing, AI infrastructure, and cloud cost optimization',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'Recent posts',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: 'G-YOUR-TRACKING-ID', // Replace with your Google Analytics ID
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/barrack-social-card.jpg',
      navbar: {
  title: 'Barrack',
  logo: {
    alt: 'Barrack.ai',
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==',
    href: 'https://barrack.ai',
    target: '_self',
    width: 0,
    height: 0,
  },
  items: [
    {to: '/', label: 'Blog', position: 'left'},
    {
      href: 'https://barrack.ai/deploy',
      label: 'Platform',
      position: 'left',
    },
    {
      href: 'https://docs.barrack.ai',
      label: 'Docs',
      position: 'left',
    },
    {
      href: 'https://github.com/barrack-ai',
      label: 'GitHub',
      position: 'right',
    },
  ],
},
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Platform',
            items: [
              {
                label: 'Sign Up',
                href: 'https://barrack.ai/signup',
              },
              {
                label: 'Pricing',
                href: 'https://barrack.ai/pricing',
              },
              {
                label: 'Documentation',
                href: 'https://docs.barrack.ai',
              },
            ],
          },
          {
            title: 'Resources',
            items: [
              {
                label: 'Blog',
                to: '/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Barrack.ai. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      metadata: [
        {name: 'keywords', content: 'GPU cloud, AI infrastructure, machine learning, deep learning, zero egress fees'},
        {name: 'twitter:card', content: 'summary_large_image'},
      ],
    }),
};

module.exports = config;
