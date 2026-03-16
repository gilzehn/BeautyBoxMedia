import Hero from '@/components/Hero';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Hero />

      {/* What We Do */}
      <section id="what-we-do" className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            What We <span className="accent-text">Do</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto 64px' }}>
            From content creation to full brand strategy, we make your vision perform.
          </p>

          <div className={styles.zigzag}>
            <div className={styles.zigzagRow}>
              <div className={styles.zigzagImage}>
                <Image src="/img-marketplaces.png" alt="Amazon Marketplace Services" width={600} height={450} className={styles.zigzagImg} />
              </div>
              <div className={styles.zigzagContent}>
                <span className={styles.zigzagLabel}>Amazon &amp; Beyond</span>
                <h3 className={styles.zigzagTitle}>Marketplaces</h3>
                <p className={styles.zigzagDesc}>
                  Your brand deserves more than a listing. It deserves a strategy. We help beauty and fashion brands launch, optimize, and scale on Amazon and other major marketplaces with data-driven precision. We build a clear, consistent strategy and execute it across every layer of your Amazon business so your brand takes more market share.
                </p>
                <Link href="/services/marketplaces" className={styles.zigzagLink}>
                  Learn More &rarr;
                </Link>
              </div>
            </div>

            <div className={`${styles.zigzagRow} ${styles.zigzagRowReverse}`}>
              <div className={styles.zigzagImage}>
                <Image src="/img-dtc.png" alt="Direct-to-Consumer Services" width={600} height={450} className={styles.zigzagImg} />
              </div>
              <div className={styles.zigzagContent}>
                <span className={styles.zigzagLabel}>Shopify &amp; Web</span>
                <h3 className={styles.zigzagTitle}>Direct-to-Consumer</h3>
                <p className={styles.zigzagDesc}>
                  Be found by the customers already looking for you. We build cohesive Google strategies, paid search, SEO, lifecycle marketing, and creator partnerships that drive profitable D2C growth.
                </p>
                <Link href="/services/dtc" className={styles.zigzagLink}>
                  Learn More &rarr;
                </Link>
              </div>
            </div>

            <div className={styles.zigzagRow}>
              <div className={styles.zigzagImage}>
                <Image src="/img-growth-data.png" alt="Growth and Data Services" width={600} height={450} className={styles.zigzagImg} />
              </div>
              <div className={styles.zigzagContent}>
                <span className={styles.zigzagLabel}>Cross-Platform</span>
                <h3 className={styles.zigzagTitle}>Growth &amp; Data Layer</h3>
                <p className={styles.zigzagDesc}>
                  Data-powered growth across every channel. We connect the dots between platforms with audience targeting, performance reporting, and attribution modeling that maximizes your marketing ROI.
                </p>
                <Link href="/services/growth-data" className={styles.zigzagLink}>
                  Learn More &rarr;
                </Link>
              </div>
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
            Let&apos;s talk about your brand.
          </p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Schedule a Call
          </Link>
        </div>
      </section>
    </>
  );
}
