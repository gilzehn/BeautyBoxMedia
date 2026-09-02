'use client';

/**
 * Sonoma Syrup Co — our 2026 advertising investment against brand income.
 *
 * The voice matters here and is deliberate: Beauty Box Media funds and runs the
 * Sonoma advertising, so the page says "we invested", never "Sonoma spent".
 * The brand's stake in it is the co-op, which is what the conversation this
 * report feeds is actually about.
 *
 * Two sections: the headline figures for Jan–Aug 2026 against the same months
 * of 2025, then the month-by-month breakdown behind them. Figures cover the
 * whole Sonoma catalogue, and "income" is total ordered product sales rather
 * than ad-attributed sales alone — what happened to the business, not what the
 * ad platform claimed credit for.
 */

import styles from './sonoma.module.css';
import {
  PAIRED,
  PHASES,
  phaseAvg,
  YTD_2025,
  YTD_2026,
  FY_2025,
  YOY,
  usd,
  num,
  pct,
  signedPct,
} from '@/lib/sonoma';

const SECTIONS = [
  { n: '01', id: 'headline', title: 'The short answer' },
  { n: '02', id: 'monthly', title: 'Month by month, 2026 against 2025' },
] as const;

function SectionHead({ n, title, id }: { n: string; title: string; id: string }) {
  return (
    <div className={styles.sectionHead} id={id}>
      <span className={styles.sectionNum}>{n}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
    </div>
  );
}

function Kpi({
  label,
  value,
  prior,
  change,
  note,
}: {
  label: string;
  value: string;
  prior?: string;
  change?: number;
  note?: string;
}) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {prior && (
        <div className={styles.kpiPrior}>
          <span>2025: {prior}</span>
          {change !== undefined && (
            <span className={change >= 0 ? styles.up : styles.down}>{signedPct(change)}</span>
          )}
        </div>
      )}
      {note && <div className={styles.kpiNote}>{note}</div>}
    </div>
  );
}

export default function SonomaReport() {
  // The three 2026 spending regimes, for the pull-back finding in the lede.
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
            What our 2026 investment in Sonoma delivered
          </h1>
          <p className={styles.standfirst}>
            Our advertising investment in the Sonoma Syrup Co brand on Amazon against total brand
            income, January through August 2026, set against the same months of 2025.
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
            Over the first eight months of 2026 we invested <strong>{usd(YTD_2026.spend)}</strong> in
            advertising the Sonoma brand, and the brand returned{' '}
            <strong>{usd(YTD_2026.income)}</strong> of income on{' '}
            <strong>{num(YTD_2026.units)} units</strong>. Against the same eight months of 2025 that
            is <strong>{signedPct(YOY.spend)}</strong> on investment and{' '}
            <strong>{signedPct(YOY.income)}</strong> on income.
          </p>

          <div className={styles.kpiGrid}>
            <Kpi
              label="Our ad investment"
              value={usd(YTD_2026.spend)}
              prior={usd(YTD_2025.spend)}
              change={YOY.spend}
            />
            <Kpi
              label="Total income"
              value={usd(YTD_2026.income)}
              prior={usd(YTD_2025.income)}
              change={YOY.income}
            />
            <Kpi
              label="Units sold"
              value={num(YTD_2026.units)}
              prior={num(YTD_2025.units)}
              change={YOY.units}
            />
            <Kpi
              label="Ad cost of income"
              value={pct(YTD_2026.adCostOfIncome)}
              prior={pct(YTD_2025.adCostOfIncome)}
              note={`${YTD_2026.roas.toFixed(2)}× return on attributed income, from ${YTD_2025.roas.toFixed(2)}×`}
            />
          </div>

          <p className={styles.body}>
            We roughly doubled the investment and income rose with it:{' '}
            <strong>{usd(YTD_2026.income - YTD_2025.income)}</strong> more income on{' '}
            <strong>{usd(YTD_2026.spend - YTD_2025.spend)}</strong> more advertising, with every one
            of the eight months ahead of its 2025 counterpart. Not all of that growth is bought —
            advertising is one input among several — but the paid contribution grew too: income
            attributed to our ads went from {usd(YTD_2025.adIncome)} to {usd(YTD_2026.adIncome)},
            and the return on it improved from {YTD_2025.roas.toFixed(2)}× to{' '}
            {YTD_2026.roas.toFixed(2)}×. The ad cost of income rose from{' '}
            {pct(YTD_2025.adCostOfIncome)} to {pct(YTD_2026.adCostOfIncome)}, which is what scaling
            costs: incremental growth comes at a higher marginal rate even as the return on
            advertised income improves.
          </p>

          <p className={styles.body}>
            The clearest evidence sits inside 2026. The April–May push raised monthly income{' '}
            {signedPct((push.income / base.income - 1) * 100)} over the January–March baseline, and
            when we cut the budget back {signedPct((hold.spend / push.spend - 1) * 100)} in June the
            higher level held — Jun–Aug is still running{' '}
            {signedPct((hold.income / base.income - 1) * 100)} on income. The investment bought rank
            and sales velocity that outlasted the spend itself, which is why the run rate did not
            fall back when the budget did.
          </p>
        </section>

        {/* --- 02 --------------------------------------------------------- */}
        <section className={styles.section}>
          <SectionHead {...SECTIONS[1]} />
          <p className={styles.lede}>
            Every month of 2026 against the same month a year earlier. Income is total ordered
            product sales across all 29 Sonoma ASINs — advertised and organic together.
          </p>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th rowSpan={2} className={styles.thMonth}>
                    Month
                  </th>
                  <th colSpan={2} className={styles.thGroup}>
                    Our ad investment
                  </th>
                  <th colSpan={3} className={`${styles.thGroup} ${styles.thGroupEdge}`}>
                    Total income
                  </th>
                </tr>
                <tr>
                  <th>2025</th>
                  <th>2026</th>
                  <th className={styles.thEdge}>2025</th>
                  <th>2026</th>
                  <th>YoY</th>
                </tr>
              </thead>
              <tbody>
                {PAIRED.map((p) => (
                  <tr key={p.label}>
                    <td>{p.label}</td>
                    <td className={styles.dim}>{usd(p.before.spend)}</td>
                    <td>{usd(p.now.spend)}</td>
                    <td className={`${styles.dim} ${styles.tdEdge}`}>{usd(p.before.income)}</td>
                    <td>{usd(p.now.income)}</td>
                    <td className={p.incomeYoY >= 0 ? styles.up : styles.down}>
                      {signedPct(p.incomeYoY)}
                    </td>
                  </tr>
                ))}
                <tr className={styles.rowTotal}>
                  <td>Jan–Aug</td>
                  <td className={styles.dim}>{usd(YTD_2025.spend)}</td>
                  <td>{usd(YTD_2026.spend)}</td>
                  <td className={`${styles.dim} ${styles.tdEdge}`}>{usd(YTD_2025.income)}</td>
                  <td>{usd(YTD_2026.income)}</td>
                  <td className={YOY.income >= 0 ? styles.up : styles.down}>
                    {signedPct(YOY.income)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className={styles.body}>
            For scale: the whole of 2025 — twelve months — brought{' '}
            <strong>{usd(FY_2025.income)}</strong> of income on{' '}
            <strong>{usd(FY_2025.spend)}</strong> of investment. Eight months of 2026 have already
            passed the full prior year on income, and Q4, the strongest quarter of Sonoma&apos;s year,
            is still ahead.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <footer className={styles.footer}>
          <p>
            <strong>Source and method.</strong> Amazon Selling Partner and Advertising data for the
            THE Boutique US account, warehoused in BigQuery. Income and units come from the Sales
            &amp; Traffic by Child ASIN report, restricted to the 29 child ASINs carrying the Sonoma
            Syrup Co brand; income is total ordered product sales. Ad investment and attributed
            income come from the Sponsored Products, Sponsored Brands and Sponsored Display campaign
            reports for the six Sonoma campaigns, on Amazon&apos;s 14-day click attribution.
          </p>
          <p>
            Data pulled 2 September 2026 and complete through 30 August 2026, so August 2026 is one
            day short of a full month while August 2025 is whole — a small understatement of the
            current year in that row. Spend figures differ by about 0.5% from the summary sent on 30
            July because Amazon restates attribution for several days after the fact; the figures
            here are the later and more accurate ones.
          </p>
          <p>Prepared by Beauty Box Media for Sonoma Syrup Co.</p>
        </footer>
      </div>
    </div>
  );
}
