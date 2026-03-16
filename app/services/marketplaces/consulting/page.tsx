import Link from 'next/link';
import styles from '../page.module.css';

export default function Consulting() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon Services</span>
          <h1 className={styles.title}>
            Consulting &amp; <span className="accent-text">Advisory.</span>
          </h1>
          <p className={styles.subtitle}>
            Not every brand needs a full retainer. Sometimes the highest-value move is the right conversation with the right expert at the right moment. Our consulting service gives business owners, CMOs, and BizDev leaders direct access to senior Amazon strategists who have built and scaled beauty and fashion brands across every major category on the platform.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            Whether you need a rapid account audit, a second opinion on your launch strategy, a pricing review, or on-demand guidance during a critical growth moment, we are available on a flexible hourly or prepaid block basis. Every session is led by a senior strategist, not a junior account manager. You get direct answers, clear recommendations, and a plan you can act on immediately. No generic playbooks. No wasted time. Just focused expertise applied directly to your specific challenge, on your timeline.
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
                  <li>Initial strategy session to understand your brand, goals, and current Amazon challenges</li>
                  <li>Account or listing audit with detailed findings and specific recommendations</li>
                  <li>Competitive landscape review for your category</li>
                  <li>Clear action plan with prioritized next steps</li>
                  <li>Follow up session to review progress and adjust direction</li>
                  <li>Available on hourly or prepaid block basis</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  Business owners and founders who want expert input before making a major Amazon decision. CMOs evaluating Amazon as a new channel. BizDev leaders who need a strategic second opinion. Brands that have tried Amazon before and want to understand what went wrong and how to fix it.
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
            Schedule a Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
