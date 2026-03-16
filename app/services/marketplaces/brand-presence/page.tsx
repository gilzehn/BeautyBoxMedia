import Link from 'next/link';
import styles from '../page.module.css';

export default function BrandPresencePage() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon &middot; Brand Presence Optimization</span>
          <h1 className={styles.title}>
            Brand Presence <span className="accent-text">Optimization.</span>
          </h1>
          <p className={styles.intro}>
            <em>If your listings aren&apos;t converting, you&apos;re handing revenue to your competitors.</em>
          </p>
          <p className={styles.subtitle}>
            Your brand&apos;s Amazon listings are being seen by thousands of shoppers every day — and if they&apos;re not converting, you&apos;re handing revenue to your competitors on a silver platter. BEAUTYBOXMEDIA rebuilds your product presence from the ground up: keyword-engineered titles, benefit-driven copy, A+ content that tells your brand&apos;s story, and product imagery that communicates premium quality in under two seconds on mobile. For CMOs and Brand Directors who&apos;ve worked hard to build a brand, we make sure Amazon reflects it accurately. A fully designed Storefront and a brand story module complete the picture — turning a fragmented catalog into a cohesive brand destination that earns trust and drives repeat purchase.
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
                  <li>Keyword-engineered titles &amp; bullet points</li>
                  <li>Benefit-driven product copy</li>
                  <li>A+ Content design &amp; copywriting</li>
                  <li>Product imagery consultation</li>
                  <li>Brand Storefront design</li>
                  <li>Brand Story module</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>
                  CMOs and Brand Directors who want their Amazon presence to reflect the quality of their brand.
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
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
