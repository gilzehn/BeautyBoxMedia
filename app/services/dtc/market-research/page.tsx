import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function MarketResearch() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C Services</span>
          <h1 className={styles.title}>
            Market Feasibility &amp; Strategic <span className="accent-text">Research.</span>
          </h1>
          <p className={styles.subtitle}>
            Before your team allocates a single dollar to Google or Shopify, you need to know exactly what the competitive landscape looks like and where the real opportunity is. Our research gives your leadership team the data-backed foundation to make confident channel investment decisions.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We map the full digital opportunity for your brand: high-intent keyword clusters, seasonal demand patterns, competitor content and backlink strategies, and the technical benchmarks your site needs to beat. We go beyond traditional SEO research by analyzing how AI answer engines like ChatGPT and Gemini currently categorize brands in your category, a critical insight for any CMO thinking about long-term discoverability. For BizDev leaders evaluating D2C as a growth channel, this study provides the clarity your investment decisions deserve.
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
                  <li>High-volume and high-intent keyword research across your category</li>
                  <li>Seasonal demand mapping for your specific product range</li>
                  <li>Competitor backlink profile and content strategy audit</li>
                  <li>Technical performance benchmarking against top category competitors</li>
                  <li>AI and generative search analysis for your brand and category</li>
                  <li>Sentiment and perception audit across customer reviews</li>
                  <li>Target CPA and break-even ROAS modeling based on your margins</li>
                  <li>Competitive pricing analysis and brand tier positioning</li>
                  <li>Full research report built for executive review</li>
                  <li>Strategic recommendations and channel investment roadmap</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  Founders and CMOs evaluating D2C as a new or expanded revenue channel. BizDev leaders who need data to build a business case for digital investment. Brands already running paid search or SEO who want to understand if their strategy is built on the right foundation. Any brand preparing to launch or relaunch their Shopify store.
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
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Your D2C Research
          </Link>
        </div>
      </section>
    </>
  );
}
