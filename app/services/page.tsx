import Link from 'next/link';
import styles from './page.module.css';

const services = [
  {
    icon: '&#9733;',
    title: 'Social Media Management',
    description:
      'We handle your social media presence from A to Z. Content calendars, daily posting, community engagement, and performance analytics across Instagram, Facebook, TikTok, and more.',
    features: ['Content Calendar Planning', 'Daily Posting & Scheduling', 'Community Management', 'Analytics & Reporting'],
  },
  {
    icon: '&#9830;',
    title: 'Content Creation',
    description:
      'Stunning visuals and videos that capture attention. From product photography to reels, stories, and branded graphics — we make your brand look incredible.',
    features: ['Photo & Video Production', 'Reels & Short-Form Video', 'Branded Graphics', 'Copywriting'],
  },
  {
    icon: '&#9827;',
    title: 'Brand Strategy',
    description:
      'Build a brand that stands out. We develop your brand identity, voice, and positioning to create a cohesive presence that resonates with your audience.',
    features: ['Brand Identity Design', 'Voice & Messaging', 'Market Positioning', 'Competitor Analysis'],
  },
  {
    icon: '&#9829;',
    title: 'Influencer Marketing',
    description:
      'Connect with the right influencers to amplify your message. We manage partnerships, campaigns, and collaborations that drive real results.',
    features: ['Influencer Outreach', 'Campaign Management', 'Partnership Negotiation', 'Performance Tracking'],
  },
  {
    icon: '&#10022;',
    title: 'Website & Digital Presence',
    description:
      'Your digital home base, designed to convert. Clean, modern websites and landing pages that showcase your brand beautifully.',
    features: ['Website Design', 'Landing Pages', 'SEO Fundamentals', 'Performance Optimization'],
  },
  {
    icon: '&#10038;',
    title: 'Advertising & Paid Media',
    description:
      'Reach your target audience with precision. Strategic ad campaigns on social platforms that maximize your ROI and grow your customer base.',
    features: ['Social Media Ads', 'Campaign Strategy', 'Audience Targeting', 'Budget Optimization'],
  },
];

export default function Services() {
  return (
    <>
      {/* Page Header */}
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>What We Offer</span>
          <h1 className={styles.title}>
            Our <span className="accent-text">Services</span>
          </h1>
          <p className={styles.subtitle}>
            Comprehensive digital media solutions to grow your brand,
            engage your audience, and drive results.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section">
        <div className="container">
          <div className={styles.grid}>
            {services.map((service) => (
              <div key={service.title} className={styles.card}>
                <div
                  className={styles.cardIcon}
                  dangerouslySetInnerHTML={{ __html: service.icon }}
                />
                <h2 className={styles.cardTitle}>{service.title}</h2>
                <p className={styles.cardDesc}>{service.description}</p>
                <ul className={styles.features}>
                  {service.features.map((feature) => (
                    <li key={feature} className={styles.feature}>
                      <span className={styles.featureCheck}>&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>
            Ready to Get Started?
          </h2>
          <p className={styles.ctaSubtitle}>
            Let&apos;s discuss how we can help your brand thrive.
          </p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
