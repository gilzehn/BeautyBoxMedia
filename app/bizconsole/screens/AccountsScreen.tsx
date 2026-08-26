'use client';

import { Fragment, useEffect, useMemo, useState, FormEvent } from 'react';
import styles from '../bizconsole.module.css';
import {
  CogsRow,
  CogsInput,
  UnitEconomicsRow,
  getCogs,
  addCogs,
  updateCogs,
  deleteCogs,
  getUnitEconomics,
  updateUnitEconomicsPlan,
} from '@/lib/unitEconomics';
import { TrashIcon, ScreenHead, formatMoney, uniq } from './shared';

type Tab = 'cogs' | 'unit-economics';

const TABS: { id: Tab; label: string }[] = [
  { id: 'cogs', label: 'COGS' },
  { id: 'unit-economics', label: 'Unit Economics' },
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
    () => cogsRows.filter(matches),
    [cogsRows, account, brand, search] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const visibleUe = useMemo(
    () => ueRows.filter(matches),
    [ueRows, account, brand, search] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const stats = useMemo(() => {
    const priced = visibleUe.filter((r) => r.currentPrice > 0);
    const losing = priced.filter((r) => r.profit < 0).length;
    const avgMargin =
      priced.length > 0
        ? priced.reduce((sum, r) => sum + (r.marginPct ?? 0), 0) / priced.length
        : null;
    return { losing, avgMargin, priced: priced.length };
  }, [visibleUe]);

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
      ? `${visibleCogs.length} products`
      : `${visibleUe.length} products · ${stats.losing} below break-even${
          stats.avgMargin !== null ? ` · avg margin ${pct(stats.avgMargin)}` : ''
        }`;

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

      <div className={styles.chipRow} role="tablist" aria-label="Views">
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
        <div className={styles.tableWrapScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Account</th>
                <th>SKU</th>
                <th>ASIN</th>
                <th>Title</th>
                <th>Brand</th>
                <th>Product Group</th>
                <th>Channel</th>
                <th className={styles.numCol}>Purchase Cost</th>
                <th className={styles.actionsHead} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : visibleCogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.emptyCell}>
                    {cogsRows.length === 0
                      ? 'No products yet — add the first one.'
                      : 'No products match the filters.'}
                  </td>
                </tr>
              ) : (
                visibleCogs.map((row) => (
                  <tr key={row.id} className={savingIds.has(row.id) ? styles.rowSaving : undefined}>
                    <td>
                      <span className={`${styles.pill} ${styles.badgeNeutral}`}>{row.account}</span>
                    </td>
                    <td>{row.sku}</td>
                    <td>{row.asin || <span className={styles.muted}>—</span>}</td>
                    <td className={styles.titleCell} title={row.title || row.itemName}>
                      {row.title || row.itemName || <span className={styles.muted}>—</span>}
                    </td>
                    <td>{row.brand || <span className={styles.muted}>—</span>}</td>
                    <td>{row.productGroup || <span className={styles.muted}>—</span>}</td>
                    <td>{row.fulfillmentChannel || <span className={styles.muted}>—</span>}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.tableWrapScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.stickyCol}>SKU</th>
                <th>Brand</th>
                <th>Title</th>
                <th className={styles.numCol}>Total Cost</th>
                <th className={styles.numCol}>Storage</th>
                <th className={styles.numCol}>FBA</th>
                <th className={styles.numCol}>Referral</th>
                <th className={styles.numCol}>Total Fee</th>
                <th className={styles.numCol}>Price</th>
                <th className={styles.numCol}>Profit</th>
                <th className={styles.numCol}>Margin</th>
                <th className={styles.numCol}>Break-even</th>
                <th className={`${styles.numCol} ${styles.planHead}`}>Discount %</th>
                <th className={styles.numCol}>Disc. Price</th>
                <th className={styles.numCol}>Disc. Profit</th>
                <th className={styles.numCol}>Disc. Margin</th>
                <th className={`${styles.numCol} ${styles.planHead}`}>Desired Profit %</th>
                <th className={styles.numCol}>Suggested Price</th>
                <th className={`${styles.numCol} ${styles.planHead}`}>Desired Price</th>
                <th className={styles.numCol}>@ Price Profit</th>
                <th className={styles.numCol}>@ Price Margin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={21} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : visibleUe.length === 0 ? (
                <tr>
                  <td colSpan={21} className={styles.emptyCell}>
                    {ueRows.length === 0
                      ? 'No unit economics yet — add products in the COGS tab.'
                      : 'No products match the filters.'}
                  </td>
                </tr>
              ) : (
                visibleUe.map((row) => (
                  <tr key={row.id} className={savingIds.has(row.id) ? styles.rowSaving : undefined}>
                    <td className={styles.stickyCol}>{row.sku}</td>
                    <td>{row.brand || <span className={styles.muted}>—</span>}</td>
                    <td className={styles.titleCell} title={row.title}>
                      {row.title || <span className={styles.muted}>—</span>}
                    </td>
                    <td className={styles.numCol}>{formatMoney(row.totalCost)}</td>
                    <td className={styles.numCol}>{formatMoney(row.storageFee)}</td>
                    <td className={styles.numCol}>{formatMoney(row.fulfillmentFee)}</td>
                    <td className={styles.numCol}>{formatMoney(row.referralFee)}</td>
                    <td className={styles.numCol}>{formatMoney(row.totalFee)}</td>
                    <td className={styles.numCol}>
                      {row.currentPrice > 0 ? (
                        formatMoney(row.currentPrice)
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                    <td className={styles.numCol}>{signed(row.profit, formatMoney)}</td>
                    <td className={styles.numCol}>{signed(row.marginPct, (v) => pct(v))}</td>
                    <td className={styles.numCol}>
                      {row.breakevenPrice === null ? (
                        <span className={styles.muted}>—</span>
                      ) : (
                        formatMoney(row.breakevenPrice)
                      )}
                    </td>
                    <td className={`${styles.numCol} ${styles.planCell}`}>
                      <input
                        className={`${styles.ghostInput} ${styles.numInput}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="—"
                        defaultValue={pctToDisplay(row.discountPct)}
                        aria-label={`Discount percent for ${row.sku}`}
                        onBlur={(e) => {
                          const next = pctToStore(e.target.value);
                          if (next !== row.discountPct) patchPlan(row, { discountPct: next });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td className={styles.numCol}>
                      {row.discountedPrice === null ? (
                        <span className={styles.muted}>—</span>
                      ) : (
                        formatMoney(row.discountedPrice)
                      )}
                    </td>
                    <td className={styles.numCol}>{signed(row.discountedProfit, formatMoney)}</td>
                    <td className={styles.numCol}>{signed(row.discountedMarginPct, (v) => pct(v))}</td>
                    <td className={`${styles.numCol} ${styles.planCell}`}>
                      <input
                        className={`${styles.ghostInput} ${styles.numInput}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="—"
                        defaultValue={pctToDisplay(row.desiredProfitPct)}
                        aria-label={`Desired profit percent for ${row.sku}`}
                        onBlur={(e) => {
                          const next = pctToStore(e.target.value);
                          if (next !== row.desiredProfitPct) patchPlan(row, { desiredProfitPct: next });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td className={styles.numCol}>
                      {row.suggestedPrice === null ? (
                        <span className={styles.muted}>—</span>
                      ) : (
                        <strong>{formatMoney(row.suggestedPrice)}</strong>
                      )}
                    </td>
                    <td className={`${styles.numCol} ${styles.planCell}`}>
                      <input
                        className={`${styles.ghostInput} ${styles.numInput}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="—"
                        defaultValue={row.desiredPrice === null ? '' : String(row.desiredPrice)}
                        aria-label={`Desired price for ${row.sku}`}
                        onBlur={(e) => {
                          const next = moneyToStore(e.target.value);
                          if (next !== row.desiredPrice) patchPlan(row, { desiredPrice: next });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td className={styles.numCol}>{signed(row.desiredPriceProfit, formatMoney)}</td>
                    <td className={styles.numCol}>{signed(row.desiredPriceMarginPct, (v) => pct(v))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
