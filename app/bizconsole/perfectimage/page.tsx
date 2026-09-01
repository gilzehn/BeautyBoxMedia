'use client';

/**
 * Perfect Image LLC — Amazon channel diligence dashboard.
 *
 * Open route by design: this sits under /bizconsole/perfectimage and is not
 * behind the console sign-in, so it can be opened in a meeting or sent as a
 * link without provisioning an account for the reader.
 *
 * Presentation is neutral: figures, their basis, and their source. Notes are
 * tagged by what they are - reconciled, measured, unconfirmed basis, superseded
 * or not supplied - never by whose case they help.
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
  REVENUE_2025,
  REVENUE_2026_STUB,
  ADVERTISING_2025,
  ADVERTISING_2026_STUB,
  ChannelRow,
  Provenance,
  channelTotal,
  costStack,
  NOT_SUPPLIED,
  SELLER_AMAZON_SHARE_CLAIM,
  AD_SPEND_2026_ANNUALIZED,
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
  MonthlyBarLine,
  StackedSplit,
  Waterfall,
  WaterfallStep,
  Sparkline,
  Donut,
  Timeline,
  TimelineEvent,
  MixBar,
  BUCKET_COLORS,
} from './charts';

// -------------------------------------------------------------------------
// Static labels
// -------------------------------------------------------------------------

const SECTIONS = [
  { id: 'company', n: 0, title: 'Company context' },
  { id: 'headline', n: 1, title: 'Amazon summary' },
  { id: 'products', n: 2, title: 'Product breakdown' },
  { id: 'removed', n: 3, title: 'Products removed' },
  { id: 'enforcement', n: 4, title: 'Enforcement' },
  { id: 'danger', n: 5, title: 'Run rate by exposure' },
  { id: 'conclusions', n: 6, title: 'Summary and open items' },
] as const;

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

const PROV_LABEL: Record<Provenance, string> = {
  settlement: 'settlement',
  pnl: 'P&L',
  derived: 'derived',
};

const PROV_CLASS: Record<Provenance, string> = {
  settlement: styles.provSettlement,
  pnl: styles.provPnl,
  derived: styles.provDerived,
};

function Prov({ p }: { p: Provenance }) {
  return <span className={`${styles.prov} ${PROV_CLASS[p]}`}>{PROV_LABEL[p]}</span>;
}

/** Channel table shared by the revenue and advertising mixes. */
function ChannelTable({
  rows,
  label,
  totalLabel,
}: {
  rows: ChannelRow[];
  label: string;
  totalLabel: string;
}) {
  const total = channelTotal(rows);
  return (
    <table className={styles.dataTable}>
      <thead>
        <tr>
          <th>{label}</th>
          <th className={styles.numCol}>Amount</th>
          <th className={styles.numCol}>Share</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.channel}>
            <td>{r.channel}</td>
            <td className={styles.numCol}>{usd(r.value)}</td>
            <td className={styles.numCol}>{((r.value / total) * 100).toFixed(1)}%</td>
            <td className={styles.muted}>
              {r.note}
              <Prov p={r.provenance} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>{totalLabel}</td>
          <td className={styles.numCol}>{usd(total)}</td>
          <td className={styles.numCol}>100%</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
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

  // --- Section 0: company context ----------------------------------------
  const rev25 = channelTotal(REVENUE_2025);
  const rev26 = channelTotal(REVENUE_2026_STUB);
  const adTotal25 = channelTotal(ADVERTISING_2025);
  const adTotal26 = channelTotal(ADVERTISING_2026_STUB);
  const amazonShare25 = (REVENUE_2025[0].value / rev25) * 100;
  const amazonShare26 = (REVENUE_2026_STUB[0].value / rev26) * 100;
  const impliedTotalIncome = REVENUE_2025[0].value / (SELLER_AMAZON_SHARE_CLAIM / 100);
  const unaccounted = impliedTotalIncome - rev25;
  const stack25 = costStack('2025', ad.ad_spend_2025);
  const stack26 = costStack('2026', ad.ad_spend_2026_to_aug);
  const CHANNEL_COLORS = ['#5b8bb5', '#4f8f6d', '#c98a2e'];

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

  return (
    <div className={styles.page}>
      {/* ---------------------------------------------------------------- */}
      <header className={styles.masthead}>
        <div className={styles.mastheadTop}>
          <div>
            <p className={styles.eyebrow}>Amazon channel · settlement and account records</p>
            <h1 className={styles.title}>Perfect Image LLC</h1>
            <p className={styles.subtitle}>
              Settlement window {D.meta.settlement_window} · prepared {D.meta.generated} · source
              tagged per figure
            </p>
          </div>
          <div className={styles.mastheadActions}>
            <Link href="/bizconsole" className={styles.backLink}>
              ← Business Console
            </Link>
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
          <div className={styles.lensBar}>
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
        </nav>

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

      </header>

      {/* ---------------------------------------------------------------- */}
      {/* 0. Company context                                                */}
      {/* ---------------------------------------------------------------- */}
      <section id="company" className={`${styles.section} ${styles.compactSection}`}>
        <SectionHead
          n={0}
          title="Company context: income and spend by platform"
          answers="Both channels, both periods, on one screen"
        />

        <div className={styles.tileRow}>
          <div className={styles.tile}>
            <span>Revenue FY2025</span>
            <strong>{usd(rev25)}</strong>
            <em>Amazon + Shopify</em>
          </div>
          <div className={styles.tile}>
            <span>Revenue 2026 stub</span>
            <strong>{usd(rev26)}</strong>
            <em>P&amp;L stub column</em>
          </div>
          <div className={styles.tile}>
            <span>Amazon share</span>
            <strong>
              {amazonShare25.toFixed(1)}% <i>→ {amazonShare26.toFixed(1)}%</i>
            </strong>
            <em>of disclosed revenue</em>
          </div>
          <div className={styles.tile}>
            <span>Advertising</span>
            <strong>
              {usd(adTotal25)} <i>→ {usd(adTotal26)}</i>
            </strong>
            <em>P&amp;L line</em>
          </div>
          <div className={styles.tile}>
            <span>Blended ad ratio</span>
            <strong>
              {((adTotal25 / rev25) * 100).toFixed(1)}%{' '}
              <i className={styles.bad}>→ {((adTotal26 / rev26) * 100).toFixed(1)}%</i>
            </strong>
            <em>of disclosed revenue</em>
          </div>
          <div className={styles.tile}>
            <span>Amazon contribution</span>
            <strong>
              {((stack25.contributionBeforeCogs / stack25.gross) * 100).toFixed(1)}%{' '}
              <i className={styles.bad}>
                → {((stack26.contributionBeforeCogs / stack26.gross) * 100).toFixed(1)}%
              </i>
            </strong>
            <em>of gross, before COGS</em>
          </div>
        </div>

        <div className={styles.compactRow}>
          <div className={styles.panel}>
            <h3>Income by platform</h3>
            {[
              { label: 'FY2025', rows: REVENUE_2025, total: rev25 },
              { label: '2026 stub', rows: REVENUE_2026_STUB, total: rev26 },
            ].map((g) => (
              <div key={g.label} className={styles.mixRow}>
                <span className={styles.mixLabel}>
                  {g.label}
                  <i>{usd(g.total)}</i>
                </span>
                <div className={styles.mixCompact}>
                  <MixBar
                    segments={g.rows.map((r, i) => ({
                      label: `${r.channel} ${usd(r.value)}`,
                      value: r.value,
                      color: CHANNEL_COLORS[i],
                    }))}
                    total={g.total}
                  />
                </div>
              </div>
            ))}
            <p className={styles.panelNote}>
              Amazon FY2025 is settlement gross, tying to the P&amp;L to 0.01%; the rest are P&amp;L
              lines. The stub is labelled seven months but its Amazon line is six.
            </p>
          </div>

          <div className={styles.panel}>
            <h3>Advertising by platform</h3>
            {[
              { label: '2025', rows: ADVERTISING_2025, total: adTotal25 },
              { label: '2026 stub', rows: ADVERTISING_2026_STUB, total: adTotal26 },
            ].map((g) => (
              <div key={g.label} className={styles.mixRow}>
                <span className={styles.mixLabel}>
                  {g.label}
                  <i>{usd(g.total)}</i>
                </span>
                <div className={styles.mixCompact}>
                  <MixBar
                    segments={g.rows.map((r, i) => ({
                      label: `${i === 0 ? 'Amazon' : 'Non-Amazon'} ${usd(r.value)}`,
                      value: r.value,
                      color: CHANNEL_COLORS[i],
                    }))}
                    total={g.total}
                  />
                </div>
              </div>
            ))}
            <p className={styles.panelNote}>
              Non-Amazon is the P&amp;L line less confirmed Amazon spend. No platform split has been
              supplied for either year.
            </p>
          </div>
        </div>

        <div className={styles.compactRow3}>
          <div className={styles.panel}>
            <h3>Where an Amazon dollar goes</h3>
            <table className={styles.compactTable}>
              <thead>
                <tr>
                  <th></th>
                  <th className={styles.numCol}>FY2025</th>
                  <th className={styles.numCol}>2026</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['Gross sales', 'gross'],
                    ['Promotional rebates', 'promoRebates'],
                    ['Refunds', 'refunds'],
                    ['Selling fees', 'sellingFees'],
                    ['FBA fees', 'fbaFees'],
                    ['Net deposits', 'netDeposits'],
                    ['Advertising', 'adSpend'],
                    ['Contribution before COGS', 'contributionBeforeCogs'],
                  ] as [string, keyof typeof stack25][]
                ).map(([label, key]) => {
                  const emph = key === 'netDeposits' || key === 'contributionBeforeCogs';
                  return (
                    <tr key={key} className={emph ? styles.rowEmphasis : ''}>
                      <td>{label}</td>
                      <td className={styles.numCol}>
                        {((stack25[key] / stack25.gross) * 100).toFixed(1)}%
                      </td>
                      <td
                        className={`${styles.numCol} ${
                          key === 'adSpend' || key === 'contributionBeforeCogs' ? styles.bad : ''
                        }`}
                      >
                        {((stack26[key] / stack26.gross) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className={styles.panelNote}>Settlement, % of gross.</p>
          </div>

          <div className={styles.panel}>
            <h3>Advertising per revenue dollar</h3>
            <table className={styles.compactTable}>
              <thead>
                <tr>
                  <th></th>
                  <th className={styles.numCol}>2025</th>
                  <th className={styles.numCol}>2026</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Amazon <Prov p="settlement" />
                  </td>
                  <td className={styles.numCol}>{ad.tacos_2025}%</td>
                  <td className={`${styles.numCol} ${styles.bad}`}>{ad.tacos_2026}%</td>
                </tr>
                <tr>
                  <td>
                    Shopify <Prov p="derived" />
                  </td>
                  <td className={styles.numCol}>{ad.implied_shopify_tacos_2025}%</td>
                  <td className={styles.numCol}>{ad.implied_shopify_tacos_2026}%</td>
                </tr>
                <tr className={styles.rowEmphasis}>
                  <td>
                    Blended <Prov p="derived" />
                  </td>
                  <td className={styles.numCol}>{((adTotal25 / rev25) * 100).toFixed(1)}%</td>
                  <td className={`${styles.numCol} ${styles.bad}`}>
                    {((adTotal26 / rev26) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
            <p className={styles.panelNote}>
              Absolute advertising fell 9.6%; the ratio rose 7.4 points.
            </p>
            <p className={styles.panelFlag}>
              The seller&apos;s materials put Amazon at ~{SELLER_AMAZON_SHARE_CLAIM}% of company
              revenue. That matches the 2026 stub ({amazonShare26.toFixed(1)}%); against FY2025 it
              implies {usd(impliedTotalIncome)} of total income and {usd(unaccounted)} in neither
              channel shown.
            </p>
          </div>

          <div className={styles.panel}>
            <h3>Not supplied at company level</h3>
            <ul className={styles.notSupplied}>
              {NOT_SUPPLIED.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div className={styles.provKey}>
              <span>
                <Prov p="settlement" /> reconciled to Amazon data
              </span>
              <span>
                <Prov p="pnl" /> seller-supplied
              </span>
              <span>
                <Prov p="derived" /> arithmetic on the two
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 1. Headline                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section id="headline" className={styles.section}>
        <SectionHead
          n={1}
          title="Amazon summary"
          answers="The Amazon channel: sales, units, advertising and organic"
        />

        <div className={styles.kpiGrid}>
          <Kpi
            label="Amazon gross sales"
            y2025={usd(fy2025Total)}
            y2026={usd(y2026Total)}
            change={`Run rate ${usd(runRateTotal)} · ${pct(-7.0)} vs FY2025`}
            changeTone="down"
            note="Different period lengths. Comparisons use run rate or like-for-like, stated per chart."
          />
          <Kpi
            label="Ad-attributed (PPC) sales"
            y2025={usd(ad.ppc_sales_2025)}
            y2026={usd(ad.ppc_sales_2026_to_aug)}
            change={`31.9% → 46.9% of gross`}
            changeTone="down"
            note="Seller-supplied, both years. 46.9% of 2026 gross carries ad attribution."
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
            note={`Average selling price $${ASP_2025.toFixed(2)} → $${ASP_2026.toFixed(2)} (${pct(9.1)}) over the full periods.`}
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
            <div className={styles.chartNarrow}>
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
            </div>
            <p className={styles.caption}>
              Organic = gross − ad-attributed sales, stated for both years. Ad-attributed sales
              are $294,966 of $629,356 in 2026 to 20 Aug, against $311,000 of $973,484 across all
              of 2025.
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
              Units fell 13.8% against revenue down 6.0%, with average selling price up 9.1%.
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
            Non-Amazon advertising is the P&amp;L line less Amazon spend: {usd(ad.non_amazon_ad_2026)}{' '}
            against {usd(ad.shopify_revenue_2026_stub)} of Shopify revenue, an implied{' '}
            {ad.implied_shopify_tacos_2026}% against {ad.implied_shopify_tacos_2025}% in 2025. The
            Amazon ratio over the same period moved from {ad.tacos_2025}% to {ad.tacos_2026}%. No
            platform split has been supplied for the non-Amazon figure in either year.
          </p>
        </div>

      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. Product breakdown                                              */}
      {/* ---------------------------------------------------------------- */}
      <section id="products" className={styles.section}>
        <SectionHead n={2} title="Product breakdown, 2026 vs 2025" answers="The same figures by ASIN" />

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

      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 3. What changed                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section id="removed" className={styles.section}>
        <SectionHead n={3} title="Products removed" answers="Revenue at zero, and when it stopped" />

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
                of FY2025 revenue — {REMOVED_SHARE_OF_CHANNEL}% of the Amazon channel — now records
                no sales. Each of the five ASINs carries a policy notice dated before its last sale.
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
              The remediation record for the relisting has not been supplied, nor whether the same
              route applies to the two SKUs with completed evaluations.
            </p>
          </div>
        </div>

      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 4. Enforcement                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="enforcement" className={styles.section}>
        <SectionHead
          n={4}
          title="Enforcement: notifications and account health"
          answers="The policy record behind the removals"
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
            Citations group by ingredient and claim pattern rather than by individual listing:{' '}
            {octoberSweep.length} ASINs were cited across three days in October 2024 — the cluster
            on the left of this chart. Four of them still record {usd(101498)} of run rate with
            those citations unresolved in the material supplied.
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
                  Cited ASINs only. The exposure figure in section 5 adds the SKUs at the caps with
                  no citation.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.factRow}>
          <div className={styles.fact}>
            <strong>0.6%</strong>
            <span>
              variance between Amazon&apos;s $28,308 at-risk figure on B007004PZO and $28,471
              computed from settlement.
            </span>
          </div>
          <div className={styles.fact}>
            <strong>{usd(48296)}</strong>
            <span>
              of trailing sales on the two rows reading &ldquo;evaluation complete&rdquo; with the
              listings still removed.
            </span>
          </div>
          <div className={styles.fact}>
            <strong>3 unfiled</strong>
            <span>
              appeals at &ldquo;submission required&rdquo;, the oldest over a month old, one
              carrying $28,308 of trailing sales.
            </span>
          </div>
          <div className={styles.fact}>
            <strong>27 Aug 2026</strong>
            <span>
              a thirteenth violation, dated after the violations export ends (07 Aug 2026).
            </span>
          </div>
        </div>

      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 5. Still in danger                                                */}
      {/* ---------------------------------------------------------------- */}
      <section id="danger" className={styles.section}>
        <SectionHead n={5} title="Run rate by exposure" answers="Live revenue on paths already used" />

        <p className={styles.leadNumber}>
          {usd(EXPOSED_RUN_RATE)}
          <span>
            — {EXPOSED_SHARE}% of the Amazon run rate, roughly 15% of company revenue — sits on the
            four enforcement paths already used against this account.
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
              Applies a total loss to the selected buckets. Defaults to the at-cap bucket.
              Contribution at 50% and the 2.5x capitalisation are stated assumptions.
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
                <span>Contribution @ 50%</span>
                <strong className={styles.bad}>{usd(sdeImpact)}</strong>
              </div>
              <div>
                <span>Capitalised @ 2.5x</span>
                <strong className={styles.bad}>{usd(valueImpact)}</strong>
              </div>
              <div>
                <span>Remaining run rate</span>
                <strong>{usd(runRateTotal - lostRevenue)}</strong>
              </div>
            </div>
            <p className={styles.caption}>
              Glycolic 70% alone is {usd(104602)} of run rate, and accounts for the whole of the
              2026 run-rate growth.
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
                Amazon&apos;s dashboard total: trailing sales on the ASINs that already carry a
                live violation.
              </span>
            </div>
            <div>
              <strong>{usd(EXPOSED_RUN_RATE)}</strong>
              <span>
                Adds the two SKUs at the concentration caps with no citation ({usd(148852)}), which
                would not appear on Amazon&apos;s figure until action is taken.
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 7. Conclusions                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="conclusions" className={styles.section}>
        <SectionHead
          n={6}
          title="Summary and open items"
          answers="What reconciles, what does not, what is missing"
        />

        <div className={styles.conclusionGrid}>
          <div className={`${styles.card} ${styles.holdsUp}`}>
            <h3>Reconciled to source data</h3>
            <ul className={styles.tickList}>
              <li>2025 revenue ties: $973,484 settlement vs $973,364 P&amp;L, 0.01% variance</li>
              <li>Buy box 96–99%, no hijackers, no suppression</li>
              <li>Refund rate 3–5%, stable across twenty months</li>
              <li>Conversion 10.2% blended, flagship at 9.2%</li>
              <li>One A-to-z claim and one chargeback in 20 months across ~58,000 units</li>
              <li>Account Health Rating unaffected; no suspension risk</li>
              <li>2025 Amazon advertising: 9.2% TACOS, 3.46x ROAS, 28.9% ACOS</li>
              <li>
                Spend and attributed sales are stated for both years, so organic is a subtraction
                on each rather than an estimate
              </li>
              <li>Implied Shopify advertising ratio 32.9% → 29.8%</li>
              <li>Amazon platform costs flat: net deposits 67.1% → 67.0% of gross</li>
              <li>August 2026 tracking +6.3% against August 2025</li>
            </ul>
          </div>
          <div className={`${styles.card} ${styles.doesNot}`}>
            <h3>Unresolved at the data cutoff</h3>
            <ul className={styles.crossList}>
              <li>Five SKUs at zero, each with a policy notice — $111,678 of FY2025 revenue</li>
              <li>$277,054 (30.6%) of run rate on the four enforcement paths in this account</li>
              <li>Both growth SKUs sit exactly at the concentration caps</li>
              <li>Three appeals at &ldquo;submission required&rdquo;; two decided adversely</li>
            </ul>
          </div>
        </div>

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
