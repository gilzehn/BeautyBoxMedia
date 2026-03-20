import ContactButton from '@/components/ContactButton';
import styles from '../../marketplaces/page.module.css';

export default function PaidSearch() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C Services</span>
          <h1 className={styles.title}>
            Paid Search &amp; Social Campaign <span className="accent-text">Management.</span>
          </h1>
          <p className={styles.subtitle}>
            Paid search done right is one of the highest-ROI channels available to beauty and fashion brands. Done wrong, it is the fastest way to burn through budget with nothing to show for it. We manage the full paid media stack across Google and Meta so every dollar is working as hard as possible for your brand.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We build and manage full-funnel campaigns that capture demand at every stage of the buyer journey. High-intent search campaigns put your brand in front of shoppers at the moment of decision. Shopping and Performance Max campaigns showcase your products visually and outperform category benchmarks. Meta campaigns build awareness, drive consideration, and retarget high-intent visitors back to purchase. Every campaign is measured against MER and LTV, not just clicks and impressions, because CMOs and CFOs need to understand what the spend is actually building for the brand over time.
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
                  <li>Google Search campaign setup and management</li>
                  <li>Google Shopping and Performance Max campaign management</li>
                  <li>YouTube ad campaign setup and management</li>
                  <li>Meta Facebook and Instagram campaign setup and management</li>
                  <li>Full-funnel campaign architecture across awareness, consideration, and conversion</li>
                  <li>Daily bid and budget optimization across all platforms</li>
                  <li>Audience targeting and segmentation strategy</li>
                  <li>Creative strategy and ad copy recommendations</li>
                  <li>Performance tracking against MER, LTV, ROAS, and CAC</li>
                  <li>Weekly performance summaries</li>
                  <li>Monthly strategic reports built for leadership review</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  CMOs and performance marketing leads running paid campaigns that are not delivering the right return. Brands scaling their D2C channel who need a more sophisticated paid media infrastructure. Business owners who want full visibility into where every paid media dollar is going and what it is returning. Any brand preparing for a major campaign moment like a product launch or seasonal sale.
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
            Scale Your Paid Campaigns
          </ContactButton>
        </div>
      </section>
    </>
  );
}
