import Link from 'next/link';
import styles from './page.module.css';

const services = [
  {
    title: 'Market Feasibility & Strategic Research',
    description: 'We analyze market demand, competitor landscape, and growth potential to determine the best marketplace strategy for your beauty brand. From product-market fit to pricing strategy, we provide data-backed recommendations before you invest.',
  },
  {
    title: 'Brand Presence Optimization',
    description: 'Your brand\'s storefront is your first impression. We optimize product listings, A+ content, brand stores, and visual assets to maximize conversion rates and build brand equity across Amazon and other marketplaces.',
  },
  {
    title: 'Advertising Management',
    description: 'Strategic advertising campaigns across Sponsored Products, Sponsored Brands, and DSP. We manage your ad spend with precision targeting, bid optimization, and continuous performance analysis to maximize ROAS.',
  },
  {
    title: 'Full Account Management',
    description: 'End-to-end marketplace operations including inventory planning, catalog management, review strategy, case management, and compliance monitoring. We handle the day-to-day so you can focus on your brand.',
  },
  {
    title: 'Consulting & Advisory',
    description: 'Expert guidance for brands looking to scale or enter new marketplaces. We provide strategic roadmaps, channel assessment, and ongoing advisory to help you make informed decisions and avoid costly mistakes.',
  },
];

export default function Marketplaces() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon &amp; Beyond</span>
          <h1 className={styles.title}>
            <span className="accent-text">Marketplaces</span>
          </h1>
          <p className={styles.subtitle}>
            Dominate the digital shelf. We help beauty brands launch, grow,
            and scale on Amazon and other major marketplaces.
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
          <h2 className={styles.ctaTitle}>Ready to Own the Marketplace?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build your marketplace growth strategy.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
