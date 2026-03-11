import styles from './page.module.css';

const team = [
  {
    name: 'Team Member',
    role: 'Founder & CEO',
    bio: 'A visionary leader with a passion for beauty and digital innovation. With years of experience in the industry, they drive the creative direction and strategic growth of Beauty Box Media.',
    image: '/team-placeholder.svg',
  },
  {
    name: 'Team Member',
    role: 'Head of Strategy',
    bio: 'A data-driven strategist who transforms insights into action. They specialize in building scalable growth frameworks for beauty brands across marketplaces and direct-to-consumer channels.',
    image: '/team-placeholder.svg',
  },
  {
    name: 'Team Member',
    role: 'Creative Director',
    bio: 'The creative force behind every campaign. From brand identity to content production, they bring bold ideas to life with an eye for design and a deep understanding of the beauty space.',
    image: '/team-placeholder.svg',
  },
  {
    name: 'Team Member',
    role: 'Head of Advertising',
    bio: 'A performance marketing expert who maximizes every dollar spent. They manage paid media across platforms, optimizing campaigns to deliver measurable results for beauty brands.',
    image: '/team-placeholder.svg',
  },
];

export default function About() {
  return (
    <>
      {/* Page Header */}
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Who We Are</span>
          <h1 className={styles.title}>
            Meet the <span className="accent-text">Team</span>
          </h1>
          <p className={styles.subtitle}>
            We&apos;re a team of strategists, creatives, and data enthusiasts
            dedicated to growing beauty brands in the digital space.
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="section">
        <div className="container">
          <div className={styles.team}>
            {team.map((member, i) => (
              <div
                key={i}
                className={`${styles.member} ${i % 2 !== 0 ? styles.memberReverse : ''}`}
              >
                <div className={styles.imageWrap}>
                  <div className={styles.imagePlaceholder}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
                <div className={styles.bio}>
                  <span className={styles.role}>{member.role}</span>
                  <h2 className={styles.name}>{member.name}</h2>
                  <p className={styles.bioText}>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
