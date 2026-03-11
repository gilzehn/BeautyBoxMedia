import Link from 'next/link';
import styles from '../marketplaces/page.module.css';

const services = [
  {
    title: 'Market Feasibility & Strategic Research',
    description: 'Before building, we research. We assess your target audience, competitive landscape, and market opportunity to develop a D2C strategy grounded in real data — ensuring your Shopify or web store is set up for success from day one.',
  },
  {
    title: 'Paid Search & Social Campaign Management',
    description: 'Precision-targeted ad campaigns across Google, Meta, TikTok, and beyond. We manage your paid media with full-funnel strategies, creative testing, and continuous optimization to drive traffic and conversions profitably.',
  },
  {
    title: 'SEO & Generative Engine Optimization (GEO)',
    description: 'Future-proof your organic visibility. We optimize for traditional search engines and the new wave of AI-powered search, ensuring your beauty brand shows up wherever your customers are looking.',
  },
  {
    title: 'Lifecycle & Email Marketing',
    description: 'Turn one-time buyers into loyal customers. We build automated email and SMS flows — welcome series, abandoned cart recovery, post-purchase nurture, and win-back campaigns — that drive repeat revenue.',
  },
  {
    title: 'Influencer & Creator Marketing',
    description: 'Authentic partnerships that move the needle. We identify, vet, and manage influencer and creator collaborations that align with your brand and deliver measurable results across social platforms.',
  },
];

export default function DTC() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Shopify &amp; Web</span>
          <h1 className={styles.title}>
            <span className="accent-text">Direct-to-Consumer</span>
          </h1>
          <p className={styles.subtitle}>
            Build a brand customers love to buy from. We drive growth for beauty
            brands through Shopify, web, and every digital touchpoint in between.
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
          <h2 className={styles.ctaTitle}>Ready to Scale Your D2C Brand?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build a direct-to-consumer engine that grows with you.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
