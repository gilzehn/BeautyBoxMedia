'use client';

/**
 * govino monthly performance report.
 *
 * Two tabs, deliberately separated. "Dashboard" is the numbers: a scorecard row
 * driven by the month dropdown, and revenue against last year. Nothing argued.
 * "Insights" is the argument and the asks — where the money actually went, and
 * what we want the brand to decide. The brand owner reads this on a call and
 * forwards it as a PDF, so the type is set large and both tabs print.
 *
 * The dropdown is the whole reason the Dashboard stays this thin: any month's
 * figures, including TACOS, are one selection away, so the trend panels and the
 * month-by-month table that used to sit here were cut as redundant. charts.tsx
 * keeps StackedBars and TrendLines for when they are wanted again; they are
 * tree-shaken out of the bundle while unused.
 *
 * The source-and-method footer was removed on request, matching the Sonoma
 * report. The provenance is not lost: it is documented in full at the top of
 * lib/govino.ts, which is where it has to stay accurate anyway, since that is
 * the file anyone updating the figures will open.
 */

import { useState } from 'react';
import Image from 'next/image';
import styles from './govino.module.css';
import { GroupedBars, Legend, C } from './charts';
import {
  MONTHS_2025,
  MONTHS_2026,
  total,
  PAIRED,
  PAIRED_QUARTERS,
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
  ASIN_COUNT,
  usd,
  num,
  pct,
  signedPct,
} from '@/lib/govino';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TABS = ['Dashboard', 'Insights'] as const;
type Tab = (typeof TABS)[number];

/** `n` is omitted where a tab has only one section and a lone "01" would be noise. */
function SectionHead({ n, title }: { n?: string; title: string }) {
  return (
    <div className={styles.sectionHead}>
      {n && <span className={styles.sectionNum}>{n}</span>}
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
  priorLabel = '2025',
  change,
  invert,
  unit,
  note,
}: {
  label: string;
  value: string;
  prior?: string;
  priorLabel?: string;
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
          <span>{priorLabel}: {prior}</span>
          {change !== undefined && <Delta v={change} invert={invert} unit={unit} />}
        </div>
      )}
      {note && <div className={styles.scoreNote}>{note}</div>}
    </div>
  );
}

export default function GovinoReport() {
  const [tab, setTab] = useState<Tab>('Dashboard');
  // -1 is the whole Jan-Aug window; 0-7 select a single month. Defaults to the
  // latest complete month, which is what the brand asks about first.
  const [period, setPeriod] = useState<number>(MONTHS_2026.length - 1);

  // Scorecard figures follow the dropdown. `total()` takes any set of months,
  // so a single month and the whole window compute identically — including the
  // derived rates, which stay weighted rather than averaged.
  const isYtd = period === -1;
  const now = isYtd ? YTD_2026 : total([MONTHS_2026[period]]);
  const before = isYtd ? YTD_2025 : total([MONTHS_2025[MONTHS_2026[period].m - 1]]);
  const periodLabel = isYtd ? 'Jan–Aug 2026' : `${MONTHS_2026[period].label} 2026`;
  const priorLabel = isYtd ? '2025' : `${MONTHS_2026[period].label} 2025`;
  const d = (a: number, b: number) => ((a - b) / b) * 100;
  const partialQ = PAIRED_QUARTERS.find((q) => q.partial);
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
          <h1 className={styles.srOnly}>govino on Amazon, January to August 2026</h1>
          <p className={styles.standfirst}>
            Revenue, advertising and where the two meet, set against the same period of 2025. Pick
            a month for the headline figures; the chart below carries the year so far by quarter.
            Revenue is total ordered product sales across the govino catalogue, advertised and
            organic together.
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
              <SectionHead title="At a glance" />

              <div className={styles.periodBar}>
                <label className={styles.periodLabel} htmlFor="period">
                  Showing
                </label>
                <select
                  id="period"
                  className={styles.periodSelect}
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                >
                  <option value={-1}>January to August 2026 (all)</option>
                  {MONTHS_2026.map((r, i) => (
                    <option key={r.label} value={i}>
                      {MONTH_NAMES[r.m - 1]} 2026
                    </option>
                  ))}
                </select>
                <span className={styles.periodNote}>
                  compared against {isYtd ? 'the same months of 2025' : priorLabel}
                </span>
              </div>

              <div className={styles.scoreGrid}>
                <Score
                  label="Revenue"
                  value={usd(now.gross)}
                  prior={usd(before.gross)}
                  priorLabel={priorLabel}
                  change={d(now.gross, before.gross)}
                />
                <Score
                  label="Units sold"
                  value={num(now.units)}
                  prior={num(before.units)}
                  priorLabel={priorLabel}
                  change={d(now.units, before.units)}
                />
                <Score
                  label="Ad spend"
                  value={usd(now.spend)}
                  prior={usd(before.spend)}
                  priorLabel={priorLabel}
                  change={d(now.spend, before.spend)}
                />
                <Score
                  label="Ad-attributed sales"
                  value={usd(now.ppcSales)}
                  prior={usd(before.ppcSales)}
                  priorLabel={priorLabel}
                  change={d(now.ppcSales, before.ppcSales)}
                />
                <Score
                  label="ACOS"
                  value={pct(now.acos)}
                  prior={pct(before.acos)}
                  priorLabel={priorLabel}
                  change={now.acos - before.acos}
                  invert
                  unit="pts"
                  note={`${now.roas.toFixed(2)}× return, from ${before.roas.toFixed(2)}×`}
                />
                <Score
                  label="TACOS"
                  value={pct(now.tacos)}
                  prior={pct(before.tacos)}
                  priorLabel={priorLabel}
                  change={now.tacos - before.tacos}
                  invert
                  unit="pts"
                  note="Ad spend as a share of all revenue"
                />
                <Score
                  label="Cost per click"
                  value={`$${now.cpc.toFixed(2)}`}
                  prior={`$${before.cpc.toFixed(2)}`}
                  priorLabel={priorLabel}
                  change={d(now.cpc, before.cpc)}
                  invert
                />
                <Score
                  label="Average order"
                  value={`$${now.aov.toFixed(2)}`}
                  prior={`$${before.aov.toFixed(2)}`}
                  priorLabel={priorLabel}
                  change={d(now.aov, before.aov)}
                />
              </div>

              <Legend
                items={[
                  { label: '2025', color: C.before },
                  { label: '2026', color: C.now },
                ]}
              />

              <div className={styles.card}>
                <div className={styles.cardHead}>Quarterly revenue, 2026 against 2025</div>
                <div className={styles.cardSub}>
                  {partialQ
                    ? `${partialQ.label} covers ${partialQ.span} only, on both sides, since September is not yet complete — so every pair compares the same months.`
                    : 'Each pair compares the same months on both sides.'}
                </div>
                <GroupedBars
                  data={PAIRED_QUARTERS.map((q) => ({
                    label: q.partial ? `${q.label} (${q.span})` : q.label,
                    before: q.before.gross,
                    now: q.now.gross,
                    change: q.grossYoY,
                  }))}
                  caption={`Ordered product sales across all ${ASIN_COUNT} govino ASINs`}
                  beforeLabel="2025"
                  nowLabel="2026"
                />
              </div>

              <p className={styles.body}>
                Every quarter of 2026 clears its 2025 counterpart, by between{' '}
                {signedPct(Math.min(...PAIRED_QUARTERS.map((q) => q.grossYoY)))} and{' '}
                {signedPct(Math.max(...PAIRED_QUARTERS.map((q) => q.grossYoY)))}.
              </p>

              {isYtd ? (
                <p className={styles.lede}>
                  Revenue is up <strong>{signedPct(YOY.gross)}</strong> on the same eight months of
                  2025, to <strong>{usd(YTD_2026.gross)}</strong>. Advertising is up{' '}
                  <strong>{signedPct(YOY.spend)}</strong>. Growth is real, but it is being bought at
                  roughly <strong>{(YOY.spend / YOY.gross).toFixed(1)}×</strong> the rate it
                  arrives: every extra dollar of revenue cost materially more this year than last.
                </p>
              ) : (
                <p className={styles.lede}>
                  {periodLabel} took <strong>{usd(now.gross)}</strong> of revenue on{' '}
                  <strong>{num(now.units)} units</strong>, against{' '}
                  <strong>{usd(before.gross)}</strong> in {priorLabel} —{' '}
                  <strong>{signedPct(d(now.gross, before.gross))}</strong>. Advertising took{' '}
                  <strong>{usd(now.spend)}</strong>, which is{' '}
                  <strong>{pct(now.tacos)}</strong> of everything the brand sold that month, from{' '}
                  {pct(before.tacos)} a year earlier.
                </p>
              )}
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
      </div>
    </div>
  );
}
