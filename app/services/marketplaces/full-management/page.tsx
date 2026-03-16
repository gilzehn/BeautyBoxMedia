import Link from 'next/link';
import styles from '../page.module.css';

export default function FullManagement() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon Services</span>
          <h1 className={styles.title}>
            Full Account <span className="accent-text">Management.</span>
          </h1>
          <p className={styles.subtitle}>
            Running a brand on Amazon is a full-time operation. Catalog management, inventory coordination, policy compliance, technical issue resolution, advertising, and reporting all demand constant attention. We take complete ownership of every layer so your leadership team can stay focused on building the brand.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We function as a fully embedded extension of your team, accountable to your growth targets and operating with the same urgency and discipline you expect from your best internal hire. We set a clear strategy from day one and execute it consistently across every layer of your Amazon business. Founders and CMOs who work with us stop firefighting the platform and start treating Amazon as the high-performing revenue channel it should be.
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
                  <li>Complete catalog management and maintenance</li>
                  <li>Listing creation, optimization, and ongoing updates</li>
                  <li>FBA inventory coordination and shipment management</li>
                  <li>Listing health and policy compliance monitoring</li>
                  <li>Technical issue resolution and case management with Amazon Seller Support</li>
                  <li>Full advertising management across Sponsored Products, Sponsored Brands, and Sponsored Display</li>
                  <li>Brand presence maintenance and updates</li>
                  <li>Weekly and monthly performance reporting</li>
                  <li>Dedicated senior account strategist</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  Founders and business owners who want Amazon completely off their plate. CMOs managing a large beauty or fashion catalog who need a dedicated agency partner. Brands scaling rapidly who need operational infrastructure that grows with them. Any brand that has experienced the cost of managing Amazon without the right team in place.
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
            Get Full Management
          </Link>
        </div>
      </section>
    </>
  );
}
