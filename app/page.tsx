import Hero from '@/components/Hero';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Hero />

      {/* Client Logos */}
      <section className={styles.logoStrip}>
        <div className="container">
          <p className={styles.logoLabel}>Trusted by leading beauty brands</p>
          <div className={styles.logoTrack}>
            <div className={styles.logoSlide}>
              {[...Array(2)].map((_, i) => (
                <div key={i} className={styles.logoSet}>
                  <span className={styles.logoPlaceholder}>Brand Logo</span>
                  <span className={styles.logoPlaceholder}>Brand Logo</span>
                  <span className={styles.logoPlaceholder}>Brand Logo</span>
                  <span className={styles.logoPlaceholder}>Brand Logo</span>
                  <span className={styles.logoPlaceholder}>Brand Logo</span>
                  <span className={styles.logoPlaceholder}>Brand Logo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            What We <span className="accent-text">Do</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto 64px' }}>
            Full-service growth for beauty and fashion brands — across every platform that matters.
          </p>

          <div className={styles.platformGrid}>
            <div className={styles.platformCard}>
              <div className={styles.platformIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
              </div>
              <span className={styles.platformLabel}>Amazon &amp; Beyond</span>
              <h3 className={styles.platformTitle}>Marketplaces</h3>
              <p className={styles.platformDesc}>
                Your brand deserves more than a listing — it deserves a strategy. We help beauty brands launch, optimize, and scale on Amazon with data-driven precision, from market research and brand optimization to full account management.
              </p>
              <Link href="/services/marketplaces" className={styles.platformLink}>
                Learn More &rarr;
              </Link>
            </div>

            <div className={styles.platformCard}>
              <div className={styles.platformIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <span className={styles.platformLabel}>Shopify &amp; Web</span>
              <h3 className={styles.platformTitle}>Direct-to-Consumer</h3>
              <p className={styles.platformDesc}>
                Be found by the customers already looking for you. We build cohesive Google strategies — paid search, SEO, lifecycle marketing, and creator partnerships — that drive profitable D2C growth.
              </p>
              <Link href="/services/dtc" className={styles.platformLink}>
                Learn More &rarr;
              </Link>
            </div>

            <div className={styles.platformCard}>
              <div className={styles.platformIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <span className={styles.platformLabel}>Cross-Platform</span>
              <h3 className={styles.platformTitle}>Growth &amp; Data Layer</h3>
              <p className={styles.platformDesc}>
                Data-powered growth across every channel. We connect the dots between platforms with audience targeting, performance reporting, and attribution modeling that maximizes your marketing ROI.
              </p>
              <Link href="/services/growth-data" className={styles.platformLink}>
                Learn More &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>
            Ready to Elevate Your Brand?
          </h2>
          <p className={styles.ctaSubtitle}>
            Let&apos;s create something beautiful together.
          </p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started Today
          </Link>
        </div>
      </section>
    </>
  );
}
