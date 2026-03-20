import ContactButton from '@/components/ContactButton';
import styles from '../../marketplaces/page.module.css';

export default function EmailLifecycle() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C Services</span>
          <h1 className={styles.title}>
            Lifecycle &amp; Email <span className="accent-text">Marketing.</span>
          </h1>
          <p className={styles.subtitle}>
            The most profitable customer you can acquire is the one you already have. Most beauty brands are dramatically undermonetizing their existing database and leaving significant revenue on the table every single month. We build intelligent email and SMS systems that turn your customer list into your highest-returning marketing channel.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We design and implement automated flows that capture revenue at every drop-off point in the customer journey, from the first visit to the fifth purchase. Deep segmentation by skin concern, purchase behavior, and product preference ensures every message feels personal and relevant, not broadcast. Seasonal campaigns for Black Friday, Mother&apos;s Day, and product launches are planned and executed with precision. For CMOs focused on LTV and payback period, lifecycle marketing consistently delivers some of the highest returns in the entire marketing mix without adding a single dollar to your acquisition spend.
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
                  <li>Welcome series automation</li>
                  <li>Abandoned cart and checkout recovery flows</li>
                  <li>Post-purchase education and upsell sequences</li>
                  <li>Win-back and lapsed customer re-engagement flows</li>
                  <li>Segmentation by skin type, concern, purchase history, and product preference</li>
                  <li>Black Friday, Mother&apos;s Day, and seasonal campaign execution</li>
                  <li>Monthly product spotlight campaigns</li>
                  <li>SMS marketing setup and automation</li>
                  <li>A/B testing of subject lines, content, and send timing</li>
                  <li>List health management and deliverability optimization</li>
                  <li>Monthly performance reporting with revenue attribution</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  CMOs focused on improving LTV and reducing payback period. Brands with a growing customer database that is not being fully monetized. Business owners who want to increase revenue without increasing ad spend. Any brand that has basic email flows in place but knows they are not performing at their full potential.
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
            Unlock Your Lifecycle Revenue
          </ContactButton>
        </div>
      </section>
    </>
  );
}
