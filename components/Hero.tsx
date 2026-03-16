import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <span className={styles.tagline}>Digital Media Agency for Beauty Brands</span>
        <h1 className={styles.title}>
          Your Brand,
          <span className={styles.titleAccent}>Beautifully Bold.</span>
        </h1>
        <p className={styles.subtitle}>
          The beauty and fashion brands winning on Amazon, Google, and Meta
          aren&apos;t guessing. They have the right partner.
        </p>
        <div className={styles.buttons}>
          <Link href="/services" className="btn btn-primary">
            Our Services
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Get in Touch
          </Link>
        </div>
      </div>

      <div className={styles.logoStrip}>
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
  );
}
