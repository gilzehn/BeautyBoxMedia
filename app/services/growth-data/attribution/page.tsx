import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function Attribution() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Growth &amp; Data Services</span>
          <h1 className={styles.title}>
            Attribution <span className="accent-text">Modeling.</span>
          </h1>
          <p className={styles.subtitle}>
            When a customer buys your product, which channel gets the credit? If you are relying on last-click attribution, you are almost certainly underfunding your best channels and overfunding your worst ones. We implement multi-touch attribution frameworks that show you the true value of every touchpoint in your customer journey.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We build and implement attribution models that reflect how your customers actually discover and decide to buy your brand, not just the last ad they clicked before purchasing. This gives your leadership team an accurate picture of how Amazon, Google, Meta, email, and creator content are all working together to drive revenue. For CMOs and CFOs making budget allocation decisions, accurate attribution is the difference between investing in what works and optimizing for what looks good in a last-click report.
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
                  <li>Current attribution setup audit and gap analysis</li>
                  <li>Multi-touch attribution model design and implementation</li>
                  <li>Cross-channel customer journey mapping</li>
                  <li>Amazon, Google, Meta, and email attribution integration</li>
                  <li>First-touch, last-touch, and data-driven attribution modeling</li>
                  <li>Revenue contribution analysis by channel</li>
                  <li>Budget allocation recommendations based on true attribution data</li>
                  <li>Ongoing attribution monitoring and model refinement</li>
                  <li>Monthly attribution reporting with channel contribution breakdown</li>
                  <li>Leadership-ready report with clear investment recommendations</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  CMOs and CFOs making channel budget allocation decisions. Performance marketing leads who suspect their current attribution model is giving them an inaccurate picture of channel performance. Business owners scaling their marketing spend who need to know exactly where to invest next. Any brand that is running across multiple channels and wants to understand how they are working together to drive growth.
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
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Accurate Attribution
          </Link>
        </div>
      </section>
    </>
  );
}
