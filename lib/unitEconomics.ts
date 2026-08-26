import { supabase } from './supabaseClient';

// Mirrors `public.cogs` and `public.unit_economics` — the Accounts screen's
// two tabs. Profitability is read from `unit_economics_view`, which computes
// the Profit-Calc formulas; the view is not updatable, so planning inputs are
// written back to `unit_economics` and the row is re-read from the view.
// See UNIT_ECONOMICS.md.

export interface CogsRow {
  id: number;
  account: string;
  sku: string;
  asin: string;
  title: string;
  itemName: string;
  brand: string;
  purchaseCost: number;
  productGroup: string;
  fulfillmentChannel: string;
  note: string;
}

export type CogsInput = Omit<CogsRow, 'id'>;

interface CogsRecord {
  id: number;
  account: string;
  sku: string;
  asin: string | null;
  title: string | null;
  item_name: string | null;
  brand: string | null;
  purchase_cost: number | string;
  product_group: string | null;
  fulfillment_channel: string | null;
  note: string | null;
}

// Every numeric column is coerced: PostgREST serializes `numeric` as a string.
function num(v: number | string | null): number {
  return v === null ? 0 : Number(v);
}

// Nullable numerics stay null so "not planned" is distinguishable from zero.
function numOrNull(v: number | string | null): number | null {
  return v === null ? null : Number(v);
}

function cogsFromRecord(r: CogsRecord): CogsRow {
  return {
    id: r.id,
    account: r.account,
    sku: r.sku,
    asin: r.asin ?? '',
    title: r.title ?? '',
    itemName: r.item_name ?? '',
    brand: r.brand ?? '',
    purchaseCost: num(r.purchase_cost),
    productGroup: r.product_group ?? '',
    fulfillmentChannel: r.fulfillment_channel ?? '',
    note: r.note ?? '',
  };
}

function cogsToRecord(input: Partial<CogsInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.account !== undefined) out.account = input.account;
  if (input.sku !== undefined) out.sku = input.sku;
  if (input.asin !== undefined) out.asin = input.asin;
  if (input.title !== undefined) out.title = input.title;
  if (input.itemName !== undefined) out.item_name = input.itemName;
  if (input.brand !== undefined) out.brand = input.brand;
  if (input.purchaseCost !== undefined) out.purchase_cost = input.purchaseCost;
  if (input.productGroup !== undefined) out.product_group = input.productGroup;
  if (input.fulfillmentChannel !== undefined) out.fulfillment_channel = input.fulfillmentChannel;
  if (input.note !== undefined) out.note = input.note;
  return out;
}

function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. See SUPABASE_SETUP.md.');
  }
  return supabase;
}

const COGS_TABLE = 'cogs';
const UE_TABLE = 'unit_economics';
const UE_VIEW = 'unit_economics_view';

export async function getCogs(account?: string): Promise<CogsRow[]> {
  let query = client().from(COGS_TABLE).select('*').order('sku');
  if (account) query = query.eq('account', account);
  const { data, error } = await query;
  if (error) throw error;
  return (data as CogsRecord[]).map(cogsFromRecord);
}

export async function addCogs(input: CogsInput): Promise<CogsRow> {
  const { data, error } = await client()
    .from(COGS_TABLE)
    .insert(cogsToRecord(input))
    .select()
    .single();
  if (error) throw error;
  return cogsFromRecord(data as CogsRecord);
}

export async function updateCogs(id: number, patch: Partial<CogsInput>): Promise<CogsRow> {
  const { data, error } = await client()
    .from(COGS_TABLE)
    .update(cogsToRecord(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return cogsFromRecord(data as CogsRecord);
}

export async function deleteCogs(id: number): Promise<void> {
  const { error } = await client().from(COGS_TABLE).delete().eq('id', id);
  if (error) throw error;
}

// --- Unit economics ---------------------------------------------------------

export interface UnitEconomicsRow {
  id: number;
  account: string;
  brand: string;
  asin: string;
  sku: string;
  title: string;
  productGroup: string;
  fulfillmentChannel: string;
  // Costs
  purchaseCost: number;
  prepCost: number;
  inboundCost: number;
  totalCost: number;
  // Amazon fees & price
  sizeTier: string;
  storageFee: number;
  fulfillmentFee: number;
  currentPrice: number;
  referralFee: number;
  totalFee: number;
  referralRate: number;
  // Profitability at the current price
  profit: number;
  marginPct: number | null;
  beTacos: number | null;
  breakevenPrice: number | null;
  // Discount planning
  discountPct: number | null;
  discountedPrice: number | null;
  discountedProfit: number | null;
  discountedMarginPct: number | null;
  // Target margin -> price
  desiredProfitPct: number | null;
  suggestedPrice: number | null;
  // Target price -> profit
  desiredPrice: number | null;
  desiredPriceProfit: number | null;
  desiredPriceMarginPct: number | null;
  syncedAt: string | null;
}

// The planning inputs are the only writable fields; everything else on the
// row is either synced from Amazon or computed by the view.
export interface UnitEconomicsPlanInput {
  discountPct: number | null;
  desiredProfitPct: number | null;
  desiredPrice: number | null;
  prepCost: number;
  inboundCost: number;
}

interface UnitEconomicsRecord {
  id: number;
  account: string;
  brand: string | null;
  asin: string | null;
  sku: string;
  title: string | null;
  product_group: string | null;
  fulfillment_channel: string | null;
  purchase_cost: number | string;
  prep_cost: number | string;
  inbound_cost: number | string;
  total_cost: number | string;
  size_tier: string | null;
  storage_fee: number | string;
  fulfillment_fee: number | string;
  current_price: number | string;
  referral_fee: number | string;
  total_fee: number | string;
  referral_rate: number | string;
  profit: number | string;
  margin_pct: number | string | null;
  be_tacos: number | string | null;
  breakeven_price: number | string | null;
  discount_pct: number | string | null;
  discounted_price: number | string | null;
  discounted_profit: number | string | null;
  discounted_margin_pct: number | string | null;
  desired_profit_pct: number | string | null;
  suggested_price: number | string | null;
  desired_price: number | string | null;
  desired_price_profit: number | string | null;
  desired_price_margin_pct: number | string | null;
  synced_at: string | null;
}

function ueFromRecord(r: UnitEconomicsRecord): UnitEconomicsRow {
  return {
    id: r.id,
    account: r.account,
    brand: r.brand ?? '',
    asin: r.asin ?? '',
    sku: r.sku,
    title: r.title ?? '',
    productGroup: r.product_group ?? '',
    fulfillmentChannel: r.fulfillment_channel ?? '',
    purchaseCost: num(r.purchase_cost),
    prepCost: num(r.prep_cost),
    inboundCost: num(r.inbound_cost),
    totalCost: num(r.total_cost),
    sizeTier: r.size_tier ?? '',
    storageFee: num(r.storage_fee),
    fulfillmentFee: num(r.fulfillment_fee),
    currentPrice: num(r.current_price),
    referralFee: num(r.referral_fee),
    totalFee: num(r.total_fee),
    referralRate: num(r.referral_rate),
    profit: num(r.profit),
    marginPct: numOrNull(r.margin_pct),
    beTacos: numOrNull(r.be_tacos),
    breakevenPrice: numOrNull(r.breakeven_price),
    discountPct: numOrNull(r.discount_pct),
    discountedPrice: numOrNull(r.discounted_price),
    discountedProfit: numOrNull(r.discounted_profit),
    discountedMarginPct: numOrNull(r.discounted_margin_pct),
    desiredProfitPct: numOrNull(r.desired_profit_pct),
    suggestedPrice: numOrNull(r.suggested_price),
    desiredPrice: numOrNull(r.desired_price),
    desiredPriceProfit: numOrNull(r.desired_price_profit),
    desiredPriceMarginPct: numOrNull(r.desired_price_margin_pct),
    syncedAt: r.synced_at,
  };
}

function planToRecord(input: Partial<UnitEconomicsPlanInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.discountPct !== undefined) out.discount_pct = input.discountPct;
  if (input.desiredProfitPct !== undefined) out.desired_profit_pct = input.desiredProfitPct;
  if (input.desiredPrice !== undefined) out.desired_price = input.desiredPrice;
  if (input.prepCost !== undefined) out.prep_cost = input.prepCost;
  if (input.inboundCost !== undefined) out.inbound_cost = input.inboundCost;
  return out;
}

export async function getUnitEconomics(account?: string): Promise<UnitEconomicsRow[]> {
  let query = client().from(UE_VIEW).select('*').order('sku');
  if (account) query = query.eq('account', account);
  const { data, error } = await query;
  if (error) throw error;
  return (data as UnitEconomicsRecord[]).map(ueFromRecord);
}

// Writes to the base table (the view is read-only), then re-reads the view row
// so the caller gets the recomputed profit/margin/suggestion columns.
export async function updateUnitEconomicsPlan(
  id: number,
  patch: Partial<UnitEconomicsPlanInput>
): Promise<UnitEconomicsRow> {
  const { error } = await client().from(UE_TABLE).update(planToRecord(patch)).eq('id', id);
  if (error) throw error;
  const { data, error: readError } = await client().from(UE_VIEW).select('*').eq('id', id).single();
  if (readError) throw readError;
  return ueFromRecord(data as UnitEconomicsRecord);
}
