'use client';

// Building blocks shared by the console screens (and the Brand List table in
// page.tsx): the multi-select column filter, small icons, money/date helpers,
// and the AI-draft affordances used by the generator screens.

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import styles from '../bizconsole.module.css';

// Preserve-order de-dupe.
export function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function NoteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

// Checkbox popover for select-column filters, so several values can be
// active at once. An empty selection means "All".
export function FilterMulti({
  label,
  values,
  counts,
  selected,
  onChange,
  alignRight = false,
}: {
  label: string;
  values: string[];
  counts?: Map<string, number>;
  selected: string[];
  onChange: (next: string[]) => void;
  alignRight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const summary =
    selected.length === 0 ? 'All' : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div className={styles.filterMulti} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.columnFilter} ${styles.filterMultiBtn} ${
          selected.length > 0 ? styles.columnFilterActive : ''
        }`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Filter ${label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.filterMultiText}>{summary}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          className={`${styles.filterMenu} ${alignRight ? styles.filterMenuRight : ''}`}
          aria-label={`${label} options`}
        >
          <button
            type="button"
            className={styles.filterMenuClear}
            disabled={selected.length === 0}
            onClick={() => onChange([])}
          >
            Clear — show all
          </button>
          {values.map((v) => {
            const checked = selected.includes(v);
            return (
              <label key={v} className={styles.filterMenuRow}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selected.filter((s) => s !== v) : [...selected, v])
                  }
                />
                <span className={styles.filterMenuValue}>{v}</span>
                <span className={styles.filterMenuCount}>{counts?.get(v) ?? 0}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Copies plain text and flashes confirmation on the button itself.
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`${styles.rowBtn} ${copied ? styles.copied : ''}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable: nothing sensible to do */
        }
      }}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  );
}

export function AiBadge({ label = 'AI draft' }: { label?: string }) {
  return (
    <span className={styles.aiBadge}>
      <span className={styles.aiBadgeDot} aria-hidden="true" />
      {label}
    </span>
  );
}

export function DraftNote() {
  return (
    <p className={styles.draftNote}>
      Generated locally as a starting draft — review and edit before using it.
    </p>
  );
}

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export function formatMoney(n: number): string {
  return MONEY.format(n);
}

// '2026-07-10' -> '2026-07'
export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

// '2026-07' -> 'Jul 2026'
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function ScreenHead({ title, meta, badge }: { title: string; meta?: string; badge?: JSX.Element }) {
  return (
    <div className={styles.pageHead}>
      <h2 className={styles.pageTitle}>
        {title}
        {badge && <span className={styles.pageTitleBadge}>{badge}</span>}
      </h2>
      {meta && <p className={styles.pageMeta}>{meta}</p>}
    </div>
  );
}

// --- Resizable table columns -------------------------------------------------
// Drag the grip on a header's right edge to resize; double-click resets that
// column. Widths persist per table in localStorage.

const COLUMN_WIDTH_PREFIX = 'bizmanage.colwidths.';
const MIN_COLUMN_WIDTH = 60;

// Module-level so its identity never changes: a component re-created on each
// render would unmount mid-drag and drop the gesture.
export function ResizeHandle({
  columnKey,
  onStart,
  onReset,
}: {
  columnKey: string;
  onStart: (key: string, clientX: number) => void;
  onReset: (key: string) => void;
}) {
  return (
    <span
      className={styles.resizeHandle}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onStart(columnKey, e.clientX);
      }}
      onDoubleClick={() => onReset(columnKey)}
    />
  );
}

export function ColGroup({ columns, widths }: { columns: string[]; widths: Record<string, number> }) {
  return (
    <colgroup>
      {columns.map((key) => (
        <col key={key} style={{ width: `${widths[key] ?? 120}px` }} />
      ))}
    </colgroup>
  );
}

export function useColumnWidths(storageKey: string, defaults: Record<string, number>) {
  const [widths, setWidths] = useState<Record<string, number>>(defaults);
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  // Mirror of the state, readable synchronously: a drag needs the starting
  // width the instant the pointer goes down, and React 18 runs state updaters
  // asynchronously (a fast drag would otherwise start from a stale value).
  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  // Read after mount only, so the static-export prerender (defaults) always
  // matches the first client render — same approach as the sidebar favorites.
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(COLUMN_WIDTH_PREFIX + storageKey) ?? '{}');
      if (raw && typeof raw === 'object') {
        const clean: Record<string, number> = {};
        for (const [k, v] of Object.entries(raw)) {
          if (typeof v === 'number' && Number.isFinite(v) && v >= MIN_COLUMN_WIDTH) clean[k] = v;
        }
        if (Object.keys(clean).length > 0) setWidths((prev) => ({ ...prev, ...clean }));
      }
    } catch {
      /* corrupted key: keep defaults */
    }
  }, [storageKey]);

  const persist = (next: Record<string, number>) => {
    try {
      localStorage.setItem(COLUMN_WIDTH_PREFIX + storageKey, JSON.stringify(next));
    } catch {
      /* storage full or blocked: the resize still applies for this session */
    }
  };

  // Listeners live on window rather than the grip, so the drag survives the
  // re-renders each width change causes and keeps tracking outside the 6px hit
  // area.
  const startResize = useCallback((key: string, clientX: number) => {
    const startWidth = widthsRef.current[key] ?? defaultsRef.current[key] ?? 120;

    const onMove = (e: PointerEvent) => {
      const next = Math.max(MIN_COLUMN_WIDTH, startWidth + (e.clientX - clientX));
      setWidths((prev) => (prev[key] === next ? prev : { ...prev, [key]: next }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      setWidths((current) => {
        persist(current);
        return current;
      });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    // Keep the resize cursor while dragging over other cells.
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Used when a saved view restores its stored widths.
  const setWidth = useCallback((key: string, px: number) => {
    if (!Number.isFinite(px) || px < MIN_COLUMN_WIDTH) return;
    setWidths((prev) => (prev[key] === px ? prev : { ...prev, [key]: px }));
  }, []);

  const resetColumn = useCallback((key: string) => {
    setWidths((prev) => {
      const next = { ...prev, [key]: defaultsRef.current[key] ?? 120 };
      persist(next);
      return next;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { widths, startResize, resetColumn, setWidth };
}

// --- Top scrollbar -----------------------------------------------------------
// A wide table's own scrollbar sits below hundreds of rows, so it is unreachable
// in practice. This mirrors it above the table and keeps the two in sync.

export function TopScrollbar({ targetRef }: { targetRef: React.RefObject<HTMLDivElement> }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [needed, setNeeded] = useState(false);
  // The two scroll handlers would otherwise feed each other into a loop.
  const syncing = useRef(false);

  useEffect(() => {
    const target = targetRef.current;
    const strip = stripRef.current;
    if (!target || !strip) return;

    const measure = () => {
      setWidth(target.scrollWidth);
      setNeeded(target.scrollWidth > target.clientWidth + 1);
    };
    measure();

    const onTarget = () => {
      if (syncing.current) return;
      syncing.current = true;
      strip.scrollLeft = target.scrollLeft;
      syncing.current = false;
    };
    const onStrip = () => {
      if (syncing.current) return;
      syncing.current = true;
      target.scrollLeft = strip.scrollLeft;
      syncing.current = false;
    };

    target.addEventListener('scroll', onTarget);
    strip.addEventListener('scroll', onStrip);
    // Column resizes and hidden columns both change scrollWidth without a
    // window resize, so observe the table itself.
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    const table = target.querySelector('table');
    if (table) observer.observe(table);
    window.addEventListener('resize', measure);

    return () => {
      target.removeEventListener('scroll', onTarget);
      strip.removeEventListener('scroll', onStrip);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [targetRef]);

  return (
    <div
      ref={stripRef}
      className={styles.topScroll}
      // Kept mounted so the ref stays live and measuring keeps working.
      style={needed ? undefined : { visibility: 'hidden', height: 0 }}
      aria-hidden="true"
    >
      <div className={styles.topScrollInner} style={{ width: `${width}px` }} />
    </div>
  );
}

// --- Column visibility -------------------------------------------------------

export interface ColumnDef {
  key: string;
  label: string;
  width: number;
  num?: boolean;
  plan?: boolean;
  required?: boolean; // never hideable (identity / selection / actions)
}

// Reconciles a saved column list against the columns that exist today: unknown
// keys are dropped and newly added columns appear, so an old saved view keeps
// working instead of blanking the table.
export function reconcileColumns(saved: string[], all: ColumnDef[]): string[] {
  const known = new Set(all.map((c) => c.key));
  const kept = saved.filter((k) => known.has(k));
  const missing = all.filter((c) => c.required && !kept.includes(c.key)).map((c) => c.key);
  const order = all.map((c) => c.key);
  return [...kept, ...missing].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
