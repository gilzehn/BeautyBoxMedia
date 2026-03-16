import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function Influencer() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C &middot; Influencer &amp; Creator Marketing</span>
          <h1 className={styles.title}>
            Influencer &amp; Creator <span className="accent-text">Marketing.</span>
          </h1>
          <p className={styles.intro}>
            <em>Creator-driven content is one of the most efficient customer acquisition tools available.</em>
          </p>
          <p className={styles.subtitle}>BEAUTYBOXMEDIA sources and vets creators whose audience demographics, aesthetic, and brand values align with your ideal customer profile — not just their follower count. We brief creators to produce authentic UGC that works organically and as high-performing paid media assets. For CMOs and Brand Directors managing tight CPAs, UGC consistently outperforms studio-produced content in paid campaigns. We also build affiliate and ambassador program tracking infrastructure so your top creator partnerships generate measurable, attributable revenue at scale.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>Creator sourcing &amp; vetting</li>
                  <li>Audience demographic alignment</li>
                  <li>UGC content briefing &amp; production</li>
                  <li>Paid media asset optimization</li>
                  <li>Affiliate &amp; ambassador program setup</li>
                  <li>Revenue attribution tracking</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>CMOs and Brand Directors managing tight CPAs who want creator-driven content that converts.</p>
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
