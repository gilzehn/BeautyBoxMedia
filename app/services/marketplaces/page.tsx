import Link from 'next/link';
import styles from './page.module.css';

const services = [
  {
    id: 'market-feasibility',
    title: 'Market Feasibility & Strategic Research',
    description: 'Smart executives don\'t commit capital without data — and neither do we. Before your brand takes a single step on Amazon, BEAUTYBOXMEDIA delivers a complete market feasibility study that maps the real opportunity in your category: demand size, competitive intensity, pricing benchmarks, and profit margins. We surface the gaps your competitors haven\'t found yet and the landmines they\'ve already stepped on. Whether you\'re a VP of Business Development evaluating Amazon as a new channel or a founder ready to scale, this research gives your team the clarity to move fast and invest smart. You\'ll receive a full visual PDF report with an executive summary and a clear, actionable launch roadmap your entire leadership team can align on.',
  },
  {
    id: 'brand-presence',
    title: 'Brand Presence Optimization',
    description: 'Your brand\'s Amazon listings are being seen by thousands of shoppers every day — and if they\'re not converting, you\'re handing revenue to your competitors on a silver platter. BEAUTYBOXMEDIA rebuilds your product presence from the ground up: keyword-engineered titles, benefit-driven copy, A+ content that tells your brand\'s story, and product imagery that communicates premium quality in under two seconds on mobile. For CMOs and Brand Directors who\'ve worked hard to build a brand, we make sure Amazon reflects it accurately. A fully designed Storefront and a brand story module complete the picture — turning a fragmented catalog into a cohesive brand destination that earns trust and drives repeat purchase.',
  },
  {
    id: 'advertising-mgmt',
    title: 'Advertising Management',
    description: 'Amazon PPC without a strategy is the fastest way to waste your marketing budget. BEAUTYBOXMEDIA builds structured, scalable advertising programs across Sponsored Products, Sponsored Brands, and Sponsored Display — then manages them daily to protect your margins and maximize your return. For business owners and CMOs accountable to revenue targets, we track the metrics that matter: ACoS, ROAS, revenue contribution, and organic rank lift driven by advertising investment. You\'ll receive weekly performance summaries and monthly strategic reports that your leadership team can actually use. We treat your ad spend the same way we\'d treat our own: with discipline, urgency, and a constant bias toward efficiency.',
  },
  {
    id: 'account-mgmt',
    title: 'Full Account Management',
    description: 'For brand owners and operators who want Amazon fully handled — this is the service. BEAUTYBOXMEDIA takes complete ownership of your Amazon business: catalog management, inventory coordination, technical issue resolution, policy compliance, advertising, and reporting. We function as a dedicated extension of your team, embedded in your account and accountable to your growth targets. Founders and CMOs who work with us stop worrying about Amazon and start seeing it as the revenue engine it should be. There\'s no operational detail too small and no strategic challenge too large — we own it all so you can stay focused on building the brand.',
  },
  {
    id: 'consulting',
    title: 'Consulting & Advisory',
    description: 'Sometimes the highest-value move isn\'t a full retainer — it\'s the right conversation with the right expert at the right time. BEAUTYBOXMEDIA\'s consulting service gives business owners, CMOs, and BizDev leaders direct access to senior Amazon strategists who have seen what works across dozens of beauty and fashion categories. Whether you need a rapid account audit, a second opinion on your launch strategy, or on-demand tactical guidance during a critical growth moment, we\'re available on a flexible hourly or prepaid block basis. No junior account managers. No templated advice. Just senior-level thinking applied directly to your specific challenge.',
  },
];

export default function Marketplaces() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon &amp; Beyond</span>
          <h1 className={styles.title}>
            Marketplace Services <span className="accent-text">Breakdown.</span>
          </h1>
          <p className={styles.intro}>
            <em>Your brand deserves more than a listing. It deserves a strategy.</em>
          </p>
          <p className={styles.subtitle}>
            If you&apos;re a CMO, Brand Director, or business owner in the beauty or fashion space, you already know Amazon isn&apos;t optional — it&apos;s where your customers are shopping, your competitors are scaling, and market share is being won or lost every single day. The question isn&apos;t whether to be on Amazon. It&apos;s whether you have the right partner to compete at the level your brand demands. BEAUTYBOXMEDIA is that partner.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            {services.map((service, i) => (
              <div key={i} id={service.id} className={styles.item}>
                <div className={styles.number}>0{i + 1}</div>
                <div className={styles.content}>
                  <h2 className={styles.itemTitle}>{service.title}</h2>
                  <p className={styles.itemDesc}>{service.description}</p>
                  <Link href="/contact" className={styles.learnMore}>
                    Learn More &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Own the Marketplace?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build your Amazon growth strategy.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
