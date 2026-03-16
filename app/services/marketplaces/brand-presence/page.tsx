import Link from 'next/link';
import styles from '../page.module.css';

export default function BrandPresence() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon Services</span>
          <h1 className={styles.title}>
            Brand Presence <span className="accent-text">Optimization.</span>
          </h1>
          <p className={styles.subtitle}>
            Your Amazon listings are being seen by thousands of shoppers every day. If they are not converting at the rate your brand deserves, you are leaving revenue on the table and handing it directly to your competitors. We rebuild your entire Amazon presence from the ground up so every touchpoint reflects your brand accurately and converts with consistency.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We start with deep keyword and competitor research to identify the highest-leverage opportunities in your category. From there we rebuild every element of your product pages and brand presence. For CMOs and Brand Directors who have invested years building a brand, we make sure Amazon reflects every bit of that investment and converts it into revenue.
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
                  <li>Keyword and competitor research</li>
                  <li>Title copywriting and optimization</li>
                  <li>Bullet point copywriting</li>
                  <li>Product image design and copy</li>
                  <li>A+ content design and copy</li>
                  <li>Brand story creation</li>
                  <li>Amazon Storefront design and build</li>
                  <li>Backend product enrichment and keyword indexation</li>
                  <li>Video implementation</li>
                  <li>SEO and organic visibility optimization</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  Brands already on Amazon with listings that are underperforming. CMOs and Brand Directors who know their Amazon presence does not reflect the quality of their brand. Founders who have launched on Amazon but are not seeing the conversion rates they expected. Any brand preparing for a major sales event like Prime Day or Black Friday.
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
            Optimize Your Brand Presence
          </Link>
        </div>
      </section>
    </>
  );
}
