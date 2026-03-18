import Link from 'next/link';
import Image from 'next/image';
import styles from './Hero.module.css';

const logos = [
  { src: '/logos/brush-clean-pro.svg', alt: 'Brush Clean PRO' },
  { src: '/logos/chaun-legend.svg', alt: 'Chaun Legend' },
  { src: '/logos/cosmedica.svg', alt: 'Cosmedica' },
  { src: '/logos/demeter.svg', alt: 'Demeter' },
  { src: '/logos/govino.svg', alt: 'Govino' },
  { src: '/logos/glimmer-goddess.svg', alt: 'Glimmer Goddess' },
  { src: '/logos/kai.svg', alt: 'Kai' },
  { src: '/logos/lifefactory.svg', alt: 'Lifefactory' },
  { src: '/logos/nina-ibrow.svg', alt: 'Nina Ibrow' },
  { src: '/logos/water-colors.svg', alt: 'Water Colors' },
];

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
                {logos.map((logo, j) => (
                  <Image
                    key={j}
                    src={logo.src}
                    alt={logo.alt}
                    width={140}
                    height={48}
                    className={styles.logoImg}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
