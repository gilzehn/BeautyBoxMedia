import styles from '../terms/page.module.css';

export default function Accessibility() {
  return (
    <section className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Accessibility Statement</h1>
        <p className={styles.updated}>Last updated: March 2026</p>

        <div className={styles.content}>
          <h2>Our Commitment</h2>
          <p>Beauty Box Media is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>

          <h2>Conformance Status</h2>
          <p>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. These guidelines explain how to make web content more accessible to people with a wide array of disabilities.</p>

          <h2>Measures We Take</h2>
          <ul>
            <li>Semantic HTML structure for proper screen reader navigation</li>
            <li>Sufficient color contrast ratios throughout the website</li>
            <li>Keyboard navigable interface elements</li>
            <li>Alternative text for meaningful images</li>
            <li>Clear and consistent navigation patterns</li>
            <li>Responsive design that works across devices and screen sizes</li>
            <li>Form labels and instructions for all input fields</li>
          </ul>

          <h2>Known Limitations</h2>
          <p>While we strive for full accessibility, some areas of our website may not yet be fully optimized. We are actively working to identify and resolve any accessibility barriers.</p>

          <h2>Feedback</h2>
          <p>We welcome your feedback on the accessibility of our website. If you encounter any accessibility barriers or have suggestions for improvement, please contact us:</p>
          <ul>
            <li>Email: hello@thebeautyboxmedia.com</li>
          </ul>
          <p>We try to respond to accessibility feedback within 2 business days.</p>

          <h2>Technical Specifications</h2>
          <p>This website is built with Next.js and relies on the following technologies for accessibility:</p>
          <ul>
            <li>HTML5</li>
            <li>WAI-ARIA</li>
            <li>CSS</li>
            <li>JavaScript</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
