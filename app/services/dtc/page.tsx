import Link from 'next/link';
import styles from '../marketplaces/page.module.css';

const services = [
  {
    slug: 'market-research',
    title: 'Market Feasibility & Strategic Research',
    description: 'A comprehensive research package covering high-intent keyword opportunities, seasonal demand patterns, competitor strategies, and AI answer engine analysis — the data-backed foundation your investment decisions deserve.',
  },
  {
    slug: 'paid-search',
    title: 'Paid Search & Social Campaign Management',
    description: 'Full Google paid media management: Search, Shopping, Performance Max, and YouTube — measured against MER and LTV, not just clicks and impressions.',
  },
  {
    slug: 'seo-geo',
    title: 'SEO & Generative Engine Optimization (GEO)',
    description: 'Technical SEO, E-E-A-T authority building, and GEO content structuring so AI-powered discovery engines like Perplexity and SearchGPT recommend your brand.',
  },
  {
    slug: 'email-lifecycle',
    title: 'Lifecycle & Email Marketing',
    description: 'Intelligent email and SMS automation: abandoned cart recovery, re-engagement campaigns, seasonal execution, and deep segmentation that makes every message feel personal.',
  },
  {
    slug: 'influencer',
    title: 'Influencer & Creator Marketing',
    description: 'Creator sourcing, UGC production, paid media optimization, and affiliate program infrastructure — so your top creator partnerships generate measurable, attributable revenue at scale.',
  },
];

export default function DTC() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Shopify &amp; Web</span>
          <h1 className={styles.title}>
            D2C <span className="accent-text">Services.</span>
          </h1>
          <p className={styles.intro}>
            <em>Be found by the customers who are already looking for you.</em>
          </p>
          <p className={styles.subtitle}>
            Google is where purchase decisions are made — and for beauty and fashion brands, the stakes have never been higher. Between paid search, SEO, and the rise of AI-powered discovery engines, the brands that win are the ones with a cohesive, multi-layer strategy. BEAUTYBOXMEDIA builds that strategy and executes it end to end.
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
                  <Link href={`/services/dtc/${service.slug}`} className={styles.learnMore}>
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
          <h2 className={styles.ctaTitle}>Ready to Scale Your D2C Brand?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build a Google growth strategy that compounds.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
