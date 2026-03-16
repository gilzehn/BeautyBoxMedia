import Link from 'next/link';
import styles from './page.module.css';

const services = [
  {
    slug: 'consulting',
    title: 'Consulting & Advisory',
    description: 'Direct access to senior Amazon strategists on a flexible basis. Get rapid account audits, launch strategy reviews, and on-demand tactical guidance without committing to a full retainer.',
  },
  {
    slug: 'market-feasibility',
    title: 'Market Feasibility & Strategic Research',
    description: 'A complete market feasibility study that maps the real opportunity in your category — demand size, competitive intensity, pricing benchmarks, and profit margins — before you invest a dollar.',
  },
  {
    slug: 'brand-onboarding',
    title: 'Amazon Brand Onboarding',
    description: 'We handle the complete onboarding process: Seller Central or Vendor Central setup, brand registry enrollment, ASIN creation, catalog structuring, and compliance review.',
  },
  {
    slug: 'brand-presence',
    title: 'Brand Presence Optimization',
    description: 'Keyword-engineered titles, benefit-driven copy, A+ content, product imagery, and a fully designed Storefront — turning a fragmented catalog into a cohesive brand destination.',
  },
  {
    slug: 'advertising',
    title: 'Advertising Management',
    description: 'Structured, scalable advertising programs across Sponsored Products, Sponsored Brands, and Sponsored Display — managed daily with discipline, urgency, and a constant bias toward efficiency.',
  },
  {
    slug: 'full-management',
    title: 'Full Account Management',
    description: 'Complete ownership of your Amazon business: catalog management, inventory coordination, technical issue resolution, policy compliance, advertising, and reporting.',
  },
];

export default function Marketplaces() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon &amp; Beyond</span>
          <h1 className={styles.title}>
            Marketplace <span className="accent-text">Services.</span>
          </h1>
          <p className={styles.intro}>
            <em>Your brand deserves more than a listing. It deserves a strategy.</em>
          </p>
          <p className={styles.subtitle}>
            If you&apos;re a CMO, Brand Director, or business owner in the beauty or fashion space, you already know Amazon isn&apos;t optional — it&apos;s where your customers are shopping, your competitors are scaling, and market share is being won or lost every single day. BEAUTYBOXMEDIA is the partner your brand demands.
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
                  <Link href={`/services/marketplaces/${service.slug}`} className={styles.learnMore}>
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
          <h2 className={styles.ctaTitle}>Ready to Own the Marketplace?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build your Amazon growth strategy.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
