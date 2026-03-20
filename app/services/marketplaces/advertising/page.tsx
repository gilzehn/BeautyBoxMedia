import ContactButton from '@/components/ContactButton';
import styles from '../page.module.css';

export default function Advertising() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon Services</span>
          <h1 className={styles.title}>
            Advertising <span className="accent-text">Management.</span>
          </h1>
          <p className={styles.subtitle}>
            Amazon advertising without a clear strategy is the fastest way to burn through your marketing budget with nothing to show for it. We build structured, scalable advertising programs that protect your margins, grow your revenue, and compound your organic ranking over time.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We architect your full PPC strategy and manage it daily, not weekly. Every dollar is tracked against the metrics that matter to your business and every decision is made with discipline and urgency. You receive clear reporting built for leadership review so your team always knows exactly what the advertising investment is returning and what we are doing next to improve it.
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
                  <li>Full PPC campaign architecture and setup</li>
                  <li>Sponsored Products, Sponsored Brands, and Sponsored Display campaigns</li>
                  <li>Campaign segmentation and targeting strategy</li>
                  <li>Daily bid and budget optimization</li>
                  <li>Search term harvesting and negative keyword management</li>
                  <li>Performance tracking against ACoS, ROAS, and revenue targets</li>
                  <li>Organic rank monitoring driven by advertising investment</li>
                  <li>Weekly performance summaries</li>
                  <li>Monthly strategic reports built for leadership review</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  Business owners and CMOs running Amazon ads that are not delivering the right return. Brands scaling their Amazon catalog who need a more sophisticated advertising infrastructure. Performance marketing leads who need clear attribution and daily management discipline. Any brand that has tried running Amazon PPC internally and wants a senior team to take it over.
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
          <ContactButton className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Start Scaling Your Ads
          </ContactButton>
        </div>
      </section>
    </>
  );
}
