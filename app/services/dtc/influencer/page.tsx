import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function Influencer() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C Services</span>
          <h1 className={styles.title}>
            Influencer &amp; Creator <span className="accent-text">Marketing.</span>
          </h1>
          <p className={styles.subtitle}>
            In the U.S. beauty and fashion market, the right creator voice moves more product than almost any paid media format. But creator marketing only delivers results when it is executed with the right infrastructure, the right briefs, and the right measurement framework. We build creator programs that generate authentic content and scalable, attributable revenue.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We source and vet creators whose audience demographics, aesthetic, and brand values align with your ideal customer profile, not just their follower count. We brief them to produce raw, native-feeling content that works both organically and as high-performing paid media assets. For CMOs and Brand Directors managing tight CPAs, UGC consistently outperforms studio-produced content in paid campaigns at a fraction of the production cost. We also build affiliate and ambassador program infrastructure so your best creator partnerships generate measurable revenue long after the initial campaign ends.
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
                  <li>Creator sourcing and vetting aligned to your brand and audience profile</li>
                  <li>Campaign strategy and creative briefing</li>
                  <li>UGC video and photo content production coordination</li>
                  <li>Gifting and seeding program management</li>
                  <li>Paid media integration of creator content across Meta and Google</li>
                  <li>Spark Ads and boosted post setup and management</li>
                  <li>Affiliate program setup and tracking infrastructure</li>
                  <li>Ambassador program development and management</li>
                  <li>Performance tracking across reach, engagement, and attributed revenue</li>
                  <li>Monthly creator program reporting</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  CMOs and Brand Directors looking to build social proof and acquire customers more efficiently. Brands whose studio-produced ad creative is underperforming and needs a fresh UGC approach. Business owners who want to build a scalable creator program that generates consistent content and revenue. Any brand preparing for a product launch that needs authentic creator coverage to build awareness and drive sales.
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
            Build Your Creator Program
          </Link>
        </div>
      </section>
    </>
  );
}
