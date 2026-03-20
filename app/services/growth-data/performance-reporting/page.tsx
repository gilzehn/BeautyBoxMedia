import ContactButton from '@/components/ContactButton';
import styles from '../../marketplaces/page.module.css';

export default function PerformanceReporting() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Growth &amp; Data Services</span>
          <h1 className={styles.title}>
            Performance Optimization &amp; <span className="accent-text">Reporting.</span>
          </h1>
          <p className={styles.subtitle}>
            Most beauty brands are making budget decisions based on incomplete or disconnected data. We build the reporting infrastructure and run the continuous optimization cycles that give your leadership team full visibility across every channel and the confidence to make smarter investment decisions.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We monitor KPIs across Amazon, Google, and Meta in a unified reporting framework so you always have a single, clear picture of your entire marketing performance. Weekly reviews identify what is working, what is not, and what needs to change. Monthly strategic reports go deeper, with trend analysis, channel contribution breakdowns, and forward-looking recommendations your leadership team can bring to the board. For CMOs and VPs of Marketing accountable to growth targets, this is the visibility layer that makes every other investment more efficient.
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
                  <li>Cross-platform KPI dashboard setup and management</li>
                  <li>Amazon, Google, and Meta performance monitoring</li>
                  <li>Weekly performance reviews with actionable insights</li>
                  <li>Monthly strategic reports built for leadership review</li>
                  <li>Budget allocation recommendations based on performance data</li>
                  <li>Continuous optimization cycles across all active channels</li>
                  <li>Creative performance analysis and recommendations</li>
                  <li>Audience and targeting performance review</li>
                  <li>Trend analysis and forward-looking growth recommendations</li>
                  <li>Custom reporting built to your specific KPI framework</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  CMOs and VPs of Marketing who need full visibility across every channel in one place. Business owners who are spending across multiple platforms but do not have a clear picture of what is working. Performance marketing leads who need cleaner data to make faster decisions. Any brand that has grown to a level of complexity where disconnected platform-level reporting is no longer enough.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Unlock Your Data?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s turn your data into your competitive advantage.</p>
          <ContactButton className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Full Performance Visibility
          </ContactButton>
        </div>
      </section>
    </>
  );
}
