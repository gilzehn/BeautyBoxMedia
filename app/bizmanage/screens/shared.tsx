'use client';

// Building blocks shared by the console screens (and the Brand List table in
// page.tsx): the multi-select column filter, small icons, money/date helpers,
// and the AI-draft affordances used by the generator screens.

import { useEffect, useRef, useState } from 'react';
import styles from '../bizmanage.module.css';

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
