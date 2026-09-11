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
}: {
  data: GroupPoint[];
  caption: string;
  beforeLabel: string;
  nowLabel: string;
  colors?: [string, string];
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
                {money(v)}
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
              {exact(tip.p.before)}
            </span>
            <span>
              <i className={styles.tipDot} style={{ background: colors[1] }} /> {nowLabel}{' '}
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
