'use client';

import { useState, FormEvent } from 'react';
import styles from './page.module.css';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Static form — integrate with Formspree or similar later
    setSubmitted(true);
  };

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
            {/* Contact Form */}
            <div className={styles.formWrap}>
              {submitted ? (
                <div className={styles.success}>
                  <div className={styles.successIcon}>&#10003;</div>
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. We&apos;ll be in touch soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label htmlFor="email" className={styles.label}>Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className={styles.input}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="brand" className={styles.label}>Brand Name</label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      required
                      className={styles.input}
                      placeholder="Your brand name"
                    />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label htmlFor="name" className={styles.label}>Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className={styles.input}
                        placeholder="Your name"
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="jobTitle" className={styles.label}>Job Title</label>
                      <input
                        type="text"
                        id="jobTitle"
                        name="jobTitle"
                        className={styles.input}
                        placeholder="e.g. CMO, Brand Director"
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Organization Type</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radio}>
                        <input type="radio" name="organization" value="ecomm-brand" />
                        <span className={styles.radioDot} />
                        Ecomm Brand
                      </label>
                      <label className={styles.radio}>
                        <input type="radio" name="organization" value="agency" />
                        <span className={styles.radioDot} />
                        Agency
                      </label>
                      <label className={styles.radio}>
                        <input type="radio" name="organization" value="other" />
                        <span className={styles.radioDot} />
                        Other
                      </label>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="revenue" className={styles.label}>Ecomm Revenue</label>
                    <select id="revenue" name="revenue" className={styles.select}>
                      <option value="">Select range</option>
                      <option value="under-500k">Under $500K</option>
                      <option value="500k-1m">$500K – $1M</option>
                      <option value="1m-5m">$1M – $5M</option>
                      <option value="5m-10m">$5M – $10M</option>
                      <option value="10m-plus">$10M+</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Do you sell on Amazon?</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radio}>
                        <input type="radio" name="sellsOnAmazon" value="yes" />
                        <span className={styles.radioDot} />
                        Yes
                      </label>
                      <label className={styles.radio}>
                        <input type="radio" name="sellsOnAmazon" value="no" />
                        <span className={styles.radioDot} />
                        No
                      </label>
                      <label className={styles.radio}>
                        <input type="radio" name="sellsOnAmazon" value="planning" />
                        <span className={styles.radioDot} />
                        Planning to
                      </label>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Service Interest</label>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkbox}>
                        <input type="checkbox" name="services" value="marketplaces" />
                        <span className={styles.checkmark} />
                        Marketplaces (Amazon &amp; Beyond)
                      </label>
                      <label className={styles.checkbox}>
                        <input type="checkbox" name="services" value="dtc" />
                        <span className={styles.checkmark} />
                        Direct-to-Consumer (Shopify &amp; Web)
                      </label>
                      <label className={styles.checkbox}>
                        <input type="checkbox" name="services" value="growth-data" />
                        <span className={styles.checkmark} />
                        Growth &amp; Data Layer
                      </label>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="message" className={styles.label}>Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      className={styles.textarea}
                      placeholder="Anything else you'd like us to know?"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Send Message
                  </button>
                </form>
              )}
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
