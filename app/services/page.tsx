import Link from 'next/link';
import styles from './page.module.css';

const sections = [
  {
    category: 'Marketplaces',
    categoryLabel: 'Amazon & Beyond',
    link: '/services/marketplaces',
    services: [
      { id: 'market-feasibility', title: 'Market Feasibility & Strategic Research', description: 'Data-backed market analysis, competitor research, and strategic recommendations before you invest.' },
      { id: 'brand-presence', title: 'Brand Presence Optimization', description: 'Optimized listings, A+ content, brand stores, and visual assets to maximize conversions.' },
      { id: 'advertising-mgmt', title: 'Advertising Management', description: 'Strategic ad campaigns across Sponsored Products, Sponsored Brands, and DSP.' },
      { id: 'account-mgmt', title: 'Full Account Management', description: 'End-to-end marketplace operations — inventory, catalog, reviews, and compliance.' },
      { id: 'consulting', title: 'Consulting & Advisory', description: 'Expert guidance, strategic roadmaps, and ongoing advisory for marketplace growth.' },
    ],
  },
  {
    category: 'Direct-to-Consumer',
    categoryLabel: 'Shopify & Web',
    link: '/services/dtc',
    services: [
      { id: 'dtc-research', title: 'Market Feasibility & Strategic Research', description: 'Audience research, competitive analysis, and D2C strategy grounded in real data.' },
      { id: 'paid-search', title: 'Paid Search & Social Campaign Management', description: 'Precision-targeted campaigns across Google, Meta, TikTok, and beyond.' },
      { id: 'seo-geo', title: 'SEO & Generative Engine Optimization (GEO)', description: 'Organic visibility for traditional and AI-powered search engines.' },
      { id: 'lifecycle-email', title: 'Lifecycle & Email Marketing', description: 'Automated email and SMS flows that drive repeat revenue and customer loyalty.' },
      { id: 'influencer', title: 'Influencer & Creator Marketing', description: 'Authentic partnerships with influencers and creators that deliver measurable results.' },
    ],
  },
  {
    category: 'Growth & Data Layer',
    categoryLabel: 'Cross-Platform',
    link: '/services/growth-data',
    services: [
      { id: 'audience-targeting', title: 'Audience Targeting & Data Strategy', description: 'Data-driven audience segments, lookalike models, and precision targeting strategies.' },
      { id: 'performance-reporting', title: 'Performance Optimization & Reporting', description: 'Continuous optimization with transparent, actionable reporting across all channels.' },
      { id: 'attribution', title: 'Attribution Modeling', description: 'Multi-touch attribution that reveals how your marketing channels work together.' },
    ],
  },
];

export default function Services() {
  return (
    <>
      {/* Page Header */}
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>What We Offer</span>
          <h1 className={styles.title}>
            Our <span className="accent-text">Services</span>
          </h1>
          <p className={styles.subtitle}>
            Comprehensive digital media solutions to grow your beauty brand,
            engage your audience, and drive results.
          </p>
        </div>
      </section>

      {/* Service Sections */}
      {sections.map((section) => (
        <section key={section.category} className="section" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionLabel}>{section.categoryLabel}</p>
                <h2 className={styles.sectionTitle}>{section.category}</h2>
              </div>
              <Link href={section.link} className="btn btn-outline">
                Learn More
              </Link>
            </div>
            <div className={styles.grid}>
              {section.services.map((service) => (
                <div key={service.id} id={service.id} className={styles.card}>
                  <h3 className={styles.cardTitle}>{service.title}</h3>
                  <p className={styles.cardDesc}>{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaSubtitle}>
            Let&apos;s discuss how we can help your brand thrive.
          </p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
