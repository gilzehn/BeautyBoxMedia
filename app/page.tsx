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

      {/* Services Preview */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="section-title">
            What We <span className="accent-text">Do</span>
          </h2>
          <p className="section-subtitle" style={{ marginBottom: '48px' }}>
            From content creation to full brand strategy, we bring your vision to life.
          </p>

          <div className={styles.servicesGrid}>
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>&#9733;</div>
              <h3 className={styles.serviceTitle}>Social Media Management</h3>
              <p className={styles.serviceDesc}>
                Strategic content planning, scheduling, and community management
                across all major platforms.
              </p>
            </div>

            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>&#9830;</div>
              <h3 className={styles.serviceTitle}>Content Creation</h3>
              <p className={styles.serviceDesc}>
                Eye-catching visuals, videos, and graphics that tell your brand
                story and engage your audience.
              </p>
            </div>

            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>&#9827;</div>
              <h3 className={styles.serviceTitle}>Brand Strategy</h3>
              <p className={styles.serviceDesc}>
                Comprehensive brand development from identity design to
                go-to-market positioning.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/services" className="btn btn-outline">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Why <span className="accent-text">Choose Us</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
            We&apos;re passionate about helping brands shine in the digital world.
          </p>

          <div className={styles.whyGrid}>
            <div className={styles.whyItem}>
              <h3 className={styles.whyNumber}>01</h3>
              <h4 className={styles.whyTitle}>Results-Driven</h4>
              <p className={styles.whyDesc}>
                Every strategy is backed by data and designed to deliver measurable growth.
              </p>
            </div>

            <div className={styles.whyItem}>
              <h3 className={styles.whyNumber}>02</h3>
              <h4 className={styles.whyTitle}>Creative Excellence</h4>
              <p className={styles.whyDesc}>
                Bold, beautiful content that stops the scroll and captures attention.
              </p>
            </div>

            <div className={styles.whyItem}>
              <h3 className={styles.whyNumber}>03</h3>
              <h4 className={styles.whyTitle}>Personal Touch</h4>
              <p className={styles.whyDesc}>
                We treat every brand as unique, crafting tailored solutions that fit your vision.
              </p>
            </div>

            <div className={styles.whyItem}>
              <h3 className={styles.whyNumber}>04</h3>
              <h4 className={styles.whyTitle}>Always On</h4>
              <p className={styles.whyDesc}>
                Dedicated support and transparent communication every step of the way.
              </p>
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
