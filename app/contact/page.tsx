'use client';

import { useEffect } from 'react';
import styles from './page.module.css';

export default function Contact() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//embed.typeform.com/next/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return (
    <>
      {/* Page Header */}
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Get In Touch</span>
          <h1 className={styles.title}>
            Let&apos;s <span className="accent-text">Connect</span>
          </h1>
          <p className={styles.subtitle}>
            Ready to take your brand to the next level? Drop us a message
            and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="section">
        <div className="container">
          <div className={styles.grid}>
            {/* Typeform Embed */}
            <div className={styles.formWrap}>
              <div data-tf-live="01KM5E6Z346PNTTN3E9M1DKZ42" style={{ width: '100%', minHeight: '600px' }} />
            </div>

            {/* Contact Info */}
            <div className={styles.info}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}>Contact Info</h3>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <a href="mailto:hello@thebeautyboxmedia.com" className={styles.infoValue}>
                    hello@thebeautyboxmedia.com
                  </a>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Location</span>
                  <span className={styles.infoValue}>Available Worldwide</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Response Time</span>
                  <span className={styles.infoValue}>Within 24 hours</span>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}>Follow Us</h3>
                <div className={styles.socialLinks}>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    Instagram
                  </a>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    Facebook
                  </a>
                  <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    TikTok
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
