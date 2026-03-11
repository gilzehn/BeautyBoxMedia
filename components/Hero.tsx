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
          We craft stunning digital experiences that captivate your audience
          and elevate your brand to new heights.
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
    </section>
  );
}
