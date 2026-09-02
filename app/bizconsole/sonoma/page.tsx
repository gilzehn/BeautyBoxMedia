'use client';

/**
 * Sonoma Syrup Co — 2026 advertising investment vs. total brand sales.
 *
 * Deliberately a single screen: the headline figures for the year to date and
 * one paragraph reading them. The month-by-month panels, the spend-versus-sales
 * scatter, the phase comparison and the monthly table were cut on request; they
 * are in this file's git history (with their chart components in charts.tsx)
 * if any of them is wanted back.
 *
 * The figures cover the whole Sonoma catalogue on the Amazon account, not a
 * selected subset, and report *total* ordered product sales rather than
 * ad-attributed sales alone. That distinction is the point: the brand is
 * funding advertising and wants to know what happened to the business, not
 * what the ad platform claimed credit for.
 */

import styles from './sonoma.module.css';
import {
  PHASES,
  phaseAvg,
  YTD,
  YTD_TACOS,
  YTD_ROAS,
  YOY,
  usd,
  num,
  pct,
  signedPct,
} from '@/lib/sonoma';

const SECTIONS = [{ n: '01', id: 'headline', title: 'The short answer' }] as const;

function SectionHead({ n, title, id }: { n: string; title: string; id: string }) {
  return (
    <div className={styles.sectionHead} id={id}>
      <span className={styles.sectionNum}>{n}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
    </div>
  );
}

export default function SonomaReport() {
  // The three 2026 spending regimes. With the phase section cut, the closing
  // paragraph is the only place the pull-back finding survives, so keep its
  // figures derived rather than typed into the prose.
  const base = phaseAvg(PHASES[0]);
  const push = phaseAvg(PHASES[1]);
  const hold = phaseAvg(PHASES[2]);

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        {/* ---------------------------------------------------------------- */}
        <header className={styles.masthead}>
          <div className={styles.eyebrow}>Beauty Box Media · Performance report</div>
          <h1 className={styles.title}>
            Sonoma Syrup Co: what the 2026 ad investment did to sales
          </h1>
          <p className={styles.standfirst}>
            Advertising spend against total brand sales on Amazon, January through August 2026 —
            the whole Sonoma catalogue, every order, advertised or not.
          </p>
          <div className={styles.stamp}>
            <span>Account: THE Boutique (US)</span>
            <span>29 Sonoma ASINs</span>
            <span>Data through 30 Aug 2026</span>
          </div>
        </header>

        {/* --- 01 --------------------------------------------------------- */}
        <section className={styles.section}>
          <SectionHead {...SECTIONS[0]} />
          <p className={styles.lede}>
            The relationship is real. Across the first eight months of 2026, Sonoma
            spent <strong>{usd(YTD.spend)}</strong> on advertising and the brand sold{' '}
            <strong>{usd(YTD.sales)}</strong>, or <strong>{num(YTD.units)} units</strong>. Advertising
            was <strong>{pct(YTD_TACOS)}</strong> of total sales.
          </p>

          <div className={styles.kpiGrid}>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Ad spend</div>
              <div className={styles.kpiValue}>{usd(YTD.spend)}</div>
              <div className={styles.kpiNote}>
                <span className={styles.up}>{signedPct(YOY.spend)}</span> vs. Jan–Aug 2025
              </div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Total sales</div>
              <div className={styles.kpiValue}>{usd(YTD.sales)}</div>
              <div className={styles.kpiNote}>
                <span className={styles.up}>{signedPct(YOY.sales)}</span> vs. Jan–Aug 2025
              </div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Units sold</div>
              <div className={styles.kpiValue}>{num(YTD.units)}</div>
              <div className={styles.kpiNote}>
                <span className={styles.up}>{signedPct(YOY.units)}</span> vs. Jan–Aug 2025
              </div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Ad cost of total sales</div>
              <div className={styles.kpiValue}>{pct(YTD_TACOS)}</div>
              <div className={styles.kpiNote}>
                {YTD_ROAS.toFixed(2)}× return on attributed sales
              </div>
            </div>
          </div>

          <p className={styles.body}>
            Sonoma nearly doubled its advertising this year and the business grew with it: sales up{' '}
            {signedPct(YOY.sales)} and volume up {signedPct(YOY.units)} on the same eight months of
            2025. The clearest evidence sits inside the year. The April–May budget push raised
            monthly sales {signedPct((push.sales / base.sales - 1) * 100)} over the January–March
            baseline, and when spend was cut back {signedPct((hold.spend / push.spend - 1) * 100)} in
            June the higher level held — Jun–Aug is still running {signedPct((hold.sales / base.sales - 1) * 100)}{' '}
            on sales. The investment bought rank and velocity that outlasted the spend itself.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <footer className={styles.footer}>
          <p>
            <strong>Source and method.</strong> Amazon Selling Partner and Advertising data for the
            THE Boutique US account, warehoused in BigQuery. Sales, units and sessions come from the
            Sales &amp; Traffic by Child ASIN report, restricted to the 29 child ASINs carrying the
            Sonoma Syrup Co brand. Spend and attributed sales come from the Sponsored Products,
            Sponsored Brands and Sponsored Display campaign reports for the six Sonoma campaigns,
            on Amazon&apos;s 14-day click attribution.
          </p>
          <p>
            Data pulled 1 September 2026 and complete through 30 August 2026, so August is one day
            short of a full month. Spend figures differ by about 0.5% from the summary sent on 30
            July because Amazon restates attribution for several days after the fact; the figures
            here are the later and more accurate ones.
          </p>
          <p>Prepared by Beauty Box Media for Sonoma Syrup Co.</p>
        </footer>
      </div>
    </div>
  );
}
