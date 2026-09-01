'use client';

/**
 * Chart primitives for the Sonoma 2026 report.
 *
 * Hand-rolled SVG: the site is a static export with no charting dependency,
 * and these need to print cleanly when the brand forwards the page as a PDF.
 * Everything scales off the viewBox, so one markup works on screen and paper.
 *
 * Deliberately no dual-axis charts. Spend and sales live on different scales,
 * so overlaying them on twin y-axes would let the shape of the picture be set
 * by where the axes were pinned rather than by the data. They are drawn as
 * stacked panels over a shared x-axis instead, which is the honest comparison.
 */

import { ReactNode, useId, useState } from 'react';
import styles from './sonoma.module.css';

/** Validated for the dark card surface (#141414): lightness band, chroma floor,
 *  CVD separation, normal-vision floor and >=3:1 contrast all pass. */
export const C = {
  sales: '#3987e5',
  spend: '#d95926',
  organic: '#199e70',
  units: '#c98500',
  grid: '#2c2c2a',
  axis: '#383835',
  muted: '#898781',
};

/**
 * Compact money for axis ticks. Keeps one decimal when the tick is not a whole
 * number of thousands, so a $2,500 gridline reads "$2.5K" and not "$3K".
 */
export const money = (n: number) => {
  if (Math.abs(n) < 1000) return `$${Math.round(n)}`;
  const k = n / 1000;
  return `$${Number.isInteger(k) ? k : k.toFixed(1)}K`;
};

const count = (n: number) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${Math.round(n)}`);

/**
 * Round an axis maximum up to a readable step, so gridlines land on $20K rather
 * than $98K. Returns the tick values including 0.
 */
function niceTicks(rawMax: number, target = 4): number[] {
  const rough = rawMax / target;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((c) => c >= rough) ?? 10 * mag;
  const top = Math.ceil(rawMax / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

interface Tip {
  x: number;
  y: number;
  content: ReactNode;
}

function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div className={styles.tooltip} style={{ left: `${tip.x}%`, top: `${tip.y}%` }}>
      {tip.content}
    </div>
  );
}

// -------------------------------------------------------------------------
// A single-measure monthly bar panel. Stack several over the same months and
// the reader compares shapes across a shared x-axis without a second y-scale.
// -------------------------------------------------------------------------

export interface PanelPoint {
  label: string;
  value: number;
  /** Optional note surfaced in the tooltip. */
  note?: string;
}

export function BarPanel({
  data,
  color,
  format = 'money',
  caption,
  highlight = [],
  height = 190,
}: {
  data: PanelPoint[];
  color: string;
  format?: 'money' | 'count';
  caption: string;
  /** Labels drawn at full strength; everything else is dimmed. Empty = all lit. */
  highlight?: string[];
  height?: number;
}) {
  const [tip, setTip] = useState<Tip | null>(null);
  const clipId = useId();
  const W = 1000;
  const H = height;
  const padL = 62;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const fmt = format === 'money' ? money : count;
  const exact = (v: number) =>
    format === 'money' ? `$${Math.round(v).toLocaleString('en-US')}` : Math.round(v).toLocaleString('en-US');

  const gridVals = niceTicks(Math.max(...data.map((d) => d.value)) * 1.04, 4);
  const max = gridVals[gridVals.length - 1];
  const step = plotW / data.length;
  const barW = Math.min(step * 0.56, 54);
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const x = (i: number) => padL + i * step + step / 2;

  return (
    <figure className={styles.panelFig}>
      <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={caption}>
          <defs>
            {/* Rounds the top of each bar only, so the data-end is soft but the
                bar stays anchored flat to its baseline. */}
            <clipPath id={clipId}>
              <rect x={0} y={0} width={W} height={y(0)} />
            </clipPath>
          </defs>

          {gridVals.map((v, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={1} />
              <text x={padL - 12} y={y(v) + 4} textAnchor="end" className={styles.axisText}>
                {fmt(v)}
              </text>
            </g>
          ))}

          <g clipPath={`url(#${clipId})`}>
            {data.map((d, i) => {
              const lit = highlight.length === 0 || highlight.includes(d.label);
              const h = Math.max(y(0) - y(d.value), 3);
              return (
                <rect
                  key={d.label}
                  x={x(i) - barW / 2}
                  y={y(d.value)}
                  width={barW}
                  height={h + 6}
                  rx={4}
                  fill={color}
                  opacity={lit ? 1 : 0.45}
                  onMouseEnter={() =>
                    setTip({
                      x: ((x(i) - padL) / plotW) * 92 + 4,
                      y: (y(d.value) / H) * 100,
                      content: (
                        <>
                          <strong>{d.label}</strong>
                          <span>{exact(d.value)}</span>
                          {d.note && <em>{d.note}</em>}
                        </>
                      ),
                    })
                  }
                />
              );
            })}
          </g>

          <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke={C.axis} strokeWidth={1} />

          {data.map((d, i) => (
            <text key={d.label} x={x(i)} y={H - 10} textAnchor="middle" className={styles.axisText}>
              {d.label}
            </text>
          ))}
        </svg>
        <Tooltip tip={tip} />
      </div>
      <figcaption className={styles.panelCaption}>{caption}</figcaption>
    </figure>
  );
}

// -------------------------------------------------------------------------
// Spend against sales, one dot per month. Shows the relationship directly:
// how tight it is, and where it stops paying.
// -------------------------------------------------------------------------

export interface ScatterPoint {
  label: string;
  x: number;
  y: number;
  /** Dims the dot and marks it in the tooltip as the outlier month. */
  flagged?: boolean;
}

export function Scatter({
  data,
  xLabel,
  yLabel,
}: {
  data: ScatterPoint[];
  xLabel: string;
  yLabel: string;
}) {
  const [tip, setTip] = useState<Tip | null>(null);
  const W = 1000;
  const H = 380;
  const padL = 72;
  const padR = 24;
  const padT = 20;
  const padB = 52;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xTickVals = niceTicks(Math.max(...data.map((d) => d.x)) * 1.06, 5);
  const xMax = xTickVals[xTickVals.length - 1];

  // The y-axis is deliberately not zero-based: every month sits in a narrow
  // band well above zero, and anchoring at zero would flatten the whole
  // relationship into one indistinguishable stripe. The axis is labelled, and
  // these are dots rather than bars, so no length is being read as a magnitude.
  const rawLo = Math.min(...data.map((d) => d.y));
  const rawHi = Math.max(...data.map((d) => d.y));
  const yStep = niceTicks(rawHi - rawLo, 3)[1] || 10000;
  const yMin = Math.floor((rawLo - yStep * 0.5) / yStep) * yStep;
  const yMax = Math.ceil((rawHi + yStep * 0.4) / yStep) * yStep;
  const yTickVals = Array.from(
    { length: Math.round((yMax - yMin) / yStep) + 1 },
    (_, i) => yMin + i * yStep,
  );

  const px = (v: number) => padL + (v / xMax) * plotW;
  const py = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  // Least-squares fit across the months actually observed. Drawn only over the
  // observed spend range: the line says nothing about spend levels never run.
  const n = data.length;
  const mx = data.reduce((t, d) => t + d.x, 0) / n;
  const my = data.reduce((t, d) => t + d.y, 0) / n;
  const slope =
    data.reduce((t, d) => t + (d.x - mx) * (d.y - my), 0) /
    data.reduce((t, d) => t + (d.x - mx) ** 2, 0);
  const intercept = my - slope * mx;
  const fitX0 = Math.min(...data.map((d) => d.x));
  const fitX1 = Math.max(...data.map((d) => d.x));

  // Two problems to keep apart. Months that land on *nearly the same spot* get
  // a fanned label with a leader line, because a plain offset would put each
  // label closer to its neighbour's dot than to its own and read as a
  // mislabelled chart. Months that are merely close get the cheaper treatment —
  // the later one's label drops below its dot. Anything else sits above.
  const pos = data.map((d) => ({ x: px(d.x), y: py(d.y) }));

  const cluster = pos.map(() => -1);
  let clusters = 0;
  pos.forEach((p1, i) => {
    if (cluster[i] >= 0) return;
    cluster[i] = clusters;
    pos.forEach((p2, j) => {
      if (j <= i || cluster[j] >= 0) return;
      if (Math.abs(p1.x - p2.x) < 30 && Math.abs(p1.y - p2.y) < 28) cluster[j] = clusters;
    });
    clusters += 1;
  });

  const FAN = [
    { dx: -30, dy: -20, anchor: 'end' as const },
    { dx: 32, dy: 24, anchor: 'start' as const },
    { dx: 32, dy: -20, anchor: 'start' as const },
  ];

  type Placement = { dx: number; dy: number; anchor: 'start' | 'middle' | 'end'; leader: boolean };
  const labels: Placement[] = new Array(pos.length);
  const taken: { x: number; y: number }[] = [];

  // Pass 1: the crowded groups claim their fanned positions first, so the
  // loosely-placed labels in pass 2 can see and avoid them. Doing this in a
  // single index-ordered pass would let an early label sit where a later fan
  // lands.
  pos.forEach((p1, i) => {
    if (cluster.filter((c) => c === cluster[i]).length < 2) return;
    const rank = cluster.slice(0, i).filter((c) => c === cluster[i]).length;
    const f = FAN[rank % FAN.length];
    labels[i] = { ...f, leader: true };
    taken.push({ x: p1.x + f.dx, y: p1.y + f.dy });
  });

  // Pass 2: everything else goes above its dot, dropping below if that spot is
  // already spoken for.
  pos.forEach((p1, i) => {
    if (labels[i]) return;
    const crowded = taken.some(
      (t) => Math.abs(t.x - p1.x) < 54 && Math.abs(t.y - (p1.y - 17)) < 26,
    );
    const spot = crowded ? { dx: 0, dy: 28 } : { dx: 0, dy: -17 };
    labels[i] = { ...spot, anchor: 'middle', leader: false };
    taken.push({ x: p1.x + spot.dx, y: p1.y + spot.dy });
  });

  return (
    <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`${yLabel} against ${xLabel}`}>
        {yTickVals.map((v, i) => (
          <g key={`y${i}`}>
            <line x1={padL} x2={W - padR} y1={py(v)} y2={py(v)} stroke={C.grid} strokeWidth={1} />
            <text x={padL - 12} y={py(v) + 4} textAnchor="end" className={styles.axisText}>
              {money(v)}
            </text>
          </g>
        ))}

        {xTickVals.map((v, i) => (
          <text key={`x${i}`} x={px(v)} y={H - 28} textAnchor="middle" className={styles.axisText}>
            {money(v)}
          </text>
        ))}

        <line
          x1={px(fitX0)}
          x2={px(fitX1)}
          y1={py(intercept + slope * fitX0)}
          y2={py(intercept + slope * fitX1)}
          stroke={C.muted}
          strokeWidth={2}
          strokeDasharray="6 5"
        />

        {data.map((d, di) => (
          <g key={d.label}>
            {/* 2px surface ring keeps overlapping dots separable. */}
            <circle cx={px(d.x)} cy={py(d.y)} r={9} fill="#141414" />
            <circle
              cx={px(d.x)}
              cy={py(d.y)}
              r={7}
              fill={d.flagged ? C.spend : C.sales}
              onMouseEnter={() =>
                setTip({
                  x: (px(d.x) / W) * 100,
                  y: (py(d.y) / H) * 100,
                  content: (
                    <>
                      <strong>{d.label}</strong>
                      <span>
                        {`$${Math.round(d.x).toLocaleString('en-US')} spend → $${Math.round(
                          d.y,
                        ).toLocaleString('en-US')} sales`}
                      </span>
                      {d.flagged && <em>Spend ran past the efficient range</em>}
                    </>
                  ),
                })
              }
            />
            {labels[di].leader && (
              <line
                x1={px(d.x)}
                y1={py(d.y)}
                x2={px(d.x) + labels[di].dx * 0.62}
                y2={py(d.y) + labels[di].dy * 0.62}
                stroke={C.muted}
                strokeWidth={1}
              />
            )}
            <text
              x={px(d.x) + labels[di].dx}
              y={py(d.y) + labels[di].dy}
              textAnchor={labels[di].anchor}
              className={styles.dotLabel}
            >
              {d.label}
            </text>
          </g>
        ))}

        <line x1={padL} x2={W - padR} y1={py(yMin)} y2={py(yMin)} stroke={C.axis} strokeWidth={1} />
        <text x={padL + plotW / 2} y={H - 6} textAnchor="middle" className={styles.axisTitle}>
          {xLabel}
        </text>
        <text
          x={-(padT + plotH / 2)}
          y={16}
          transform="rotate(-90)"
          textAnchor="middle"
          className={styles.axisTitle}
        >
          {yLabel}
        </text>
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// -------------------------------------------------------------------------
// Share of total sales Amazon attributes to an ad click, month by month.
// -------------------------------------------------------------------------

export function SplitBar({
  adSales,
  total,
}: {
  adSales: number;
  total: number;
}) {
  const share = (adSales / total) * 100;
  return (
    <div className={styles.splitTrack} role="img" aria-label={`${share.toFixed(0)}% ad-attributed`}>
      <div className={styles.splitPaid} style={{ width: `${share}%`, background: C.sales }} />
      <div className={styles.splitOrganic} style={{ width: `${100 - share}%`, background: C.organic }} />
    </div>
  );
}
