import Link from 'next/link';
import styles from '../page.module.css';

export default function MarketFeasibility() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon Services</span>
          <h1 className={styles.title}>
            Market Feasibility &amp; Strategic <span className="accent-text">Research.</span>
          </h1>
          <p className={styles.subtitle}>
            Before your brand commits a single dollar to Amazon, you need to know exactly what you are walking into. Our market feasibility study gives your leadership team a complete, data-backed picture of the opportunity in your category so every decision is built on evidence, not assumptions.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We analyze your category from every angle: total market size, demand growth, seasonality patterns, competitor sales volumes, pricing benchmarks, keyword visibility, and profit margin modeling including FBA fees, referral costs, and logistics. We surface the gaps your competitors have not found yet and the risks they have already fallen into. For CMOs and VPs of Business Development evaluating Amazon as a new revenue channel, this is the research that turns uncertainty into a confident investment decision.
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
                  <li>Full category size and demand analysis</li>
                  <li>Seasonality and trend mapping for your specific products</li>
                  <li>Competitor sales volume and positioning research</li>
                  <li>Keyword visibility and organic rank benchmarking</li>
                  <li>Pricing and promotional trend analysis</li>
                  <li>FBA cost, referral fee, and profit margin modeling</li>
                  <li>Visual PDF feasibility report built for executive review</li>
                  <li>Executive summary with key conclusions and strategic recommendations</li>
                  <li>Actionable launch or expansion roadmap with clear priorities and timelines</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  Founders and business owners considering Amazon for the first time. CMOs who need data to justify the investment internally. BizDev leaders building a channel expansion strategy. Brands already on Amazon that want to understand a new category before expanding into it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build your Amazon growth strategy.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Your Feasibility Study
          </Link>
        </div>
      </section>
    </>
  );
}
