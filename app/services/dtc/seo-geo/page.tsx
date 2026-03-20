import ContactButton from '@/components/ContactButton';
import styles from '../../marketplaces/page.module.css';

export default function SeoGeo() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C Services</span>
          <h1 className={styles.title}>
            SEO &amp; Generative Engine <span className="accent-text">Optimization.</span>
          </h1>
          <p className={styles.subtitle}>
            Paid media drives fast results. SEO builds an asset that keeps compounding long after the campaign ends. We invest in both traditional search and the next generation of AI-powered discovery so your brand is visible wherever your customers are looking, today and tomorrow.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We go further than any standard SEO agency by optimizing your brand for the AI-powered discovery engines that are rapidly reshaping how consumers find products. GEO structures your site content and data so that tools like Perplexity and SearchGPT can extract, understand, and recommend your brand when users ask for beauty solutions. For CMOs thinking beyond the next quarter, this is the long-term brand infrastructure that protects your visibility regardless of how search evolves.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>Full technical SEO audit and implementation on Shopify or WooCommerce</li>
                  <li>Core Web Vitals and mobile performance optimization</li>
                  <li>Keyword strategy and content gap analysis</li>
                  <li>On-page SEO optimization across all product and category pages</li>
                  <li>Beauty and skincare content hub creation</li>
                  <li>Expert-led editorial content production</li>
                  <li>E-E-A-T authority building through author bios and professional citations</li>
                  <li>Brand narrative optimization for AI answer engines</li>
                  <li>Structured data and JSON-LD schema implementation</li>
                  <li>Backlink strategy and outreach</li>
                  <li>GEO monitoring and ongoing optimization</li>
                  <li>Monthly SEO performance reporting</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  CMOs who want to reduce dependency on paid media over time. Brands investing in long-term channel equity and organic growth. Business owners whose Shopify store is not generating meaningful organic traffic. Any brand that wants to be recommended by AI discovery tools like Perplexity and SearchGPT when shoppers ask for beauty solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Scale Your D2C Brand?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build a growth strategy that compounds.</p>
          <ContactButton className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Build Your Search Authority
          </ContactButton>
        </div>
      </section>
    </>
  );
}
