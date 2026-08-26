'use client';

import { Fragment, useEffect, useMemo, useRef, useState, FormEvent } from 'react';
import styles from '../bizconsole.module.css';
import {
  CogsRow,
  CogsInput,
  UnitEconomicsRow,
  getCogs,
  addCogs,
  updateCogs,
  updateCogsBulk,
  deleteCogs,
  getUnitEconomics,
  updateUnitEconomicsPlan,
  updateUnitEconomicsBulk,
  refreshUnitEconomics,
  SavedViewRow,
  getSavedViews,
  addSavedView,
  updateSavedView,
  deleteSavedView,
} from '@/lib/unitEconomics';
import {
  TrashIcon,
  ScreenHead,
  formatMoney,
  uniq,
  useColumnWidths,
  ResizeHandle,
  ColGroup,
  TopScrollbar,
  ColumnDef,
  reconcileColumns,
} from './shared';

type Tab = 'cogs' | 'unit-economics';

const TABS: { id: Tab; label: string }[] = [
  { id: 'cogs', label: 'COGS' },
  { id: 'unit-economics', label: 'Unit Economics' },
];

const ADD_NEW = '__add_new__';

// Fields the Unit Economics bulk editor can set. `pct` values are typed as
// percentages and stored as rates; `cogs` writes to the cogs table instead.
const UE_BULK_FIELDS: { key: string; label: string; kind: 'pct' | 'money'; target: 'ue' | 'cogs' }[] = [
  { key: 'discountPct', label: 'Discount %', kind: 'pct', target: 'ue' },
  { key: 'desiredProfitPct', label: 'Desired Profit %', kind: 'pct', target: 'ue' },
  { key: 'desiredPrice', label: 'Desired Price', kind: 'money', target: 'ue' },
  { key: 'prepCost', label: 'Prep', kind: 'money', target: 'ue' },
  { key: 'inboundCost', label: 'Inbound', kind: 'money', target: 'ue' },
  { key: 'purchaseCost', label: 'Purchase Cost (COGS)', kind: 'money', target: 'cogs' },
];

// Column keys and their starting widths. Users drag from here; the chosen
// widths are remembered per table in localStorage.
const COGS_COLUMNS: ColumnDef[] = [
  { key: 'select', label: '', width: 38, required: true },
  { key: 'account', label: 'Account', width: 90 },
  { key: 'sku', label: 'SKU', width: 170, required: true },
  { key: 'asin', label: 'ASIN', width: 110 },
  { key: 'title', label: 'Title', width: 300 },
  { key: 'brand', label: 'Brand', width: 140 },
  { key: 'productGroup', label: 'Product Type', width: 150 },
  { key: 'channel', label: 'Channel', width: 90 },
  { key: 'purchaseCost', label: 'Purchase Cost', width: 120, num: true },
  { key: 'actions', label: '', width: 56, required: true },
];

const UE_COLUMNS: ColumnDef[] = [
  { key: 'select', label: '', width: 38, required: true },
  { key: 'sku', label: 'SKU', width: 170, required: true },
  { key: 'brand', label: 'Brand', width: 130 },
  { key: 'title', label: 'Title', width: 260 },
  { key: 'purchaseCost', label: 'COGS', width: 95, num: true },
  { key: 'prep', label: 'Prep', width: 85, num: true, plan: true },
  { key: 'inbound', label: 'Inbound', width: 95, num: true, plan: true },
  { key: 'totalCost', label: 'Total Cost', width: 105, num: true },
  { key: 'storage', label: 'Storage', width: 90, num: true },
  { key: 'fba', label: 'FBA', width: 90, num: true },
  { key: 'referral', label: 'Referral', width: 95, num: true },
  { key: 'totalFee', label: 'Total Fee', width: 100, num: true },
  { key: 'price', label: 'Price', width: 95, num: true },
  { key: 'profit', label: 'Profit', width: 100, num: true },
  { key: 'margin', label: 'Margin', width: 90, num: true },
  { key: 'breakeven', label: 'Break-even', width: 110, num: true },
  { key: 'discountPct', label: 'Discount %', width: 105, num: true, plan: true },
  { key: 'discPrice', label: 'Disc. Price', width: 105, num: true },
  { key: 'discProfit', label: 'Disc. Profit', width: 105, num: true },
  { key: 'discMargin', label: 'Disc. Margin', width: 110, num: true },
  { key: 'desiredProfitPct', label: 'Desired Profit %', width: 135, num: true, plan: true },
  { key: 'suggestedPrice', label: 'Suggested Price', width: 135, num: true },
  { key: 'desiredPrice', label: 'Desired Price', width: 120, num: true, plan: true },
  { key: 'desiredProfit', label: '@ Price Profit', width: 120, num: true },
  { key: 'desiredMargin', label: '@ Price Margin', width: 125, num: true },
];

// Percentages live in the database as rates (0.1810) but read as percents
// (18.1) in the UI, so every percent cell goes through this pair.
const pctToDisplay = (rate: number | null): string =>
  rate === null ? '' : String(Math.round(rate * 1000) / 10);

const pctToStore = (display: string): number | null => {
  const raw = display.trim().replace('%', '');
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n / 100 : null;
};

const moneyToStore = (display: string): number | null => {
  const raw = display.trim().replace(/[$,]/g, '');
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

function pct(rate: number | null): string {
  return rate === null ? '—' : `${(rate * 100).toFixed(1)}%`;
}

// Profit and margin turn red the moment they go negative — the whole point of
// the screen is spotting products that lose money at their current price.
function signed(value: number | null, render: (v: number) => string): JSX.Element {
  if (value === null) return <span className={styles.muted}>—</span>;
  return <span className={value < 0 ? styles.negative : undefined}>{render(value)}</span>;
}

export default function AccountsScreen({
  options,
  onAddOption,
}: {
  options: Record<string, string[]>;
  onAddOption: (field: string, value: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>('cogs');
  const [account, setAccount] = useState(''); // '' = all accounts
  const [brand, setBrand] = useState(''); // '' = all brands
  const [search, setSearch] = useState('');

  const [cogsRows, setCogsRows] = useState<CogsRow[]>([]);
  const [ueRows, setUeRows] = useState<UnitEconomicsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  const [needsCostOnly, setNeedsCostOnly] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkGroup, setBulkGroup] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const cogsCols = useColumnWidths(
    'accounts.cogs',
    Object.fromEntries(COGS_COLUMNS.map((c) => [c.key, c.width]))
  );
  const ueCols = useColumnWidths(
    'accounts.unitEconomics',
    Object.fromEntries(UE_COLUMNS.map((c) => [c.key, c.width]))
  );

  // Column visibility, saved views, and the top-scrollbar targets. COGS and
  // Unit Economics keep independent selections, so everything is per-tab.
  const [cogsVisible, setCogsVisible] = useState<string[]>(COGS_COLUMNS.map((c) => c.key));
  const [ueVisible, setUeVisible] = useState<string[]>(UE_COLUMNS.map((c) => c.key));
  const [views, setViews] = useState<SavedViewRow[]>([]);
  const [activeViewId, setActiveViewId] = useState<number | null>(null);
  const [viewDirty, setViewDirty] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);
  const cogsScrollRef = useRef<HTMLDivElement>(null);
  const ueScrollRef = useRef<HTMLDivElement>(null);

  const [ueSelected, setUeSelected] = useState<Set<number>>(new Set());
  const [ueBulkField, setUeBulkField] = useState('');
  const [ueBulkValue, setUeBulkValue] = useState('');
  const [ueBulkBusy, setUeBulkBusy] = useState(false);

  const allColumns = tab === 'cogs' ? COGS_COLUMNS : UE_COLUMNS;
  const visibleKeys = tab === 'cogs' ? cogsVisible : ueVisible;
  const setVisibleKeys = tab === 'cogs' ? setCogsVisible : setUeVisible;
  const cols = tab === 'cogs' ? cogsCols : ueCols;
  const visibleColumns = useMemo(
    () => allColumns.filter((c) => visibleKeys.includes(c.key)),
    [allColumns, visibleKeys]
  );

  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<CogsInput>({
    account: '',
    sku: '',
    asin: '',
    title: '',
    itemName: '',
    brand: '',
    purchaseCost: 0,
    productGroup: '',
    fulfillmentChannel: '',
    note: '',
  });
  const [draftCost, setDraftCost] = useState('');

  // Both tabs load together: they share the account/brand filters, and the
  // COGS tab's cost edits change the Unit Economics numbers.
  useEffect(() => {
    setLoading(true);
    setLoadError('');
    Promise.all([getCogs(), getUnitEconomics()])
      .then(([cogs, ue]) => {
        setCogsRows(cogs);
        setUeRows(ue);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const accountValues = useMemo(
    () => uniq([...(options['account_name'] ?? []), ...cogsRows.map((r) => r.account)]).filter(Boolean).sort(),
    [options, cogsRows]
  );

  // Brands are scoped to the chosen account so the second dropdown never
  // offers a brand that would produce an empty table.
  const brandValues = useMemo(
    () =>
      uniq(cogsRows.filter((r) => !account || r.account === account).map((r) => r.brand))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [cogsRows, account]
  );

  // Switching account can strand the brand filter on a value that account
  // doesn't carry; clear it rather than showing zero rows.
  useEffect(() => {
    if (brand && !brandValues.includes(brand)) setBrand('');
  }, [brand, brandValues]);

  const matches = (row: { account: string; brand: string; sku: string; asin: string; title: string }) => {
    if (account && row.account !== account) return false;
    if (brand && row.brand !== brand) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !row.sku.toLowerCase().includes(q) &&
        !row.asin.toLowerCase().includes(q) &&
        !row.title.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  };

  const visibleCogs = useMemo(
    () => cogsRows.filter((r) => matches(r) && (!needsCostOnly || r.purchaseCost === 0)),
    [cogsRows, account, brand, search, needsCostOnly] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const visibleUe = useMemo(
    () => ueRows.filter(matches),
    [ueRows, account, brand, search] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Rows with no cost yet would report a fake 100%-ish margin, so they are
  // counted separately instead of being averaged in.
  const stats = useMemo(() => {
    const costed = visibleUe.filter((r) => r.currentPrice > 0 && r.purchaseCost > 0);
    const needsCost = visibleUe.filter((r) => r.purchaseCost === 0).length;
    const losing = costed.filter((r) => r.profit < 0).length;
    const avgMargin =
      costed.length > 0
        ? costed.reduce((sum, r) => sum + (r.marginPct ?? 0), 0) / costed.length
        : null;
    return { losing, avgMargin, needsCost };
  }, [visibleUe]);

  const cogsNeedingCost = useMemo(
    () => cogsRows.filter((r) => matches(r) && r.purchaseCost === 0).length,
    [cogsRows, account, brand, search] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Product types offered in the row select and the bulk control.
  const productGroupValues = useMemo(
    () => uniq([...(options['product_group'] ?? []), ...cogsRows.map((r) => r.productGroup)])
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
    [options, cogsRows]
  );

  const setSaving = (id: number, on: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // Optimistic update with rollback, matching the other console screens.
  const patchCogs = async (row: CogsRow, changes: Partial<CogsInput>) => {
    setSaveError('');
    setCogsRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...changes } : r)));
    setSaving(row.id, true);
    try {
      const saved = await updateCogs(row.id, changes);
      setCogsRows((prev) => prev.map((r) => (r.id === row.id ? saved : r)));
      // A cost change moves profit on the other tab, so refresh that row too.
      if (changes.purchaseCost !== undefined) {
        const fresh = await getUnitEconomics(row.account);
        setUeRows((prev) => {
          const byId = new Map(fresh.map((r) => [r.id, r]));
          return prev.map((r) => byId.get(r.id) ?? r);
        });
      }
    } catch (err) {
      setCogsRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
      setSaveError(`Couldn't save the product: ${err instanceof Error ? err.message : 'save failed'}`);
    } finally {
      setSaving(row.id, false);
    }
  };

  const patchPlan = async (
    row: UnitEconomicsRow,
    changes: Parameters<typeof updateUnitEconomicsPlan>[1]
  ) => {
    setSaveError('');
    setSaving(row.id, true);
    try {
      const saved = await updateUnitEconomicsPlan(row.id, changes);
      setUeRows((prev) => prev.map((r) => (r.id === row.id ? saved : r)));
    } catch (err) {
      setUeRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
      setSaveError(`Couldn't save the plan: ${err instanceof Error ? err.message : 'save failed'}`);
    } finally {
      setSaving(row.id, false);
    }
  };

  // Mirrors FinanceScreen's category handler: a sentinel option prompts for a
  // brand-new value and registers it for reuse.
  const handleProductGroup = async (row: CogsRow, raw: string) => {
    if (raw !== ADD_NEW) {
      patchCogs(row, { productGroup: raw });
      return;
    }
    const entered = window.prompt('Add a new product type:')?.trim();
    if (!entered) return;
    patchCogs(row, { productGroup: entered });
    try {
      await onAddOption('product_group', entered);
    } catch {
      setSaveError(`"${entered}" is saved on this product, but adding it as a reusable type failed.`);
    }
  };

  const toggleRow = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const visibleIds = visibleCogs.map((r) => r.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });

  const applyBulkProductGroup = async () => {
    const ids = visibleCogs.filter((r) => selected.has(r.id)).map((r) => r.id);
    if (ids.length === 0) return;
    let value = bulkGroup;
    if (value === ADD_NEW) {
      const entered = window.prompt('Add a new product type:')?.trim();
      if (!entered) return;
      value = entered;
    }
    setBulkBusy(true);
    setSaveError('');
    const previous = cogsRows;
    setCogsRows((prev) => prev.map((r) => (selected.has(r.id) ? { ...r, productGroup: value } : r)));
    try {
      await updateCogsBulk(ids, { productGroup: value });
      if (bulkGroup === ADD_NEW) {
        try {
          await onAddOption('product_group', value);
        } catch {
          /* saved on the rows; only the reusable option failed */
        }
      }
      setSelected(new Set());
      setBulkGroup('');
    } catch (err) {
      setCogsRows(previous);
      setSaveError(`Couldn't apply the product type: ${err instanceof Error ? err.message : 'update failed'}`);
    } finally {
      setBulkBusy(false);
    }
  };

  const toggleUeRow = (id: number) =>
    setUeSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const visibleUeIds = visibleUe.map((r) => r.id);
  const allUeSelected = visibleUeIds.length > 0 && visibleUeIds.every((id) => ueSelected.has(id));

  const toggleAllUeVisible = () =>
    setUeSelected((prev) => {
      const next = new Set(prev);
      if (allUeSelected) visibleUeIds.forEach((id) => next.delete(id));
      else visibleUeIds.forEach((id) => next.add(id));
      return next;
    });

  // Bulk-set one planning field across the ticked rows. Purchase Cost lives on
  // `cogs`, so it takes the cogs path and the view rows are re-read afterwards.
  const applyUeBulk = async () => {
    const field = UE_BULK_FIELDS.find((f) => f.key === ueBulkField);
    const rows = visibleUe.filter((r) => ueSelected.has(r.id));
    if (!field || rows.length === 0) return;
    const parsed = field.kind === 'pct' ? pctToStore(ueBulkValue) : moneyToStore(ueBulkValue);
    if (parsed === null && field.kind === 'money') return; // a price needs a number
    setUeBulkBusy(true);
    setSaveError('');
    try {
      if (field.target === 'cogs') {
        const keys = new Set(rows.map((r) => `${r.account}~${r.sku}`));
        const cogsIds = cogsRows.filter((c) => keys.has(`${c.account}~${c.sku}`)).map((c) => c.id);
        const savedCogs = await updateCogsBulk(cogsIds, { purchaseCost: parsed ?? 0 });
        const byId = new Map(savedCogs.map((c) => [c.id, c]));
        setCogsRows((prev) => prev.map((c) => byId.get(c.id) ?? c));
        const fresh = await refreshUnitEconomics(rows.map((r) => r.id));
        const ueById = new Map(fresh.map((r) => [r.id, r]));
        setUeRows((prev) => prev.map((r) => ueById.get(r.id) ?? r));
      } else {
        const saved = await updateUnitEconomicsBulk(rows.map((r) => r.id), { [field.key]: parsed });
        const byId = new Map(saved.map((r) => [r.id, r]));
        setUeRows((prev) => prev.map((r) => byId.get(r.id) ?? r));
      }
      setUeSelected(new Set());
      setUeBulkValue('');
    } catch (err) {
      setSaveError(`Couldn't apply the change: ${err instanceof Error ? err.message : 'update failed'}`);
    } finally {
      setUeBulkBusy(false);
    }
  };

  // --- Saved views ---------------------------------------------------------
  useEffect(() => {
    getSavedViews('accounts', tab)
      .then(setViews)
      .catch(() => setViews([])); // a view list failure must not block the table
    setActiveViewId(null);
    setViewDirty(false);
  }, [tab]);

  // The columns popover closes the same way FilterMulti's does.
  useEffect(() => {
    if (!columnsOpen) return;
    const onDown = (e: PointerEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setColumnsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setColumnsOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [columnsOpen]);

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    if (activeViewId !== null) setViewDirty(true);
  };

  const showAllColumns = () => {
    setVisibleKeys(allColumns.map((c) => c.key));
    if (activeViewId !== null) setViewDirty(true);
  };

  const applyView = (view: SavedViewRow | null) => {
    if (!view) {
      setVisibleKeys(allColumns.map((c) => c.key));
      setActiveViewId(null);
      setViewDirty(false);
      return;
    }
    // Reconcile against today's columns so an older view still renders.
    setVisibleKeys(reconcileColumns(view.columns, allColumns));
    for (const [key, px] of Object.entries(view.widths)) cols.setWidth(key, px);
    setActiveViewId(view.id);
    setViewDirty(false);
  };

  const saveCurrentView = async () => {
    const existing = views.find((v) => v.id === activeViewId);
    const name = existing
      ? existing.name
      : window.prompt('Name this view:')?.trim();
    if (!name) return;
    const payload = {
      screen: 'accounts',
      tab,
      name,
      columns: visibleKeys,
      widths: Object.fromEntries(visibleKeys.map((k) => [k, cols.widths[k]])),
    };
    setSaveError('');
    try {
      if (existing) {
        const saved = await updateSavedView(existing.id, payload);
        setViews((prev) => prev.map((v) => (v.id === saved.id ? saved : v)));
        setActiveViewId(saved.id);
      } else {
        const created = await addSavedView(payload);
        setViews((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setActiveViewId(created.id);
      }
      setViewDirty(false);
    } catch (err) {
      setSaveError(`Couldn't save the view: ${err instanceof Error ? err.message : 'save failed'}`);
    }
  };

  const removeView = async () => {
    const view = views.find((v) => v.id === activeViewId);
    if (!view) return;
    if (!window.confirm(`Delete the view "${view.name}"? Everyone loses it.`)) return;
    try {
      await deleteSavedView(view.id);
      setViews((prev) => prev.filter((v) => v.id !== view.id));
      applyView(null);
    } catch (err) {
      setSaveError(`Couldn't delete the view: ${err instanceof Error ? err.message : 'delete failed'}`);
    }
  };

  const removeCogs = async (row: CogsRow) => {
    if (!window.confirm(`Delete ${row.sku}? This removes its cost row.`)) return;
    setSaveError('');
    const previous = cogsRows;
    setCogsRows((prev) => prev.filter((r) => r.id !== row.id));
    try {
      await deleteCogs(row.id);
    } catch (err) {
      setCogsRows(previous);
      setSaveError(`Couldn't delete the product: ${err instanceof Error ? err.message : 'delete failed'}`);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const cost = Number(draftCost.replace(/[$,]/g, '') || '0');
    if (Number.isNaN(cost)) return;
    setCreating(true);
    setSaveError('');
    try {
      const created = await addCogs({ ...draft, purchaseCost: cost });
      setCogsRows((prev) => [...prev, created]);
      setDraft({
        account: draft.account,
        sku: '',
        asin: '',
        title: '',
        itemName: '',
        brand: '',
        purchaseCost: 0,
        productGroup: '',
        fulfillmentChannel: '',
        note: '',
      });
      setDraftCost('');
      setAddOpen(false);
    } catch (err) {
      setSaveError(`Couldn't add the product: ${err instanceof Error ? err.message : 'add failed'}`);
    } finally {
      setCreating(false);
    }
  };

  const meta = loading
    ? undefined
    : tab === 'cogs'
      ? `${visibleCogs.length} products${cogsNeedingCost > 0 ? ` · ${cogsNeedingCost} need cost` : ''}`
      : `${visibleUe.length} products · ${stats.losing} below break-even${
          stats.avgMargin !== null ? ` · avg margin ${pct(stats.avgMargin)}` : ''
        }${stats.needsCost > 0 ? ` · ${stats.needsCost} need cost` : ''}`;

  return (
    <>
      <ScreenHead title="Accounts" meta={meta} />

      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <select
            className={styles.searchInput}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            aria-label="Account"
          >
            <option value="">All accounts</option>
            {accountValues.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            className={styles.searchInput}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            aria-label="Brand"
          >
            <option value="">All brands</option>
            {brandValues.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search SKU, ASIN or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
        </div>
        {tab === 'cogs' && (
          <button
            className={`btn btn-primary ${styles.addBtn}`}
            onClick={() => setAddOpen((o) => !o)}
            type="button"
          >
            + Add product
          </button>
        )}
      </div>

      <div className={styles.chipRow}>
        <div role="tablist" aria-label="Views" style={{ display: 'flex', gap: 8 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`${styles.chip} ${tab === t.id ? styles.chipActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'cogs' && (
          <button
            type="button"
            className={`${styles.chip} ${needsCostOnly ? styles.chipActive : ''}`}
            aria-pressed={needsCostOnly}
            onClick={() => setNeedsCostOnly((v) => !v)}
          >
            Needs cost{cogsNeedingCost > 0 ? ` (${cogsNeedingCost})` : ''}
          </button>
        )}
      </div>

      <div className={styles.viewBar}>
        <select
          className={styles.searchInput}
          value={activeViewId ?? ''}
          aria-label="Saved view"
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '__save__') {
              saveCurrentView();
              return;
            }
            applyView(raw === '' ? null : views.find((v) => v.id === Number(raw)) ?? null);
          }}
        >
          <option value="">All columns</option>
          {views.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
          <option value="__save__">＋ Save current view…</option>
        </select>

        <div className={styles.columnsWrap} ref={columnsRef}>
          <button
            type="button"
            className={styles.chip}
            aria-haspopup="true"
            aria-expanded={columnsOpen}
            onClick={() => setColumnsOpen((o) => !o)}
          >
            Columns ({visibleColumns.length}/{allColumns.length}) ▾
          </button>
          {columnsOpen && (
            <div className={styles.columnsMenu} role="menu" aria-label="Choose columns">
              <div className={styles.columnsMenuActions}>
                <button type="button" className={styles.linkBtn} onClick={showAllColumns}>
                  Show all
                </button>
              </div>
              {allColumns
                .filter((c) => !c.required)
                .map((c) => (
                  <label key={c.key} className={styles.columnsMenuRow}>
                    <input
                      type="checkbox"
                      checked={visibleKeys.includes(c.key)}
                      onChange={() => toggleColumn(c.key)}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
            </div>
          )}
        </div>

        {viewDirty && <span className={styles.dirtyChip}>Modified</span>}
        {activeViewId !== null && viewDirty && (
          <>
            <button type="button" className={styles.linkBtn} onClick={saveCurrentView}>
              Save
            </button>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => applyView(views.find((v) => v.id === activeViewId) ?? null)}
            >
              Revert
            </button>
          </>
        )}
        {activeViewId !== null && (
          <button type="button" className={styles.linkBtn} onClick={removeView}>
            Delete view
          </button>
        )}
      </div>

      {tab === 'unit-economics' && ueSelected.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{ueSelected.size} selected</span>
          <select
            className={styles.searchInput}
            value={ueBulkField}
            onChange={(e) => setUeBulkField(e.target.value)}
            aria-label="Field to set"
          >
            <option value="">Set field…</option>
            {UE_BULK_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            className={styles.searchInput}
            style={{ maxWidth: 120 }}
            value={ueBulkValue}
            onChange={(e) => setUeBulkValue(e.target.value)}
            placeholder={
              UE_BULK_FIELDS.find((f) => f.key === ueBulkField)?.kind === 'pct' ? 'e.g. 15' : 'e.g. 0.30'
            }
            inputMode="decimal"
            aria-label="Value to apply"
          />
          <button
            className="btn btn-primary"
            type="button"
            disabled={!ueBulkField || ueBulkValue.trim() === '' || ueBulkBusy}
            onClick={applyUeBulk}
          >
            {ueBulkBusy ? 'Applying…' : 'Apply'}
          </button>
          <button className="btn" type="button" onClick={() => setUeSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {tab === 'cogs' && selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selected.size} selected</span>
          <select
            className={styles.searchInput}
            value={bulkGroup}
            onChange={(e) => setBulkGroup(e.target.value)}
            aria-label="Product type to apply"
          >
            <option value="">Set product type…</option>
            {productGroupValues.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
            <option value={ADD_NEW}>＋ Add new…</option>
          </select>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!bulkGroup || bulkBusy}
            onClick={applyBulkProductGroup}
          >
            {bulkBusy ? 'Applying…' : 'Apply'}
          </button>
          <button className="btn" type="button" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {addOpen && tab === 'cogs' && (
        <form className={styles.inlineAdd} onSubmit={handleAdd}>
          <select
            className={styles.input}
            value={draft.account}
            onChange={(e) => setDraft((d) => ({ ...d, account: e.target.value }))}
            aria-label="Account"
            required
          >
            <option value="">Account…</option>
            {accountValues.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            value={draft.sku}
            onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
            placeholder="SKU"
            aria-label="SKU"
            required
          />
          <input
            className={styles.input}
            value={draft.asin}
            onChange={(e) => setDraft((d) => ({ ...d, asin: e.target.value }))}
            placeholder="ASIN"
            aria-label="ASIN"
          />
          <input
            className={styles.input}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Title"
            aria-label="Title"
          />
          <input
            className={styles.input}
            value={draft.brand}
            onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
            placeholder="Brand"
            aria-label="Brand"
          />
          <input
            className={styles.input}
            value={draft.productGroup}
            onChange={(e) => setDraft((d) => ({ ...d, productGroup: e.target.value }))}
            placeholder="Product group"
            aria-label="Product group"
          />
          <select
            className={styles.input}
            value={draft.fulfillmentChannel}
            onChange={(e) => setDraft((d) => ({ ...d, fulfillmentChannel: e.target.value }))}
            aria-label="Fulfillment channel"
          >
            <option value="">Channel…</option>
            <option value="FBA">FBA</option>
            <option value="FBM">FBM</option>
          </select>
          <input
            className={styles.input}
            value={draftCost}
            onChange={(e) => setDraftCost(e.target.value)}
            placeholder="Purchase cost"
            inputMode="decimal"
            aria-label="Purchase cost"
          />
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? 'Adding…' : 'Add'}
          </button>
          <button className="btn" type="button" onClick={() => setAddOpen(false)}>
            Cancel
          </button>
        </form>
      )}

      {loadError && <p className={styles.error}>{loadError}</p>}
      {saveError && (
        <div className={styles.errorBar} role="alert">
          <span>{saveError}</span>
          <button className={styles.errorDismiss} onClick={() => setSaveError('')} type="button">
            Dismiss
          </button>
        </div>
      )}

      {tab === 'cogs' ? (
        <>
        <TopScrollbar targetRef={cogsScrollRef} />
        <div className={styles.tableWrapScroll} ref={cogsScrollRef}>
          <table className={`${styles.table} ${styles.tableFixed}`}>
            <ColGroup columns={visibleColumns.map((c) => c.key)} widths={cogsCols.widths} />
            <thead>
              <tr>
                {visibleColumns.map((c) => (
                  <th
                    key={c.key}
                    className={`${c.num ? styles.numCol : ''} ${c.key === 'select' ? styles.checkCol : ''}`}
                    aria-label={c.label || (c.key === 'select' ? 'Select' : 'Actions')}
                  >
                    {c.key === 'select' ? (
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        aria-label="Select all shown products"
                      />
                    ) : (
                      c.label
                    )}
                    <ResizeHandle columnKey={c.key} onStart={cogsCols.startResize} onReset={cogsCols.resetColumn} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : visibleCogs.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className={styles.emptyCell}>
                    {cogsRows.length === 0
                      ? 'No products yet — add the first one.'
                      : 'No products match the filters.'}
                  </td>
                </tr>
              ) : (
                visibleCogs.map((row) => {
                  // Cells are keyed so hiding a column can never misalign a row.
                  const cells: Record<string, JSX.Element> = {
                    select: (
                      <td className={styles.checkCol}>
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select ${row.sku}`}
                        />
                      </td>
                    ),
                    account: (
                      <td>
                        <span className={`${styles.pill} ${styles.badgeNeutral}`}>{row.account}</span>
                      </td>
                    ),
                    sku: <td title={row.sku}>{row.sku}</td>,
                    asin: <td>{row.asin || <span className={styles.muted}>—</span>}</td>,
                    title: (
                      <td title={row.title || row.itemName}>
                        {row.title || row.itemName || <span className={styles.muted}>—</span>}
                      </td>
                    ),
                    brand: <td title={row.brand}>{row.brand || <span className={styles.muted}>—</span>}</td>,
                    productGroup: (
                      <td>
                        <div className={styles.selectCell}>
                          {row.productGroup ? (
                            <span className={`${styles.pill} ${styles.badgeNeutral}`}>{row.productGroup}</span>
                          ) : (
                            <span className={styles.muted}>—</span>
                          )}
                          <select
                            className={styles.overlaySelect}
                            value={row.productGroup}
                            aria-label={`Product type for ${row.sku}`}
                            onChange={(e) => handleProductGroup(row, e.target.value)}
                          >
                            <option value="">—</option>
                            {uniq([...productGroupValues, row.productGroup]).filter(Boolean).map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                            <option value={ADD_NEW}>＋ Add new…</option>
                          </select>
                        </div>
                      </td>
                    ),
                    channel: <td>{row.fulfillmentChannel || <span className={styles.muted}>—</span>}</td>,
                    purchaseCost: (
                      <td className={styles.numCol}>
                        <input
                          className={`${styles.ghostInput} ${styles.numInput}`}
                          type="text"
                          inputMode="decimal"
                          defaultValue={String(row.purchaseCost)}
                          aria-label={`Purchase cost for ${row.sku}`}
                          onBlur={(e) => {
                            const raw = e.target.value.trim().replace(/[$,]/g, '');
                            const n = Number(raw);
                            if (raw === '' || Number.isNaN(n)) {
                              e.target.value = String(row.purchaseCost);
                              return;
                            }
                            if (n !== row.purchaseCost) patchCogs(row, { purchaseCost: n });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                        />
                      </td>
                    ),
                    actions: (
                      <td className={styles.rowActions}>
                        <button
                          className={styles.iconBtn}
                          type="button"
                          aria-label={`Delete ${row.sku}`}
                          onClick={() => removeCogs(row)}
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    ),
                  };
                  return (
                    <tr key={row.id} className={savingIds.has(row.id) ? styles.rowSaving : undefined}>
                      {visibleColumns.map((c) => (
                        <Fragment key={c.key}>{cells[c.key]}</Fragment>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <>
        <TopScrollbar targetRef={ueScrollRef} />
        <div className={styles.tableWrapScroll} ref={ueScrollRef}>
          <table className={`${styles.table} ${styles.tableFixed}`}>
            <ColGroup columns={visibleColumns.map((c) => c.key)} widths={ueCols.widths} />
            <thead>
              <tr>
                {visibleColumns.map((c) => (
                  <th
                    key={c.key}
                    className={`${c.num ? styles.numCol : ''} ${c.plan ? styles.planHead : ''} ${
                      c.key === 'sku' ? styles.stickyCol : ''
                    } ${c.key === 'select' ? styles.checkCol : ''}`}
                  >
                    {c.key === 'select' ? (
                      <input
                        type="checkbox"
                        checked={allUeSelected}
                        onChange={toggleAllUeVisible}
                        aria-label="Select all shown products"
                      />
                    ) : (
                      c.label
                    )}
                    <ResizeHandle columnKey={c.key} onStart={ueCols.startResize} onReset={ueCols.resetColumn} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : visibleUe.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className={styles.emptyCell}>
                    {ueRows.length === 0
                      ? 'No unit economics yet — add products in the COGS tab.'
                      : 'No products match the filters.'}
                  </td>
                </tr>
              ) : (
                visibleUe.map((row) => {
                  // Same keyed-cell approach as the COGS table.
                  const planInput = (
                    key: string,
                    label: string,
                    value: string,
                    onCommit: (raw: string) => void
                  ) => (
                    <td className={`${styles.numCol} ${styles.planCell}`}>
                      <input
                        className={`${styles.ghostInput} ${styles.numInput}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="—"
                        defaultValue={value}
                        aria-label={`${label} for ${row.sku}`}
                        onBlur={(e) => onCommit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                  );
                  const cells: Record<string, JSX.Element> = {
                    select: (
                      <td className={styles.checkCol}>
                        <input
                          type="checkbox"
                          checked={ueSelected.has(row.id)}
                          onChange={() => toggleUeRow(row.id)}
                          aria-label={`Select ${row.sku}`}
                        />
                      </td>
                    ),
                    sku: <td className={styles.stickyCol}>{row.sku}</td>,
                    brand: <td>{row.brand || <span className={styles.muted}>—</span>}</td>,
                    title: (
                      <td title={row.title}>{row.title || <span className={styles.muted}>—</span>}</td>
                    ),
                    purchaseCost: <td className={styles.numCol}>{formatMoney(row.purchaseCost)}</td>,
                    prep: planInput('prep', 'Prep', String(row.prepCost), (raw) => {
                      const n = moneyToStore(raw);
                      if (n !== null && n !== row.prepCost) patchPlan(row, { prepCost: n });
                    }),
                    inbound: planInput('inbound', 'Inbound', String(row.inboundCost), (raw) => {
                      const n = moneyToStore(raw);
                      if (n !== null && n !== row.inboundCost) patchPlan(row, { inboundCost: n });
                    }),
                    totalCost: <td className={styles.numCol}>{formatMoney(row.totalCost)}</td>,
                    storage: <td className={styles.numCol}>{formatMoney(row.storageFee)}</td>,
                    fba: <td className={styles.numCol}>{formatMoney(row.fulfillmentFee)}</td>,
                    referral: <td className={styles.numCol}>{formatMoney(row.referralFee)}</td>,
                    totalFee: <td className={styles.numCol}>{formatMoney(row.totalFee)}</td>,
                    price: (
                      <td className={styles.numCol}>
                        {row.currentPrice > 0 ? (
                          formatMoney(row.currentPrice)
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                    ),
                    profit: <td className={styles.numCol}>{signed(row.profit, formatMoney)}</td>,
                    margin: <td className={styles.numCol}>{signed(row.marginPct, (v) => pct(v))}</td>,
                    breakeven: (
                      <td className={styles.numCol}>
                        {row.breakevenPrice === null ? (
                          <span className={styles.muted}>—</span>
                        ) : (
                          formatMoney(row.breakevenPrice)
                        )}
                      </td>
                    ),
                    discountPct: planInput(
                      'discountPct',
                      'Discount percent',
                      pctToDisplay(row.discountPct),
                      (raw) => {
                        const next = pctToStore(raw);
                        if (next !== row.discountPct) patchPlan(row, { discountPct: next });
                      }
                    ),
                    discPrice: (
                      <td className={styles.numCol}>
                        {row.discountedPrice === null ? (
                          <span className={styles.muted}>—</span>
                        ) : (
                          formatMoney(row.discountedPrice)
                        )}
                      </td>
                    ),
                    discProfit: (
                      <td className={styles.numCol}>{signed(row.discountedProfit, formatMoney)}</td>
                    ),
                    discMargin: (
                      <td className={styles.numCol}>
                        {signed(row.discountedMarginPct, (v) => pct(v))}
                      </td>
                    ),
                    desiredProfitPct: planInput(
                      'desiredProfitPct',
                      'Desired profit percent',
                      pctToDisplay(row.desiredProfitPct),
                      (raw) => {
                        const next = pctToStore(raw);
                        if (next !== row.desiredProfitPct) patchPlan(row, { desiredProfitPct: next });
                      }
                    ),
                    suggestedPrice: (
                      <td className={styles.numCol}>
                        {row.suggestedPrice === null ? (
                          <span className={styles.muted}>—</span>
                        ) : (
                          <strong>{formatMoney(row.suggestedPrice)}</strong>
                        )}
                      </td>
                    ),
                    desiredPrice: planInput(
                      'desiredPrice',
                      'Desired price',
                      row.desiredPrice === null ? '' : String(row.desiredPrice),
                      (raw) => {
                        const next = moneyToStore(raw);
                        if (next !== row.desiredPrice) patchPlan(row, { desiredPrice: next });
                      }
                    ),
                    desiredProfit: (
                      <td className={styles.numCol}>{signed(row.desiredPriceProfit, formatMoney)}</td>
                    ),
                    desiredMargin: (
                      <td className={styles.numCol}>
                        {signed(row.desiredPriceMarginPct, (v) => pct(v))}
                      </td>
                    ),
                  };
                  return (
                    <tr key={row.id} className={savingIds.has(row.id) ? styles.rowSaving : undefined}>
                      {visibleColumns.map((c) => (
                        <Fragment key={c.key}>{cells[c.key]}</Fragment>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </>
      )}
    </>
  );
}
