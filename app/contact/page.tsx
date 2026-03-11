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
                    <label htmlFor="subject" className={styles.label}>Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className={styles.input}
                      placeholder="What's this about?"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="message" className={styles.label}>Message</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      className={styles.textarea}
                      placeholder="Tell us about your project..."
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
