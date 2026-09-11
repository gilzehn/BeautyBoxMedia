'use client';

/**
 * govino monthly performance report.
 *
 * One page, three movements: six scorecards fixed to the latest complete month,
 * the same six metrics by quarter as panels the reader can switch off, then
 * three written insights that say what the numbers mean and what we want the
 * brand to decide. The brand owner reads this on a call and forwards it as a
 * PDF, so the type is set large and it prints.
 *
 * The separate Insights tab was removed along with the tab bar; the per-ASIN,
 * branded-versus-generic and Q4 stock analysis that lived there is still
 * exported from lib/govino.ts and tree-shaken out while unused.
 *
 * The quarter panels are small multiples rather than six series on one chart:
 * dollars, unit counts and percentages have no honest shared y-axis. charts.tsx
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
import { ComboChart, YearKey, COMBO } from './charts';
import {
  MONTHS_2025,
  MONTHS_2026,
  total,
  PAIRED_QUARTERS,
  type Totals,
  SEP_MTD,
  YTD_2025,
  YTD_2026,
  YOY,
  DATA_THROUGH,
  ASIN_COUNT,
  usd,
  num,
  pct,
  signedPct,
} from '@/lib/govino';

/**
 * The six figures the brand asked for, in the order they read: sales, units and
 * TACOS on the top row, then the advertising line beneath it.
 *
 * `unit` drives two things that are easy to get wrong. Percentages compare as
 * point moves, not relative ones, so ACOS going 36.4% to 46.5% is "+10.1 pts",
 * never "+28%". And dollars, unit counts and percentages each need their own
 * axis formatter, which is why the panels below are small multiples rather than
 * six series sharing one scale.
 */
type MetricKey = 'gross' | 'units' | 'tacos' | 'spend' | 'ppcSales' | 'acos';

interface Metric {
  key: MetricKey;
  label: string;
  unit: 'usd' | 'count' | 'pct';
  lowerIsBetter?: boolean;
  /** No good/bad direction: shown in plain ink rather than green or red. */
  neutral?: boolean;
  fmt: (n: number) => string;
  caption: string;
  note?: (now: Totals, before: Totals) => string;
}

const METRICS: Metric[] = [
  {
    key: 'gross',
    label: 'Total Sales',
    unit: 'usd',
    fmt: (n) => usd(n),
    caption: 'Ordered product sales, advertised and organic',
  },
  {
    key: 'units',
    label: 'Total Units',
    unit: 'count',
    fmt: (n) => num(n),
    caption: 'Units ordered',
  },
  {
    key: 'tacos',
    label: 'TACOS',
    unit: 'pct',
    lowerIsBetter: true,
    fmt: (n) => pct(n),
    caption: 'Ad spend as a share of all sales',
    note: () => 'Ad spend as a share of all sales',
  },
  {
    key: 'spend',
    label: 'Ad Spend',
    unit: 'usd',
    neutral: true,
    fmt: (n) => usd(n),
    caption: 'Sponsored Products and Sponsored Display',
  },
  {
    key: 'ppcSales',
    label: 'Ad Attributed Sales',
    unit: 'usd',
    fmt: (n) => usd(n),
    caption: 'Sales on a 14-day click attribution',
  },
  {
    key: 'acos',
    label: 'ACOS',
    unit: 'pct',
    lowerIsBetter: true,
    fmt: (n) => pct(n),
    caption: 'Ad spend as a share of ad-attributed sales',
    note: (now) => `${now.roas.toFixed(2)}× return on ad spend`,
  },
];

/** The scorecards are fixed to the latest complete month and its counterpart. */
const AUG_2026 = total([MONTHS_2026[MONTHS_2026.length - 1]]);
const AUG_2025 = total([MONTHS_2025[7]]);

/**
 * What the chart carries: sales as bars, spend and TACOS as lines. Kept apart
 * from METRICS because the scorecards show six figures and the chart shows
 * three — they answer different questions and should not be forced to agree.
 */
const CHART_SERIES = [
  { key: 'sales' as const, label: 'Total Sales', mark: 'bars' as const, color: COMBO.sales },
  { key: 'spend' as const, label: 'Ad Spend', mark: 'line' as const, color: COMBO.spend },
  { key: 'tacos' as const, label: 'TACOS', mark: 'line' as const, color: COMBO.tacos },
];

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
  neutral = false,
}: {
  v: number;
  invert?: boolean;
  unit?: 'pct' | 'pts';
  /** For measures where neither direction is self-evidently good, like spend. */
  neutral?: boolean;
}) {
  const good = invert ? v < 0 : v >= 0;
  return (
    <span className={neutral ? styles.flat : good ? styles.up : styles.down}>
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
  neutral,
  note,
}: {
  label: string;
  value: string;
  prior?: string;
  priorLabel?: string;
  change?: number;
  invert?: boolean;
  unit?: 'pct' | 'pts';
  neutral?: boolean;
  note?: string;
}) {
  return (
    <div className={styles.score}>
      <div className={styles.scoreLabel}>{label}</div>
      <div className={styles.scoreValue}>{value}</div>
      {prior && (
        <div className={styles.scorePrior}>
          <span>{priorLabel}: {prior}</span>
          {change !== undefined && <Delta v={change} invert={invert} unit={unit} neutral={neutral} />}
        </div>
      )}
      {note && <div className={styles.scoreNote}>{note}</div>}
    </div>
  );
}

export default function GovinoReport() {
  // All three series drawn by default; a chip takes one off the chart.
  const [shown, setShown] = useState({ sales: true, spend: true, tacos: true });
  const toggle = (k: 'sales' | 'spend' | 'tacos') =>
    setShown((prev) => ({ ...prev, [k]: !prev[k] }));

  const partialQ = PAIRED_QUARTERS.find((q) => q.partial);

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
            August 2026 against August 2025, with the year so far by quarter beneath it. Total
            sales is ordered product sales across the govino catalogue, advertised and organic
            together.
          </p>
          <div className={styles.stamp}>
            <span>Account: The Beauty Box (US)</span>
            <span>{ASIN_COUNT} govino ASINs</span>
            <span>Data through {DATA_THROUGH}</span>
          </div>
        </header>


            <section className={styles.section}>
              <SectionHead title="August 2026 at a glance" />
              <p className={styles.body}>
                The latest complete month, against August 2025.
              </p>

              <div className={styles.scoreGrid}>
                {METRICS.map((m) => {
                  const v = AUG_2026[m.key];
                  const p = AUG_2025[m.key];
                  return (
                    <Score
                      key={m.key}
                      label={m.label}
                      value={m.fmt(v)}
                      prior={m.fmt(p)}
                      priorLabel="Aug 2025"
                      change={m.unit === 'pct' ? v - p : ((v - p) / p) * 100}
                      unit={m.unit === 'pct' ? 'pts' : 'pct'}
                      invert={m.lowerIsBetter}
                      neutral={m.neutral}
                      note={m.note?.(AUG_2026, AUG_2025)}
                    />
                  );
                })}
              </div>
            </section>

            <section className={styles.section}>
              <SectionHead title="By quarter, 2026 against 2025" />
              <p className={styles.body}>
                Click a series to put it on the chart or take it off.{' '}
                {partialQ
                  ? `${partialQ.label} covers ${partialQ.span} only, since September is not yet complete.`
                  : ''}
              </p>

              <div className={styles.toggleRow} role="group" aria-label="Series shown">
                {CHART_SERIES.map((c) => {
                  const on = shown[c.key];
                  return (
                    <button
                      key={c.key}
                      type="button"
                      aria-pressed={on}
                      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
                      onClick={() => toggle(c.key)}
                    >
                      <span
                        className={c.mark === 'bars' ? styles.toggleDot : styles.toggleLine}
                        style={{ background: on ? c.color : 'transparent', borderColor: c.color }}
                        aria-hidden="true"
                      />
                      {c.label}
                    </button>
                  );
                })}
                <YearKey />
              </div>

              {/* Sales and spend are both dollars and share the upper plot. TACOS
                  is a rate, so it gets its own plot below rather than a second
                  y-axis, which would let the crossings be set by axis placement
                  rather than by the data. */}
              <div className={styles.card}>
                <ComboChart
                  data={PAIRED_QUARTERS.map((q) => ({
                    label: q.partial ? `${q.label} (${q.span})` : q.label,
                    sales: q.now.gross,
                    salesPrior: q.before.gross,
                    spend: q.now.spend,
                    spendPrior: q.before.spend,
                    tacos: q.now.tacos,
                    tacosPrior: q.before.tacos,
                  }))}
                  show={shown}
                  caption="Sales and spend in dollars above, TACOS below. Each quarter compares the same months in both years."
                />
              </div>

              {!shown.sales && !shown.spend && !shown.tacos && (
                <p className={styles.body}>Nothing selected. Pick a series above to draw it.</p>
              )}
            </section>

        <section className={styles.section}>
          <SectionHead title="What this tells us" />

          <div className={styles.insights}>
            <div className={styles.insight}>
              <div className={styles.insightNum}>01</div>
              <div>
                <h3 className={styles.insightTitle}>We bought the growth on purpose</h3>
                <p className={styles.insightBody}>
                  Sales for January to August are <strong>{usd(YTD_2026.gross)}</strong>, up{' '}
                  <strong>{signedPct(YOY.gross)}</strong> on the same eight months of 2025, on{' '}
                  <strong>{num(YTD_2026.units)} units</strong>. That growth was bought: we put{' '}
                  <strong>{usd(YTD_2026.spend)}</strong> behind the brand against{' '}
                  {usd(YTD_2025.spend)} last year, an increase of{' '}
                  <strong>{signedPct(YOY.spend)}</strong>. The aggression was deliberate, taken to
                  win rank on the core stemless range while the category was still winnable, and
                  Q1 and Q2 both grew more than 50%. The cost of it shows in TACOS, which ran{' '}
                  {pct(YTD_2026.tacos)} against {pct(YTD_2025.tacos)} a year earlier.
                </p>
              </div>
            </div>

            <div className={styles.insight}>
              <div className={styles.insightNum}>02</div>
              <div>
                <h3 className={styles.insightTitle}>
                  August is where we started finding the balance
                </h3>
                <p className={styles.insightBody}>
                  August was the first month we pulled back to test what the brand holds without
                  full support. Spend came in at <strong>{usd(AUG_2026.spend)}</strong>, sales
                  still grew{' '}
                  <strong>{signedPct(((AUG_2026.gross - AUG_2025.gross) / AUG_2025.gross) * 100)}</strong>{' '}
                  year on year, at {pct(AUG_2026.acos)} ACOS and {pct(AUG_2026.tacos)} TACOS. The
                  early September read is better still: <strong>{pct(SEP_MTD.acos)} ACOS</strong>{' '}
                  and <strong>{pct(SEP_MTD.tacos)} TACOS</strong> across {SEP_MTD.label}. That is
                  only {SEP_MTD.days} days, so we would not bank it yet, but it points the way we
                  hoped it would.
                </p>
              </div>
            </div>

            <div className={styles.insight}>
              <div className={styles.insightNum}>03</div>
              <div>
                <h3 className={styles.insightTitle}>The decision we need to make together</h3>
                <p className={styles.insightBody}>
                  There are two honest paths from here and they lead to different places.{' '}
                  <strong>Invest significantly more</strong> and we push for another step change
                  through Q4, the strongest quarter of govino&apos;s year: faster growth, thinner
                  margin, and it needs stock behind it. <strong>Hold the balance</strong> we have
                  been finding since August and growth slows to something steadier, but it comes
                  with profit attached. Neither is the wrong answer. We would like to put a meeting
                  in the diary and choose deliberately rather than drift into it.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
