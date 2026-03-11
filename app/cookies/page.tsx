import styles from '../terms/page.module.css';

export default function CookiePolicy() {
  return (
    <section className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Cookie Policy</h1>
        <p className={styles.updated}>Last updated: March 2026</p>

        <div className={styles.content}>
          <h2>What Are Cookies</h2>
          <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.</p>

          <h2>How We Use Cookies</h2>
          <p>Beauty Box Media uses cookies to improve your browsing experience and to analyze how our website is used. We use the following types of cookies:</p>

          <h3>Essential Cookies</h3>
          <p>These cookies are necessary for the website to function properly. They enable basic features like page navigation and cannot be disabled.</p>

          <h3>Analytics Cookies</h3>
          <p>We use analytics cookies to understand how visitors interact with our website. This helps us improve our website&apos;s functionality and content. These cookies collect information anonymously.</p>

          <h3>Marketing Cookies</h3>
          <p>These cookies may be used to track visitors across websites to display relevant advertisements. We only use marketing cookies with your consent.</p>

          <h2>Managing Cookies</h2>
          <p>You can control and manage cookies in various ways. Most browsers allow you to:</p>
          <ul>
            <li>View what cookies are stored and delete them individually</li>
            <li>Block third-party cookies</li>
            <li>Block cookies from specific sites</li>
            <li>Block all cookies</li>
            <li>Delete all cookies when you close your browser</li>
          </ul>
          <p>Please note that blocking or deleting cookies may impact your experience on our website and limit the functionality available to you.</p>

          <h2>Third-Party Cookies</h2>
          <p>Some cookies on our website are set by third-party services that appear on our pages, such as analytics providers. We do not control these cookies. Please refer to the respective third-party privacy policies for more information.</p>

          <h2>Changes to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>

          <h2>Contact Us</h2>
          <p>If you have questions about our use of cookies, please contact us at hello@thebeautyboxmedia.com.</p>
        </div>
      </div>
    </section>
  );
}
