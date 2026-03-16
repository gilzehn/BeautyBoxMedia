import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function MarketResearch() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C &middot; Market Feasibility &amp; Strategic Research</span>
          <h1 className={styles.title}>
            Market Feasibility &amp; Strategic <span className="accent-text">Research.</span>
          </h1>
          <p className={styles.intro}>
            <em>Before your team allocates a single dollar to Google, you need to know exactly what the competitive landscape looks like.</em>
          </p>
          <p className={styles.subtitle}>BEAUTYBOXMEDIA delivers a comprehensive research package covering high-intent keyword opportunities, seasonal demand patterns, competitor backlink and content strategies, and technical benchmarks your site needs to beat. We go beyond traditional SEO research by analyzing how AI answer engines like ChatGPT and Gemini currently categorize brands in your category — a critical insight for any CMO thinking about long-term discoverability. For BizDev leaders evaluating Google as a growth channel, this study provides the data-backed foundation your investment decisions deserve.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>High-intent keyword opportunity analysis</li>
                  <li>Seasonal demand pattern mapping</li>
                  <li>Competitor backlink &amp; content audit</li>
                  <li>Technical benchmark assessment</li>
                  <li>AI answer engine brand categorization analysis</li>
                  <li>Data-backed investment recommendation report</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>CMOs and BizDev leaders evaluating Google and D2C as a growth channel.</p>
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
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
