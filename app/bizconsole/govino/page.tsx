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
import { IndexLines, SERIES_COLORS } from './charts';
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
  /** Fixed hue, assigned in order and never cycled. */
  color: string;
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
    color: SERIES_COLORS[0],
    label: 'Total Sales',
    unit: 'usd',
    fmt: (n) => usd(n),
    caption: 'Ordered product sales, advertised and organic',
  },
  {
    key: 'units',
    color: SERIES_COLORS[1],
    label: 'Total Units',
    unit: 'count',
    fmt: (n) => num(n),
    caption: 'Units ordered',
  },
  {
    key: 'tacos',
    color: SERIES_COLORS[2],
    label: 'TACOS',
    unit: 'pct',
    lowerIsBetter: true,
    fmt: (n) => pct(n),
    caption: 'Ad spend as a share of all sales',
    note: () => 'Ad spend as a share of all sales',
  },
  {
    key: 'spend',
    color: SERIES_COLORS[3],
    label: 'Ad Spend',
    unit: 'usd',
    neutral: true,
    fmt: (n) => usd(n),
    caption: 'Sponsored Products and Sponsored Display',
  },
  {
    key: 'ppcSales',
    color: SERIES_COLORS[4],
    label: 'Ad Attributed Sales',
    unit: 'usd',
    fmt: (n) => usd(n),
    caption: 'Sales on a 14-day click attribution',
  },
  {
    key: 'acos',
    color: SERIES_COLORS[5],
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
  // Every metric drawn by default; clicking a chip hides or restores its panel.
  const [shown, setShown] = useState<Set<MetricKey>>(new Set(METRICS.map((m) => m.key)));
  const toggle = (k: MetricKey) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

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
              <SectionHead title="2026 by quarter" />
              <p className={styles.body}>
                Click a metric to put it on the chart or take it off.{' '}
                {partialQ
                  ? `${partialQ.label} covers ${partialQ.span} only, since September is not yet complete.`
                  : ''}
              </p>

              <div className={styles.toggleRow} role="group" aria-label="Metrics shown">
                {METRICS.map((m) => {
                  const on = shown.has(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      aria-pressed={on}
                      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
                      onClick={() => toggle(m.key)}
                    >
                      <span
                        className={styles.toggleDot}
                        style={{ background: on ? m.color : 'transparent', borderColor: m.color }}
                        aria-hidden="true"
                      />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* One chart. The chips above are the legend: each carries its
                  metric's colour, so identity is never colour-alone. */}
              <div className={styles.card}>
                <div className={styles.cardHead}>Indexed to Q1 2026 = 100</div>
                <div className={styles.cardSub}>
                  These six measures are dollars, unit counts and percentages, so they have no
                  shared scale. Each is indexed to its own Q1, which puts them on one axis and shows
                  which moved furthest. Hover a quarter for the real numbers.
                </div>
                <IndexLines
                  labels={PAIRED_QUARTERS.map((q) => (q.partial ? `${q.label} (${q.span})` : q.label))}
                  series={METRICS.filter((m) => shown.has(m.key)).map((m) => {
                    const base = PAIRED_QUARTERS[0].now[m.key];
                    return {
                      name: m.label,
                      color: m.color,
                      index: PAIRED_QUARTERS.map((q) => (q.now[m.key] / base) * 100),
                      display: PAIRED_QUARTERS.map((q) => m.fmt(q.now[m.key])),
                    };
                  })}
                  caption="govino 2026 by quarter, each metric indexed to its own Q1"
                />
              </div>

              {shown.size === 0 && (
                <p className={styles.body}>No metrics selected. Pick one above to draw it.</p>
              )}
            </section>

        <section className={styles.section}>
          <SectionHead title="What this tells us" />

          <div className={styles.insights}>
            <div className={styles.insight}>
              <div className={styles.insightNum}>01</div>
              <div>
                <h3 className={styles.insightTitle}>
                  We bought the growth on purpose
                </h3>
                <p className={styles.insightBody}>
                  Sales for January to August are{' '}
                  <strong>{usd(YTD_2026.gross)}</strong>, up{' '}
                  <strong>{signedPct(YOY.gross)}</strong> on the same eight months of 2025, on{' '}
                  <strong>{num(YTD_2026.units)} units</strong> ({signedPct(YOY.units)}). That did
                  not happen on its own: we put <strong>{usd(YTD_2026.spend)}</strong> behind the
                  brand against {usd(YTD_2025.spend)} last year, an increase of{' '}
                  <strong>{signedPct(YOY.spend)}</strong>. It was a deliberately aggressive
                  position, taken to win rank and sales velocity on the core stemless range while
                  the category was still winnable, and it worked — Q1 and Q2 both grew more than
                  50% year on year. The cost of that choice is visible in the same numbers: TACOS
                  ran {pct(YTD_2026.tacos)} across the eight months against {pct(YTD_2025.tacos)} a
                  year earlier. Growth of this shape is bought, and we were the ones buying it.
                </p>
              </div>
            </div>

            <div className={styles.insight}>
              <div className={styles.insightNum}>02</div>
              <div>
                <h3 className={styles.insightTitle}>
                  August was the month we started looking for the balance
                </h3>
                <p className={styles.insightBody}>
                  Having established position, August was the first month we pulled back to test
                  what the brand holds without full support. Spend came in at{' '}
                  <strong>{usd(AUG_2026.spend)}</strong> and sales still grew{' '}
                  <strong>{signedPct(((AUG_2026.gross - AUG_2025.gross) / AUG_2025.gross) * 100)}</strong>{' '}
                  year on year, at {pct(AUG_2026.acos)} ACOS and {pct(AUG_2026.tacos)} TACOS. The
                  early September read is the more encouraging one:{' '}
                  <strong>{pct(SEP_MTD.acos)} ACOS</strong> and{' '}
                  <strong>{pct(SEP_MTD.tacos)} TACOS</strong> across {SEP_MTD.label}, on{' '}
                  {usd(SEP_MTD.gross)} of sales. Both are the best efficiency the brand has seen
                  since April. That is only {SEP_MTD.days} days and it can move, so we would not
                  bank it yet — but it points the way we hoped it would.
                </p>
              </div>
            </div>

            <div className={styles.insight}>
              <div className={styles.insightNum}>03</div>
              <div>
                <h3 className={styles.insightTitle}>
                  The decision we need to make together
                </h3>
                <p className={styles.insightBody}>
                  There are two honest paths from here and they lead to different places, so we
                  would like to put a meeting in the diary and choose one deliberately rather than
                  drift into it. <strong>Invest significantly more</strong> and we push for another
                  step change in share through Q4, the strongest quarter of govino&apos;s year —
                  faster growth, thinner margin, and it needs stock behind it.{' '}
                  <strong>Hold the sustainable balance</strong> we have been finding since August
                  and growth slows to something steadier, but it comes with profit attached rather
                  than being spent back into the channel. Neither is the wrong answer. The choice
                  depends on what govino wants this brand to be worth in twelve months, which is
                  yours to make, not ours — and it is easier to make now than in November.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
