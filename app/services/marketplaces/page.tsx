import Link from 'next/link';
import styles from './page.module.css';

const services = [
  {
    slug: 'consulting',
    title: 'Consulting & Advisory',
    description: 'Sometimes the highest-value move isn\'t a full retainer, it\'s the right conversation with the right expert at the right time. Our consulting service gives business owners, CMOs, and BizDev leaders direct access to senior Amazon strategists who have built and scaled beauty and fashion brands across every major category on the platform. Whether you need a rapid account audit, a second opinion on your launch strategy, or on-demand guidance during a critical growth moment, we are available on a flexible hourly or prepaid block basis.',
  },
  {
    slug: 'market-feasibility',
    title: 'Market Feasibility & Strategic Research',
    description: 'Before your brand commits a single dollar to Amazon, you need to know exactly what you are walking into. Our market feasibility study gives your leadership team a complete, data-backed picture of the opportunity in your category so every decision is built on evidence, not assumptions. We analyze your category from every angle and surface the gaps your competitors have not found yet and the risks they have already fallen into.',
  },
  {
    slug: 'brand-onboarding',
    title: 'Amazon Brand Onboarding',
    description: 'Your brand is already winning online or in retail. Now it is time to own Amazon too. We take your brand from zero to fully operational on Amazon, built from scratch, aligned to your brand book, and set up to compete from day one. Every decision we make is informed by deep competitive research specific to your category so your brand does not just show up on Amazon, it shows up better than everyone else.',
  },
  {
    slug: 'brand-presence',
    title: 'Brand Presence Optimization',
    description: 'Your brand\'s Amazon listings are being seen by thousands of shoppers every day and if they are not converting, you are handing revenue to your competitors. We rebuild your entire Amazon presence from the ground up so every touchpoint reflects your brand accurately and converts with consistency. For CMOs and Brand Directors who have invested years building a brand, we make sure Amazon reflects every bit of that investment.',
  },
  {
    slug: 'advertising',
    title: 'Advertising Management',
    description: 'Amazon advertising without a clear strategy is the fastest way to burn through your marketing budget. We build structured, scalable advertising programs that protect your margins, grow your revenue, and compound your organic ranking over time. Every dollar is tracked against the metrics that matter to your business and every decision is made with discipline and urgency.',
  },
  {
    slug: 'full-management',
    title: 'Full Account Management',
    description: 'Running a brand on Amazon is a full-time operation. We take complete ownership of every layer so your leadership team can stay focused on building the brand. We function as a fully embedded extension of your team, accountable to your growth targets and operating with the same urgency and discipline you expect from your best internal hire.',
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
            If you&apos;re a CMO, Brand Director, or business owner in the beauty or fashion space, you already know Amazon isn&apos;t optional. It&apos;s where your customers are shopping, your competitors are scaling, and market share is being won or lost every single day. The question isn&apos;t whether to be on Amazon. It&apos;s whether you have the right partner to compete at the level your brand demands.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            {services.map((service, i) => (
              <div key={i} className={styles.item}>
                <div className={styles.number}>0{i + 1}</div>
                <div className={styles.content}>
                  <h2 className={styles.itemTitle}>{service.title}</h2>
                  <p className={styles.itemDesc}>{service.description}</p>
                  <Link href={`/services/marketplaces/${service.slug}`} className={styles.learnMore}>
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
            Schedule a Call
          </Link>
        </div>
      </section>
    </>
  );
}
