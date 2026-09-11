'use client';

/**
 * govino monthly performance report.
 *
 * Two tabs, deliberately separated. "Dashboard" is the numbers: scorecards and
 * trends, nothing argued. "Insights" is the argument and the asks — where the
 * money actually went, and what we want the brand to decide. The brand owner
 * reads this on a call and forwards it as a PDF, so the type is set large and
 * both tabs print.
 *
 * Provenance for every figure is documented at the top of lib/govino.ts, which
 * is where it needs to stay accurate.
 */

import { useState } from 'react';
import Image from 'next/image';
import styles from './govino.module.css';
import { GroupedBars, StackedBars, TrendLines, Legend, C } from './charts';
import {
  MONTHS_2026,
  PAIRED,
  TREND_2026,
  SPLIT_2026,
  BRANDED,
  GENERIC,
  SPLIT_TOTAL_SPEND,
  ASINS,
  RESTOCK,
  daysCover,
  YTD_2025,
  YTD_2026,
  FY_2025,
  Q4_2025,
  YOY,
  DATA_THROUGH,
  PULLED_ON,
  ASIN_COUNT,
  usd,
  num,
  pct,
  signedPct,
} from '@/lib/govino';

const TABS = ['Dashboard', 'Insights'] as const;
type Tab = (typeof TABS)[number];

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionNum}>{n}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
    </div>
  );
}

/**
 * Arrow glyph alongside the colour, so direction is never colour-alone.
 *
 * `unit` matters: a change in a rate that is already a percentage (ACOS, TACOS)
 * is a percentage-POINT move, and writing it as "+24%" would read as a relative
 * change and overstate it. Those pass unit="pts".
 */
function Delta({
  v,
  invert = false,
  unit = 'pct',
}: {
  v: number;
  invert?: boolean;
  unit?: 'pct' | 'pts';
}) {
  const good = invert ? v < 0 : v >= 0;
  return (
    <span className={good ? styles.up : styles.down}>
      {v >= 0 ? '▲' : '▼'}{' '}
      {unit === 'pts' ? `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts` : signedPct(v)}
    </span>
  );
}

function Score({
  label,
  value,
  prior,
  change,
  invert,
  unit,
  note,
}: {
  label: string;
  value: string;
  prior?: string;
  change?: number;
  invert?: boolean;
  unit?: 'pct' | 'pts';
  note?: string;
}) {
  return (
    <div className={styles.score}>
      <div className={styles.scoreLabel}>{label}</div>
      <div className={styles.scoreValue}>{value}</div>
      {prior && (
        <div className={styles.scorePrior}>
          <span>2025: {prior}</span>
          {change !== undefined && <Delta v={change} invert={invert} unit={unit} />}
        </div>
      )}
      {note && <div className={styles.scoreNote}>{note}</div>}
    </div>
  );
}

export default function GovinoReport() {
  const [tab, setTab] = useState<Tab>('Dashboard');

  const labels = MONTHS_2026.map((r) => r.label);
  const brandedShare = (BRANDED.spend / SPLIT_TOTAL_SPEND) * 100;
  const genericShare = (GENERIC.spend / SPLIT_TOTAL_SPEND) * 100;
  // What the generic half would have returned at the branded half's efficiency.
  const genericAtBrandedRoas = GENERIC.spend * BRANDED.roas;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        {/* ---------------------------------------------------------------- */}
        <header className={styles.masthead}>
          <div className={styles.brandRow}>
            <Image
              src="/logos/govino.svg"
              alt="govino"
              width={140}
              height={48}
              className={styles.brandMark}
              priority
            />
            <span className={styles.brandRule} />
            <span className={styles.eyebrow}>Beauty Box Media · Monthly report</span>
          </div>
          <div className={styles.accentBar} />
          <h1 className={styles.title}>govino on Amazon — January to August 2026</h1>
          <p className={styles.standfirst}>
            Revenue, advertising and where the two meet, month by month, set against the same eight
            months of 2025. Revenue is total ordered product sales across the govino catalogue,
            advertised and organic together.
          </p>
          <div className={styles.stamp}>
            <span>Account: The Beauty Box (US)</span>
            <span>{ASIN_COUNT} govino ASINs</span>
            <span>Data through {DATA_THROUGH}</span>
          </div>
        </header>

        <nav className={styles.tabs} role="tablist" aria-label="Report sections">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>

        {/* ================================================================ */}
        {/* DASHBOARD                                                        */}
        {/* ================================================================ */}
        {tab === 'Dashboard' && (
          <>
            <section className={styles.section}>
              <SectionHead n="01" title="The eight months at a glance" />

              <div className={styles.scoreGrid}>
                <Score
                  label="Revenue"
                  value={usd(YTD_2026.gross)}
                  prior={usd(YTD_2025.gross)}
                  change={YOY.gross}
                />
                <Score
                  label="Units sold"
                  value={num(YTD_2026.units)}
                  prior={num(YTD_2025.units)}
                  change={YOY.units}
                />
                <Score
                  label="Ad spend"
                  value={usd(YTD_2026.spend)}
                  prior={usd(YTD_2025.spend)}
                  change={YOY.spend}
                />
                <Score
                  label="Ad-attributed sales"
                  value={usd(YTD_2026.ppcSales)}
                  prior={usd(YTD_2025.ppcSales)}
                  change={YOY.ppcSales}
                />
                <Score
                  label="ACOS"
                  value={pct(YTD_2026.acos)}
                  prior={pct(YTD_2025.acos)}
                  change={YTD_2026.acos - YTD_2025.acos}
                  invert
                  unit="pts"
                  note={`${YTD_2026.roas.toFixed(2)}× return, from ${YTD_2025.roas.toFixed(2)}×`}
                />
                <Score
                  label="TACOS"
                  value={pct(YTD_2026.tacos)}
                  prior={pct(YTD_2025.tacos)}
                  change={YTD_2026.tacos - YTD_2025.tacos}
                  invert
                  unit="pts"
                  note="Ad spend as a share of all revenue"
                />
                <Score
                  label="Cost per click"
                  value={`$${YTD_2026.cpc.toFixed(2)}`}
                  prior={`$${YTD_2025.cpc.toFixed(2)}`}
                  change={((YTD_2026.cpc - YTD_2025.cpc) / YTD_2025.cpc) * 100}
                  invert
                />
                <Score
                  label="Average order"
                  value={`$${YTD_2026.aov.toFixed(2)}`}
                  prior={`$${YTD_2025.aov.toFixed(2)}`}
                  change={((YTD_2026.aov - YTD_2025.aov) / YTD_2025.aov) * 100}
                />
              </div>

              <p className={styles.lede}>
                Revenue is up <strong>{signedPct(YOY.gross)}</strong> on the same eight months of
                2025, to <strong>{usd(YTD_2026.gross)}</strong>. Advertising is up{' '}
                <strong>{signedPct(YOY.spend)}</strong>. Growth is real, but it is being bought at
                roughly <strong>{(YOY.spend / YOY.gross).toFixed(1)}×</strong> the rate it arrives:
                every extra dollar of revenue cost materially more this year than last.
              </p>
            </section>

            {/* --- 02 ----------------------------------------------------- */}
            <section className={styles.section}>
              <SectionHead n="02" title="Revenue and spend, 2026 against 2025" />
              <p className={styles.body}>
                Each pair of bars is one month, 2025 beside 2026. Revenue and spend are drawn on
                separate panels because they sit on very different scales — one y-axis each, so the
                comparison is shaped by the data rather than by where the axes were pinned.
              </p>

              <Legend
                items={[
                  { label: '2025', color: C.before },
                  { label: '2026', color: C.now },
                ]}
              />

              <div className={styles.card}>
                <div className={styles.cardHead}>Total revenue</div>
                <div className={styles.cardSub}>
                  Ordered product sales across all {ASIN_COUNT} govino ASINs
                </div>
                <GroupedBars
                  data={PAIRED.map((p) => ({
                    label: p.label,
                    before: p.before.gross,
                    now: p.now.gross,
                    change: p.grossYoY,
                  }))}
                  caption="Monthly revenue, 2026 against 2025"
                  beforeLabel="2025"
                  nowLabel="2026"
                />
              </div>

              <div className={styles.card}>
                <div className={styles.cardHead}>Ad spend</div>
                <div className={styles.cardSub}>Sponsored Products and Sponsored Display combined</div>
                <GroupedBars
                  data={PAIRED.map((p) => ({
                    label: p.label,
                    before: p.before.spend,
                    now: p.now.spend,
                    change: p.spendYoY,
                  }))}
                  caption="Monthly ad spend, 2026 against 2025"
                  beforeLabel="2025"
                  nowLabel="2026"
                />
              </div>

              <p className={styles.body}>
                Revenue clears its 2025 counterpart in every one of the eight months. Spend clears
                it in {PAIRED.filter((p) => p.spendYoY > 0).length} of them — and from May onwards
                by more than double, every month.
              </p>
            </section>

            {/* --- 03 ----------------------------------------------------- */}
            <section className={styles.section}>
              <SectionHead n="03" title="Where the revenue comes from" />
              <p className={styles.body}>
                Each bar is one month&apos;s total revenue, split into the part Amazon attributes to
                an ad click within 14 days and the part it does not.
              </p>

              <Legend
                items={[
                  { label: 'Not ad-attributed', color: C.organic },
                  { label: 'Ad-attributed', color: C.paid },
                ]}
              />

              <div className={styles.card}>
                <div className={styles.cardHead}>Revenue composition</div>
                <div className={styles.cardSub}>
                  Ad-attributed sales sat at {pct(100 - TREND_2026[0].organicShare, 0)} of revenue in
                  January and {pct(100 - TREND_2026[7].organicShare, 0)} in August
                </div>
                <StackedBars
                  data={TREND_2026.map((r) => ({
                    label: r.label,
                    lower: r.organic,
                    upper: r.ppcSales,
                  }))}
                  caption="Monthly revenue split by attribution, 2026"
                  lowerLabel="Not ad-attributed"
                  upperLabel="Ad-attributed"
                />
              </div>
            </section>

            {/* --- 04 ----------------------------------------------------- */}
            <section className={styles.section}>
              <SectionHead n="04" title="Efficiency trend" />
              <p className={styles.body}>
                ACOS is spend against ad-attributed sales; TACOS is the same spend against all
                revenue. Both are drawn on one axis because both are percentages of the same kind.
              </p>

              <Legend
                items={[
                  { label: 'ACOS', color: C.paid },
                  { label: 'TACOS', color: C.branded },
                ]}
              />

              <div className={styles.card}>
                <div className={styles.cardHead}>ACOS and TACOS by month</div>
                <div className={styles.cardSub}>Lower is better on both</div>
                <TrendLines
                  labels={labels}
                  series={[
                    { name: 'ACOS', color: C.paid, values: TREND_2026.map((r) => r.acos) },
                    { name: 'TACOS', color: C.branded, values: TREND_2026.map((r) => r.tacos) },
                  ]}
                  caption="Advertising cost of sales, 2026"
                  format={(n) => `${n.toFixed(0)}%`}
                />
              </div>

              <div className={styles.card}>
                <div className={styles.cardHead}>Cost per click</div>
                <div className={styles.cardSub}>
                  What one click costs, blended across Sponsored Products and Sponsored Display
                </div>
                <TrendLines
                  labels={labels}
                  series={[{ name: 'CPC', color: C.paid, values: TREND_2026.map((r) => r.cpc) }]}
                  caption="Blended cost per click, 2026"
                  format={(n) => `$${n.toFixed(2)}`}
                />
              </div>
            </section>

            {/* --- 05 ----------------------------------------------------- */}
            <section className={styles.section}>
              <SectionHead n="05" title="Month by month" />
              <p className={styles.body}>
                The same five figures the monthly spreadsheet has always carried — spend, ad sales,
                revenue, ACOS and TACOS — with units and sessions alongside them. Quarter columns
                are weighted totals, not averages of the monthly percentages.
              </p>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Spend</th>
                      <th>Ad sales</th>
                      <th>Revenue</th>
                      <th>ACOS</th>
                      <th>TACOS</th>
                      <th>Units</th>
                      <th>Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS_2026.map((r) => {
                      const acos = (r.spend / r.ppcSales) * 100;
                      const tacos = (r.spend / r.gross) * 100;
                      return (
                        <tr key={r.label}>
                          <td>{r.label} 2026</td>
                          <td>{usd(r.spend)}</td>
                          <td>{usd(r.ppcSales)}</td>
                          <td>{usd(r.gross)}</td>
                          <td className={acos > 70 ? styles.flag : undefined}>{pct(acos, 1)}</td>
                          <td className={tacos > 30 ? styles.flag : undefined}>{pct(tacos, 1)}</td>
                          <td>{num(r.units)}</td>
                          <td>{num(r.sessions)}</td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td>
                        <strong>Jan–Aug 2026</strong>
                      </td>
                      <td>
                        <strong>{usd(YTD_2026.spend)}</strong>
                      </td>
                      <td>
                        <strong>{usd(YTD_2026.ppcSales)}</strong>
                      </td>
                      <td>
                        <strong>{usd(YTD_2026.gross)}</strong>
                      </td>
                      <td>
                        <strong>{pct(YTD_2026.acos, 1)}</strong>
                      </td>
                      <td>
                        <strong>{pct(YTD_2026.tacos, 1)}</strong>
                      </td>
                      <td>
                        <strong>{num(YTD_2026.units)}</strong>
                      </td>
                      <td>
                        <strong>{num(YTD_2026.sessions)}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Jan–Aug 2025</td>
                      <td>{usd(YTD_2025.spend)}</td>
                      <td>{usd(YTD_2025.ppcSales)}</td>
                      <td>{usd(YTD_2025.gross)}</td>
                      <td>{pct(YTD_2025.acos, 1)}</td>
                      <td>{pct(YTD_2025.tacos, 1)}</td>
                      <td>{num(YTD_2025.units)}</td>
                      <td>{num(YTD_2025.sessions)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className={styles.body}>
                TACOS is the number to watch on this table. It went from{' '}
                <strong>{pct(TREND_2026[0].tacos)}</strong> in January to{' '}
                <strong>{pct(TREND_2026[7].tacos)}</strong> in August — meaning that by August,{' '}
                {pct(TREND_2026[7].tacos, 0)} of every dollar govino took on Amazon went straight
                back out as advertising. Across the eight months it averaged{' '}
                <strong>{pct(YTD_2026.tacos)}</strong>, against {pct(YTD_2025.tacos)} over the same
                months last year.
              </p>
            </section>
          </>
        )}

        {/* ================================================================ */}
        {/* INSIGHTS                                                         */}
        {/* ================================================================ */}
        {tab === 'Insights' && (
          <>
            <section className={styles.section}>
              <SectionHead n="01" title="Branded vs generic: where the money goes" />
              <p className={styles.lede}>
                Splitting Sponsored Products by what the customer actually typed separates two very
                different businesses. <strong>Branded</strong> is anyone searching for govino by
                name. <strong>Generic</strong> is everything else — &ldquo;unbreakable wine
                glasses&rdquo;, &ldquo;plastic stemless&rdquo;, and so on. They perform nothing
                alike.
              </p>

              <div className={styles.scoreGrid}>
                <Score
                  label="Branded spend"
                  value={usd(BRANDED.spend)}
                  note={`${pct(brandedShare, 0)} of keyword spend`}
                />
                <Score
                  label="Branded return"
                  value={`${BRANDED.roas.toFixed(2)}×`}
                  note={`${pct(BRANDED.acos, 0)} ACOS · $${BRANDED.cpc.toFixed(2)} per click`}
                />
                <Score
                  label="Generic spend"
                  value={usd(GENERIC.spend)}
                  note={`${pct(genericShare, 0)} of keyword spend`}
                />
                <Score
                  label="Generic return"
                  value={`${GENERIC.roas.toFixed(2)}×`}
                  note={`${pct(GENERIC.acos, 0)} ACOS · $${GENERIC.cpc.toFixed(2)} per click`}
                />
              </div>

              <Legend
                items={[
                  { label: 'Branded search', color: C.branded },
                  { label: 'Generic search', color: C.generic },
                ]}
              />

              <div className={styles.card}>
                <div className={styles.cardHead}>Ad spend by search type</div>
                <div className={styles.cardSub}>
                  Sponsored Products keyword and auto targeting, monthly
                </div>
                <GroupedBars
                  data={SPLIT_2026.map((r) => ({
                    label: r.label,
                    before: r.brandedSpend,
                    now: r.genericSpend,
                    change: ((r.genericSpend - r.brandedSpend) / r.brandedSpend) * 100,
                  }))}
                  caption="Monthly ad spend, branded against generic search terms"
                  beforeLabel="Branded"
                  nowLabel="Generic"
                  colors={[C.branded, C.generic]}
                />
              </div>

              <div className={styles.card}>
                <div className={styles.cardHead}>Sales returned by search type</div>
                <div className={styles.cardSub}>
                  Branded spend is a fifth of the budget and returns nearly half the sales
                </div>
                <GroupedBars
                  data={SPLIT_2026.map((r) => ({
                    label: r.label,
                    before: r.brandedSales,
                    now: r.genericSales,
                    change: ((r.genericSales - r.brandedSales) / r.brandedSales) * 100,
                  }))}
                  caption="Monthly ad-attributed sales, branded against generic search terms"
                  beforeLabel="Branded"
                  nowLabel="Generic"
                  colors={[C.branded, C.generic]}
                />
              </div>

              <div className={styles.callout}>
                <div className={styles.calloutHead}>The single biggest finding</div>
                <p>
                  <strong>{pct(genericShare, 0)} of keyword spend goes to generic search</strong>,
                  where a click costs ${GENERIC.cpc.toFixed(2)} and returns{' '}
                  {GENERIC.roas.toFixed(2)}× — against {BRANDED.roas.toFixed(2)}× on branded search
                  at ${BRANDED.cpc.toFixed(2)} a click. Branded converts{' '}
                  {(
                    (SPLIT_2026.reduce((t, r) => t + r.brandedSales, 0) / BRANDED.clicks) /
                    (SPLIT_2026.reduce((t, r) => t + r.genericSales, 0) / GENERIC.clicks)
                  ).toFixed(1)}
                  × better per click. Practically all of the efficiency lost this year was lost on
                  the generic side: its ACOS ran {pct(GENERIC.acos, 0)} across the eight months and
                  peaked at 130% in May, while branded stayed between 11% and 32% every single month.
                </p>
              </div>

              <p className={styles.body}>
                The honest caveat: branded advertising partly buys sales that would have arrived
                anyway, since those shoppers were already searching for govino. Its true
                incremental return is lower than {BRANDED.roas.toFixed(2)}×. But that cuts both
                ways — it means the generic{' '}
                {GENERIC.roas.toFixed(2)}× is the number carrying the real acquisition cost, and it
                is not covering it.
              </p>
            </section>

            {/* --- 02 ----------------------------------------------------- */}
            <section className={styles.section}>
              <SectionHead n="02" title="Product-level performance" />
              <p className={styles.body}>
                June to August, the last complete quarter. TACOS here is ad spend against that
                ASIN&apos;s total revenue — the honest measure of what each product costs to sell.
              </p>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Spend</th>
                      <th>Ad sales</th>
                      <th>Revenue</th>
                      <th>ACOS</th>
                      <th>TACOS</th>
                      <th>CPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ASINS.map((r) => {
                      const acos = (r.spend / r.ppcSales) * 100;
                      const tacos = (r.spend / r.gross) * 100;
                      return (
                        <tr key={r.asin}>
                          <td>
                            <span className={styles.rowName}>
                              <span>{r.name}</span>
                              <span className={styles.rowAsin}>{r.asin}</span>
                            </span>
                          </td>
                          <td>{usd(r.spend)}</td>
                          <td>{usd(r.ppcSales)}</td>
                          <td>{usd(r.gross)}</td>
                          <td className={acos > 70 ? styles.flag : undefined}>{pct(acos, 0)}</td>
                          <td className={tacos > 50 ? styles.flag : undefined}>{pct(tacos, 0)}</td>
                          <td>${r.cpc.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className={styles.body}>
                Two products are selling at a loss on advertising alone. The{' '}
                <strong>2-pack 16oz</strong> (B075QPYS96) spent {usd(5177)} to produce {usd(7498)}{' '}
                of revenue — a 69% TACOS on a low-priced item. The{' '}
                <strong>2-pack 12oz</strong> (B07792YXG3) is worse still at 71% — 71 cents of
                every revenue dollar went back out as advertising, before any cost of goods. Small
                packs carry the same click cost as large ones on a fraction of the order value.
              </p>
              <p className={styles.body}>
                At the other end, the <strong>8-pack 16oz</strong> (B073D7HF23) turned {usd(4450)}{' '}
                of spend into {usd(32996)} of revenue — 13% TACOS, the best economics in the
                catalogue. The pattern is unambiguous: <strong>bigger packs pay, small packs do
                not</strong>.
              </p>
            </section>

            {/* --- 03 ----------------------------------------------------- */}
            <section className={styles.section}>
              <SectionHead n="03" title="Q4 is the whole game — and stock is short" />

              <div className={styles.scoreGrid}>
                <Score
                  label="Sep–Dec 2025 revenue"
                  value={usd(Q4_2025.gross)}
                  note={`${pct((Q4_2025.gross / FY_2025.gross) * 100, 0)} of the entire 2025 year`}
                />
                <Score
                  label="Nov 2025 alone"
                  value={usd(55539)}
                  note="The single biggest month govino has ever had"
                />
                <Score
                  label="Nov 2025 units"
                  value={num(2589)}
                  note="Against 1,110 in Aug 2026"
                />
                <Score
                  label="At 2026 growth"
                  value={num(Math.round(2589 * (1 + YOY.units / 100)))}
                  note="Units November could need this year"
                />
              </div>

              <p className={styles.body}>
                Last year September to December delivered {usd(Q4_2025.gross)} —{' '}
                {pct((Q4_2025.gross / FY_2025.gross) * 100, 0)} of the entire year — with November
                alone at {usd(55539)} on {num(2589)} units. If 2026 holds its current{' '}
                {signedPct(YOY.units)} unit growth, November needs roughly{' '}
                <strong>{num(Math.round(2589 * (1 + YOY.units / 100)))} units</strong>.
              </p>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Units / 30d</th>
                      <th>In stock</th>
                      <th>Inbound</th>
                      <th>Days cover</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESTOCK.map((r) => (
                      <tr key={r.asin}>
                        <td>
                          <span className={styles.rowName}>
                            <span>{r.name}</span>
                            <span className={styles.rowAsin}>{r.asin}</span>
                          </span>
                        </td>
                        <td>{num(r.units30)}</td>
                        <td>{num(r.stock)}</td>
                        <td>{num(r.inbound)}</td>
                        <td className={daysCover(r) < 30 ? styles.flag : undefined}>
                          {Math.round(daysCover(r))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.callout}>
                <div className={styles.calloutHead}>Urgent</div>
                <p>
                  The <strong>72-pack 16oz</strong> (B01DMFI1A0) has{' '}
                  <strong>4 units on hand and 6 inbound</strong> — about two weeks of cover. It sold{' '}
                  {usd(2400)} in the last 30 days at roughly $300 an order, making it one of the
                  highest-value items in the range. It will be out of stock before October on
                  current inventory.
                </p>
              </div>
            </section>

            {/* --- 04 ----------------------------------------------------- */}
            <section className={styles.section}>
              <SectionHead n="04" title="What we recommend" />

              <div className={styles.actions}>
                <div className={styles.action}>
                  <div className={styles.actionHead}>
                    <span className={styles.actionNum}>01</span>
                    <span className={styles.actionTitle}>Restock for Q4 now</span>
                    <span className={styles.actionTag}>Brand decision</span>
                  </div>
                  <p className={styles.actionBody}>
                    {RESTOCK.length} ASINs sit under 60 days of cover going into the quarter that
                    was {pct((Q4_2025.gross / FY_2025.gross) * 100, 0)} of last year&apos;s revenue.
                    The 72-pack needs a purchase order this week. Everything else on that list needs
                    to be inbound to FBA by mid-October to clear receiving before peak. This is the
                    one item on this page that only govino can action, and the one with the largest
                    downside if it slips.
                  </p>
                </div>

                <div className={styles.action}>
                  <div className={styles.actionHead}>
                    <span className={styles.actionNum}>02</span>
                    <span className={styles.actionTitle}>Cut generic spend back to what pays</span>
                    <span className={styles.actionTag}>We action</span>
                  </div>
                  <p className={styles.actionBody}>
                    Generic search took {usd(GENERIC.spend)} and returned{' '}
                    {GENERIC.roas.toFixed(2)}×. We will take the bottom-performing generic terms out
                    on a strict ACOS ceiling and re-point that budget at branded and
                    high-AOV-product campaigns. On the eight-month numbers, moving even half the
                    generic budget to branded-level efficiency would have been worth roughly{' '}
                    <strong>{usd((genericAtBrandedRoas - GENERIC.sales) / 2)}</strong> in additional
                    ad-attributed sales at the same cost.
                  </p>
                </div>

                <div className={styles.action}>
                  <div className={styles.actionHead}>
                    <span className={styles.actionNum}>03</span>
                    <span className={styles.actionTitle}>Stop advertising the 2-packs</span>
                    <span className={styles.actionTag}>We action</span>
                  </div>
                  <p className={styles.actionBody}>
                    B075QPYS96 and B07792YXG3 run 69% and 71% TACOS. They cannot carry a $1.45 click
                    at their price point. We will pull paid support off both, let them sell
                    organically, and move the budget to the 4-, 8- and 12-packs, where TACOS runs
                    13–38%. Expect reported ad sales to fall slightly and profit to rise.
                  </p>
                </div>

                <div className={styles.action}>
                  <div className={styles.actionHead}>
                    <span className={styles.actionNum}>04</span>
                    <span className={styles.actionTitle}>Turn on Sponsored Brands</span>
                    <span className={styles.actionTag}>Needs brand sign-off</span>
                  </div>
                  <p className={styles.actionBody}>
                    govino has run <strong>no Sponsored Brands at all</strong> in either year. Given
                    branded search already returns {BRANDED.roas.toFixed(2)}× and converts at nearly
                    double the generic rate, the brand headline and Store formats are the obvious
                    unused lever — and they defend the branded term against competitors bidding on
                    it. We need sign-off on creative and a Store landing page to start.
                  </p>
                </div>

                <div className={styles.action}>
                  <div className={styles.actionHead}>
                    <span className={styles.actionNum}>05</span>
                    <span className={styles.actionTitle}>Put Sponsored Display on a leash</span>
                    <span className={styles.actionTag}>We action</span>
                  </div>
                  <p className={styles.actionBody}>
                    In March, Sponsored Display spent <strong>{usd(2527.52, 2)}</strong> and returned{' '}
                    <strong>{usd(340.17, 2)}</strong> — a 743% ACOS that single-handedly pushed that
                    month&apos;s blended ACOS to 83%. It has been kept under $110 a month since, which
                    is the right level until it proves itself. We are capping it formally so it
                    cannot recur unnoticed.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        <footer className={styles.footer}>
          <p>
            Figures cover the {ASIN_COUNT} ASINs carrying the govino brand on the Beauty Box US
            seller account. Revenue is ordered product sales, advertised and organic together. Ad
            spend and ad-attributed sales are Sponsored Products plus Sponsored Display on Amazon&apos;s
            14-day click attribution; govino ran no Sponsored Brands in either year. The branded
            versus generic split covers Sponsored Products keyword and auto targeting, which is 92%
            of Sponsored Products spend — product-targeting and Sponsored Display placements have no
            customer search term to classify and are excluded from that panel only.
          </p>
          <p>
            &ldquo;Not ad-attributed&rdquo; revenue is total revenue less ad-attributed sales. It is
            the standard approximation rather than a clean split: Amazon&apos;s 14-day window can credit
            an ad with sales of other products, so the paid share is somewhat overstated and the
            unattributed share correspondingly understated.
          </p>
          <p>
            Data pulled {PULLED_ON} and complete through {DATA_THROUGH}. September 2026 is a partial
            month and is excluded throughout. Amazon restates attribution for several days after the
            fact, so recent figures may move slightly. These numbers reconcile to the monthly
            spreadsheet govino has been receiving: March through July 2026 match it to the dollar on
            spend, ad sales and revenue.
          </p>
          <p>Prepared by Beauty Box Media for govino.</p>
        </footer>
      </div>
    </div>
  );
}
