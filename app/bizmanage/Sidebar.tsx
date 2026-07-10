'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './bizmanage.module.css';

// Every navigable view in the console. 'brands' is the real Brand List page;
// the rest render placeholder views until their sections are built out.
export type ViewId =
  | 'brands'
  | 'agency-clients'
  | 'tasks'
  | 'leads'
  | 'deck-creator'
  | 'proposal-builder'
  | 'income'
  | 'expenses'
  | 'cashflow'
  | 'profit-loss'
  | 'profitability-estimator'
  | 'roadmap-builder'
  | 'email-drafter';

export const VIEW_TITLES: Record<ViewId, string> = {
  brands: 'Brand List',
  'agency-clients': 'Agency Clients',
  tasks: 'Tasks',
  leads: 'Leads',
  'deck-creator': 'Deck Creator',
  'proposal-builder': 'Proposal Builder',
  income: 'Income',
  expenses: 'Expenses',
  cashflow: 'Cashflow',
  'profit-loss': 'Profit and Loss',
  'profitability-estimator': 'Profitability Estimator',
  'roadmap-builder': 'Roadmap Builder',
  'email-drafter': 'Email Drafter',
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

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
  { key: 'agency-clients', label: 'Agency Clients', icon: UsersIcon, view: 'agency-clients' },
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
  {
    key: 'analysis',
    label: 'Analysis',
    icon: BarChartIcon,
    items: [
      { id: 'profitability-estimator', label: 'Profitability Estimator' },
      { id: 'roadmap-builder', label: 'Roadmap Builder' },
      { id: 'email-drafter', label: 'Email Drafter' },
    ],
  },
];

const FAVORITES_KEY = 'bizmanage.favorites';

function isViewId(value: string): value is ViewId {
  return value in VIEW_TITLES;
}

interface SidebarProps {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  // Expansion lives in the page so the content shell can reflow with it.
  expanded: boolean;
  onToggleExpanded: () => void;
  firstName: string;
}

export default function Sidebar({ view, onNavigate, expanded, onToggleExpanded, firstName }: SidebarProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<ViewId[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const railBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // localStorage is read after mount only, so the static-export prerender
  // (no favorites) always matches the first client render.
  useEffect(() => {
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
      <div className={styles.profileRow}>
        <button
          className={styles.avatarBtn}
          type="button"
          title={firstName}
          aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
          onClick={onToggleExpanded}
        >
          <span className={styles.avatar}>{firstName.charAt(0).toUpperCase()}</span>
        </button>
        <span className={styles.profileName}>{firstName}</span>
        <button
          className={styles.profileToggle}
          type="button"
          aria-label="Collapse menu"
          onClick={onToggleExpanded}
        >
          <ChevronsRightIcon />
        </button>
      </div>

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
                  // Hover already opens the flyout, so a toggle here would
                  // close it right under the click. Clicking always opens;
                  // mouse-leave, outside press, and Escape close.
                  section.view ? navigate(section.view) : setOpenKey(section.key)
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
