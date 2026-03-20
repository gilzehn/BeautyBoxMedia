import ContactButton from '@/components/ContactButton';
import styles from '../page.module.css';

export default function BrandOnboarding() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon Services</span>
          <h1 className={styles.title}>
            Amazon Brand <span className="accent-text">Onboarding.</span>
          </h1>
          <p className={styles.subtitle}>
            Your brand is already winning online or in retail. Now it is time to own Amazon too. We take your brand from zero to fully operational on Amazon, built from scratch, aligned to your brand book, and set up to compete from day one.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We handle everything. Every decision we make is informed by deep competitive research specific to your category so your brand does not just show up on Amazon, it shows up better than everyone else. You get a complete, professional Amazon presence that reflects the brand equity you have already built and positions it to take market share immediately. No learning curve. No costly setup mistakes. Just a clean, compliant, conversion-ready Amazon business built to your standards.
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
                  <li>Amazon Seller Central account setup and brand registry</li>
                  <li>Brand book review and Amazon brand guidelines alignment</li>
                  <li>Full catalog setup and product listing creation</li>
                  <li>A+ content design and copy</li>
                  <li>Amazon Storefront design and build</li>
                  <li>Backend attribute configuration and keyword indexation</li>
                  <li>FBA shipment setup and logistics configuration</li>
                  <li>Policy and compliance review</li>
                  <li>Competitive research and category positioning</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  Established beauty and fashion brands selling successfully through their own website or retail channels that are ready to add Amazon as a new revenue stream. Founders who want Amazon done right the first time. CMOs who need a new channel launched without disrupting the core business.
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
            Start Your Onboarding
          </ContactButton>
        </div>
      </section>
    </>
  );
}
