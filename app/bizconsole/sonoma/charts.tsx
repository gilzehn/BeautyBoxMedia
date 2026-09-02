'use client';

/**
 * Grouped bar panels for the Sonoma year-on-year comparison.
 *
 * Hand-rolled SVG: the site is a static export with no charting dependency,
 * and the page needs to print cleanly when it is forwarded as a PDF.
 *
 * One measure per panel, one y-scale each. Investment and income are on very
 * different scales, so drawing them together on twin y-axes would let the shape
 * of the comparison be set by where the axes were pinned rather than by the
 * data. Stacking two panels over the same months is the honest version.
 *
 * Within a panel the two bars are the two years, which is the categorical
 * dimension, so colour carries the year and stays the same in both panels,
 * under one legend.
 */

import { useId, useState } from 'react';
import styles from './sonoma.module.css';

/** Validated for the dark card surface (#141414): lightness band, chroma floor,
 *  CVD separation, normal-vision floor and >=3:1 contrast all pass. */
export const C = {
  before: '#199e70',
  now: '#3987e5',
  grid: '#2c2c2a',
  axis: '#4a4a47',
};

const money = (n: number) => {
  if (Math.abs(n) < 1000) return `$${Math.round(n)}`;
  const k = n / 1000;
  return `$${Number.isInteger(k) ? k : k.toFixed(1)}K`;
};

const exact = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

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

export interface GroupPoint {
  label: string;
  before: number;
  now: number;
  /** Percentage change, shown in the tooltip. */
  change: number;
}

export function GroupedBars({
  data,
  caption,
  beforeLabel,
  nowLabel,
}: {
  data: GroupPoint[];
  caption: string;
  beforeLabel: string;
  nowLabel: string;
}) {
  const [tip, setTip] = useState<{ x: number; y: number; p: GroupPoint } | null>(null);
  const clipId = useId();

  const W = 1000;
  const H = 300;
  const padL = 96;
  const padR = 16;
  const padT = 18;
  const padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const gridVals = niceTicks(Math.max(...data.map((d) => Math.max(d.before, d.now))) * 1.04, 4);
  const max = gridVals[gridVals.length - 1];

  const step = plotW / data.length;
  const barW = Math.min(step * 0.34, 34);
  const gap = 3; // surface gap between the pair, so the two years never touch
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const cx = (i: number) => padL + i * step + step / 2;

  return (
    <figure className={styles.panelFig}>
      <div className={styles.chartWrap} onMouseLeave={() => setTip(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={caption}>
          <defs>
            {/* Rounds the top of each bar only: the data-end is soft, the bar
                stays anchored flat to its baseline. */}
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
            {data.map((d, i) => (
              <g
                key={d.label}
                onMouseEnter={() =>
                  setTip({ x: ((cx(i) - padL) / plotW) * 92 + 4, y: (y(Math.max(d.before, d.now)) / H) * 100, p: d })
                }
              >
                {/* Full-height hit target: easier to hover than the bars alone. */}
                <rect x={cx(i) - step / 2} y={padT} width={step} height={plotH} fill="transparent" />
                <rect
                  x={cx(i) - barW - gap / 2}
                  y={y(d.before)}
                  width={barW}
                  height={y(0) - y(d.before) + 8}
                  rx={4}
                  fill={C.before}
                />
                <rect
                  x={cx(i) + gap / 2}
                  y={y(d.now)}
                  width={barW}
                  height={y(0) - y(d.now) + 8}
                  rx={4}
                  fill={C.now}
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
              <i className={styles.tipDot} style={{ background: C.before }} /> {beforeLabel}{' '}
              {exact(tip.p.before)}
            </span>
            <span>
              <i className={styles.tipDot} style={{ background: C.now }} /> {nowLabel}{' '}
              {exact(tip.p.now)}
            </span>
            <em>{`${tip.p.change >= 0 ? '+' : ''}${tip.p.change.toFixed(0)}% year on year`}</em>
          </div>
        )}
      </div>
      <figcaption className={styles.panelCaption}>{caption}</figcaption>
    </figure>
  );
}

export function Legend({ beforeLabel, nowLabel }: { beforeLabel: string; nowLabel: string }) {
  return (
    <div className={styles.legend}>
      <span className={styles.legendItem}>
        <span className={styles.swatch} style={{ background: C.before }} />
        {beforeLabel}
      </span>
      <span className={styles.legendItem}>
        <span className={styles.swatch} style={{ background: C.now }} />
        {nowLabel}
      </span>
    </div>
  );
}
