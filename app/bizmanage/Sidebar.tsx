'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './bizmanage.module.css';

// Every navigable view in the console. 'brands' is the real Brand List page;
// the rest render placeholder views until their sections are built out.
export type ViewId =
  | 'brands'
  | 'tasks'
  | 'leads'
  | 'deck-creator'
  | 'proposal-builder'
  | 'income'
  | 'expenses'
  | 'cashflow'
  | 'profit-loss'
  | 'brand-analysis';

export const VIEW_TITLES: Record<ViewId, string> = {
  brands: 'Brand List',
  tasks: 'Tasks',
  leads: 'Leads',
  'deck-creator': 'Deck Creator',
  'proposal-builder': 'Proposal Builder',
  income: 'Income',
  expenses: 'Expenses',
  cashflow: 'Cashflow',
  'profit-loss': 'Profit and Loss',
  'brand-analysis': 'Brand Analysis',
};

interface SidebarLeaf {
  id: ViewId;
  label: string;
}

interface SidebarSection {
  key: string;
  label: string;
  icon: () => JSX.Element;
  view?: ViewId; // leaf section: rail button navigates directly
  items?: SidebarLeaf[]; // group section: flyout lists these
  favorites?: boolean; // Favorites section: items come from starred views
}

function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5.5l1.5 1.5L7 4.5" />
      <path d="M3 12l1.5 1.5L7 11" />
      <path d="M3 18.5l1.5 1.5L7 17.5" />
      <path d="M11 6h10M11 12.75h10M11 19.25h10" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 7H4a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2h14v4" />
      <path d="M22 7v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5" />
      <path d="M18 14h.01" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function ChevronsRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 17l5-5-5-5" />
      <path d="M6 17l5-5-5-5" />
    </svg>
  );
}

const MENU: SidebarSection[] = [
  { key: 'favorites', label: 'Favorites', icon: () => <StarIcon />, favorites: true },
  { key: 'brands', label: 'Brand List', icon: GridIcon, view: 'brands' },
  { key: 'tasks', label: 'Tasks', icon: ChecklistIcon, view: 'tasks' },
  {
    key: 'sales',
    label: 'Sales',
    icon: TrendingUpIcon,
    items: [
      { id: 'leads', label: 'Leads' },
      { id: 'deck-creator', label: 'Deck Creator' },
      { id: 'proposal-builder', label: 'Proposal Builder' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: WalletIcon,
    items: [
      { id: 'income', label: 'Income' },
      { id: 'expenses', label: 'Expenses' },
      { id: 'cashflow', label: 'Cashflow' },
      { id: 'profit-loss', label: 'Profit and Loss' },
    ],
  },
  { key: 'analysis', label: 'Brand Analysis', icon: BarChartIcon, view: 'brand-analysis' },
];

const FAVORITES_KEY = 'bizmanage.favorites';
const EXPANDED_KEY = 'bizmanage.sidebar';

function isViewId(value: string): value is ViewId {
  return value in VIEW_TITLES;
}

interface SidebarProps {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
}

export default function Sidebar({ view, onNavigate }: SidebarProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [favorites, setFavorites] = useState<ViewId[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const railBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // localStorage is read after mount only, so the static-export prerender
  // (collapsed, no favorites) always matches the first client render.
  useEffect(() => {
    setExpanded(localStorage.getItem(EXPANDED_KEY) === 'expanded');
    try {
      const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
      if (Array.isArray(raw)) setFavorites(raw.filter((v) => typeof v === 'string' && isViewId(v)));
    } catch {
      /* corrupted key: keep empty favorites */
    }
  }, []);

  // Open flyouts close on any press outside the nav and on Escape (the
  // document listener catches Escape even when focus sits outside the nav,
  // e.g. after hover-opening).
  useEffect(() => {
    if (openKey === null) return;
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenKey(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenKey(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openKey]);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      localStorage.setItem(EXPANDED_KEY, prev ? 'collapsed' : 'expanded');
      return !prev;
    });
  };

  const toggleFavorite = (id: ViewId) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const navigate = (id: ViewId) => {
    onNavigate(id);
    setOpenKey(null);
  };

  const itemsFor = (section: SidebarSection): SidebarLeaf[] => {
    if (section.favorites) return favorites.map((id) => ({ id, label: VIEW_TITLES[id] }));
    if (section.items) return section.items;
    if (section.view) return [{ id: section.view, label: section.label }];
    return [];
  };

  const sectionOwnsView = (section: SidebarSection): boolean => {
    if (section.favorites) return false;
    if (section.view) return section.view === view;
    return section.items?.some((item) => item.id === view) ?? false;
  };

  const handleEscape = (key: string) => {
    setOpenKey(null);
    railBtnRefs.current[key]?.focus();
  };

  return (
    <nav
      ref={navRef}
      aria-label="Console menu"
      className={`${styles.sidebar} ${expanded ? styles.sidebarExpanded : ''}`}
    >
      <button
        className={`${styles.railToggle} ${expanded ? styles.railToggleOpen : ''}`}
        type="button"
        aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
        onClick={toggleExpanded}
      >
        <ChevronsRightIcon />
      </button>

      <ul className={styles.sidebarNav}>
        {MENU.map((section) => {
          const active = sectionOwnsView(section);
          const open = openKey === section.key;
          const items = itemsFor(section);
          return (
            <li
              key={section.key}
              className={styles.sectionWrap}
              onMouseEnter={() => setOpenKey(section.key)}
              onMouseLeave={() => setOpenKey((k) => (k === section.key ? null : k))}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && open) handleEscape(section.key);
              }}
            >
              <button
                ref={(el) => {
                  railBtnRefs.current[section.key] = el;
                }}
                className={`${styles.railItem} ${active ? styles.railItemActive : ''} ${
                  open ? styles.railItemOpen : ''
                }`}
                type="button"
                title={section.label}
                aria-haspopup="true"
                aria-expanded={open}
                aria-current={active ? 'page' : undefined}
                onClick={() =>
                  section.view ? navigate(section.view) : setOpenKey((k) => (k === section.key ? null : section.key))
                }
              >
                {section.icon()}
                <span className={styles.railLabel}>{section.label}</span>
              </button>

              {open && (
                <div className={styles.flyout} role="menu" aria-label={section.label}>
                  <div className={styles.flyoutTitle}>{section.label}</div>
                  {items.length === 0 ? (
                    <p className={styles.flyoutEmpty}>No favorites yet — star items to pin them here.</p>
                  ) : (
                    items.map((item) => {
                      const starred = favorites.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`${styles.flyoutRow} ${item.id === view ? styles.flyoutRowActive : ''}`}
                        >
                          <button
                            className={styles.flyoutBtn}
                            type="button"
                            role="menuitem"
                            onClick={() => navigate(item.id)}
                          >
                            {item.label}
                          </button>
                          <button
                            className={`${styles.starBtn} ${starred ? styles.starBtnActive : ''}`}
                            type="button"
                            aria-pressed={starred}
                            aria-label={`${starred ? 'Unstar' : 'Star'} ${item.label}`}
                            onClick={() => toggleFavorite(item.id)}
                          >
                            <StarIcon filled={starred} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
