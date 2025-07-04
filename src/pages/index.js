import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import BlogPostItem from '@theme/BlogPostItem';
import {useBlogPosts} from '@docusaurus/theme-common/internal';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="https://barrack.ai/signup">
            Start Building with GPUs
          </Link>
          <Link
            className="button button--outline button--lg"
            to="https://barrack.ai/pricing"
            style={{marginLeft: '1rem'}}>
            View Pricing
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeatureItem({title, description, icon}) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className="text--center">
        <div className={styles.featureIcon}>{icon}</div>
      </div>
      <div className="text--center padding-horiz--md">
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  const features = [
    {
      title: 'Zero Egress Fees',
      icon: '🚀',
      description: 'Download your datasets, models, and outputs without hidden charges. Pay only for compute time.',
    },
    {
      title: 'High-Performance GPUs',
      icon: '⚡',
      description: 'Access H100, A100, and other cutting-edge GPUs with on-demand pricing and instant deployment.',
    },
    {
      title: 'AI-Optimized Infrastructure',
      icon: '🧠',
      description: 'Purpose-built for machine learning workloads with fast storage, high-speed networking, and pre-configured environments.',
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((props, idx) => (
            <FeatureItem key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className="row">
          <div className="col col--8 col--offset-2 text--center">
            <h2 className={styles.ctaTitle}>Ready to Accelerate Your AI Development?</h2>
            <p className={styles.ctaDescription}>
              Join hundreds of AI developers who've eliminated egress fees and reduced their cloud costs by up to 60%.
            </p>
            <div className={styles.ctaButtons}>
              <Link
                className="button button--primary button--lg"
                to="https://barrack.ai/signup">
                Start Free Trial
              </Link>
              <Link
                className="button button--outline button--lg"
                to="https://barrack.ai/contact"
                style={{marginLeft: '1rem'}}>
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description="Insights on GPU computing, AI infrastructure, and cloud cost optimization from the Barrack.ai team.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <CTASection />
      </main>
    </Layout>
  );
}
