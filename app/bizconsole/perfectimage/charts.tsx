'use client';

/**
 * Chart primitives for the Perfect Image diligence dashboard.
 *
 * Hand-rolled SVG on purpose: the app is a static export with no charting
 * dependency, and these need to print cleanly to PDF. Everything scales via
 * viewBox, so the same markup works on screen and on paper.
 */

import { ReactNode, useState } from 'react';
import styles from './perfectimage.module.css';

export const PALETTE = {
  gross: '#5b8bb5',
  grossPartial: '#3a5771',
  units: '#c98a2e',
  organic: '#4f8f6d',
  paid: '#5b8bb5',
  removed: '#c0453f',
  decline: '#8a5a53',
  growth: '#4f8f6d',
  neutral: '#4a5568',
  amber: '#c98a2e',
  grid: '#262626',
  axis: '#666666',
};

export const BUCKET_COLORS = [
  '#3f5c73',
  '#c98a2e',
  '#a8603f',
  '#b4514a',
  '#c0453f',
  '#5a4a5e',
];

interface TipState {
  x: number;
  y: number;
  content: ReactNode;
}

function Tooltip({ tip }: { tip: TipState | null }) {
  if (!tip) return null;
  return (
    <div className={styles.tooltip} style={{ left: `${tip.x}%`, top: `${tip.y}%` }}>
      {tip.content}
    </div>
  );
}

/** Money on a compact axis: 120000 -> "$120K". */
export function axisMoney(n: number): string {
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}

// -------------------------------------------------------------------------
// Monthly gross sales bars with a units line overlay.
// -------------------------------------------------------------------------

export interface MonthlyPoint {
  month: string;
  label: string;
  gross: number;
  units: number;
  partial?: boolean;
}

export interface Marker {
  month: string;
  date: string;
  label: string;
}

export function MonthlyBarLine({
  data,
  markers = [],
  showUnits = true,
}: {
  data: MonthlyPoint[];
  markers?: Marker[];
  showUnits?: boolean;
}) {
  const [tip, setTip] = useState<TipState | null>(null);
  const W = 1000;
  const H = 320;
  const padL = 58;
  const padR = 52;
  const padT = 24;
  const padB = 46;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxGross = Math.max(...data.map((d) => d.gross)) * 1.12;
  const maxUnits = Math.max(...data.map((d) => d.units)) * 1.25;
  const step = plotW / data.length;
  const barW = step * 0.6;

  const y = (v: number) => padT + plotH - (v / maxGross) * plotH;
  const yu = (v: number) => padT + plotH - (v / maxUnits) * plotH;
  const x = (i: number) => padL + i * step + step / 2;

  const ticks = 4;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => (maxGross / ticks) * i);

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yu(d.units).toFixed(1)}`)
    .join(' ');

  return (
    <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img">
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={PALETTE.grid} strokeWidth={1} />
            <text x={padL - 10} y={y(v) + 4} textAnchor="end" className={styles.axisText}>
              {axisMoney(v)}
            </text>
          </g>
        ))}

        {markers.map((m) => {
          const i = data.findIndex((d) => d.month === m.month);
          if (i < 0) return null;
          return (
            <g key={m.month}>
              <line
                x1={x(i)}
                x2={x(i)}
                y1={padT - 8}
                y2={padT + plotH}
                stroke={PALETTE.removed}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={x(i)} cy={padT - 10} r={3.5} fill={PALETTE.removed} />
            </g>
          );
        })}

        {data.map((d, i) => (
          <rect
            key={d.month}
            x={x(i) - barW / 2}
            y={y(d.gross)}
            width={barW}
            height={padT + plotH - y(d.gross)}
            fill={d.partial ? PALETTE.grossPartial : PALETTE.gross}
            stroke={d.partial ? PALETTE.gross : 'none'}
            strokeDasharray={d.partial ? '3 2' : undefined}
            onMouseEnter={() =>
              setTip({
                x: ((x(i) / W) * 100),
                y: ((y(d.gross) / H) * 100),
                content: (
                  <>
                    <strong>{d.label}</strong>
                    <span>
                      {d.gross.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                      {' · '}
                      {d.units.toLocaleString('en-US')} units
                    </span>
                    {d.partial && <em>partial month, to 20 Aug</em>}
                    {markers
                      .filter((m) => m.month === d.month)
                      .map((m) => (
                        <em key={m.date} className={styles.tipRed}>
                          {m.date} — {m.label}
                        </em>
                      ))}
                  </>
                ),
              })
            }
          />
        ))}

        {showUnits && (
          <>
            <path d={linePath} fill="none" stroke={PALETTE.units} strokeWidth={2} />
            {data.map((d, i) => (
              <circle key={d.month} cx={x(i)} cy={yu(d.units)} r={2.6} fill={PALETTE.units} />
            ))}
            {[0, 0.5, 1].map((f) => (
              <text
                key={f}
                x={W - padR + 10}
                y={yu(maxUnits * f) + 4}
                className={styles.axisText}
                fill={PALETTE.units}
              >
                {Math.round(maxUnits * f).toLocaleString('en-US')}
              </text>
            ))}
          </>
        )}

        {data.map((d, i) =>
          i % 2 === 0 ? (
            <text key={d.month} x={x(i)} y={H - 24} textAnchor="middle" className={styles.axisText}>
              {d.label}
            </text>
          ) : null
        )}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// -------------------------------------------------------------------------
// Stacked organic / paid columns.
// -------------------------------------------------------------------------

export interface StackedColumn {
  label: string;
  sub?: string;
  organic: number;
  paid: number;
  unconfirmed?: boolean;
}

export function StackedSplit({ columns }: { columns: StackedColumn[] }) {
  const [tip, setTip] = useState<TipState | null>(null);
  const W = 460;
  const H = 300;
  const padT = 18;
  const padB = 52;
  const plotH = H - padT - padB;
  const max = Math.max(...columns.map((c) => c.organic + c.paid)) * 1.1;
  const step = W / columns.length;
  const barW = Math.min(96, step * 0.46);
  const h = (v: number) => (v / max) * plotH;
  const cx = (i: number) => step * i + step / 2;

  return (
    <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img">
        {columns.map((c, i) => {
          const paidH = h(c.paid);
          const orgH = h(c.organic);
          const base = padT + plotH;
          return (
            <g key={c.label}>
              <rect
                x={cx(i) - barW / 2}
                y={base - orgH}
                width={barW}
                height={orgH}
                fill={PALETTE.organic}
                onMouseEnter={() =>
                  setTip({
                    x: (cx(i) / W) * 100,
                    y: ((base - orgH) / H) * 100,
                    content: (
                      <>
                        <strong>{c.label} — organic</strong>
                        <span>
                          {c.organic.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                          {' · '}
                          {((c.organic / (c.organic + c.paid)) * 100).toFixed(1)}% of gross
                        </span>
                      </>
                    ),
                  })
                }
              />
              <rect
                x={cx(i) - barW / 2}
                y={base - orgH - paidH}
                width={barW}
                height={paidH}
                fill={PALETTE.paid}
                stroke={c.unconfirmed ? '#e0b03a' : 'none'}
                strokeDasharray={c.unconfirmed ? '4 3' : undefined}
                onMouseEnter={() =>
                  setTip({
                    x: (cx(i) / W) * 100,
                    y: ((base - orgH - paidH) / H) * 100,
                    content: (
                      <>
                        <strong>{c.label} — ad-attributed</strong>
                        <span>
                          {c.paid.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                          {' · '}
                          {((c.paid / (c.organic + c.paid)) * 100).toFixed(1)}% of gross
                        </span>
                        {c.unconfirmed && <em className={styles.tipAmber}>basis unconfirmed</em>}
                      </>
                    ),
                  })
                }
              />
              <text x={cx(i)} y={H - 28} textAnchor="middle" className={styles.axisLabelStrong}>
                {c.label}
              </text>
              {c.sub && (
                <text x={cx(i)} y={H - 12} textAnchor="middle" className={styles.axisText}>
                  {c.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// -------------------------------------------------------------------------
// 100% mix bar - channel share of revenue or of spend.
// -------------------------------------------------------------------------

export interface MixSegment {
  label: string;
  value: number;
  color: string;
}

export function MixBar({ segments, total }: { segments: MixSegment[]; total: number }) {
  return (
    <div className={styles.mixBar}>
      <div className={styles.mixTrack}>
        {segments.map((sg) => (
          <div
            key={sg.label}
            className={styles.mixSeg}
            style={{ width: `${(sg.value / total) * 100}%`, background: sg.color }}
            title={`${sg.label}: ${((sg.value / total) * 100).toFixed(1)}%`}
          >
            <span>{((sg.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div className={styles.mixKeys}>
        {segments.map((sg) => (
          <span key={sg.label}>
            <i style={{ background: sg.color }} />
            {sg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// Waterfall: FY2025 -> removals -> declines -> growth -> run rate.
// -------------------------------------------------------------------------

export interface WaterfallStep {
  label: string;
  value: number;
  kind: 'total' | 'removed' | 'decline' | 'growth';
  detail?: string;
}

export function Waterfall({ steps }: { steps: WaterfallStep[] }) {
  const [tip, setTip] = useState<TipState | null>(null);
  const W = 1000;
  const H = 340;
  const padL = 62;
  const padT = 20;
  const padB = 74;
  const plotH = H - padT - padB;
  const plotW = W - padL - 20;
  const step = plotW / steps.length;
  const barW = step * 0.62;

  let running = 0;
  const bars = steps.map((s) => {
    if (s.kind === 'total') {
      const bar = { from: 0, to: s.value, s };
      running = s.value;
      return bar;
    }
    const from = running;
    running += s.value;
    return { from, to: running, s };
  });

  const max = Math.max(...bars.map((b) => Math.max(b.from, b.to))) * 1.08;
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const cx = (i: number) => padL + i * step + step / 2;

  const color = (k: WaterfallStep['kind']) =>
    k === 'total' ? PALETTE.gross : k === 'removed' ? PALETTE.removed : k === 'decline' ? PALETTE.decline : PALETTE.growth;

  return (
    <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={W - 20} y1={y(max * f)} y2={y(max * f)} stroke={PALETTE.grid} />
            <text x={padL - 10} y={y(max * f) + 4} textAnchor="end" className={styles.axisText}>
              {axisMoney(max * f)}
            </text>
          </g>
        ))}
        {bars.map((b, i) => {
          const top = Math.min(y(b.from), y(b.to));
          const height = Math.max(2, Math.abs(y(b.from) - y(b.to)));
          return (
            <g key={b.s.label + i}>
              {i > 0 && (
                <line
                  x1={cx(i - 1) + barW / 2}
                  x2={cx(i) - barW / 2}
                  y1={y(bars[i - 1].to)}
                  y2={y(bars[i - 1].to)}
                  stroke={PALETTE.axis}
                  strokeDasharray="2 3"
                />
              )}
              <rect
                x={cx(i) - barW / 2}
                y={top}
                width={barW}
                height={height}
                fill={color(b.s.kind)}
                onMouseEnter={() =>
                  setTip({
                    x: (cx(i) / W) * 100,
                    y: (top / H) * 100,
                    content: (
                      <>
                        <strong>{b.s.label}</strong>
                        <span>
                          {b.s.kind === 'total'
                            ? b.s.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                            : `${b.s.value > 0 ? '+' : ''}${b.s.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`}
                        </span>
                        {b.s.detail && <em>{b.s.detail}</em>}
                      </>
                    ),
                  })
                }
              />
              <text x={cx(i)} y={top - 6} textAnchor="middle" className={styles.axisText}>
                {b.s.kind === 'total' ? axisMoney(b.s.value) : `${b.s.value > 0 ? '+' : '−'}${axisMoney(Math.abs(b.s.value))}`}
              </text>
              <text x={cx(i)} y={H - padB + 22} textAnchor="middle" className={styles.waterfallLabel}>
                {b.s.label}
              </text>
              {b.s.detail && (
                <text x={cx(i)} y={H - padB + 38} textAnchor="middle" className={styles.axisText}>
                  {b.s.detail}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// -------------------------------------------------------------------------
// Sparkline for a product's monthly series.
// -------------------------------------------------------------------------

export function Sparkline({
  values,
  months,
  markerMonths = [],
}: {
  values: number[];
  months: string[];
  markerMonths?: string[];
}) {
  const W = 620;
  const H = 90;
  const pad = 6;
  const max = Math.max(...values, 1);
  const step = (W - pad * 2) / Math.max(values.length - 1, 1);
  const x = (i: number) => pad + i * step;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(values.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.spark} role="img" aria-label="monthly revenue">
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke={PALETTE.grid} />
      <path d={area} fill="rgba(91,139,181,0.14)" />
      <path d={path} fill="none" stroke={PALETTE.gross} strokeWidth={1.8} />
      {months.map((m, i) =>
        markerMonths.includes(m) ? (
          <line key={m} x1={x(i)} x2={x(i)} y1={pad} y2={H - pad} stroke={PALETTE.removed} strokeDasharray="3 3" />
        ) : null
      )}
      {values.map((v, i) => (v === 0 ? <circle key={i} cx={x(i)} cy={H - pad} r={1.6} fill={PALETTE.removed} /> : null))}
    </svg>
  );
}

// -------------------------------------------------------------------------
// Donut for the exposure buckets.
// -------------------------------------------------------------------------

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
  muted?: boolean;
}

export function Donut({
  slices,
  centerValue,
  centerLabel,
  onHover,
}: {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  onHover?: (label: string | null) => void;
}) {
  const size = 260;
  const r = 100;
  const stroke = 34;
  const c = size / 2;
  const total = slices.reduce((a, s) => a + s.value, 0);
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={styles.donut} role="img">
      {slices.map((s) => {
        const len = (s.value / total) * circ;
        const el = (
          <circle
            key={s.label}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeOpacity={s.muted ? 0.28 : 1}
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${c} ${c})`}
            onMouseEnter={() => onHover?.(s.label)}
            onMouseLeave={() => onHover?.(null)}
          />
        );
        offset += len;
        return el;
      })}
      <text x={c} y={c - 4} textAnchor="middle" className={styles.donutValue}>
        {centerValue}
      </text>
      <text x={c} y={c + 18} textAnchor="middle" className={styles.donutLabel}>
        {centerLabel}
      </text>
    </svg>
  );
}

// -------------------------------------------------------------------------
// Enforcement timeline: one swimlane per ASIN.
// -------------------------------------------------------------------------

export interface TimelineEvent {
  date: string;
  asin: string;
  kind: 'violation' | 'removed' | 'at_risk' | 'deactivated';
  label: string;
  detail?: string;
}

export function Timeline({
  lanes,
  events,
  start,
  end,
  bands = [],
}: {
  lanes: { asin: string; product: string }[];
  events: TimelineEvent[];
  start: string;
  end: string;
  /** Highlighted windows - the enforcement sweeps that have to be impossible to miss. */
  bands?: { from: string; to: string; label: string }[];
}) {
  const [tip, setTip] = useState<TipState | null>(null);
  const W = 1000;
  const laneH = 26;
  const padL = 250;
  const padT = 34;
  const padB = 30;
  const H = padT + lanes.length * laneH + padB;
  const t0 = new Date(start).getTime();
  const t1 = new Date(end).getTime();
  const x = (d: string) => padL + ((new Date(d).getTime() - t0) / (t1 - t0)) * (W - padL - 24);

  const quarters: { d: string; label: string }[] = [];
  for (let yr = 2024; yr <= 2026; yr += 1) {
    ['01', '04', '07', '10'].forEach((m, qi) => {
      const d = `${yr}-${m}-01`;
      if (new Date(d).getTime() >= t0 && new Date(d).getTime() <= t1) {
        quarters.push({ d, label: `Q${qi + 1} ${String(yr).slice(2)}` });
      }
    });
  }

  const color = (k: TimelineEvent['kind']) =>
    k === 'removed' ? PALETTE.removed : k === 'deactivated' ? '#7a2f2b' : k === 'at_risk' ? PALETTE.amber : '#a8603f';

  return (
    <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img">
        {quarters.map((q) => (
          <g key={q.d}>
            <line x1={x(q.d)} x2={x(q.d)} y1={padT - 12} y2={H - padB + 4} stroke={PALETTE.grid} />
            <text x={x(q.d)} y={padT - 18} textAnchor="middle" className={styles.axisText}>
              {q.label}
            </text>
          </g>
        ))}
        {bands.map((b) => (
          <g key={b.label}>
            <rect
              x={x(b.from)}
              y={padT - 6}
              width={Math.max(10, x(b.to) - x(b.from))}
              height={lanes.length * laneH + 6}
              fill="rgba(192,69,63,0.14)"
              stroke="rgba(192,69,63,0.55)"
              strokeDasharray="4 3"
            />
            <text
              x={x(b.from) + Math.max(10, x(b.to) - x(b.from)) / 2}
              y={H - padB + 18}
              textAnchor="middle"
              className={styles.bandLabel}
            >
              {b.label}
            </text>
          </g>
        ))}
        {lanes.map((lane, i) => {
          const y = padT + i * laneH + laneH / 2;
          const laneEvents = events.filter((e) => e.asin === lane.asin);
          return (
            <g key={lane.asin}>
              <line x1={padL} x2={W - 24} y1={y} y2={y} stroke="#1f1f1f" strokeWidth={laneH - 6} />
              <text x={10} y={y + 4} className={styles.laneAsin}>
                {lane.asin}
              </text>
              <text x={104} y={y + 4} className={styles.laneName}>
                {lane.product.length > 26 ? `${lane.product.slice(0, 25)}…` : lane.product}
              </text>
              {laneEvents.map((e, j) => {
                const cx = x(e.date);
                const fill = color(e.kind);
                const common = {
                  onMouseEnter: () =>
                    setTip({
                      x: (cx / W) * 100,
                      y: (y / H) * 100,
                      content: (
                        <>
                          <strong>
                            {lane.asin} — {e.label}
                          </strong>
                          <span>{new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          {e.detail && <em>{e.detail}</em>}
                        </>
                      ),
                    }),
                };
                if (e.kind === 'violation') {
                  return (
                    <polygon
                      key={j}
                      points={`${cx},${y - 6} ${cx + 6},${y} ${cx},${y + 6} ${cx - 6},${y}`}
                      fill={fill}
                      {...common}
                    />
                  );
                }
                if (e.kind === 'removed') {
                  return <rect key={j} x={cx - 4.5} y={y - 4.5} width={9} height={9} fill={fill} {...common} />;
                }
                return <circle key={j} cx={cx} cy={y} r={4.2} fill={fill} fillOpacity={e.kind === 'deactivated' ? 0.85 : 1} {...common} />;
              })}
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// -------------------------------------------------------------------------
// Simple month bars (removal / disposal events).
// -------------------------------------------------------------------------

export function EventBars({
  data,
  markers = [],
}: {
  data: { month: string; label: string; value: number }[];
  markers?: string[];
}) {
  const [tip, setTip] = useState<TipState | null>(null);
  const W = 1000;
  const H = 210;
  const padL = 46;
  const padT = 16;
  const padB = 34;
  const plotH = H - padT - padB;
  const max = Math.max(...data.map((d) => d.value)) * 1.1;
  const step = (W - padL - 16) / data.length;
  const barW = step * 0.6;
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const x = (i: number) => padL + i * step + step / 2;

  return (
    <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={W - 16} y1={y(max * f)} y2={y(max * f)} stroke={PALETTE.grid} />
            <text x={padL - 8} y={y(max * f) + 4} textAnchor="end" className={styles.axisText}>
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <rect
            key={d.month}
            x={x(i) - barW / 2}
            y={y(d.value)}
            width={barW}
            height={padT + plotH - y(d.value)}
            fill={markers.includes(d.month) ? PALETTE.removed : PALETTE.neutral}
            onMouseEnter={() =>
              setTip({
                x: (x(i) / W) * 100,
                y: (y(d.value) / H) * 100,
                content: (
                  <>
                    <strong>{d.label}</strong>
                    <span>{d.value} removal / disposal events</span>
                  </>
                ),
              })
            }
          />
        ))}
        {data.map((d, i) =>
          i % 2 === 0 ? (
            <text key={d.month} x={x(i)} y={H - 12} textAnchor="middle" className={styles.axisText}>
              {d.label}
            </text>
          ) : null
        )}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}
