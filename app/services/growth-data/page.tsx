import Link from 'next/link';
import styles from '../marketplaces/page.module.css';

const services = [
  {
    title: 'Audience Targeting & Data Strategy',
    description: 'Reach the right people with the right message. We build data-driven audience segments, lookalike models, and targeting strategies that connect your beauty brand with high-intent customers across every platform.',
  },
  {
    title: 'Performance Optimization & Reporting',
    description: 'Transparent, actionable insights that drive smarter decisions. We monitor KPIs across all channels, run continuous optimization cycles, and deliver clear reporting so you always know what\'s working and why.',
  },
  {
    title: 'Attribution Modeling',
    description: 'Understand the true value of every touchpoint. We implement multi-touch attribution frameworks that reveal how your marketing channels work together, helping you allocate budget where it matters most.',
  },
];

export default function GrowthData() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Cross-Platform</span>
          <h1 className={styles.title}>
            <span className="accent-text">Growth &amp; Data Layer</span>
          </h1>
          <p className={styles.subtitle}>
            Data-powered growth across every channel. We connect the dots between
            platforms to optimize performance and maximize your marketing ROI.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            {services.map((service, i) => (
              <div key={i} className={styles.item}>
                <div className={styles.number}>0{i + 1}</div>
                <div className={styles.content}>
                  <h2 className={styles.itemTitle}>{service.title}</h2>
                  <p className={styles.itemDesc}>{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Unlock Your Data?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s turn your data into your competitive advantage.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
