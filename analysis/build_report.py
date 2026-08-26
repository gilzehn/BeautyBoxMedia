#!/usr/bin/env python3
"""Build the Brand Profit Analysis report for one Amazon account.

Inputs — all under analysis/data/, one set per account:
  <ACCOUNT>_<FROM>_<TO>_bq.json    SKU activity BY MONTH   (analysis/sku_profit_pl.sql)
  <ACCOUNT>_cogs_supabase.json     landed cost             (analysis/cogs.sql)
  <ACCOUNT>_account_costs.json     account-level lines by month (analysis/account_costs.sql)
  <ACCOUNT>_brand_list.json        public.brands + alias map + focus flags
  <ACCOUNT>_campaign_spend.json    ad spend by campaign-name brand token (analysis/campaign_spend.sql)

Output:
  analysis/<account>-brand-profit-analysis.html   self-contained, no network calls

Usage:
  python3 analysis/build_report.py --account NRG --from 2026-05-01 --to 2026-08-20
"""
from __future__ import annotations

import argparse
import calendar
import datetime as dt
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "data"
TOTAL = "TOTAL"

# The 18 numbers stored per SKU per period. Everything else on the page is
# derived from these, in Python for the findings and in JS for the tables, so
# the two can never drift.
METRICS = ["units", "gross", "promo", "refunds", "retUnits", "retSellable", "referral", "fba",
           "otherFee", "reimb", "storage", "inbound", "ads", "adSales", "cogs", "overhead",
           "sessions", "bbNum"]
MI = {k: i for i, k in enumerate(METRICS)}

# Thresholds that turn a number into a finding.
TARGET_REFUND_RATE = 0.05
TARGET_FEE_RATIO = 0.40
TARGET_PROMO_RATIO = 0.05
MIN_BUY_BOX = 0.85
MIN_SESSIONS_FOR_BB = 300
MATERIAL = 50.0


def load(p: pathlib.Path):
    with open(p) as fh:
        return json.load(fh)


def norm_key(s: str) -> str:
    """Brand strings arrive spelled three ways (Amazon, Supabase, the Brand
    List). Compare them on letters and digits only."""
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def money(v):
    return f'-${abs(v):,.0f}' if v < 0 else f'${v:,.0f}'


def pct(v, d=1):
    return f'{v * 100:.{d}f}%'


# --- derived figures --------------------------------------------------------
def derive(m):
    """m is a METRICS list. Returns the derived P&L for it."""
    g = lambda k: m[MI[k]]
    net = g("gross") - g("promo") - g("refunds")
    fees = g("referral") + g("fba") + g("otherFee") + g("storage") + g("inbound")
    cm_before_ads = net + g("reimb") - fees - g("cogs")
    contrib = cm_before_ads - g("ads")
    profit = contrib - g("overhead")
    d = {k: g(k) for k in METRICS}
    d.update(
        netSales=round(net, 2), amazonFees=round(fees, 2), cmBeforeAds=round(cm_before_ads, 2),
        contrib=round(contrib, 2), netProfit=round(profit, 2),
        margin=round(profit / net, 4) if net else 0.0,
        tacos=round(g("ads") / net, 4) if net > 0 else 0.0,
        acos=round(g("ads") / g("adSales"), 4) if g("adSales") > 0 else 0.0,
        refundRate=round(g("retUnits") / g("units"), 4) if g("units") else 0.0,
        feeRatio=round((g("referral") + g("fba")) / net, 4) if net > 0 else 0.0,
        beAcos=round(cm_before_ads / net, 4) if net > 0 else 0.0,
        adShare=round(g("adSales") / net, 4) if net > 0 else 0.0,
        promoRatio=round(g("promo") / g("gross"), 4) if g("gross") > 0 else 0.0,
        bb=round(g("bbNum") / g("sessions"), 4) if g("sessions") else 0.0,
    )
    return d


def add(a, b):
    return [round(x + y, 4) for x, y in zip(a, b)]


def zero():
    return [0.0] * len(METRICS)


def rollup(skus, period):
    """Sum a list of SKU records over one period and derive its P&L."""
    tot = zero()
    for s in skus:
        tot = add(tot, s["m"].get(period, zero()))
    d = derive(tot)
    d["skuCount"] = len(skus)
    d["noCostSales"] = round(sum(derive(s["m"].get(period, zero()))["netSales"]
                                 for s in skus if not s["hasCost"]), 2)
    d["sellingSkus"] = sum(1 for s in skus if s["m"].get(period, zero())[MI["units"]] > 0)
    return d


# --- build ------------------------------------------------------------------
def compute(account, d_from, d_to):
    bq = load(DATA / f"{account}_{d_from}_{d_to}_bq.json")
    cogs_raw = load(DATA / f"{account}_cogs_supabase.json")
    acct = load(DATA / f"{account}_account_costs.json")
    brand_list = load(DATA / f"{account}_brand_list.json")

    ccol = {c: i for i, c in enumerate(cogs_raw["columns"])}
    cost_by_sku, cost_by_asin = {}, {}
    for r in cogs_raw["rows"]:
        rec = {
            "landed": round((r[ccol["purchase_cost"]] or 0) + (r[ccol["prep_cost"]] or 0)
                            + (r[ccol["inbound_cost"]] or 0), 4),
            "brand": (r[ccol["brand"]] or "").strip(),
            "group": (r[ccol["product_group"]] or "").strip(),
            "has_cost": (r[ccol["purchase_cost"]] or 0) > 0,
        }
        cost_by_sku[r[ccol["sku"]]] = rec
        asin = (r[ccol["asin"]] or "").strip()
        if asin and rec["has_cost"] and asin not in cost_by_asin:
            cost_by_asin[asin] = rec

    bcols = {c: i for i, c in enumerate(brand_list["columns"])}
    alias = {}
    for r in brand_list["rows"]:
        for a in [r[bcols["brand"]]] + list(r[bcols["aliases"]] or []):
            alias.setdefault(norm_key(a), r[bcols["brand"]])

    col = {c: i for i, c in enumerate(bq["columns"])}
    g = lambda r, c: r[col[c]]
    months = sorted({g(r, "ym") for r in bq["rows"]})

    # Per-month allocation pools need month totals first.
    by_month = {ym: [r for r in bq["rows"] if g(r, "ym") == ym] for ym in months}
    alloc = {}
    for ym, rows in by_month.items():
        costs = acct["months"][ym]
        ad_rep = sum(g(r, "ad_spend") for r in rows)
        st_rep = sum(g(r, "storage") for r in rows)
        alloc[ym] = {
            "adFactor": (costs["advertising"] / ad_rep) if ad_rep else 0.0,
            "storageFactor": (costs["storage"] / st_rep) if st_rep else 0.0,
            "adReport": round(ad_rep, 2), "storageReport": round(st_rep, 2),
            "inboundPool": costs["inbound_logistics"],
            "overheadPool": round(costs["removals_disposal"] + costs["returns_processing"]
                                  + costs["subscription"] + costs["other_adjustments"], 2),
        }

    skus = {}
    for ym, rows in by_month.items():
        a = alloc[ym]
        units_tot = sum(g(r, "units") for r in rows) or 1
        # Net sales share for the overhead split needs a first pass.
        nets = {}
        for r in rows:
            nets[g(r, "sku")] = max(g(r, "gross") - g(r, "promo") - g(r, "refund_amt"), 0)
        net_tot = sum(nets.values()) or 1

        for r in rows:
            sku = g(r, "sku")
            asin = g(r, "asin")
            c = cost_by_sku.get(sku) or cost_by_asin.get(asin) or {}
            if sku not in skus:
                src_brand = (c.get("brand") or "").strip()
                bq_brand = (g(r, "bq_brand") or "").strip()
                brand, on_list = "", False
                for cand in (src_brand, bq_brand):
                    if cand and norm_key(cand) in alias:
                        brand, on_list = alias[norm_key(cand)], True
                        break
                if not brand:
                    brand = src_brand or bq_brand or "Unassigned"
                skus[sku] = {
                    "sku": sku, "asin": asin, "name": g(r, "name"),
                    "brand": brand, "onList": on_list,
                    "group": (c.get("group") or "").strip() or "Unassigned",
                    "tier": g(r, "size_tier"), "status": g(r, "listing_status"),
                    "fc": g(r, "fulfillment_channel"), "price": g(r, "price"),
                    "onHand": g(r, "on_hand"),
                    "hasCost": bool(c.get("has_cost")),
                    "landed": c.get("landed", 0.0) if c.get("has_cost") else 0.0,
                    "m": {},
                }
            s = skus[sku]
            units = g(r, "units")
            cogs_units = max(units - g(r, "ret_sellable"), 0)
            m = zero()
            m[MI["units"]] = units
            m[MI["gross"]] = g(r, "gross")
            m[MI["promo"]] = g(r, "promo")
            m[MI["refunds"]] = g(r, "refund_amt")
            m[MI["retUnits"]] = g(r, "ret_units")
            m[MI["retSellable"]] = g(r, "ret_sellable")
            m[MI["referral"]] = g(r, "referral")
            m[MI["fba"]] = g(r, "fba_fee")
            m[MI["otherFee"]] = g(r, "other_fee")
            m[MI["reimb"]] = g(r, "reimb")
            m[MI["storage"]] = round(g(r, "storage") * a["storageFactor"], 2)
            m[MI["inbound"]] = round(a["inboundPool"] * (units / units_tot), 2)
            m[MI["ads"]] = round(g(r, "ad_spend") * a["adFactor"], 2)
            m[MI["adSales"]] = round(g(r, "ad_sales") * a["adFactor"], 2)
            m[MI["cogs"]] = round(s["landed"] * cogs_units, 2)
            m[MI["overhead"]] = round(a["overheadPool"] * (nets[sku] / net_tot), 2)
            m[MI["sessions"]] = g(r, "sessions")
            m[MI["bbNum"]] = round(g(r, "buy_box") * g(r, "sessions"), 2)
            s["m"][ym] = m

    for s in skus.values():
        t = zero()
        for ym in months:
            t = add(t, s["m"].get(ym, zero()))
        s["m"][TOTAL] = t

    return list(skus.values()), acct, brand_list, alloc, months


# --- findings ---------------------------------------------------------------
def sku_findings(skus, period):
    """Every leak we can put a dollar on, one SKU at a time."""
    out = []
    for s in skus:
        d = derive(s["m"].get(period, zero()))
        tag = f'{s["brand"]} · {s["sku"]}'
        base = dict(sku=s["sku"], asin=s["asin"], brand=s["brand"], scope=tag,
                    name=s["name"])

        if d["netSales"] > 0 and d["netProfit"] < 0 and s["hasCost"]:
            out.append(dict(base, kind="loss", sev="critical", impact=round(-d["netProfit"], 2),
                            title="Sells at a loss",
                            detail=f'{int(d["units"]):,} units, {money(d["netSales"])} net sales, '
                                   f'{money(d["netProfit"])} net profit ({pct(d["margin"])}).',
                            action="Reprice or renegotiate landed cost; if neither moves, stop advertising it and run the stock down."))

        if d["ads"] > MATERIAL and d["netSales"] > 0:
            waste = round(d["ads"] - d["adSales"] * max(d["beAcos"], 0), 2)
            if waste > MATERIAL:
                out.append(dict(base, kind="ads", sev="serious", impact=waste,
                                title="Ad spend above break-even",
                                detail=f'{money(d["ads"])} spent for {money(d["adSales"])} attributed sales '
                                       f'(ACOS {pct(d["acos"])} vs break-even {pct(d["beAcos"])}).',
                                action="Cut bids to the break-even ACOS, negative out the converting-but-unprofitable terms, and re-check in 14 days."))

        if d["units"] >= 20 and d["refundRate"] > TARGET_REFUND_RATE and d["netSales"] > 0:
            excess = (d["refundRate"] - TARGET_REFUND_RATE) * d["units"]
            per_unit = d["contrib"] / d["units"] if d["units"] else 0
            unsellable = 1 - (d["retSellable"] / d["retUnits"] if d["retUnits"] else 1)
            impact = round(excess * max(per_unit, 0) + excess * s["landed"] * unsellable, 2)
            if impact > MATERIAL:
                out.append(dict(base, kind="refunds", sev="serious", impact=impact,
                                title=f'Refund rate {pct(d["refundRate"])}',
                                detail=f'{int(d["retUnits"]):,} of {int(d["units"]):,} units came back, '
                                       f'{int(d["retUnits"] - d["retSellable"]):,} of them unsellable. '
                                       f'{money(d["refunds"])} refunded.',
                                action="Pull the return reasons for this ASIN, fix the listing claim or the packaging behind them, and re-measure after 30 days."))

        if d["units"] == 0 and (d["storage"] + d["otherFee"]) > MATERIAL:
            out.append(dict(base, kind="dead", sev="warning",
                            impact=round(d["storage"] + d["otherFee"], 2),
                            title="No sales, still costing money",
                            detail=f'Zero units sold, {money(d["storage"] + d["otherFee"])} of storage and fees, '
                                   f'{int(s["onHand"]):,} units on hand.',
                            action="Liquidate, remove, or relist with a working offer — the inventory is only accruing storage."))

        if d["netSales"] > 1000 and d["feeRatio"] > TARGET_FEE_RATIO:
            impact = round((d["feeRatio"] - TARGET_FEE_RATIO) * d["netSales"], 2)
            if impact > MATERIAL:
                out.append(dict(base, kind="fees", sev="warning", impact=impact,
                                title=f'Amazon fees are {pct(d["feeRatio"])} of net sales',
                                detail=f'{money(d["referral"])} referral + {money(d["fba"])} FBA on '
                                       f'{money(d["netSales"])} net sales. Size tier: {s["tier"] or "unknown"}.',
                                action="Re-measure the carton for the size tier, and check whether a multipack or a price move lifts the fee-to-price ratio."))

        if d["gross"] > 1000 and d["promoRatio"] > 0.10:
            impact = round((d["promoRatio"] - TARGET_PROMO_RATIO) * d["gross"], 2)
            if impact > MATERIAL:
                out.append(dict(base, kind="promo", sev="warning", impact=impact,
                                title=f'Promotions give away {pct(d["promoRatio"])} of gross',
                                detail=f'{money(d["promo"])} of rebates on {money(d["gross"])} gross sales.',
                                action="Cut the coupon or deal depth on this SKU and watch unit velocity for two weeks before deciding it was load-bearing."))

        if d["retUnits"] >= 10 and d["retSellable"] / d["retUnits"] < 0.5 and s["landed"] > 0:
            impact = round((d["retUnits"] - d["retSellable"]) * s["landed"], 2)
            if impact > MATERIAL:
                out.append(dict(base, kind="unsellable", sev="warning", impact=impact,
                                title="Returns come back unsellable",
                                detail=f'{int(d["retUnits"] - d["retSellable"]):,} of {int(d["retUnits"]):,} returned '
                                       f'units could not be resold — {money(impact)} of landed cost written off.',
                                action="Check the disposition reasons; damaged-in-transit points at packaging, defective at the supplier."))

        if d["sessions"] >= MIN_SESSIONS_FOR_BB and 0 < d["bb"] < MIN_BUY_BOX and d["netSales"] > 0:
            out.append(dict(base, kind="buybox", sev="warning",
                            impact=round(max(d["netSales"] * (MIN_BUY_BOX - d["bb"]) * max(d["margin"], 0), 0), 2),
                            title=f'Buy Box only {pct(d["bb"])}',
                            detail=f'{int(d["sessions"]):,} sessions with the Buy Box held {pct(d["bb"])} of the time.',
                            action="Find who is taking the box — a competing offer, a price-parity trip, or an out-of-stock gap — and close it."))

        if not s["hasCost"] and d["netSales"] > 500:
            out.append(dict(base, kind="nocost", sev="critical", impact=0.0,
                            at_risk=round(d["netSales"], 2),
                            title="No landed cost on file",
                            detail=f'{money(d["netSales"])} of net sales with purchase_cost = 0 in Supabase, '
                                   f'so its profit is overstated by whatever the product actually costs.',
                            action="Add purchase_cost for this SKU in public.cogs — until then every profit number on this row is fiction."))

    out.sort(key=lambda f: (-f["impact"], -f.get("at_risk", 0), f["kind"]))
    return out


def brand_findings(name, meta, brand_skus, months, labels=None, period=TOTAL):
    """The reads you make once for a whole brand rather than SKU by SKU."""
    out = []
    t = rollup(brand_skus, period) if brand_skus else None
    try:
        listed = int(meta.get("numAsins") or 0)
    except (TypeError, ValueError):
        listed = 0

    if not brand_skus:
        out.append(dict(sev="critical", impact=0.0, kind="absent",
                        title="On the Brand List, absent from Amazon",
                        detail=f'"{name}" is {meta.get("status","Active")} on the Brand List '
                               f'({meta.get("resellerType") or "no reseller type"}, brand registry '
                               f'{meta.get("registry") or "unknown"}, {listed} ASINs recorded) but no SKU under that '
                               f'brand moved money in the window, and none is mapped in Supabase cogs.',
                        action="Decide which it is: not launched, listed under a different brand string, or dead. "
                               "If it is live, tag its SKUs with the brand in public.cogs so it starts reporting here."))
        return out

    losers = sorted([s for s in brand_skus
                     if derive(s["m"].get(period, zero()))["netProfit"] < 0 and s["hasCost"]],
                    key=lambda s: derive(s["m"].get(period, zero()))["netProfit"])

    if t["netProfit"] < 0:
        top = ", ".join(f'{s["sku"]} ({money(derive(s["m"][period])["netProfit"])})' for s in losers[:3]) \
              or "no single SKU dominates"
        out.append(dict(sev="critical", kind="loss", impact=round(-t["netProfit"], 2),
                        title=f'The brand loses money — {money(t["netProfit"])} on {money(t["netSales"])} net sales',
                        detail=f'Margin {pct(t["margin"])} across {t["skuCount"]} SKUs. Worst: {top}.',
                        action="Treat this as a brand-level pricing and cost decision, not a SKU cleanup — the whole "
                               "line is priced below its landed-plus-fee cost."))

    if t["netSales"] > 0 and t["noCostSales"] / t["netSales"] > 0.10:
        n = sum(1 for s in brand_skus if not s["hasCost"])
        out.append(dict(sev="critical", kind="nocost", impact=0.0, at_risk=round(t["noCostSales"], 2),
                        title=f'{pct(t["noCostSales"]/t["netSales"])} of the brand has no landed cost',
                        detail=f'{n} of {t["skuCount"]} SKUs carry purchase_cost = 0, covering '
                               f'{money(t["noCostSales"])} of net sales.',
                        action="Fill purchase_cost in Supabase public.cogs for those SKUs before acting on this brand's margins."))

    if t["ads"] > 200 and t["netSales"] > 0:
        waste = round(t["ads"] - t["adSales"] * max(t["beAcos"], 0), 2)
        if waste > 200:
            out.append(dict(sev="serious", kind="ads", impact=waste,
                            title="Advertising runs past break-even for the whole brand",
                            detail=f'{money(t["ads"])} spend, {money(t["adSales"])} attributed sales — ACOS '
                                   f'{pct(t["acos"])} against a break-even of {pct(t["beAcos"])}. TACOS {pct(t["tacos"])}.',
                            action="Set the brand's target ACOS at its break-even and rebuild bids from there; "
                                   "the spend above that line buys revenue at a loss."))

    if t["units"] > 100 and t["refundRate"] > TARGET_REFUND_RATE:
        worst = sorted([s for s in brand_skus if derive(s["m"].get(period, zero()))["units"] >= 20],
                       key=lambda s: -derive(s["m"][period])["refundRate"])[:3]
        out.append(dict(sev="serious", kind="refunds",
                        impact=round((t["refundRate"] - TARGET_REFUND_RATE) * t["units"]
                                     * max(t["contrib"] / t["units"] if t["units"] else 0, 0), 2),
                        title=f'Brand refund rate {pct(t["refundRate"])}',
                        detail=f'{int(t["retUnits"]):,} of {int(t["units"]):,} units returned, {money(t["refunds"])} '
                               f'refunded. Worst: ' + ", ".join(
                                   f'{s["sku"]} {pct(derive(s["m"][period])["refundRate"])}' for s in worst) + ".",
                        action="Pull the return reasons across the brand — a rate this consistent is usually one "
                               "listing claim or one packaging decision, not a per-SKU accident."))

    if t["netSales"] > 5000 and t["feeRatio"] > TARGET_FEE_RATIO:
        out.append(dict(sev="warning", kind="fees",
                        impact=round((t["feeRatio"] - TARGET_FEE_RATIO) * t["netSales"], 2),
                        title=f'Amazon takes {pct(t["feeRatio"])} of net sales',
                        detail=f'{money(t["referral"])} referral + {money(t["fba"])} FBA on {money(t["netSales"])}.',
                        action="Audit carton dimensions and weights for the brand's top movers — at this ratio the "
                               "size tier, not the price, is usually what is wrong."))

    if t["gross"] > 5000 and t["promoRatio"] > 0.08:
        out.append(dict(sev="warning", kind="promo",
                        impact=round((t["promoRatio"] - TARGET_PROMO_RATIO) * t["gross"], 2),
                        title=f'Promotions give away {pct(t["promoRatio"])} of gross',
                        detail=f'{money(t["promo"])} of coupons and deal rebates on {money(t["gross"])} gross sales.',
                        action="Cut the depth on the brand's evergreen coupons and keep them for launches and rank pushes."))

    active_asins = len({s["asin"] for s in brand_skus
                        if s["asin"] and derive(s["m"].get(period, zero()))["units"] > 0})
    if listed and active_asins and listed > active_asins * 1.5:
        out.append(dict(sev="warning", kind="catalog", impact=0.0,
                        title=f'{listed} ASINs on the Brand List, {active_asins} actually selling',
                        detail=f'{t["sellingSkus"]} of {t["skuCount"]} SKUs moved a unit in the window.',
                        action="Work out whether the dormant ASINs are suppressed, out of stock or not worth "
                               "relisting, and close the gap in one pass."))

    dead = [s for s in brand_skus
            if derive(s["m"].get(period, zero()))["units"] == 0
            and (derive(s["m"].get(period, zero()))["storage"]
                 + derive(s["m"].get(period, zero()))["otherFee"]) > 10]
    if dead:
        cost = round(sum(derive(s["m"][period])["storage"] + derive(s["m"][period])["otherFee"]
                         for s in dead), 2)
        out.append(dict(sev="warning", kind="dead", impact=cost,
                        title=f'{len(dead)} SKUs sold nothing and still cost {money(cost)}',
                        detail="Storage and fees on inventory that did not move in the window.",
                        action="Remove, liquidate or relist them — each is a standing charge with no revenue."))

    if t["netSales"] > 0:
        top = max(brand_skus, key=lambda s: derive(s["m"].get(period, zero()))["netSales"])
        top_net = derive(top["m"][period])["netSales"]
        if top_net / t["netSales"] > 0.5:
            out.append(dict(sev="warning", kind="concentration", impact=0.0,
                            title=f'{pct(top_net/t["netSales"])} of the brand rides on one SKU',
                            detail=f'{top["sku"]} — {money(top_net)} of {money(t["netSales"])} net sales.',
                            action="Any change to that listing is a brand-level risk; make sure it has the best "
                                   "inventory cover and the tightest ad control."))

    # Trend: is the part-month tracking above or below the completed months?
    labels = labels or {}
    lab = lambda m: labels.get(m, m)
    full = [m for m in months[:-1]]
    if full and len(months) > 1:
        avg = sum(rollup(brand_skus, m)["netSales"] for m in full) / len(full)
        mtd = rollup(brand_skus, months[-1])["netSales"]
        if avg > 1000:
            run = mtd / avg
            if run < 0.75 or run > 1.25:
                out.append(dict(sev="warning" if run < 0.75 else "good", kind="trend", impact=0.0,
                                title=f'{lab(months[-1])} is running at {pct(run, 0)} of the monthly average',
                                detail=f'{money(mtd)} so far against a {money(avg)} average over '
                                       f'{", ".join(lab(m) for m in full)}. The part month is not annualised.',
                                action=("Find out whether it is stock, rank or ad pacing before the month closes."
                                        if run < 0.75 else
                                        "Check inventory cover holds for the rest of the month before it becomes a stockout.")))

    out.sort(key=lambda f: -(f["impact"] or f.get("at_risk", 0) / 10))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--account", required=True)
    ap.add_argument("--from", dest="d_from", required=True)
    ap.add_argument("--to", dest="d_to", required=True)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    skus, acct, brand_list, alloc, months = compute(args.account, args.d_from, args.d_to)
    campaign = load(DATA / f"{args.account}_campaign_spend.json")
    bcols = {c: i for i, c in enumerate(brand_list["columns"])}

    # --- periods ---
    periods = []
    for ym in months:
        y, mo = int(ym[:4]), int(ym[5:])
        last = calendar.monthrange(y, mo)[1]
        start = f"{ym}-01"
        end = f"{ym}-{last:02d}"
        partial = end > args.d_to or start < args.d_from
        if end > args.d_to:
            end = args.d_to
        if start < args.d_from:
            start = args.d_from
        label = dt.date(y, mo, 1).strftime("%b")
        periods.append({"key": ym, "label": label + (" MTD" if partial else ""),
                        "from": start, "to": end, "partial": partial,
                        "days": (dt.date.fromisoformat(end) - dt.date.fromisoformat(start)).days + 1})
    periods.append({"key": TOTAL, "label": "All four", "from": args.d_from, "to": args.d_to,
                    "partial": False,
                    "days": (dt.date.fromisoformat(args.d_to) - dt.date.fromisoformat(args.d_from)).days + 1})

    labels = {p["key"]: p["label"] for p in periods}

    # --- brand list, joined to the P&L ---
    by_brand = {}
    for s in skus:
        by_brand.setdefault(s["brand"], []).append(s)

    camp_by_brand = {}
    for ym, token, typ, cost, sales in campaign["rows"]:
        b = campaign["tokenToBrand"].get(token, token)
        d = camp_by_brand.setdefault(b, {})
        for k in (ym, TOTAL):
            e = d.setdefault(k, {"cost": 0.0, "sales": 0.0})
            e["cost"] = round(e["cost"] + cost, 2)
            e["sales"] = round(e["sales"] + sales, 2)

    brands, recos = [], []
    listed_names = set()
    for r in brand_list["rows"]:
        name = r[bcols["brand"]]
        listed_names.add(name)
        meta = {c: r[bcols[c]] for c in ("registry", "resellerType", "numAsins", "ownedBy",
                                         "assignee", "status", "priority")}
        bs = by_brand.get(name, [])
        brands.append({
            "brand": name, "onList": True, "focus": bool(r[bcols["focus"]]), **meta,
            "skuCount": len(bs), "skus": [s["sku"] for s in bs],
            "campaign": camp_by_brand.get(name, {}),
        })
        if r[bcols["focus"]]:
            recos.append({
                "brand": name,
                "brandFindings": brand_findings(name, meta, bs, months, labels),
                "skuFindings": sku_findings(bs, TOTAL),
            })
    for name, bs in sorted(by_brand.items()):
        if name in listed_names:
            continue
        brands.append({"brand": name, "onList": False, "focus": False,
                       "registry": "", "resellerType": "", "numAsins": "", "ownedBy": "",
                       "assignee": "", "status": "", "priority": "",
                       "skuCount": len(bs), "skus": [s["sku"] for s in bs],
                       "campaign": camp_by_brand.get(name, {})})

    total = rollup(skus, TOTAL)
    report = {
        "meta": {
            "account": args.account, "accountName": acct.get("account_name", args.account),
            "accountId": acct.get("account_id"), "from": args.d_from, "to": args.d_to,
            "generated": dt.date.today().isoformat(), "skuCount": len(skus),
            "totalKey": TOTAL, "months": months,
            "focusBrands": [b["brand"] for b in brands if b["focus"]],
        },
        "metrics": METRICS,
        "periods": periods,
        "accountCosts": acct["months"],
        "alloc": alloc,
        "brands": brands,
        "campaign": campaign,
        "skus": skus,
        "recos": recos,
        "coverage": {
            "withCost": sum(1 for s in skus if s["hasCost"]),
            "noCost": sum(1 for s in skus if not s["hasCost"]),
            "noCostSales": total["noCostSales"],
        },
    }

    tpl = (HERE / "report_template.html").read_text()
    html = (tpl.replace("{{ACCOUNT}}", args.account)
               .replace("/*__REPORT_JSON__*/null", json.dumps(report, separators=(",", ":"))))
    out = args.out or str(HERE / f"{args.account.lower()}-brand-profit-analysis.html")
    pathlib.Path(out).write_text(html)

    print(f'{args.account} {args.d_from}..{args.d_to}  {len(skus)} SKUs, {len(brands)} brands, '
          f'{len(recos)} focus brands')
    for p in periods:
        t = rollup(skus, p["key"])
        print(f'  {p["label"]:>9} {p["from"]}..{p["to"]}  net {t["netSales"]:>12,.0f}  '
              f'profit {t["netProfit"]:>11,.0f}  margin {t["margin"]*100:>6.1f}%  '
              f'ads {t["ads"]:>9,.0f}  TACOS {t["tacos"]*100:>5.1f}%')
    print(f'  cost coverage {report["coverage"]["withCost"]}/{len(skus)} SKUs · '
          f'{report["coverage"]["noCostSales"]:,.0f} net sales with no cost')
    print(f'  wrote {out}  ({pathlib.Path(out).stat().st_size/1e6:.1f} MB)')


if __name__ == "__main__":
    main()
