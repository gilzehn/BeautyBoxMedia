import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export default function About() {
  return (
    <>
      {/* Page Header */}
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Our Story</span>
          <h1 className={styles.title}>
            We Don&apos;t Just Know Beauty.
            <span className="accent-text"> We&apos;ve Lived It.</span>
          </h1>
        </div>
      </section>

      {/* Meet the Founders */}
      <section className="section">
        <div className="container">
          <div className={styles.foundersIntro}>
            <span className={styles.sectionLabel}>Meet the Founders</span>
            <h2 className={styles.foundersName}>Regina Tseikhin &amp; Mariann Marinberg</h2>
          </div>

          <div className={styles.founders}>
            <div className={styles.founderPhotos}>
              <div className={styles.imagePlaceholder}>
                <Image src="/Regina.jpeg" alt="Regina Tseikhin" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className={styles.imagePlaceholder}>
                <Image src="/Mariann.jpeg" alt="Mariann Marinberg" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>

            <div className={styles.founderBio}>
              <p>
                Regina and Mariann are sisters who have spent over 20 years building, scaling, and selling luxury beauty and fashion brands at the highest commercial level. They built retail stores from the ground up, mastered the art of selling premium brands online, and became two of the most respected operators in the Amazon luxury space long before most agencies knew it existed. Their expertise spans the full beauty and fashion landscape, skincare, cosmetics, fragrance, and fashion, each category mastered at the luxury level over two decades of hands-on operation.
              </p>
              <p>
                They are the founders and operators of The Beauty Box Inc, an actively operating company that acquires, resells, and manages qualified luxury beauty and fashion brands at the highest commercial level. They are not former operators who moved into consulting. They are active brand owners and resellers who built an agency because they saw exactly what the market was missing. Every strategy BEAUTYBOXMEDIA builds is informed by decisions Regina and Mariann are making in their own business today, with their own capital at risk.
              </p>
              <p>
                Their approach to every brand is the same. They see the full commercial picture. The margin implications of every creative decision. The brand equity cost of every pricing move. The long-term revenue consequence of every platform strategy. When they sit across the table from a CMO or founder they are not pitching services. They are solving a business problem with the authority of people who have solved the same problems themselves, at scale, with real stakes.
              </p>
              <p>
                Over two decades they have carefully assembled a team of specialists and platform experts who are the best in the beauty and fashion space. Every person in the BEAUTYBOXMEDIA network was personally selected by Regina and Mariann because they meet one standard: exceptional expertise in this specific category. Not generalists. Not borrowed talent. The right people, chosen for the right reasons, accountable to the same level of excellence that Regina and Mariann have held themselves to throughout their careers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why BEAUTYBOXMEDIA */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <span className={styles.sectionLabel}>Why BEAUTYBOXMEDIA</span>
          <h2 className={styles.whyTitle}>
            This Is All We Do. <span className="accent-text">By Design.</span>
          </h2>
          <p className={styles.whyText}>
            BEAUTYBOXMEDIA works exclusively in beauty and fashion. Not as a specialty practice within a larger agency, but as the entire focus of everything we do. Every service we offer, every team member we hire, and every strategy we build is designed specifically for this category. That level of focus means your brand is never being handled by someone learning your industry on your budget. You get specialists who live and breathe beauty and fashion every single day, backed by founders who have been operating in it for over two decades.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Work With People Who Actually Get It?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s talk about your brand.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Schedule a Call
          </Link>
        </div>
      </section>
    </>
  );
}
