import Link from 'next/link';
import styles from '../marketplaces/page.module.css';

const services = [
  {
    slug: 'audience-targeting',
    title: 'Audience Targeting & Data Strategy',
    description: 'Data-driven audience segments, lookalike models, and targeting strategies that connect your beauty brand with high-intent customers across every platform.',
  },
  {
    slug: 'performance-reporting',
    title: 'Performance Optimization & Reporting',
    description: 'Cross-channel KPI monitoring, continuous optimization cycles, and clear reporting that cuts through vanity metrics to surface the numbers that actually drive business decisions.',
  },
  {
    slug: 'attribution',
    title: 'Attribution Modeling',
    description: 'Multi-touch attribution frameworks that reveal how your marketing channels work together — so you can allocate budget where it matters most.',
  },
];

export default function GrowthData() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Cross-Platform</span>
          <h1 className={styles.title}>
            Growth &amp; Data <span className="accent-text">Layer.</span>
          </h1>
          <p className={styles.intro}>
            <em>Data-powered growth across every channel.</em>
          </p>
          <p className={styles.subtitle}>
            We connect the dots between platforms to optimize performance and maximize your marketing ROI. From audience targeting to attribution modeling, our data layer gives your leadership team the clarity to make confident investment decisions.
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
                  <Link href={`/services/growth-data/${service.slug}`} className={styles.learnMore}>
                    Learn More &rarr;
                  </Link>
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
