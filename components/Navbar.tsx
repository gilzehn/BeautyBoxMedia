'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

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
          <li
            className={styles.servicesWrap}
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              className={styles.link}
              onClick={() => setServicesOpen(!servicesOpen)}
              aria-expanded={servicesOpen}
            >
              Services
              <svg className={`${styles.chevron} ${servicesOpen ? styles.chevronOpen : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className={`${styles.mega} ${servicesOpen ? styles.megaOpen : ''}`}>
              <div className={styles.megaPanel}>
              <div className={styles.megaInner}>
                <div className={styles.megaCol}>
                  <Link href="/services/marketplaces" className={styles.megaHeadingLink} onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>
                    <h3 className={styles.megaHeading}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg> Marketplaces</h3>
                    <p className={styles.megaLabel}>Amazon &amp; Beyond</p>
                  </Link>
                  <ul className={styles.megaLinks}>
                    <li><Link href="/services/marketplaces#market-feasibility" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Market Feasibility &amp; Strategic Research</Link></li>
                    <li><Link href="/services/marketplaces#brand-presence" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Brand Presence Optimization</Link></li>
                    <li><Link href="/services/marketplaces#advertising-mgmt" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Advertising Management</Link></li>
                    <li><Link href="/services/marketplaces#account-mgmt" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Full Account Management</Link></li>
                    <li><Link href="/services/marketplaces#consulting" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Consulting &amp; Advisory</Link></li>
                  </ul>
                </div>

                <div className={styles.megaCol}>
                  <Link href="/services/dtc" className={styles.megaHeadingLink} onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>
                    <h3 className={styles.megaHeading}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> Direct-to-Consumer</h3>
                    <p className={styles.megaLabel}>Shopify &amp; Web</p>
                  </Link>
                  <ul className={styles.megaLinks}>
                    <li><Link href="/services/dtc#dtc-research" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Market Feasibility &amp; Strategic Research</Link></li>
                    <li><Link href="/services/dtc#paid-search" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Paid Search &amp; Social Campaign Management</Link></li>
                    <li><Link href="/services/dtc#seo-geo" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>SEO &amp; Generative Engine Optimization (GEO)</Link></li>
                    <li><Link href="/services/dtc#lifecycle-email" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Lifecycle &amp; Email Marketing</Link></li>
                    <li><Link href="/services/dtc#influencer" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Influencer &amp; Creator Marketing</Link></li>
                  </ul>
                </div>

                <div className={styles.megaCol}>
                  <Link href="/services/growth-data" className={styles.megaHeadingLink} onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>
                    <h3 className={styles.megaHeading}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> Growth &amp; Data Layer</h3>
                    <p className={styles.megaLabel}>Cross-Platform</p>
                  </Link>
                  <ul className={styles.megaLinks}>
                    <li><Link href="/services/growth-data#audience-targeting" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Audience Targeting &amp; Data Strategy</Link></li>
                    <li><Link href="/services/growth-data#performance-reporting" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Performance Optimization &amp; Reporting</Link></li>
                    <li><Link href="/services/growth-data#attribution" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>Attribution Modeling</Link></li>
                  </ul>
                </div>
              </div>

              <div className={styles.megaFooter}>
                <Link href="/services" className={styles.megaFooterLink} onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>
                  View All Services &rarr;
                </Link>
              </div>
              </div>
            </div>
          </li>
          <li>
            <Link href="/case-studies" className={styles.link} onClick={() => setMenuOpen(false)}>
              Case Studies
            </Link>
          </li>
          <li>
            <Link href="/about" className={styles.link} onClick={() => setMenuOpen(false)}>
              About Us
            </Link>
          </li>
          <li>
            <Link href="/contact" className={styles.ctaLink} onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
