'use client';

/**
 * Chart panels for the govino monthly report.
 *
 * Hand-rolled SVG, matching the Sonoma report: the site is a static export with
 * no charting dependency, and these pages get forwarded as PDFs.
 *
 * One measure per panel, one y-scale each — never twin axes, so the shape of a
 * comparison is set by the data rather than by where the axes were pinned.
 *
 * Colour is assigned by what the thing *is*, and every panel carries its own
 * legend so identity is never colour-alone:
 *   green  earned / prior year      blue  paid, or the current year
 *   pink   brand-driven paid demand (Beauty Box accent, used only where it means this)
 * Validated for the #141414 card surface: lightness band, chroma floor, CVD
 * separation, normal-vision floor and >=3:1 contrast all pass.
 */

import { useId, useState } from 'react';
import styles from './govino.module.css';

export const C = {
  before: '#199e70',
  now: '#3987e5',
  organic: '#199e70',
  paid: '#3987e5',
  branded: '#FF2D7B',
  generic: '#3987e5',
  grid: '#2c2c2a',
  axis: '#4a4a47',
};

const money = (n: number) => {
  if (Math.abs(n) < 1000) return `$${Math.round(n)}`;
  const k = n / 1000;
  return `$${Number.isInteger(k) ? k : k.toFixed(1)}K`;
};

const exact = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

/** Counts (units) and rates (ACOS, TACOS) cannot wear the money formatter. */
export const fmtCount = (n: number) =>
  Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `${Math.round(n)}`;
export const fmtCountExact = (n: number) => Math.round(n).toLocaleString('en-US');
export const fmtPct = (n: number) => `${n.toFixed(0)}%`;
export const fmtPctExact = (n: number) => `${n.toFixed(1)}%`;

/** Round an axis maximum up to a readable step, so gridlines land on $20K. */
function niceTicks(rawMax: number, target = 4): number[] {
  const rough = rawMax / target;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((c) => c >= rough) ?? 10 * mag;
  const top = Math.ceil(rawMax / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

const W = 1000;
const H = 300;
const padL = 96;
const padR = 16;
const padT = 18;
const padB = 44;
const plotW = W - padL - padR;
const plotH = H - padT - padB;

// --- Grouped bars: two series side by side -------------------------------

export interface GroupPoint {
  label: string;
  before: number;
  now: number;
  change: number;
}

export function GroupedBars({
  data,
  caption,
  beforeLabel,
  nowLabel,
  colors = [C.before, C.now],
  fmtAxis = money,
  fmtExact = exact,
}: {
  data: GroupPoint[];
  caption: string;
  beforeLabel: string;
  nowLabel: string;
  colors?: [string, string];
  /** Axis ticks. Defaults to money; pass a counter or a percentage formatter. */
  fmtAxis?: (n: number) => string;
  /** Tooltip values, usually the unrounded form of the same unit. */
  fmtExact?: (n: number) => string;
}) {
  const [tip, setTip] = useState<{ x: number; y: number; p: GroupPoint } | null>(null);
  const clipId = useId();

  const gridVals = niceTicks(Math.max(...data.map((d) => Math.max(d.before, d.now))) * 1.04, 4);
  const max = gridVals[gridVals.length - 1];
  const step = plotW / data.length;
  const barW = Math.min(step * 0.34, 34);
  const gap = 3;
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const cx = (i: number) => padL + i * step + step / 2;

  return (
    <figure className={styles.panelFig}>
      <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={caption}>
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={W} height={y(0)} />
            </clipPath>
          </defs>

          {gridVals.map((v, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={1} />
              <text x={padL - 14} y={y(v) + 7} textAnchor="end" className={styles.axisText}>
                {fmtAxis(v)}
              </text>
            </g>
          ))}

          <g clipPath={`url(#${clipId})`}>
            {data.map((d, i) => (
              <g
                key={d.label}
                onMouseEnter={() =>
                  setTip({
                    x: ((cx(i) - padL) / plotW) * 92 + 4,
                    y: (y(Math.max(d.before, d.now)) / H) * 100,
                    p: d,
                  })
                }
              >
                <rect x={cx(i) - step / 2} y={padT} width={step} height={plotH} fill="transparent" />
                <rect
                  x={cx(i) - barW - gap / 2}
                  y={y(d.before)}
                  width={barW}
                  height={y(0) - y(d.before) + 8}
                  rx={4}
                  fill={colors[0]}
                />
                <rect
                  x={cx(i) + gap / 2}
                  y={y(d.now)}
                  width={barW}
                  height={y(0) - y(d.now) + 8}
                  rx={4}
                  fill={colors[1]}
                />
              </g>
            ))}
          </g>

          <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke={C.axis} strokeWidth={1} />

          {data.map((d, i) => (
            <text key={d.label} x={cx(i)} y={H - 14} textAnchor="middle" className={styles.axisText}>
              {d.label}
            </text>
          ))}
        </svg>

        {tip && (
          <div className={styles.tooltip} style={{ left: `${tip.x}%`, top: `${tip.y}%` }}>
            <strong>{tip.p.label}</strong>
            <span>
              <i className={styles.tipDot} style={{ background: colors[0] }} /> {beforeLabel}{' '}
              {fmtExact(tip.p.before)}
            </span>
            <span>
              <i className={styles.tipDot} style={{ background: colors[1] }} /> {nowLabel}{' '}
              {fmtExact(tip.p.now)}
            </span>
            <em>{`${tip.p.change >= 0 ? '+' : ''}${tip.p.change.toFixed(0)}% year on year`}</em>
          </div>
        )}
      </div>
      <figcaption className={styles.panelCaption}>{caption}</figcaption>
    </figure>
  );
}

// --- Stacked bars: composition of one total ------------------------------

export interface StackPoint {
  label: string;
  lower: number;
  upper: number;
}

export function StackedBars({
  data,
  caption,
  lowerLabel,
  upperLabel,
  colors = [C.organic, C.paid],
}: {
  data: StackPoint[];
  caption: string;
  lowerLabel: string;
  upperLabel: string;
  colors?: [string, string];
}) {
  const [tip, setTip] = useState<{ x: number; y: number; p: StackPoint } | null>(null);
  const clipId = useId();

  const gridVals = niceTicks(Math.max(...data.map((d) => d.lower + d.upper)) * 1.04, 4);
  const max = gridVals[gridVals.length - 1];
  const step = plotW / data.length;
  const barW = Math.min(step * 0.5, 48);
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const cx = (i: number) => padL + i * step + step / 2;

  return (
    <figure className={styles.panelFig}>
      <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={caption}>
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={W} height={y(0)} />
            </clipPath>
          </defs>

          {gridVals.map((v, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={1} />
              <text x={padL - 14} y={y(v) + 7} textAnchor="end" className={styles.axisText}>
                {money(v)}
              </text>
            </g>
          ))}

          <g clipPath={`url(#${clipId})`}>
            {data.map((d, i) => {
              const totalV = d.lower + d.upper;
              return (
                <g
                  key={d.label}
                  onMouseEnter={() =>
                    setTip({ x: ((cx(i) - padL) / plotW) * 92 + 4, y: (y(totalV) / H) * 100, p: d })
                  }
                >
                  <rect x={cx(i) - step / 2} y={padT} width={step} height={plotH} fill="transparent" />
                  {/* Lower segment keeps its flat baseline; the 2px surface gap
                      between the two keeps the boundary readable. */}
                  <rect
                    x={cx(i) - barW / 2}
                    y={y(d.lower)}
                    width={barW}
                    height={y(0) - y(d.lower)}
                    rx={4}
                    fill={colors[0]}
                  />
                  <rect
                    x={cx(i) - barW / 2}
                    y={y(totalV)}
                    width={barW}
                    height={y(d.lower) - y(totalV) - 2}
                    rx={4}
                    fill={colors[1]}
                  />
                </g>
              );
            })}
          </g>

          <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke={C.axis} strokeWidth={1} />

          {data.map((d, i) => (
            <text key={d.label} x={cx(i)} y={H - 14} textAnchor="middle" className={styles.axisText}>
              {d.label}
            </text>
          ))}
        </svg>

        {tip && (
          <div className={styles.tooltip} style={{ left: `${tip.x}%`, top: `${tip.y}%` }}>
            <strong>{tip.p.label}</strong>
            <span>
              <i className={styles.tipDot} style={{ background: colors[1] }} /> {upperLabel}{' '}
              {exact(tip.p.upper)}
            </span>
            <span>
              <i className={styles.tipDot} style={{ background: colors[0] }} /> {lowerLabel}{' '}
              {exact(tip.p.lower)}
            </span>
            <em>
              {((tip.p.lower / (tip.p.lower + tip.p.upper)) * 100).toFixed(0)}% {lowerLabel.toLowerCase()}
            </em>
          </div>
        )}
      </div>
      <figcaption className={styles.panelCaption}>{caption}</figcaption>
    </figure>
  );
}

// --- Trend lines: one or two rates over the same months ------------------

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

export function TrendLines({
  labels,
  series,
  caption,
  format,
}: {
  labels: string[];
  series: LineSeries[];
  caption: string;
  format: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const all = series.flatMap((s) => s.values);
  const gridVals = niceTicks(Math.max(...all) * 1.08, 4);
  const max = gridVals[gridVals.length - 1];
  const step = plotW / labels.length;
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const cx = (i: number) => padL + i * step + step / 2;

  return (
    <figure className={styles.panelFig}>
      <div className={styles.chartWrap} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={caption}>
          {gridVals.map((v, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={1} />
              <text x={padL - 14} y={y(v) + 7} textAnchor="end" className={styles.axisText}>
                {format(v)}
              </text>
            </g>
          ))}

          {hover !== null && (
            <line
              x1={cx(hover)}
              x2={cx(hover)}
              y1={padT}
              y2={y(0)}
              stroke={C.axis}
              strokeWidth={1}
            />
          )}

          {series.map((s) => (
            <g key={s.name}>
              <path
                d={s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${cx(i)},${y(v)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={cx(i)}
                  cy={y(v)}
                  r={hover === i ? 7 : 4.5}
                  fill={s.color}
                  stroke="#141414"
                  strokeWidth={2}
                />
              ))}
            </g>
          ))}

          {/* Full-height hit targets, wider than the markers. */}
          {labels.map((l, i) => (
            <rect
              key={l}
              x={cx(i) - step / 2}
              y={padT}
              width={step}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}

          <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke={C.axis} strokeWidth={1} />

          {labels.map((l, i) => (
            <text key={l} x={cx(i)} y={H - 14} textAnchor="middle" className={styles.axisText}>
              {l}
            </text>
          ))}
        </svg>

        {hover !== null && (
          <div
            className={styles.tooltip}
            style={{
              left: `${((cx(hover) - padL) / plotW) * 92 + 4}%`,
              top: `${(Math.min(...series.map((s) => y(s.values[hover]))) / H) * 100}%`,
            }}
          >
            <strong>{labels[hover]}</strong>
            {series.map((s) => (
              <span key={s.name}>
                <i className={styles.tipDot} style={{ background: s.color }} /> {s.name}{' '}
                {format(s.values[hover])}
              </span>
            ))}
          </div>
        )}
      </div>
      <figcaption className={styles.panelCaption}>{caption}</figcaption>
    </figure>
  );
}

// --- Legend --------------------------------------------------------------

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className={styles.legend}>
      {items.map((it) => (
        <span key={it.label} className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// --- Multi-series index lines --------------------------------------------

/**
 * One chart, any combination of the six metrics on it.
 *
 * The metrics are dollars, unit counts and percentages, which have no honest
 * shared linear axis: drawn raw, TACOS at 24 and units at 3,700 would sit as a
 * flat line under sales at 105,000, and the shape of the comparison would be an
 * artefact of the scale rather than the data. So every series is indexed to its
 * own first quarter = 100 and the axis reads in index points. That makes the
 * question the chart answers "which of these moved most, and which way", which
 * is the one worth asking of six measures at once. Real values in native units
 * are in the tooltip, which is where the absolute numbers belong.
 *
 * Colour is assigned per metric in fixed order and never cycled, so a metric
 * keeps its hue whichever others are switched on. Palette validated against the
 * #141414 card surface: lightness band, chroma floor, CVD separation,
 * normal-vision floor and contrast all pass.
 */
export const SERIES_COLORS = [
  '#199e70',
  '#3987e5',
  '#c27612',
  '#9b6ef3',
  '#12a4bf',
  '#FF2D7B',
];

export interface IndexSeries {
  name: string;
  color: string;
  /** Indexed to the first period = 100. */
  index: number[];
  /** Actual values, already formatted for display. */
  display: string[];
}

export function IndexLines({
  labels,
  series,
  caption,
}: {
  labels: string[];
  series: IndexSeries[];
  caption: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const H2 = 360;
  const plotH2 = H2 - padT - padB;
  const all = series.flatMap((s) => s.index);
  const lo = Math.min(100, ...all);
  const hi = Math.max(100, ...all);
  // Pad the band so lines never graze the frame, and keep 100 inside it.
  const pad = Math.max((hi - lo) * 0.12, 5);
  const min = Math.floor((lo - pad) / 10) * 10;
  const max = Math.ceil((hi + pad) / 10) * 10;
  const ticks = 4;
  const stepV = (max - min) / ticks;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => min + i * stepV);

  const step = plotW / labels.length;
  const y = (v: number) => padT + plotH2 - ((v - min) / (max - min)) * plotH2;
  const cx = (i: number) => padL + i * step + step / 2;

  return (
    <figure className={styles.panelFig}>
      <div className={styles.chartWrap} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H2}`} className={styles.svg} role="img" aria-label={caption}>
          {gridVals.map((v, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={1} />
              <text x={padL - 14} y={y(v) + 7} textAnchor="end" className={styles.axisText}>
                {Math.round(v)}
              </text>
            </g>
          ))}

          {/* The baseline every series starts from. */}
          <line
            x1={padL}
            x2={W - padR}
            y1={y(100)}
            y2={y(100)}
            stroke={C.axis}
            strokeWidth={1.5}
            strokeDasharray="6 5"
          />

          {hover !== null && (
            <line x1={cx(hover)} x2={cx(hover)} y1={padT} y2={padT + plotH2} stroke={C.axis} strokeWidth={1} />
          )}

          {series.map((s) => (
            <g key={s.name}>
              <path
                d={s.index.map((v, i) => `${i === 0 ? 'M' : 'L'}${cx(i)},${y(v)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.index.map((v, i) => (
                <circle
                  key={i}
                  cx={cx(i)}
                  cy={y(v)}
                  r={hover === i ? 7 : 4.5}
                  fill={s.color}
                  stroke="#141414"
                  strokeWidth={2}
                />
              ))}
            </g>
          ))}

          {labels.map((l, i) => (
            <rect
              key={l}
              x={cx(i) - step / 2}
              y={padT}
              width={step}
              height={plotH2}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}

          <line x1={padL} x2={W - padR} y1={padT + plotH2} y2={padT + plotH2} stroke={C.axis} strokeWidth={1} />

          {labels.map((l, i) => (
            <text key={l} x={cx(i)} y={H2 - 14} textAnchor="middle" className={styles.axisText}>
              {l}
            </text>
          ))}
        </svg>

        {hover !== null && series.length > 0 && (
          <div
            className={styles.tooltip}
            style={{
              left: `${((cx(hover) - padL) / plotW) * 88 + 6}%`,
              top: `${(Math.min(...series.map((s) => y(s.index[hover]))) / H2) * 100}%`,
            }}
          >
            <strong>{labels[hover]}</strong>
            {series.map((s) => (
              <span key={s.name}>
                <i className={styles.tipDot} style={{ background: s.color }} /> {s.name}{' '}
                <em>{s.display[hover]}</em>
              </span>
            ))}
          </div>
        )}
      </div>
      <figcaption className={styles.panelCaption}>{caption}</figcaption>
    </figure>
  );
}

// --- Quarter charts ------------------------------------------------------

/**
 * Two charts rather than one.
 *
 * Sales and spend are both dollars, so they belong together on one y-axis and
 * the spend line reads directly against the bars it paid for. TACOS is a rate
 * and gets its own chart underneath: on a scale reaching $105,000 it would lie
 * flat on the floor, and a second y-axis would let the crossings be decided by
 * where the axes were pinned rather than by the data.
 *
 * The year is carried differently by each mark, because the palette has room
 * for it in one place and not the other. Bars get their own hue, blue for last
 * year against green for this one, with last year always the left bar so
 * position reinforces it. The lines keep dashed against solid, since a second
 * hue each for spend and TACOS would need colours this palette cannot spare.
 */
export interface ComboPoint {
  label: string;
  sales: number;
  salesPrior: number;
  spend: number;
  spendPrior: number;
  tacos: number;
  tacosPrior: number;
}

export const COMBO = {
  sales: '#199e70',
  /**
   * Last year's sales bar. No fourth hue clears green, purple and amber at
   * once on this surface, and steps of the same green sit under ΔE 10 for
   * normal vision, which is not a difference anyone can read. So the budget
   * goes to the pair that has to separate: blue against green is ΔE 20.9 for
   * normal vision and 19.6 under deuteranopia. It shares a hue family with the
   * purple spend line, which a strict all-pairs check flags, but a filled bar
   * and a 2.5px stroke are never confused and the two never sit edge to edge.
   */
  salesPrior: '#3987e5',
  spend: '#9b6ef3',
  tacos: '#c27612',
};

/**
 * Two line-end labels can land on top of each other when the years finish
 * close together. Nudge them apart around their midpoint rather than letting
 * them overlap. The gap clears the phone breakpoint's larger label size, since
 * the nudge is computed in viewBox units and cannot know which size renders.
 */
function spread(a: number, b: number, min = 38): [number, number] {
  const gap = Math.abs(a - b);
  if (gap >= min) return [a, b];
  const mid = (a + b) / 2;
  const half = min / 2;
  return a <= b ? [mid - half, mid + half] : [mid + half, mid - half];
}

const pctChange = (now: number, before: number) => (before ? (now / before - 1) * 100 : 0);
const signed = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(0)}%`;

/**
 * One tooltip row: the metric, then this year over last year in a two-column
 * grid so the years stack and the values line up under each other. Compact
 * enough that three of these still read at a glance.
 */
function TipRow({
  name,
  color,
  now,
  prior,
  delta,
}: {
  name: string;
  color: string;
  now: string;
  prior: string;
  delta: string;
}) {
  return (
    <div className={styles.tipRow}>
      <div className={styles.tipName}>
        <i className={styles.tipDot} style={{ background: color }} />
        {name}
      </div>
      <div className={styles.tipYears}>
        <span className={styles.tipYr}>2026</span>
        <span className={styles.tipNow}>{now}</span>
        <span />
        <span className={styles.tipYr}>2025</span>
        <span className={styles.tipWas}>{prior}</span>
        <span className={styles.tipDelta}>{delta}</span>
      </div>
    </div>
  );
}

/** Dashed with hollow markers for last year, solid and filled for this one. */
function YearLine({
  pts,
  color,
  prior,
  hover,
}: {
  pts: { x: number; y: number }[];
  color: string;
  prior: boolean;
  hover: number | null;
}) {
  return (
    <g>
      <path
        d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={prior ? '7 5' : undefined}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={hover === i ? 7 : 5}
          fill={prior ? '#141414' : color}
          stroke={color}
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

// --- Sales and spend, in dollars -----------------------------------------

export function SalesSpendChart({
  data,
  caption,
  show,
}: {
  data: ComboPoint[];
  caption: string;
  show: { sales: boolean; spend: boolean };
}) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();

  // Taller than the plot needs: the extra row at the bottom carries a year
  // under each bar, and the right margin carries a year at each line end, so
  // the reader never has to go back to the key to know which is which.
  const H2 = 380;
  const padB2 = 84;
  const padR2 = 92;
  const plotW2 = W - padL - padR2;
  const plotH2 = H2 - padT - padB2;
  const vals = [
    ...(show.sales ? data.flatMap((d) => [d.sales, d.salesPrior]) : []),
    ...(show.spend ? data.flatMap((d) => [d.spend, d.spendPrior]) : []),
  ];
  const ticks = niceTicks(Math.max(1, ...vals) * 1.08, 4);
  const max = ticks[ticks.length - 1];
  const y = (v: number) => padT + plotH2 - (v / max) * plotH2;

  const step = plotW2 / data.length;
  const barW = Math.min(step * 0.2, 44);
  const barGap = 6;
  const cx = (i: number) => padL + i * step + step / 2;
  const barX = (i: number, prior: boolean) =>
    prior ? cx(i) - barW / 2 - barGap / 2 - barW / 2 : cx(i) + barW / 2 + barGap / 2 - barW / 2;

  return (
    <figure className={styles.panelFig}>
      <div className={styles.chartWrap} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H2}`} className={styles.svg} role="img" aria-label={caption}>
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={W} height={y(0)} />
            </clipPath>
          </defs>

          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR2} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={1} />
              <text x={padL - 14} y={y(v) + 7} textAnchor="end" className={styles.axisText}>
                {money(v)}
              </text>
            </g>
          ))}

          {show.sales && (
            <g clipPath={`url(#${clipId})`}>
              {data.map((d, i) => (
                <g key={d.label}>
                  <rect
                    x={cx(i) - barW - barGap / 2}
                    y={y(d.salesPrior)}
                    width={barW}
                    height={y(0) - y(d.salesPrior) + 8}
                    rx={4}
                    fill={COMBO.salesPrior}
                  />
                  <rect
                    x={cx(i) + barGap / 2}
                    y={y(d.sales)}
                    width={barW}
                    height={y(0) - y(d.sales) + 8}
                    rx={4}
                    fill={COMBO.sales}
                  />
                </g>
              ))}
            </g>
          )}

          {show.spend && (
            <>
              <YearLine
                pts={data.map((d, i) => ({ x: cx(i), y: y(d.spendPrior) }))}
                color={COMBO.spend}
                prior
                hover={hover}
              />
              <YearLine
                pts={data.map((d, i) => ({ x: cx(i), y: y(d.spend) }))}
                color={COMBO.spend}
                prior={false}
                hover={hover}
              />
              {/* Direct labels at the line ends, so the year is readable
                  without going back to the key. */}
              {(() => {
                const last = data[data.length - 1];
                const [yNow, yPrior] = spread(y(last.spend), y(last.spendPrior));
                return (
                  <>
                    <text
                      x={cx(data.length - 1) + 14}
                      y={yNow + 7}
                      className={styles.seriesLabel}
                      fill={COMBO.spend}
                    >
                      2026
                    </text>
                    <text
                      x={cx(data.length - 1) + 14}
                      y={yPrior + 7}
                      className={styles.seriesLabel}
                      fill={COMBO.spend}
                    >
                      2025
                    </text>
                  </>
                );
              })()}
            </>
          )}

          {hover !== null && (
            <line x1={cx(hover)} x2={cx(hover)} y1={padT} y2={y(0)} stroke={C.axis} strokeWidth={1} />
          )}

          {data.map((d, i) => (
            <rect
              key={d.label}
              x={cx(i) - step / 2}
              y={padT}
              width={step}
              height={plotH2}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}

          <line x1={padL} x2={W - padR2} y1={y(0)} y2={y(0)} stroke={C.axis} strokeWidth={1} />

          {/* A year under each bar, in that bar's own colour. */}
          {show.sales &&
            data.map((d, i) => (
              <g key={`yr-${d.label}`}>
                <text
                  x={barX(i, true) + barW / 2}
                  y={y(0) + 30}
                  textAnchor="middle"
                  className={styles.barYear}
                  fill={COMBO.salesPrior}
                >
                  2025
                </text>
                <text
                  x={barX(i, false) + barW / 2}
                  y={y(0) + 30}
                  textAnchor="middle"
                  className={styles.barYear}
                  fill={COMBO.sales}
                >
                  2026
                </text>
              </g>
            ))}

          {data.map((d, i) => (
            <text key={d.label} x={cx(i)} y={H2 - 16} textAnchor="middle" className={styles.axisText}>
              {d.label}
            </text>
          ))}
        </svg>

        {hover !== null && (
          <div
            className={`${styles.tooltip} ${styles.tooltipBelow}`}
            style={{ left: `${((cx(hover) - padL) / plotW2) * 80 + 8}%`, top: `${(padT / H2) * 100}%` }}
          >
            <strong>{data[hover].label}</strong>
            {show.sales && (
              <TipRow
                name="Total Sales"
                color={COMBO.sales}
                now={exact(data[hover].sales)}
                prior={exact(data[hover].salesPrior)}
                delta={signed(pctChange(data[hover].sales, data[hover].salesPrior))}
              />
            )}
            {show.spend && (
              <TipRow
                name="Ad Spend"
                color={COMBO.spend}
                now={exact(data[hover].spend)}
                prior={exact(data[hover].spendPrior)}
                delta={signed(pctChange(data[hover].spend, data[hover].spendPrior))}
              />
            )}
          </div>
        )}
      </div>
      <figcaption className={styles.panelCaption}>{caption}</figcaption>
    </figure>
  );
}

// --- TACOS, its own chart and its own scale ------------------------------

export function TacosChart({ data, caption }: { data: ComboPoint[]; caption: string }) {
  const [hover, setHover] = useState<number | null>(null);

  const H2 = 280;
  // Right margin carries a year at each line end, as on the sales chart.
  const padR2 = 92;
  const plotW2 = W - padL - padR2;
  const plotH2 = H2 - padT - padB;
  const ticks = niceTicks(Math.max(...data.flatMap((d) => [d.tacos, d.tacosPrior])) * 1.15, 3);
  const max = ticks[ticks.length - 1];
  const y = (v: number) => padT + plotH2 - (v / max) * plotH2;

  const step = plotW2 / data.length;
  const cx = (i: number) => padL + i * step + step / 2;

  return (
    <figure className={styles.panelFig}>
      <div className={styles.chartWrap} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H2}`} className={styles.svg} role="img" aria-label={caption}>
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR2} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={1} />
              <text x={padL - 14} y={y(v) + 7} textAnchor="end" className={styles.axisText}>
                {`${Math.round(v)}%`}
              </text>
            </g>
          ))}

          <YearLine
            pts={data.map((d, i) => ({ x: cx(i), y: y(d.tacosPrior) }))}
            color={COMBO.tacos}
            prior
            hover={hover}
          />
          <YearLine
            pts={data.map((d, i) => ({ x: cx(i), y: y(d.tacos) }))}
            color={COMBO.tacos}
            prior={false}
            hover={hover}
          />

          {(() => {
            const last = data[data.length - 1];
            const [yNow, yPrior] = spread(y(last.tacos), y(last.tacosPrior));
            return (
              <>
                <text
                  x={cx(data.length - 1) + 14}
                  y={yNow + 7}
                  className={styles.seriesLabel}
                  fill={COMBO.tacos}
                >
                  2026
                </text>
                <text
                  x={cx(data.length - 1) + 14}
                  y={yPrior + 7}
                  className={styles.seriesLabel}
                  fill={COMBO.tacos}
                >
                  2025
                </text>
              </>
            );
          })()}

          {hover !== null && (
            <line x1={cx(hover)} x2={cx(hover)} y1={padT} y2={y(0)} stroke={C.axis} strokeWidth={1} />
          )}

          {data.map((d, i) => (
            <rect
              key={d.label}
              x={cx(i) - step / 2}
              y={padT}
              width={step}
              height={plotH2}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}

          <line x1={padL} x2={W - padR2} y1={y(0)} y2={y(0)} stroke={C.axis} strokeWidth={1} />

          {data.map((d, i) => (
            <text key={d.label} x={cx(i)} y={H2 - 14} textAnchor="middle" className={styles.axisText}>
              {d.label}
            </text>
          ))}
        </svg>

        {hover !== null && (
          <div
            className={`${styles.tooltip} ${styles.tooltipBelow}`}
            style={{ left: `${((cx(hover) - padL) / plotW2) * 80 + 8}%`, top: `${(padT / H2) * 100}%` }}
          >
            <strong>{data[hover].label}</strong>
            <TipRow
              name="TACOS"
              color={COMBO.tacos}
              now={`${data[hover].tacos.toFixed(1)}%`}
              prior={`${data[hover].tacosPrior.toFixed(1)}%`}
              delta={`${data[hover].tacos - data[hover].tacosPrior >= 0 ? '+' : ''}${(
                data[hover].tacos - data[hover].tacosPrior
              ).toFixed(1)} pts`}
            />
          </div>
        )}
      </div>
      <figcaption className={styles.panelCaption}>{caption}</figcaption>
    </figure>
  );
}

/** Says what the two years look like, since the year is not one encoding. */
export function YearKey() {
  return (
    <div className={styles.yearKey}>
      <span className={styles.legendItem}>
        <svg width="26" height="11" aria-hidden="true">
          <rect x="0" y="0" width="9" height="11" rx="2" fill={COMBO.salesPrior} />
          <line x1="13" y1="6" x2="25" y2="6" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
        2025
      </span>
      <span className={styles.legendItem}>
        <svg width="26" height="11" aria-hidden="true">
          <rect x="0" y="0" width="9" height="11" rx="2" fill={COMBO.sales} />
          <line x1="13" y1="6" x2="25" y2="6" stroke="#ffffff" strokeWidth="2" />
        </svg>
        2026
      </span>
    </div>
  );
}
