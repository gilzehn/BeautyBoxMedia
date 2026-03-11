import styles from './page.module.css';

const caseStudies = [
  {
    brand: 'Brand Name',
    category: 'Marketplaces',
    title: 'Scaling a Beauty Brand to 7 Figures on Amazon',
    description: 'We developed a full marketplace strategy including listing optimization, advertising management, and brand store design — resulting in significant revenue growth within the first 12 months.',
    stats: [
      { label: 'Revenue Growth', value: '+320%' },
      { label: 'ROAS', value: '5.2x' },
    ],
  },
  {
    brand: 'Brand Name',
    category: 'Direct-to-Consumer',
    title: 'Launching a Shopify Store That Converts',
    description: 'From zero to a high-converting D2C storefront. We handled brand strategy, paid media, and lifecycle email — building a profitable acquisition engine from day one.',
    stats: [
      { label: 'Conversion Rate', value: '4.8%' },
      { label: 'Email Revenue', value: '+210%' },
    ],
  },
  {
    brand: 'Brand Name',
    category: 'Growth & Data',
    title: 'Cutting CPA in Half with Data-Driven Targeting',
    description: 'By rebuilding audience segments and implementing multi-touch attribution, we dramatically reduced customer acquisition costs while scaling ad spend across platforms.',
    stats: [
      { label: 'CPA Reduction', value: '-52%' },
      { label: 'Ad Spend Scaled', value: '3x' },
    ],
  },
  {
    brand: 'Brand Name',
    category: 'Marketplaces',
    title: 'Turning Around a Struggling Amazon Account',
    description: 'A complete account audit and strategic overhaul — from suppressed listings and wasted ad spend to optimized operations and consistent month-over-month growth.',
    stats: [
      { label: 'Sales Recovery', value: '+180%' },
      { label: 'ACoS Reduction', value: '-38%' },
    ],
  },
  {
    brand: 'Brand Name',
    category: 'Direct-to-Consumer',
    title: 'Building a Community-Driven Beauty Brand',
    description: 'We paired influencer and creator marketing with a robust social strategy to build an engaged community that drives organic growth and repeat purchases.',
    stats: [
      { label: 'Social Following', value: '+450%' },
      { label: 'Repeat Purchase Rate', value: '42%' },
    ],
  },
];

export default function CaseStudies() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Our Work</span>
          <h1 className={styles.title}>
            Case <span className="accent-text">Studies</span>
          </h1>
          <p className={styles.subtitle}>
            Real results for real beauty brands. Here&apos;s how we&apos;ve helped
            our clients grow.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            {caseStudies.map((study, i) => (
              <div key={i} className={styles.row}>
                <div className={styles.left}>
                  <div className={styles.brandCard}>
                    <span className={styles.category}>{study.category}</span>
                    <h3 className={styles.brand}>{study.brand}</h3>
                    <div className={styles.stats}>
                      {study.stats.map((stat) => (
                        <div key={stat.label} className={styles.stat}>
                          <span className={styles.statValue}>{stat.value}</span>
                          <span className={styles.statLabel}>{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.right}>
                  <h2 className={styles.studyTitle}>{study.title}</h2>
                  <p className={styles.studyDesc}>{study.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
