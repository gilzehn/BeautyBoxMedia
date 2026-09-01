'use client';

/**
 * Sonoma Syrup Co — 2026 advertising investment vs. total brand sales.
 *
 * Written to answer one question the brand asked directly: can we see sales
 * volumes against ad spend, and how should the relationship be read?
 *
 * The report covers the whole Sonoma catalogue on the Amazon account, not a
 * selected subset, and it reports *total* ordered product sales rather than
 * ad-attributed sales alone. That distinction is the point: the brand is
 * funding advertising and wants to know what happened to the business, not
 * what the ad platform claimed credit for.
 */

import styles from './sonoma.module.css';
import { BarPanel, Scatter, SplitBar, C } from './charts';
import {
  MONTHS_2026,
  PHASES,
  phaseAvg,
  YTD,
  YTD_TACOS,
  YTD_ROAS,
  YOY,
  R_SPEND_SALES,
  R_SPEND_UNITS,
  usd,
  num,
  pct,
  signedPct,
} from '@/lib/sonoma';

const PUSH_MONTHS = ['Apr', 'May'];

const SECTIONS = [
  { n: '01', id: 'headline', title: 'The short answer' },
  { n: '02', id: 'month-by-month', title: 'Spend and sales, month by month' },
  { n: '03', id: 'phases', title: 'What happened when the budget moved' },
  { n: '04', id: 'correlation', title: 'How tightly the two track' },
  { n: '05', id: 'detail', title: 'The monthly figures' },
  { n: '06', id: 'reading', title: 'How to read this' },
] as const;

function SectionHead({ n, title, id }: { n: string; title: string; id: string }) {
  return (
    <div className={styles.sectionHead} id={id}>
      <span className={styles.sectionNum}>{n}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
    </div>
  );
}

export default function SonomaReport() {
  const base = phaseAvg(PHASES[0]);
  const push = phaseAvg(PHASES[1]);
  const hold = phaseAvg(PHASES[2]);

  const spendCutVsPush = (hold.spend / push.spend - 1) * 100;
  const salesCutVsPush = (hold.sales / push.sales - 1) * 100;
  const salesVsBase = (hold.sales / base.sales - 1) * 100;
  const spendVsBase = (hold.spend / base.spend - 1) * 100;

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

        <blockquote className={styles.question}>
          <p className={styles.questionText}>
            “Is there a way to see the sales volumes in comparison to the ad spend? Any additional
            info to interpret the correlation between the two will be most appreciated.”
          </p>
          <p className={styles.questionWho}>Helena Gonzalez, Director of Sales &amp; Operations, Sonoma Syrup Co.</p>
        </blockquote>

        {/* --- 01 --------------------------------------------------------- */}
        <section className={styles.section}>
          <SectionHead {...SECTIONS[0]} />
          <p className={styles.lede}>
            Yes — and the relationship is real. Across the first eight months of 2026, Sonoma
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
            2025. But the more useful evidence is not the year-on-year total — it is what happened
            inside 2026, when the budget was raised sharply and then cut back again.
          </p>
        </section>

        {/* --- 02 --------------------------------------------------------- */}
        <section className={styles.section}>
          <SectionHead {...SECTIONS[1]} />
          <p className={styles.lede}>
            The two measures are drawn on separate panels over the same months. Spend and sales sit
            on very different scales, and putting them on twin axes in one frame would let the
            picture be shaped by where those axes were pinned rather than by the data.
          </p>

          <div className={styles.card}>
            <div className={styles.cardHead}>Monthly advertising spend</div>
            <div className={styles.cardNote}>
              All ad types. April and May are the deliberate investment push.
            </div>
            <BarPanel
              data={MONTHS_2026.map((m) => ({ label: m.label, value: m.spend }))}
              color={C.spend}
              caption="Ad spend, 2026"
              highlight={PUSH_MONTHS}
            />
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>Monthly total sales</div>
            <div className={styles.cardNote}>
              Ordered product sales across all 29 Sonoma ASINs — advertised and organic together.
            </div>
            <BarPanel
              data={MONTHS_2026.map((m) => ({ label: m.label, value: m.sales }))}
              color={C.sales}
              caption="Total brand sales, 2026"
            />
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>Monthly sales volume</div>
            <div className={styles.cardNote}>Units ordered — the volume measure, free of price effects.</div>
            <BarPanel
              data={MONTHS_2026.map((m) => ({ label: m.label, value: m.units }))}
              color={C.units}
              format="count"
              caption="Units sold, 2026"
            />
          </div>

          <p className={styles.body}>
            Reading the three panels together: sales and volume step up in April alongside the
            budget — and then <strong>stay up</strong> through June, July and August even though
            spend falls back sharply. That gap between the two shapes is the most important thing
            on this page.
          </p>
        </section>

        {/* --- 03 --------------------------------------------------------- */}
        <section className={styles.section}>
          <SectionHead {...SECTIONS[2]} />
          <p className={styles.lede}>
            2026 split into three spending regimes on its own, which makes it close to a controlled
            test: the budget moved hard in both directions while the catalogue, the pricing and the
            listings stayed broadly put.
          </p>

          <div className={styles.phaseGrid}>
            {PHASES.map((p, i) => {
              const a = [base, push, hold][i];
              return (
                <div
                  key={p.id}
                  className={`${styles.phaseCard} ${p.id === 'hold' ? styles.phaseCardLead : ''}`}
                >
                  <div className={styles.phaseSpan}>{p.span}</div>
                  <div className={styles.phaseName}>{p.name}</div>
                  <div className={styles.phaseRow}>
                    <span className={styles.phaseRowLabel}>Spend / month</span>
                    <span className={styles.phaseRowValue}>{usd(a.spend)}</span>
                  </div>
                  <div className={styles.phaseRow}>
                    <span className={styles.phaseRowLabel}>Sales / month</span>
                    <span className={styles.phaseRowValue}>{usd(a.sales)}</span>
                  </div>
                  <div className={styles.phaseRow}>
                    <span className={styles.phaseRowLabel}>Units / month</span>
                    <span className={styles.phaseRowValue}>{num(a.units)}</span>
                  </div>
                  <div className={styles.phaseRow}>
                    <span className={styles.phaseRowLabel}>Ad % of sales</span>
                    <span className={styles.phaseRowValue}>{pct(a.tacos)}</span>
                  </div>
                  <p className={styles.phaseNote}>{p.note}</p>
                </div>
              );
            })}
          </div>

          <div className={styles.callout}>
            <div className={styles.calloutTitle}>The finding worth acting on</div>
            <p className={styles.calloutBody}>
              Between the push and the pull-back, spend came down{' '}
              <strong>{signedPct(spendCutVsPush)}</strong> — but sales only came down{' '}
              <strong>{signedPct(salesCutVsPush)}</strong>. Compared with the January–March baseline,
              Jun–Aug is running <strong>{signedPct(salesVsBase)}</strong> on sales for{' '}
              <strong>{signedPct(spendVsBase)}</strong> on spend. The April–May investment did not
              simply buy two good months and stop; it lifted the brand to a higher level that has
              held for three months on a much smaller budget. That is what advertising is supposed
              to do on Amazon — spend buys rank and sales velocity, and rank keeps selling after the
              spend eases.
            </p>
          </div>

          <p className={styles.body}>
            It also means the two cannot be read as a simple monthly ratio. A month of heavy spend
            pays into the months that follow it, so any single month understates what the budget did
            and the month after it overstates the brand&apos;s organic strength.
          </p>
        </section>

        {/* --- 04 --------------------------------------------------------- */}
        <section className={styles.section}>
          <SectionHead {...SECTIONS[3]} />
          <p className={styles.lede}>
            Each dot is one month: spend along the bottom, total sales up the side. The dashed line
            is the best straight-line fit through the eight months observed. The sales axis starts
            above zero so the months can be told apart.
          </p>

          <div className={styles.card}>
            <Scatter
              data={MONTHS_2026.map((m) => ({
                label: m.label,
                x: m.spend,
                y: m.sales,
                flagged: m.label === 'May',
              }))}
              xLabel="Ad spend per month"
              yLabel="Total sales per month"
            />
          </div>

          <p className={styles.body}>
            The correlation between monthly spend and monthly sales is{' '}
            <strong>r = {R_SPEND_SALES.toFixed(2)}</strong>; against units it is{' '}
            <strong>r = {R_SPEND_UNITS.toFixed(2)}</strong>. Both are strong positive relationships.
            They are not 1.0, and they should not be — advertising is one input among several, and
            the carry-over effect described above deliberately blurs the month-to-month link.
          </p>

          <div className={`${styles.callout} ${styles.caution}`}>
            <div className={styles.calloutTitle}>Where the spend stopped paying: May</div>
            <p className={styles.calloutBody}>
              May is the one month that sits off the line. Spend went to{' '}
              <strong>{usd(10695)}</strong> — {Math.round((10695 / 7330 - 1) * 100)}% above April —
              and sales moved by less than {usd(300)}. Ad cost of sales hit {pct(12.5)} that month
              against {pct(YTD_TACOS)} for the year. The read is straightforward: somewhere above
              roughly <strong>$7,500 a month</strong> on the current catalogue, additional budget
              stops buying additional volume at an acceptable cost. The efficient working range this
              year has been about <strong>$4,000–$7,500 a month</strong>.
            </p>
          </div>
        </section>

        {/* --- 05 --------------------------------------------------------- */}
        <section className={styles.section}>
          <SectionHead {...SECTIONS[4]} />
          <p className={styles.lede}>
            Everything above, as numbers. &ldquo;Ad-attributed&rdquo; is the share of sales Amazon
            credits to an ad click within 14 days; the remainder is the rest of the business.
          </p>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Ad spend</th>
                  <th>Total sales</th>
                  <th>Units</th>
                  <th>Ad % of sales</th>
                  <th>Ad-attributed</th>
                  <th className={styles.splitCell}>Split</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS_2026.map((m) => (
                  <tr key={m.month}>
                    <td>{m.label} 2026</td>
                    <td>{usd(m.spend)}</td>
                    <td>{usd(m.sales)}</td>
                    <td>{num(m.units)}</td>
                    <td>{pct((m.spend / m.sales) * 100)}</td>
                    <td>{pct((m.adSales / m.sales) * 100)}</td>
                    <td className={styles.splitCell}>
                      <SplitBar adSales={m.adSales} total={m.sales} />
                    </td>
                  </tr>
                ))}
                <tr className={styles.rowTotal}>
                  <td>Jan–Aug</td>
                  <td>{usd(YTD.spend)}</td>
                  <td>{usd(YTD.sales)}</td>
                  <td>{num(YTD.units)}</td>
                  <td>{pct(YTD_TACOS)}</td>
                  <td>{pct((YTD.adSales / YTD.sales) * 100)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.legend} style={{ marginTop: 16 }}>
            <span className={styles.legendItem}>
              <span className={styles.swatch} style={{ background: C.sales }} />
              Ad-attributed sales
            </span>
            <span className={styles.legendItem}>
              <span className={styles.swatch} style={{ background: C.organic }} />
              Rest of business
            </span>
          </div>
        </section>

        {/* --- 06 --------------------------------------------------------- */}
        <section className={styles.section}>
          <SectionHead {...SECTIONS[5]} />
          <ol className={styles.readList}>
            <li className={styles.readItem}>
              <strong>Judge the spend on total sales, not on attributed sales.</strong> Amazon
              credits {pct((YTD.adSales / YTD.sales) * 100)} of Sonoma&apos;s 2026 sales to an ad
              click. The other {pct(100 - (YTD.adSales / YTD.sales) * 100)} is not
              advertising-free — much of it is repeat purchase and organic rank that the advertising
              helped build. Attributed sales are the floor of the effect, not the whole of it.
            </li>
            <li className={styles.readItem}>
              <strong>The correlation is strong but it is not proof on its own.</strong> Spend and
              sales moved together (r = {R_SPEND_SALES.toFixed(2)}), and the April budget decision
              came before the sales step-up rather than after it, which is the right order for a
              causal read. Even so, season, price and competitor behaviour all move sales too. The
              pull-back is the more persuasive evidence, because sales held when spend was withdrawn.
            </li>
            <li className={styles.readItem}>
              <strong>Do not extrapolate the line to zero.</strong> Sonoma has not run a month below{' '}
              {usd(2717)} this year, so the data says nothing reliable about what happens with no
              advertising at all. It describes the range actually tested — roughly {usd(2700)} to{' '}
              {usd(10700)} a month.
            </li>
            <li className={styles.readItem}>
              <strong>There is a ceiling, and May found it.</strong> More budget is not linearly
              more sales. The practical range for this catalogue is about $4,000–$7,500 a month;
              beyond that, spend should be paired with new listings or new ASINs to have somewhere
              productive to go.
            </li>
            <li className={styles.readItem}>
              <strong>Q4 is where the budget earns most.</strong> Sonoma&apos;s Q4 2025 ran about
              29% above its late-summer monthly average on seasonal demand alone. Applying that
              same lift to the current {usd(hold.sales)} per-month run rate puts Q4 2026 in the
              region of $320K. Holding the year&apos;s {pct(YTD_TACOS)} ad-to-sales ratio through
              that quarter implies roughly <strong>$6,000–$6,500 a month</strong> of advertising —
              which is above the $2,000 monthly co-op cap currently in place, and is the specific
              gap worth discussing.
            </li>
          </ol>
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
