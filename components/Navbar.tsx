'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ContactButton from './ContactButton';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const closeAll = () => { setMenuOpen(false); setOpenDropdown(null); };

  const chevron = (key: string) => (
    <svg className={`${styles.chevron} ${openDropdown === key ? styles.chevronOpen : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.svg" alt="Beauty Box Media" width={216} height={48} priority />
        </Link>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        {menuOpen && (
          <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
        )}

        <ul className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
          {/* Amazon */}
          <li
            className={styles.servicesWrap}
            onMouseEnter={() => setOpenDropdown('amazon')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className={styles.link}
              onClick={() => setOpenDropdown(openDropdown === 'amazon' ? null : 'amazon')}
              aria-expanded={openDropdown === 'amazon'}
            >
              Amazon {chevron('amazon')}
            </button>

            <div className={`${styles.dropdown} ${openDropdown === 'amazon' ? styles.dropdownOpen : ''}`}>
              <div className={styles.dropdownPanel}>
                <Link href="/services/marketplaces" className={styles.megaHeadingLink} onClick={closeAll}>
                  <h3 className={styles.megaHeading}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg> Marketplaces</h3>
                  <p className={styles.megaLabel}>Amazon &amp; Beyond</p>
                </Link>
                <ul className={styles.megaLinks}>
                  <li><Link href="/services/marketplaces/consulting" onClick={closeAll}>Consulting &amp; Advisory</Link></li>
                  <li><Link href="/services/marketplaces/market-feasibility" onClick={closeAll}>Market Feasibility &amp; Strategic Research</Link></li>
                  <li><Link href="/services/marketplaces/brand-onboarding" onClick={closeAll}>Amazon Brand Onboarding</Link></li>
                  <li><Link href="/services/marketplaces/brand-presence" onClick={closeAll}>Brand Presence Optimization</Link></li>
                  <li><Link href="/services/marketplaces/advertising" onClick={closeAll}>Advertising Management</Link></li>
                  <li><Link href="/services/marketplaces/full-management" onClick={closeAll}>Full Account Management</Link></li>
                </ul>
              </div>
            </div>
          </li>

          {/* Shopify */}
          <li
            className={styles.servicesWrap}
            onMouseEnter={() => setOpenDropdown('shopify')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className={styles.link}
              onClick={() => setOpenDropdown(openDropdown === 'shopify' ? null : 'shopify')}
              aria-expanded={openDropdown === 'shopify'}
            >
              Shopify {chevron('shopify')}
            </button>

            <div className={`${styles.dropdown} ${openDropdown === 'shopify' ? styles.dropdownOpen : ''}`}>
              <div className={styles.dropdownPanel}>
                <Link href="/services/dtc" className={styles.megaHeadingLink} onClick={closeAll}>
                  <h3 className={styles.megaHeading}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> Direct-to-Consumer</h3>
                  <p className={styles.megaLabel}>Shopify &amp; Web</p>
                </Link>
                <ul className={styles.megaLinks}>
                  <li><Link href="/services/dtc/market-research" onClick={closeAll}>Market Feasibility &amp; Strategic Research</Link></li>
                  <li><Link href="/services/dtc/paid-search" onClick={closeAll}>Paid Search &amp; Social Campaign Management</Link></li>
                  <li><Link href="/services/dtc/seo-geo" onClick={closeAll}>SEO &amp; Generative Engine Optimization (GEO)</Link></li>
                  <li><Link href="/services/dtc/email-lifecycle" onClick={closeAll}>Lifecycle &amp; Email Marketing</Link></li>
                  <li><Link href="/services/dtc/influencer" onClick={closeAll}>Influencer &amp; Creator Marketing</Link></li>
                </ul>
              </div>
            </div>
          </li>

          {/* Data */}
          <li
            className={styles.servicesWrap}
            onMouseEnter={() => setOpenDropdown('data')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className={styles.link}
              onClick={() => setOpenDropdown(openDropdown === 'data' ? null : 'data')}
              aria-expanded={openDropdown === 'data'}
            >
              Data {chevron('data')}
            </button>

            <div className={`${styles.dropdown} ${openDropdown === 'data' ? styles.dropdownOpen : ''}`}>
              <div className={styles.dropdownPanel}>
                <Link href="/services/growth-data" className={styles.megaHeadingLink} onClick={closeAll}>
                  <h3 className={styles.megaHeading}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> Growth &amp; Data Layer</h3>
                  <p className={styles.megaLabel}>Cross-Platform</p>
                </Link>
                <ul className={styles.megaLinks}>
                  <li><Link href="/services/growth-data/audience-targeting" onClick={closeAll}>Audience Targeting &amp; Data Strategy</Link></li>
                  <li><Link href="/services/growth-data/performance-reporting" onClick={closeAll}>Performance Optimization &amp; Reporting</Link></li>
                  <li><Link href="/services/growth-data/attribution" onClick={closeAll}>Attribution Modeling</Link></li>
                </ul>
              </div>
            </div>
          </li>

          <li>
            <Link href="/about" className={styles.link} onClick={() => setMenuOpen(false)}>
              Our Story
            </Link>
          </li>
          <li>
            <ContactButton className={styles.ctaLink} style={{}}>
              Contact
            </ContactButton>
          </li>
        </ul>
      </div>
    </nav>
  );
}
