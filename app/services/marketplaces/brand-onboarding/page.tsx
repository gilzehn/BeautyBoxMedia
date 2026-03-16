import Link from 'next/link';
import styles from '../page.module.css';

export default function BrandOnboardingPage() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon &middot; Brand Onboarding</span>
          <h1 className={styles.title}>
            Amazon Brand <span className="accent-text">Onboarding.</span>
          </h1>
          <p className={styles.intro}>
            <em>Get your brand live on Amazon — the right way, the first time.</em>
          </p>
          <p className={styles.subtitle}>
            Launching on Amazon involves dozens of moving parts that can delay or derail even the most promising brands. BEAUTYBOXMEDIA handles the complete onboarding process: Seller Central or Vendor Central setup, brand registry enrollment, ASIN creation, catalog structuring, and compliance review. We ensure your brand is properly configured from day one — avoiding the costly mistakes that slow down launches and create operational headaches down the road.
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
                  <li>Seller Central or Vendor Central account setup</li>
                  <li>Brand Registry enrollment</li>
                  <li>ASIN creation &amp; catalog structuring</li>
                  <li>Compliance &amp; policy review</li>
                  <li>Launch readiness audit</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>
                  Beauty and fashion brands launching on Amazon for the first time or migrating to a new account structure.
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
