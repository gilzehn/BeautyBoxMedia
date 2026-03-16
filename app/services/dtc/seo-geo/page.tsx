import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function SeoGeo() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C &middot; SEO &amp; Generative Engine Optimization</span>
          <h1 className={styles.title}>
            SEO &amp; Generative Engine <span className="accent-text">Optimization.</span>
          </h1>
          <p className={styles.intro}>
            <em>Paid media drives fast results. SEO builds the kind of channel equity that keeps compounding.</em>
          </p>
          <p className={styles.subtitle}>BEAUTYBOXMEDIA invests in both — and we go further than any standard SEO agency by optimizing your brand for the AI-powered discovery engines that are rapidly reshaping how consumers find products. GEO (Generative Engine Optimization) structures your site&apos;s content and data so that tools like Perplexity and SearchGPT extract, understand, and recommend your brand when users ask for beauty solutions. For CMOs thinking beyond the next quarter, this is the long-term brand infrastructure that protects your visibility regardless of how search evolves. Technical SEO, E-E-A-T authority building, and expert-led Beauty Content Hubs complete the picture.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>Technical SEO audit &amp; implementation</li>
                  <li>E-E-A-T authority building</li>
                  <li>GEO content structuring for AI discovery</li>
                  <li>Beauty Content Hub strategy</li>
                  <li>Perplexity &amp; SearchGPT optimization</li>
                  <li>Ongoing rank tracking &amp; reporting</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>CMOs thinking beyond the next quarter who want long-term brand visibility infrastructure.</p>
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
