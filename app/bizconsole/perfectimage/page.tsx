'use client';

/**
 * Perfect Image LLC — Amazon channel diligence dashboard.
 *
 * Open route by design: this sits under /bizconsole/perfectimage and is not
 * behind the console sign-in, so it can be opened in a meeting or sent as a
 * link without provisioning an account for the reader.
 *
 * The dashboard argues rather than lists. Section order is
 * what happened -> where -> what broke -> why -> what breaks next ->
 * what the physical evidence confirms -> so what.
 */

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './perfectimage.module.css';
import {
  perfectImage as D,
  MONTHS,
  MONTH_LABEL,
  REMOVAL_MARKERS,
  ProductStatus,
  acceptanceChecks,
  fy2025Total,
  y2026Total,
  runRateTotal,
  units2025,
  units2026,
  usd,
  pct,
  num,
  sum,
  AD_SPEND_2026_ANNUALIZED,
  AD_SPEND_2026_CALENDAR,
  UNDERLYING_DETERIORATION,
  EXPOSED_RUN_RATE,
  EXPOSED_SHARE,
  AMAZON_AT_RISK_TOTAL,
  REMOVED_FY2025_REVENUE,
  REMOVED_SHARE_OF_CHANNEL,
  JAN_JUL_2025,
  JAN_JUL_2026,
  ASP_2025,
  ASP_2026,
} from '@/lib/perfectImage';
import {
  Comment,
  SECTIONS,
  SectionId,
  Stance,
  STANCE_LABEL,
  comments as allComments,
} from '@/lib/perfectImageComments';
import {
  MonthlyBarLine,
  StackedSplit,
  Waterfall,
  WaterfallStep,
  Sparkline,
  Donut,
  Timeline,
  TimelineEvent,
  EventBars,
  BUCKET_COLORS,
} from './charts';

// -------------------------------------------------------------------------
// Static labels
// -------------------------------------------------------------------------

const STATUS_LABEL: Record<ProductStatus, string> = {
  clean: 'Clean',
  watch: 'Watch',
  impaired: 'Impaired',
  at_risk_family: 'At risk — family',
  at_risk_cited: 'At risk — cited',
  at_risk_high: 'At risk — at cap',
  removed: 'Removed',
};

const STATUS_CLASS: Record<ProductStatus, string> = {
  clean: styles.pillClean,
  watch: styles.pillWatch,
  impaired: styles.pillImpaired,
  at_risk_family: styles.pillRiskFamily,
  at_risk_cited: styles.pillRiskCited,
  at_risk_high: styles.pillRiskHigh,
  removed: styles.pillRemoved,
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'clean', label: 'Clean' },
  { id: 'risk', label: 'At risk' },
  { id: 'removed', label: 'Removed' },
] as const;
type FilterId = (typeof FILTERS)[number]['id'];

type SortKey = 'product' | 'fy2025' | 'y2026_to_20aug' | 'run_rate' | 'delta' | 'status';

const LENSES: { id: Stance | 'all'; label: string }[] = [
  { id: 'all', label: 'All commentary' },
  { id: 'buyer', label: STANCE_LABEL.buyer },
  { id: 'seller', label: STANCE_LABEL.seller },
  { id: 'flag', label: STANCE_LABEL.flag },
  { id: 'verified', label: STANCE_LABEL.verified },
  { id: 'ask', label: STANCE_LABEL.ask },
  { id: 'withdrawn', label: STANCE_LABEL.withdrawn },
];

// -------------------------------------------------------------------------
// Small presentational pieces
// -------------------------------------------------------------------------

function Kpi({
  label,
  y2025,
  y2026,
  change,
  changeTone,
  note,
  flag,
}: {
  label: string;
  y2025: string;
  y2026: string;
  change?: string;
  changeTone?: 'up' | 'down' | 'flat';
  note?: string;
  flag?: string;
}) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>
        {label}
        {flag && <span className={styles.unconfirmed}>{flag}</span>}
      </div>
      <div className={styles.kpiRow}>
        <span className={styles.kpiMini}>FY2025</span>
        <span className={styles.kpiMini}>2026 to 20 Aug</span>
        <span className={styles.kpiValueSm}>{y2025}</span>
        <span className={styles.kpiValue}>{y2026}</span>
      </div>
      {change && (
        <div
          className={`${styles.kpiChange} ${
            changeTone === 'up' ? styles.up : changeTone === 'down' ? styles.down : ''
          }`}
        >
          {change}
        </div>
      )}
      {note && <p className={styles.kpiNote}>{note}</p>}
    </div>
  );
}

function CommentCard({ c }: { c: Comment }) {
  return (
    <article className={`${styles.comment} ${styles[`stance_${c.stance}`]}`}>
      <header className={styles.commentHead}>
        <span className={styles.stanceTag}>{STANCE_LABEL[c.stance]}</span>
        {c.figure && <span className={styles.commentFigure}>{c.figure}</span>}
        {c.internal && <span className={styles.internalTag}>Internal</span>}
      </header>
      <h4 className={styles.commentTitle}>{c.title}</h4>
      <p className={styles.commentBody}>{c.body}</p>
      {c.evidence && <p className={styles.commentEvidence}>{c.evidence}</p>}
    </article>
  );
}

function SectionHead({ n, title, answers }: { n: number; title: string; answers: string }) {
  return (
    <header className={styles.sectionHead}>
      <span className={styles.sectionNum}>{String(n).padStart(2, '0')}</span>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionAnswers}>{answers}</p>
      </div>
    </header>
  );
}

// -------------------------------------------------------------------------
// Page
// -------------------------------------------------------------------------

export default function PerfectImageDashboard() {
  const [lens, setLens] = useState<Stance | 'all'>('all');
  const [redacted, setRedacted] = useState(false);
  const [filter, setFilter] = useState<FilterId>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('fy2025');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [lostBuckets, setLostBuckets] = useState<string[]>([
    'At the concentration cap, not yet cited',
  ]);
  const [hoverBucket, setHoverBucket] = useState<string | null>(null);
  const [showChecks, setShowChecks] = useState(false);

  const checks = useMemo(() => acceptanceChecks(), []);
  const checksPass = checks.every((c) => c.ok);

  const visibleComments = useMemo(
    () =>
      allComments.filter(
        (c) => (lens === 'all' || c.stance === lens) && !(redacted && c.internal)
      ),
    [lens, redacted]
  );
  const notes = (section: SectionId) => visibleComments.filter((c) => c.section === section);

  // --- Section 1 series ---------------------------------------------------
  const monthlyPoints = useMemo(
    () =>
      D.monthly.map((m) => ({
        month: m.month,
        label: MONTH_LABEL[m.month],
        gross: m.gross_sales,
        units: m.units,
        partial: m.month === '2026-08',
      })),
    []
  );

  const ad = D.ad_spend;

  /** Jan-Jul, the one clean like-for-like window: seven full months in both years. */
  const janJul = useMemo(() => {
    const slice = (year: string) =>
      D.monthly.filter((m) => m.month.startsWith(year) && Number(m.month.slice(5)) <= 7);
    const fold = (year: string) => {
      const rows = slice(year);
      const gross = sum(rows.map((m) => m.gross_sales));
      const units = sum(rows.map((m) => m.units));
      return { gross, units, asp: gross / units };
    };
    return { y2025: fold('2025'), y2026: fold('2026') };
  }, []);

  // --- Section 2 table ----------------------------------------------------
  const rows = useMemo(() => {
    const withDelta = D.products.map((p) => ({
      ...p,
      delta: p.fy2025 > 0 ? ((p.run_rate - p.fy2025) / p.fy2025) * 100 : 0,
    }));
    const q = search.trim().toLowerCase();
    const filtered = withDelta.filter((p) => {
      const inFilter =
        filter === 'all'
          ? true
          : filter === 'clean'
          ? p.status === 'clean'
          : filter === 'removed'
          ? p.status === 'removed'
          : p.status !== 'clean' && p.status !== 'removed';
      const inSearch =
        !q ||
        p.product.toLowerCase().includes(q) ||
        p.asin.toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q) ||
        p.why.toLowerCase().includes(q);
      return inFilter && inSearch;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      if (sortKey === 'product') return a.product.localeCompare(b.product) * dir;
      if (sortKey === 'status') return a.status.localeCompare(b.status) * dir;
      return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
    });
  }, [filter, search, sortKey, sortDir]);

  const shownTotals = useMemo(
    () => ({
      fy2025: sum(rows.map((r) => r.fy2025)),
      y2026: sum(rows.map((r) => r.y2026_to_20aug)),
      runRate: sum(rows.map((r) => r.run_rate)),
    }),
    [rows]
  );

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'product' || key === 'status' ? 'asc' : 'desc');
    }
  };

  // --- Section 3 waterfall ------------------------------------------------
  const waterfall: WaterfallStep[] = useMemo(() => {
    const removed = D.products.filter((p) => p.status === 'removed');
    const rest = D.products.filter((p) => p.status !== 'removed');
    const removedDelta = sum(removed.map((p) => p.run_rate - p.fy2025));
    const declines = rest.filter((p) => p.run_rate < p.fy2025);
    const growth = rest.filter((p) => p.run_rate >= p.fy2025);
    return [
      { label: 'FY2025', value: fy2025Total, kind: 'total', detail: 'settlement gross' },
      {
        label: 'Enforcement removals',
        value: removedDelta,
        kind: 'removed',
        detail: `${removed.filter((p) => p.asin !== 'B018IVXS1K / B08S5CNFKL').length} SKUs to zero`,
      },
      {
        label: 'Declines',
        value: sum(declines.map((p) => p.run_rate - p.fy2025)),
        kind: 'decline',
        detail: `${declines.length} live SKUs`,
      },
      {
        label: 'Growth',
        value: sum(growth.map((p) => p.run_rate - p.fy2025)),
        kind: 'growth',
        detail: `${growth.length} live SKUs`,
      },
      { label: 'Run rate', value: runRateTotal, kind: 'total', detail: 'May–Jul 2026 × 4' },
    ];
  }, []);

  const gone = useMemo(
    () =>
      D.products
        .filter((p) => p.status === 'removed' && p.asin !== 'B018IVXS1K / B08S5CNFKL')
        .sort((a, b) => b.fy2025 - a.fy2025),
    []
  );

  const relisted = D.products.find((p) => p.asin === 'B006ZA0A5Y')!;

  // --- Section 4 timeline -------------------------------------------------
  const { lanes, timelineEvents } = useMemo(() => {
    const asinSet = new Set<string>();
    D.violations.forEach((v) => asinSet.add(v.asin));
    D.listing_status_events.forEach((e) => asinSet.add(e.asin));
    const productFor = (asin: string) =>
      D.products.find((p) => p.asin.split('/').map((a) => a.trim()).includes(asin));
    const laneList = Array.from(asinSet)
      .map((asin) => ({ asin, product: productFor(asin)?.product ?? 'Unmapped ASIN' }))
      .sort((a, b) => (productFor(b.asin)?.fy2025 ?? 0) - (productFor(a.asin)?.fy2025 ?? 0));

    const evs: TimelineEvent[] = [
      ...D.violations.map<TimelineEvent>((v) => ({
        date: v.date,
        asin: v.asin,
        kind: 'violation',
        label: `Violation — ${v.category}`,
        detail: v.note,
      })),
      ...D.listing_status_events.map<TimelineEvent>((e) => ({
        date: e.date,
        asin: e.asin,
        kind:
          e.status === 'Removed' ? 'removed' : e.status === 'At risk' ? 'at_risk' : 'deactivated',
        label: e.status,
        detail: e.reason,
      })),
    ];
    return { lanes: laneList, timelineEvents: evs };
  }, []);

  const octoberSweep = D.violations.filter((v) => v.date.startsWith('2024-10'));

  // --- Section 5 scenario -------------------------------------------------
  const buckets = D.exposure_buckets;
  const lostRevenue = sum(
    buckets.filter((b) => lostBuckets.includes(b.bucket)).map((b) => b.run_rate)
  );
  const sdeImpact = lostRevenue * 0.5;
  const valueImpact = sdeImpact * 2.5;
  const toggleBucket = (b: string) =>
    setLostBuckets((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  // --- Section 6 ----------------------------------------------------------
  const liquidationTotals = useMemo(
    () => ({
      events: sum(D.liquidations.map((l) => l.events)),
      units: sum(D.liquidations.map((l) => l.units)),
      proceeds: sum(D.liquidations.map((l) => l.proceeds)),
    }),
    []
  );
  const disposalFee = D.fba_fees.find((f) => f.item === 'FBA Removal Order: Disposal Fee')!;
  const returnFee = D.fba_fees.find((f) => f.item === 'FBA Removal Order: Return Fee')!;
  const storageFees = sum(
    D.fba_fees.filter((f) => /storage/i.test(f.item)).map((f) => Math.abs(f.amount))
  );
  const reimbursements = sum(D.adjustments.map((a) => a.amount));
  const removalMonths = D.removal_orders_by_month.map((r) => ({
    month: r.month,
    label: MONTH_LABEL[r.month] ?? r.month,
    value: r.events,
  }));

  return (
    <div className={styles.page}>
      {/* ---------------------------------------------------------------- */}
      <header className={styles.masthead}>
        <div className={styles.mastheadTop}>
          <div>
            <p className={styles.eyebrow}>Buy-side diligence · Amazon channel</p>
            <h1 className={styles.title}>Perfect Image LLC</h1>
            <p className={styles.subtitle}>
              Settlement window {D.meta.settlement_window} · analysis {D.meta.generated} · every
              figure reconciles to Amazon&apos;s own settlement data
            </p>
          </div>
          <div className={styles.mastheadActions}>
            <Link href="/bizconsole" className={styles.backLink}>
              ← Business Console
            </Link>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={redacted}
                onChange={(e) => setRedacted(e.target.checked)}
              />
              <span>Seller-facing view</span>
            </label>
            <button type="button" className={styles.printBtn} onClick={() => window.print()}>
              Print / PDF
            </button>
          </div>
        </div>

        <nav className={styles.sectionNav}>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={styles.navChip}>
              <span>{String(s.n).padStart(2, '0')}</span> {s.title}
            </a>
          ))}
        </nav>

        <div className={styles.lensBar}>
          <span className={styles.lensLabel}>Commentary lens</span>
          {LENSES.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`${styles.lensChip} ${lens === l.id ? styles.lensChipOn : ''}`}
              onClick={() => setLens(l.id)}
            >
              {l.label}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.checkBadge} ${checksPass ? styles.checkPass : styles.checkFail}`}
            onClick={() => setShowChecks((v) => !v)}
          >
            {checksPass
              ? `${checks.length}/${checks.length} reconciliation checks pass`
              : 'RECONCILIATION FAILED'}
          </button>
        </div>

        {showChecks && (
          <ul className={styles.checkList}>
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? styles.checkOk : styles.checkBad}>
                <span>{c.ok ? '✓' : '✕'}</span>
                <span>{c.label}</span>
                <span className={styles.checkActual}>
                  {c.ok ? 'ties' : `got ${c.actual.toLocaleString('en-US')}`}
                </span>
              </li>
            ))}
          </ul>
        )}

        {redacted && (
          <p className={styles.redactedNote}>
            Seller-facing view: our own price working and negotiating posture are hidden. Every
            finding drawn from the seller&apos;s own account data stays on the page.
          </p>
        )}
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* 1. Headline                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section id="headline" className={styles.section}>
        <SectionHead n={1} title="Headline: total sales, ad spend, organic" answers="What happened at the top line" />

        <div className={styles.kpiGrid}>
          <Kpi
            label="Amazon gross sales"
            y2025={usd(fy2025Total)}
            y2026={usd(y2026Total)}
            change={`Run rate ${usd(runRateTotal)} · ${pct(-7.0)} vs FY2025`}
            changeTone="down"
            note="Different period lengths. Compare on run rate or like-for-like, never head to head."
          />
          <Kpi
            label="Ad-attributed (PPC) sales"
            y2025={usd(ad.ppc_sales_2025)}
            y2026={usd(ad.ppc_sales_2026_to_aug)}
            change={`31.9% → 46.9% of gross`}
            changeTone="down"
            note="Seller-supplied, both years. Nearly half of Amazon revenue is now bought."
          />
          <Kpi
            label="Organic sales"
            y2025={usd(ad.organic_sales_2025)}
            y2026={usd(ad.organic_sales_2026_to_aug)}
            change={`${ad.organic_share_2025}% → ${ad.organic_share_2026}% of gross · ${pct(
              ad.like_for_like_jan_to_20aug.organic_chg_pct
            )} like-for-like`}
            changeTone="down"
            note="Measured on both years now: gross sales minus ad-attributed sales."
          />
          <Kpi
            label="Units"
            y2025={num(units2025)}
            y2026={num(units2026)}
            change={`Jan–Jul like-for-like ${pct(-13.8)}`}
            changeTone="down"
            note={`ASP $${ASP_2025.toFixed(2)} → $${ASP_2026.toFixed(2)} (${pct(9.1)}). Price is holding the line, not demand.`}
          />
        </div>

        <div className={styles.miniRow}>
          <div className={styles.mini}>
            <span>Amazon ad spend 2025</span>
            <strong>{usd(ad.ad_spend_2025)}</strong>
          </div>
          <div className={styles.mini}>
            <span>Ad spend 2026 to 20 Aug</span>
            <strong className={styles.bad}>{usd(ad.ad_spend_2026_to_aug)}</strong>
          </div>
          <div className={styles.mini}>
            <span>Annualized on run rate</span>
            <strong className={styles.bad}>
              ~{usd(AD_SPEND_2026_ANNUALIZED)} <span className={styles.miniDelta}>+58%</span>
            </strong>
          </div>
          <div className={styles.mini}>
            <span>ROAS</span>
            <strong>
              {ad.roas_2025.toFixed(2)}x <span className={styles.miniDelta}>→ {ad.roas_2026.toFixed(2)}x</span>
            </strong>
          </div>
          <div className={styles.mini}>
            <span>ACOS</span>
            <strong>
              {ad.acos_2025}% <span className={styles.miniDelta}>→ {ad.acos_2026}%</span>
            </strong>
          </div>
          <div className={styles.mini}>
            <span>TACOS</span>
            <strong className={styles.good}>
              {ad.tacos_2025}% <span className={styles.miniDeltaBad}>→ {ad.tacos_2026}%</span>
            </strong>
          </div>
        </div>

        <div className={styles.restated}>
          <h4>Restated 31 Aug 2026, on the seller&apos;s confirmation</h4>
          <p>{ad.resolved}</p>
          <ul>
            {ad.withdrawn.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p className={styles.restatedFoot}>
            A calendar annualization of the $99,000 over 7.65 months gives ~{usd(AD_SPEND_2026_CALENDAR)} (+72%);
            the {usd(AD_SPEND_2026_ANNUALIZED)} above carries the 15.7% TACOS onto the May–Jul run
            rate, which is the basis every other annualized figure here uses.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Monthly gross sales and units, Jan 2025 – Aug 2026</h3>
            <div className={styles.legend}>
              <span className={styles.legGross}>Gross sales</span>
              <span className={styles.legUnits}>Units</span>
              <span className={styles.legMark}>Removal dates</span>
            </div>
          </div>
          <MonthlyBarLine data={monthlyPoints} markers={REMOVAL_MARKERS} />
          <p className={styles.caption}>
            August 2026 is a partial month, to 20 Aug (hatched). Dashed markers are the three
            enforcement removals: 20 Nov 2025 (B006ZA0A5Y), 17 Dec 2025 (B006ZBP8NM) and 19 May
            2026 (B06XY9XL5H). Like-for-like Jan–Jul: {usd(JAN_JUL_2025)} → {usd(JAN_JUL_2026)},{' '}
            {pct(-6.0)}.
          </p>
        </div>

        <div className={styles.splitGrid}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Organic and paid, full periods</h3>
              <div className={styles.legend}>
                <span className={styles.legOrganic}>Organic</span>
                <span className={styles.legPaid}>Ad-attributed</span>
              </div>
            </div>
            <StackedSplit
              columns={[
                {
                  label: 'FY2025',
                  sub: `${ad.organic_share_2025}% organic`,
                  organic: ad.organic_sales_2025,
                  paid: ad.ppc_sales_2025,
                },
                {
                  label: '2026 to 20 Aug',
                  sub: `${ad.organic_share_2026}% organic`,
                  organic: ad.organic_sales_2026_to_aug,
                  paid: ad.ppc_sales_2026_to_aug,
                },
              ]}
            />
            <p className={styles.caption}>
              Organic = gross − ad-attributed sales, measured on both years. The paid block grows
              in absolute dollars on a smaller top line: $294,966 of 2026 gross is bought, against
              $311,000 out of a year half as long again in 2025.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Like-for-like, Jan – 20 Aug</h3>
            </div>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Jan – 20 Aug</th>
                  <th className={styles.numCol}>2025</th>
                  <th className={styles.numCol}>2026</th>
                  <th className={styles.numCol}>Change</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total gross</td>
                  <td className={styles.numCol}>{usd(ad.like_for_like_jan_to_20aug.total_2025)}</td>
                  <td className={styles.numCol}>{usd(ad.like_for_like_jan_to_20aug.total_2026)}</td>
                  <td className={`${styles.numCol} ${styles.down}`}>
                    {pct(ad.like_for_like_jan_to_20aug.total_chg_pct)}
                  </td>
                </tr>
                <tr>
                  <td>Ad-attributed</td>
                  <td className={styles.numCol}>{usd(ad.like_for_like_jan_to_20aug.paid_2025)}</td>
                  <td className={styles.numCol}>{usd(ad.like_for_like_jan_to_20aug.paid_2026)}</td>
                  <td className={`${styles.numCol} ${styles.bad}`}>
                    {pct(ad.like_for_like_jan_to_20aug.paid_chg_pct)}
                  </td>
                </tr>
                <tr className={styles.rowEmphasis}>
                  <td>Organic</td>
                  <td className={styles.numCol}>{usd(ad.like_for_like_jan_to_20aug.organic_2025)}</td>
                  <td className={styles.numCol}>{usd(ad.like_for_like_jan_to_20aug.organic_2026)}</td>
                  <td className={`${styles.numCol} ${styles.bad}`}>
                    {pct(ad.like_for_like_jan_to_20aug.organic_chg_pct)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className={styles.caption}>
              2025 paid is apportioned to the Jan – 20 Aug window pro-rata on gross sales; the
              seller has supplied full-year PPC sales only.
            </p>

            <h4 className={styles.subHead}>Jan–Jul basis — seven full months, both years</h4>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Jan–Jul</th>
                  <th className={styles.numCol}>2025</th>
                  <th className={styles.numCol}>2026</th>
                  <th className={styles.numCol}>Change</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Gross sales</td>
                  <td className={styles.numCol}>{usd(janJul.y2025.gross)}</td>
                  <td className={styles.numCol}>{usd(janJul.y2026.gross)}</td>
                  <td className={`${styles.numCol} ${styles.down}`}>
                    {pct(((janJul.y2026.gross - janJul.y2025.gross) / janJul.y2025.gross) * 100)}
                  </td>
                </tr>
                <tr className={styles.rowEmphasis}>
                  <td>Units</td>
                  <td className={styles.numCol}>{num(janJul.y2025.units)}</td>
                  <td className={styles.numCol}>{num(janJul.y2026.units)}</td>
                  <td className={`${styles.numCol} ${styles.down}`}>
                    {pct(((janJul.y2026.units - janJul.y2025.units) / janJul.y2025.units) * 100)}
                  </td>
                </tr>
                <tr>
                  <td>Average selling price</td>
                  <td className={styles.numCol}>${janJul.y2025.asp.toFixed(2)}</td>
                  <td className={styles.numCol}>${janJul.y2026.asp.toFixed(2)}</td>
                  <td className={`${styles.numCol} ${styles.up}`}>
                    {pct(((janJul.y2026.asp - janJul.y2025.asp) / janJul.y2025.asp) * 100)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className={styles.caption}>
              Units are falling at twice the rate of revenue. Price, not demand, is holding the
              revenue line.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Channel split — the P&amp;L advertising line, less Amazon</h3>
          </div>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th></th>
                <th className={styles.numCol}>Total ad (P&amp;L)</th>
                <th className={styles.numCol}>Amazon</th>
                <th className={styles.numCol}>Non-Amazon</th>
                <th className={styles.numCol}>Shopify revenue</th>
                <th className={styles.numCol}>Implied Shopify TACOS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2025</td>
                <td className={styles.numCol}>{usd(ad.pnl_advertising_2025)}</td>
                <td className={styles.numCol}>{usd(ad.ad_spend_2025)}</td>
                <td className={styles.numCol}>{usd(ad.non_amazon_ad_2025)}</td>
                <td className={styles.numCol}>{usd(ad.shopify_revenue_2025)}</td>
                <td className={`${styles.numCol} ${styles.warn}`}>{ad.implied_shopify_tacos_2025}%</td>
              </tr>
              <tr>
                <td>2026 stub</td>
                <td className={styles.numCol}>{usd(ad.pnl_advertising_2026_stub)}</td>
                <td className={styles.numCol}>
                  {usd(ad.ad_spend_2026_to_aug)} <span className={styles.confirmed}>confirmed</span>
                </td>
                <td className={styles.numCol}>{usd(ad.non_amazon_ad_2026)}</td>
                <td className={styles.numCol}>{usd(ad.shopify_revenue_2026_stub)}</td>
                <td className={`${styles.numCol} ${styles.warn}`}>{ad.implied_shopify_tacos_2026}%</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.callout}>
            On confirmed Amazon spend the non-Amazon line is {usd(ad.non_amazon_ad_2026)} against{' '}
            {usd(ad.shopify_revenue_2026_stub)} of Shopify revenue — an implied{' '}
            {ad.implied_shopify_tacos_2026}% TACOS, down from {ad.implied_shopify_tacos_2025}% and
            no longer the ~47.6% the inferred figure produced. Shopify acquisition cost is roughly
            flat. Amazon&apos;s moved: {ad.tacos_2025}% to {ad.tacos_2026}% TACOS. Both channels are
            now inside a comparable band, and the one that deteriorated is the one being bought as
            the stable, efficient half of this business.
          </p>
        </div>

        <div className={styles.commentGrid}>{notes('headline').map((c) => <CommentCard key={c.id} c={c} />)}</div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. Product breakdown                                              */}
      {/* ---------------------------------------------------------------- */}
      <section id="products" className={styles.section}>
        <SectionHead n={2} title="Product breakdown, 2026 vs 2025" answers="Where it happened" />

        <p className={styles.calloutBox}>
          Strip out Glycolic 70% and Salicylic 30% — the only two products growing — and the rest
          of the Amazon catalogue is down roughly 15% year over year. Both sit exactly on
          Amazon&apos;s published concentration caps.
        </p>

        <div className={styles.tableControls}>
          <div className={styles.chipRow}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.chip} ${filter === f.id ? styles.chipOn : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            className={styles.search}
            placeholder="Search product, ASIN, path…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th onClick={() => toggleSort('product')}>Product</th>
                <th>ASIN</th>
                <th className={styles.numCol} onClick={() => toggleSort('fy2025')}>
                  FY2025
                </th>
                <th className={styles.numCol} onClick={() => toggleSort('y2026_to_20aug')}>
                  2026 to 20 Aug
                </th>
                <th className={styles.numCol} onClick={() => toggleSort('run_rate')}>
                  Run rate
                </th>
                <th className={styles.numCol} onClick={() => toggleSort('delta')}>
                  Δ vs FY2025
                </th>
                <th onClick={() => toggleSort('status')}>Status</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const open = openRow === p.asin;
                const series = MONTHS.map((m) => p.monthly[m] ?? 0);
                return (
                  <Fragment key={p.asin}>
                    <tr
                      className={`${styles.clickRow} ${open ? styles.rowOpen : ''}`}
                      onClick={() => setOpenRow(open ? null : p.asin)}
                    >
                      <td>
                        <span className={styles.rowCaret}>{open ? '▾' : '▸'}</span>
                        {p.product}
                      </td>
                      <td className={styles.asin}>{p.asin}</td>
                      <td className={styles.numCol}>{usd(p.fy2025)}</td>
                      <td className={styles.numCol}>{usd(p.y2026_to_20aug)}</td>
                      <td className={styles.numCol}>{usd(p.run_rate)}</td>
                      <td
                        className={`${styles.numCol} ${
                          p.delta > 0.5 ? styles.up : p.delta < -0.5 ? styles.down : ''
                        }`}
                      >
                        {p.fy2025 > 0 ? pct(p.delta, 1) : '—'}
                      </td>
                      <td>
                        <span className={`${styles.pill} ${STATUS_CLASS[p.status]}`}>
                          {STATUS_LABEL[p.status]}
                        </span>
                      </td>
                      <td className={styles.path}>{p.path || '—'}</td>
                    </tr>
                    {open && (
                      <tr className={styles.detailRow}>
                        <td colSpan={8}>
                          <div className={styles.detailGrid}>
                            <div>
                              <p className={styles.detailWhy}>{p.why}</p>
                              <p className={styles.detailMeta}>
                                Units {num(p.units_2025)} (2025) → {num(p.units_2026)} (2026) · last
                                sale {p.last_sale || 'none in window'}
                              </p>
                            </div>
                            <div>
                              <Sparkline
                                values={series}
                                months={MONTHS}
                                markerMonths={REMOVAL_MARKERS.map((m) => m.month)}
                              />
                              <p className={styles.detailMeta}>
                                Monthly gross, {MONTH_LABEL[MONTHS[0]]} – {MONTH_LABEL[MONTHS[MONTHS.length - 1]]}.
                                Red dots are zero months.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  Total{rows.length !== D.products.length ? ` (${rows.length} of ${D.products.length} shown)` : ''}
                </td>
                <td className={styles.numCol}>{usd(shownTotals.fy2025)}</td>
                <td className={styles.numCol}>{usd(shownTotals.y2026)}</td>
                <td className={styles.numCol}>{usd(shownTotals.runRate)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.commentGrid}>{notes('products').map((c) => <CommentCard key={c.id} c={c} />)}</div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 3. What changed                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section id="removed" className={styles.section}>
        <SectionHead n={3} title="What changed: products removed" answers="What broke" />

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>FY2025 to forward run rate</h3>
            <div className={styles.legend}>
              <span className={styles.legRemoved}>Enforcement removals</span>
              <span className={styles.legDecline}>Declines</span>
              <span className={styles.legGrowth}>Growth</span>
            </div>
          </div>
          <Waterfall steps={waterfall} />
          <p className={styles.caption}>
            Bridge ties by construction: {usd(fy2025Total)} less enforcement removals, less
            declines, plus growth = {usd(runRateTotal)}.
          </p>
        </div>

        <div className={styles.splitGrid}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Gone</h3>
            </div>
            <p className={styles.leadNumber}>
              {usd(REMOVED_FY2025_REVENUE)}
              <span>
                of FY2025 revenue — {REMOVED_SHARE_OF_CHANNEL}% of the Amazon channel — is now zero,
                and every dollar of it was removed by enforcement, not lost to competition.
              </span>
            </p>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>ASIN</th>
                  <th>Product</th>
                  <th className={styles.numCol}>FY2025</th>
                  <th>Removed</th>
                </tr>
              </thead>
              <tbody>
                {gone.map((p) => {
                  const ev = D.listing_status_events
                    .filter((e) => p.asin.includes(e.asin) && e.status === 'Removed')
                    .map((e) => e.date)[0];
                  const viol = D.violations.filter((v) => p.asin.includes(v.asin)).map((v) => v.date)[0];
                  return (
                    <tr key={p.asin}>
                      <td className={styles.asin}>{p.asin}</td>
                      <td>{p.product}</td>
                      <td className={styles.numCol}>{usd(p.fy2025)}</td>
                      <td className={styles.dateCell}>{ev ?? viol ?? 'before window'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className={styles.caption}>
              Two further ASINs (B018IVXS1K, B08S5CNFKL) were deactivated for skin lightening in
              Oct–Nov 2024, before the settlement window opens, and carry no revenue in either
              column.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>The one that came back — B006ZA0A5Y</h3>
            </div>
            <p className={styles.leadNumberSm}>
              Removed 20 Nov 2025 · dark 3.5 months · relisted March 2026 · running{' '}
              <strong>23% below</strong> its pre-removal level
            </p>
            <Sparkline
              values={MONTHS.map((m) => relisted.monthly[m] ?? 0)}
              months={MONTHS}
              markerMonths={['2025-11']}
            />
            <table className={styles.dataTable}>
              <tbody>
                <tr>
                  <td>FY2025</td>
                  <td className={styles.numCol}>{usd(relisted.fy2025)}</td>
                </tr>
                <tr>
                  <td>2026 to 20 Aug</td>
                  <td className={styles.numCol}>{usd(relisted.y2026_to_20aug)}</td>
                </tr>
                <tr>
                  <td>Run rate</td>
                  <td className={styles.numCol}>{usd(relisted.run_rate)}</td>
                </tr>
              </tbody>
            </table>
            <p className={styles.caption}>
              Recovery on this platform is possible, and it is not full. Ask for the remediation
              record: what was submitted, and whether the same path is open for the two SKUs with
              final rulings.
            </p>
          </div>
        </div>

        <div className={styles.commentGrid}>{notes('removed').map((c) => <CommentCard key={c.id} c={c} />)}</div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 4. Enforcement                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="enforcement" className={styles.section}>
        <SectionHead
          n={4}
          title="Enforcement review: notifications and account health"
          answers="Why it broke"
        />

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Enforcement timeline, Oct 2024 – Aug 2026</h3>
            <div className={styles.legend}>
              <span className={styles.legViolation}>Violation</span>
              <span className={styles.legAtRisk}>At risk</span>
              <span className={styles.legRemovedSq}>Removed</span>
              <span className={styles.legDeactivated}>Deactivated</span>
            </div>
          </div>
          <Timeline
            lanes={lanes}
            events={timelineEvents}
            start="2024-09-15"
            end="2026-09-15"
            bands={[
              {
                from: '2024-10-18',
                to: '2024-11-05',
                label: `Oct 2024 sweep — ${octoberSweep.length} ASINs in three days`,
              },
            ]}
          />
          <p className={styles.callout}>
            Amazon enforces in sweeps, by ingredient and claim pattern, not one listing at a time.{' '}
            {octoberSweep.length} ASINs were cited on the same three days in October 2024 — the
            cluster on the left of this chart. Four of them are still selling{' '}
            {usd(101498)} of run rate on citations that were never resolved.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Amazon&apos;s own account health screen — Restricted Products</h3>
            <span className={styles.stamp}>captured 31 Aug 2026</span>
          </div>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>ASIN / product</th>
                <th className={styles.numCol}>Amazon at-risk sales</th>
                <th>Action taken</th>
                <th>AHR impact</th>
                <th>Appeal status</th>
              </tr>
            </thead>
            <tbody>
              {D.account_health_dashboard.map((r) => {
                const notFiled = r.appeal.includes('NOT FILED');
                return (
                  <tr key={`${r.date}-${r.asin}`} className={notFiled ? styles.rowAlert : ''}>
                    <td className={styles.dateCell}>{r.date}</td>
                    <td>
                      <span className={styles.asin}>{r.asin}</span>
                      <br />
                      {r.product}
                    </td>
                    <td className={styles.numCol}>
                      {r.at_risk_sales > 0 ? usd(r.at_risk_sales) : r.note ?? '—'}
                    </td>
                    <td>{r.action}</td>
                    <td className={styles.muted}>{r.ahr_impact}</td>
                    <td>
                      <span
                        className={`${styles.pill} ${
                          notFiled ? styles.pillRemoved : styles.pillImpaired
                        }`}
                      >
                        {r.appeal}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Amazon&apos;s at-risk total</td>
                <td className={styles.numCol}>{usd(AMAZON_AT_RISK_TOTAL)}</td>
                <td colSpan={3} className={styles.muted}>
                  Cited ASINs only. Our exposure figure adds the SKUs at the caps with no citation
                  yet — see section 5.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.factRow}>
          <div className={styles.fact}>
            <strong>0.6%</strong>
            <span>
              Amazon&apos;s $28,308 at-risk figure on B007004PZO against our computed $28,471. Our
              numbers agree with Amazon&apos;s own.
            </span>
          </div>
          <div className={styles.fact}>
            <strong>{usd(48296)}</strong>
            <span>
              of trailing sales already ruled on and lost — two rows read &ldquo;evaluation
              complete&rdquo; with the listings still removed.
            </span>
          </div>
          <div className={styles.fact}>
            <strong>3 unfiled</strong>
            <span>
              appeals sitting at &ldquo;submission required&rdquo;, the oldest over a month old,
              one of them carrying $28,308 of trailing sales.
            </span>
          </div>
          <div className={styles.fact}>
            <strong>27 Aug 2026</strong>
            <span>
              a thirteenth violation, after every file the seller sent. The export was stale on
              arrival.
            </span>
          </div>
        </div>

        <div className={styles.commentGrid}>{notes('enforcement').map((c) => <CommentCard key={c.id} c={c} />)}</div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 5. Still in danger                                                */}
      {/* ---------------------------------------------------------------- */}
      <section id="danger" className={styles.section}>
        <SectionHead n={5} title="Still in danger, and why" answers="What breaks next" />

        <p className={styles.leadNumber}>
          {usd(EXPOSED_RUN_RATE)}
          <span>
            — {EXPOSED_SHARE}% of the Amazon run rate, roughly 15% of company revenue — is exposed
            to enforcement paths that already have a body.
          </span>
        </p>

        <div className={styles.exposureGrid}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Run rate by exposure bucket</h3>
            </div>
            <div className={styles.donutRow}>
              <Donut
                slices={buckets.map((b, i) => ({
                  label: b.bucket,
                  value: b.run_rate,
                  color: BUCKET_COLORS[i],
                  muted: hoverBucket !== null && hoverBucket !== b.bucket,
                }))}
                centerValue={usd(runRateTotal)}
                centerLabel="run rate"
                onHover={setHoverBucket}
              />
              <ul className={styles.bucketList}>
                {buckets.map((b, i) => (
                  <li
                    key={b.bucket}
                    onMouseEnter={() => setHoverBucket(b.bucket)}
                    onMouseLeave={() => setHoverBucket(null)}
                    className={hoverBucket === b.bucket ? styles.bucketOn : ''}
                  >
                    <span className={styles.swatch} style={{ background: BUCKET_COLORS[i] }} />
                    <span className={styles.bucketName}>{b.bucket}</span>
                    <span className={styles.bucketVal}>{usd(b.run_rate)}</span>
                    <span className={styles.bucketShare}>{b.share}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Scenario: which buckets go to zero</h3>
            </div>
            <p className={styles.caption}>
              Defaults to the at-cap bucket alone — the only bucket where a single lab number
              decides the outcome. SDE at ~50% contribution, value at 2.5x.
            </p>
            <ul className={styles.scenarioList}>
              {buckets.map((b) => (
                <li key={b.bucket}>
                  <label>
                    <input
                      type="checkbox"
                      checked={lostBuckets.includes(b.bucket)}
                      onChange={() => toggleBucket(b.bucket)}
                    />
                    <span>{b.bucket}</span>
                    <span className={styles.bucketVal}>{usd(b.run_rate)}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className={styles.scenarioOut}>
              <div>
                <span>Revenue lost</span>
                <strong className={styles.bad}>{usd(lostRevenue)}</strong>
              </div>
              <div>
                <span>SDE impact @ 50%</span>
                <strong className={styles.bad}>{usd(sdeImpact)}</strong>
              </div>
              <div>
                <span>Value @ 2.5x</span>
                <strong className={styles.bad}>{usd(valueImpact)}</strong>
              </div>
              <div>
                <span>Remaining run rate</span>
                <strong>{usd(runRateTotal - lostRevenue)}</strong>
              </div>
            </div>
            <p className={styles.caption}>
              If Glycolic 70% alone goes, {usd(104602)} of run rate — the entire 2026 Amazon growth
              story — goes with it.
            </p>
          </div>
        </div>

        <div className={styles.pathGrid}>
          {D.enforcement_paths.map((p) => {
            const live = D.products.filter(
              (pr) => pr.path.includes(p.id) && pr.status !== 'removed' && pr.run_rate > 0
            );
            return (
              <div key={p.id} className={styles.pathCard}>
                <div className={styles.pathHead}>
                  <span className={styles.pathId}>{p.id}</span>
                  <h4>{p.name}</h4>
                </div>
                <p className={styles.pathTrigger}>{p.trigger}</p>
                <p className={styles.pathRealized}>
                  <span>Already realized against</span>
                  {p.realized_against}
                </p>
                <ul className={styles.pathLive}>
                  {live.map((pr) => (
                    <li key={pr.asin}>
                      <span>{pr.product}</span>
                      <strong>{usd(pr.run_rate)}</strong>
                    </li>
                  ))}
                </ul>
                <p className={styles.pathTotal}>
                  Live run rate on this path <strong>{usd(sum(live.map((l) => l.run_rate)))}</strong>
                </p>
              </div>
            );
          })}
        </div>

        <div className={styles.reconcileBox}>
          <h4>Reconciling the two exposure numbers</h4>
          <div className={styles.reconcileRow}>
            <div>
              <strong>{usd(AMAZON_AT_RISK_TOTAL)}</strong>
              <span>
                Amazon&apos;s dashboard total. Counts only ASINs that already carry a live
                violation — realized and pending damage the platform itself acknowledges.
              </span>
            </div>
            <div>
              <strong>{usd(EXPOSED_RUN_RATE)}</strong>
              <span>
                Ours. Adds the two SKUs sitting exactly at the caps with no citation yet
                ({usd(148852)}), which Amazon has no reason to flag until it acts.
              </span>
            </div>
          </div>
        </div>

        <div className={styles.commentGrid}>{notes('danger').map((c) => <CommentCard key={c.id} c={c} />)}</div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 6. Inventory                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section id="inventory" className={styles.section}>
        <SectionHead
          n={6}
          title="Inventory: liquidations and disposals"
          answers="What the physical evidence confirms"
        />

        <div className={styles.splitGrid}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Liquidations</h3>
              <span className={styles.stamp}>
                {liquidationTotals.events} events · {usd(liquidationTotals.proceeds, { cents: true })} recovered
              </span>
            </div>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className={styles.numCol}>Events</th>
                  <th className={styles.numCol}>Units</th>
                  <th className={styles.numCol}>Proceeds</th>
                </tr>
              </thead>
              <tbody>
                {D.liquidations.map((l) => (
                  <tr key={l.product}>
                    <td>{l.product.length > 52 ? `${l.product.slice(0, 51)}…` : l.product}</td>
                    <td className={styles.numCol}>{l.events}</td>
                    <td className={styles.numCol}>{l.units}</td>
                    <td className={styles.numCol}>{usd(l.proceeds, { cents: true })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className={styles.numCol}>{liquidationTotals.events}</td>
                  <td className={styles.numCol}>{liquidationTotals.units}</td>
                  <td className={`${styles.numCol} ${styles.bad}`}>
                    {usd(liquidationTotals.proceeds, { cents: true })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>FBA fee profile, 20 months</h3>
            </div>
            <table className={styles.dataTable}>
              <tbody>
                <tr>
                  <td>Disposal fees</td>
                  <td className={styles.numCol}>{disposalFee.count} events</td>
                  <td className={styles.numCol}>{usd(Math.abs(disposalFee.amount), { cents: true })}</td>
                </tr>
                <tr>
                  <td>Removal — return fees</td>
                  <td className={styles.numCol}>{returnFee.count} events</td>
                  <td className={styles.numCol}>{usd(Math.abs(returnFee.amount), { cents: true })}</td>
                </tr>
                <tr className={styles.rowEmphasis}>
                  <td>Storage fees, all types</td>
                  <td className={styles.numCol}>0.03% of revenue</td>
                  <td className={styles.numCol}>{usd(storageFees, { cents: true })}</td>
                </tr>
                <tr>
                  <td>Net FBA reimbursements</td>
                  <td className={styles.numCol}>~{usd(reimbursements / 20 * 12)}/yr</td>
                  <td className={`${styles.numCol} ${styles.up}`}>{usd(reimbursements, { cents: true })}</td>
                </tr>
              </tbody>
            </table>
            <p className={styles.caption}>
              Storage of {usd(storageFees)} across twenty months on $1.6M of throughput, against a
              1–2% norm. Reimbursements are non-operating income if they have been booked to
              revenue.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Removal and disposal events by month</h3>
            <div className={styles.legend}>
              <span className={styles.legMark}>Removal months</span>
            </div>
          </div>
          <EventBars data={removalMonths} markers={REMOVAL_MARKERS.map((m) => m.month)} />
          <p className={styles.caption}>
            The events cluster on the enforcement dates — 171 in January 2026 alone, the month
            after the Lactic 50% removal. Disposals here are a compliance consequence, not routine
            housekeeping.
          </p>
        </div>

        <div className={styles.commentGrid}>{notes('inventory').map((c) => <CommentCard key={c.id} c={c} />)}</div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 7. Conclusions                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="conclusions" className={styles.section}>
        <SectionHead n={7} title="Conclusions" answers="So what" />

        <div className={styles.conclusionGrid}>
          <div className={`${styles.card} ${styles.holdsUp}`}>
            <h3>What holds up</h3>
            <ul className={styles.tickList}>
              <li>2025 revenue ties: $973,484 settlement vs $973,364 P&amp;L, 0.01% variance</li>
              <li>Buy box 96–99%, no hijackers, no suppression</li>
              <li>Refund rate 3–5%, stable across twenty months</li>
              <li>Conversion 10.2% blended, flagship at 9.2%</li>
              <li>One A-to-z claim and one chargeback in 20 months across ~58,000 units</li>
              <li>Account Health Rating unaffected; no suspension risk</li>
              <li>
                Amazon advertising was efficient in 2025: 9.2% TACOS, 3.46x ROAS, 28.9% ACOS, and
                68% of revenue unattributed to ads
              </li>
              <li>
                Both sides of advertising are now disclosed for both years — spend and attributed
                sales — so organic is measured, not modelled
              </li>
              <li>Shopify acquisition cost is roughly flat: implied TACOS 32.9% → 29.8%</li>
              <li>August 2026 tracking +6.3% against August 2025</li>
            </ul>
          </div>
          <div className={`${styles.card} ${styles.doesNot}`}>
            <h3>What does not</h3>
            <ul className={styles.crossList}>
              <li>Five SKUs at zero, all by enforcement — $111,678 of FY2025 revenue</li>
              <li>$277,054 (30.6%) of run rate exposed to the same four paths</li>
              <li>Both growth SKUs sit exactly at the concentration caps</li>
              <li>Three appeals unfiled; two rulings already lost</li>
              <li>Units −13.8% against revenue −6.0%; price is masking demand</li>
              <li>
                Organic sales −25.9% like-for-like while ad-attributed sales rose 39.2%; organic
                share 68.1% → 53.1%
              </li>
              <li>
                Amazon advertising efficiency has deteriorated: TACOS 9.2% → 15.7%, ROAS 3.46x →
                2.98x, ACOS 28.9% → 33.6%, spend ~+58% annualized against revenue −6%
              </li>
              <li>ASIN concentration 60.7% in a single glycolic variation family</li>
              <li>
                Inventory drawdown $154,537 against an $82,360 SDE improvement — underlying
                performance deteriorated ~{usd(Math.abs(UNDERLYING_DETERIORATION))}, with no
                ad-cost saving left to explain it
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.commentGrid}>{notes('conclusions').map((c) => <CommentCard key={c.id} c={c} />)}</div>
      </section>

      <footer className={styles.footer}>
        <p>
          <strong>Definitions.</strong> Gross sales — settlement product sales before platform
          fees, refunds and promotional rebates; the basis the P&amp;L uses. Run rate — May–Jul
          2026 × 4, which strips the Jan–Mar seasonal peak. PPC sales — Amazon ad-attributed
          sales, seller-supplied; distinct from ad spend, which is given separately for both years
          ($90,000 in 2025, $99,000 to 20 Aug 2026). Organic sales — gross minus PPC sales,
          measured on both years. 2026 — through 20 Aug 2026 unless a chart says otherwise;
          August is partial.
        </p>
        <p className={styles.footerMeta}>
          {D.meta.source} · window {D.meta.settlement_window} · generated {D.meta.generated} ·{' '}
          {D.meta.reconciliation.note}
        </p>
      </footer>
    </div>
  );
}
