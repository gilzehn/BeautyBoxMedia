import styles from './page.module.css';

export default function Terms() {
  return (
    <section className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Terms &amp; Privacy Policy</h1>
        <p className={styles.updated}>Last updated: March 2026</p>

        <div className={styles.content}>
          <h2>Terms of Service</h2>
          <p>Welcome to Beauty Box Media. By accessing and using our website (thebeautyboxmedia.com), you agree to comply with and be bound by the following terms and conditions.</p>

          <h3>1. Use of Services</h3>
          <p>Beauty Box Media provides digital marketing and media services for beauty and fashion brands. All services are subject to separate engagement agreements. The content on this website is for general informational purposes only and does not constitute professional advice.</p>

          <h3>2. Intellectual Property</h3>
          <p>All content on this website — including text, graphics, logos, images, and software — is the property of Beauty Box Media and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.</p>

          <h3>3. Limitation of Liability</h3>
          <p>Beauty Box Media shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of this website or our services. Our total liability shall not exceed the amount paid by you for the specific service giving rise to the claim.</p>

          <h3>4. Third-Party Links</h3>
          <p>Our website may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of any third-party sites.</p>

          <h3>5. Governing Law</h3>
          <p>These terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions.</p>

          <h2>Privacy Policy</h2>

          <h3>Information We Collect</h3>
          <p>We may collect personal information that you voluntarily provide when you contact us through our website, including your name, email address, brand name, job title, and any other information you choose to share.</p>

          <h3>How We Use Your Information</h3>
          <p>We use the information collected to respond to your inquiries, provide our services, improve our website, and communicate with you about our offerings. We do not sell, trade, or rent your personal information to third parties.</p>

          <h3>Data Security</h3>
          <p>We implement reasonable security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>

          <h3>Your Rights</h3>
          <p>You have the right to access, correct, or delete your personal information. To exercise these rights, please contact us at hello@thebeautyboxmedia.com.</p>

          <h3>Changes to This Policy</h3>
          <p>We reserve the right to update this policy at any time. Changes will be posted on this page with an updated revision date.</p>

          <h3>Contact Us</h3>
          <p>If you have questions about these Terms or our Privacy Policy, please contact us at hello@thebeautyboxmedia.com.</p>
        </div>
      </div>
    </section>
  );
}
