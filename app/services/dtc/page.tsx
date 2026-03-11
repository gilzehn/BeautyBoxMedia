import Link from 'next/link';
import styles from '../marketplaces/page.module.css';

const services = [
  {
    id: 'dtc-research',
    title: 'Market Feasibility & Strategic Research',
    description: 'Before your team allocates a single dollar to Google, you need to know exactly what the competitive landscape looks like — and where the real opportunity is. BEAUTYBOXMEDIA delivers a comprehensive research package covering high-intent keyword opportunities, seasonal demand patterns, competitor backlink and content strategies, and technical benchmarks your site needs to beat. We go beyond traditional SEO research by analyzing how AI answer engines like ChatGPT and Gemini currently categorize brands in your category — a critical insight for any CMO thinking about long-term discoverability. For BizDev leaders evaluating Google as a growth channel, this study provides the data-backed foundation your investment decisions deserve.',
  },
  {
    id: 'paid-search',
    title: 'Paid Search & Social Campaign Management',
    description: 'Google Ads done right is one of the highest-ROI channels available to beauty and fashion brands — but only when the strategy, structure, and daily management are all dialed in. BEAUTYBOXMEDIA manages the full Google paid media stack: Search campaigns capturing high-intent shoppers at the moment of decision, Shopping and Performance Max campaigns built to outperform category benchmarks, and YouTube ads that reach beauty audiences while brand preferences are still forming. Every campaign is measured against MER and LTV — not just clicks and impressions — because CMOs and CFOs need to understand what the spend is actually building. You\'ll always know exactly where your budget is going and exactly what it\'s returning.',
  },
  {
    id: 'seo-geo',
    title: 'SEO & Generative Engine Optimization (GEO)',
    description: 'Paid media drives fast results. SEO builds the kind of channel equity that keeps compounding long after the campaign ends. BEAUTYBOXMEDIA invests in both — and we go further than any standard SEO agency by optimizing your brand for the AI-powered discovery engines that are rapidly reshaping how consumers find products. GEO (Generative Engine Optimization) structures your site\'s content and data so that tools like Perplexity and SearchGPT extract, understand, and recommend your brand when users ask for beauty solutions. For CMOs thinking beyond the next quarter, this is the long-term brand infrastructure that protects your visibility regardless of how search evolves. Technical SEO, E-E-A-T authority building, and expert-led Beauty Content Hubs complete the picture.',
  },
  {
    id: 'lifecycle-email',
    title: 'Lifecycle & Email Marketing',
    description: 'The most profitable customer you can acquire is the one you already have — and most beauty brands are dramatically undermonetizing their existing database. BEAUTYBOXMEDIA builds intelligent email and SMS automation systems that recover abandoned carts, re-engage lapsed customers, educate post-purchase buyers, and execute high-revenue seasonal campaigns for moments like Black Friday, Mother\'s Day, and product launches. Deep segmentation by skin concern, purchase behavior, and product preference ensures every message feels personal — not broadcast. For CMOs focused on LTV and payback period, lifecycle marketing is consistently one of the highest-return investments in the entire marketing mix.',
  },
  {
    id: 'influencer',
    title: 'Influencer & Creator Marketing',
    description: 'In the U.S. beauty and fashion market, creator-driven content is no longer a nice-to-have — it\'s one of the most efficient customer acquisition tools available when it\'s executed with the right infrastructure. BEAUTYBOXMEDIA sources and vets creators whose audience demographics, aesthetic, and brand values align with your ideal customer profile — not just their follower count. We brief creators to produce authentic UGC that works organically and as high-performing paid media assets. For CMOs and Brand Directors managing tight CPAs, UGC consistently outperforms studio-produced content in paid campaigns. We also build affiliate and ambassador program tracking infrastructure so your top creator partnerships generate measurable, attributable revenue at scale.',
  },
];

export default function DTC() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Shopify &amp; Web</span>
          <h1 className={styles.title}>
            D2C Services <span className="accent-text">Breakdown.</span>
          </h1>
          <p className={styles.intro}>
            <em>Be found by the customers who are already looking for you.</em>
          </p>
          <p className={styles.subtitle}>
            Google is where purchase decisions are made — and for beauty and fashion brands, the stakes have never been higher. Between paid search, SEO, and the rise of AI-powered discovery engines, the brands that win on Google are the ones with a cohesive, multi-layer strategy. If you&apos;re a CMO, VP of Marketing, or business owner trying to reduce CAC, build long-term channel equity, and show up where your best customers are searching, BEAUTYBOXMEDIA builds that strategy and executes it end to end.
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
          <h2 className={styles.ctaTitle}>Ready to Scale Your D2C Brand?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build a Google growth strategy that compounds.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
