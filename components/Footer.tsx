import Link from 'next/link';
import ContactButton from './ContactButton';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <h3>
              Beauty Box <span className={styles.brandAccent}>Media</span>
            </h3>
            <p>
              Elevate your brand with stunning digital media solutions.
              We help businesses stand out in the digital landscape.
            </p>
          </div>

          <div className={styles.column}>
            <h4>Navigation</h4>
            <ul>
              <li><Link href="/services">Services</Link></li>
              <li><Link href="/case-studies">Case Studies</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><ContactButton className={styles.contactLink} style={{}}>Contact</ContactButton></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h4>Legal</h4>
            <ul>
              <li><Link href="/terms">Terms &amp; Privacy</Link></li>
              <li><Link href="/accessibility">Accessibility</Link></li>
              <li><Link href="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h4>Connect</h4>
            <ul>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">TikTok</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Beauty Box Media. All rights reserved.
          </p>
          <div className={styles.socials}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              IG
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              FB
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              TT
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
