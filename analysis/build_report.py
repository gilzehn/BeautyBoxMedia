#!/usr/bin/env python3
"""Build the Brand Profit Analysis HTML report for one Amazon account.

Inputs (all under analysis/data/, one set per account + window):
  <ACCOUNT>_<FROM>_<TO>_bq.json   SKU activity from BigQuery  (analysis/sku_profit_pl.sql)
  <ACCOUNT>_cogs_supabase.json    landed cost from Supabase   (analysis/cogs.sql)
  <ACCOUNT>_account_costs.json    account-level settlement lines (analysis/account_costs.sql)

Output:
  analysis/<account>-brand-profit-analysis.html   self-contained, no network calls

Usage:
  python3 analysis/build_report.py --account NRG --from 2026-05-01 --to 2026-07-31
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "data"

# Thresholds that turn a number into a finding. Tuned for a mixed FBA
# reseller portfolio; override per account if the category demands it.
TARGET_REFUND_RATE = 0.05      # units refunded / units ordered
TARGET_FEE_RATIO = 0.40        # referral + FBA / net sales
TARGET_PROMO_RATIO = 0.05      # promotional rebates / gross sales
MIN_BUY_BOX = 0.85
MIN_SESSIONS_FOR_BB = 300
MATERIAL = 50.0                # ignore findings worth less than this


def load(path: pathlib.Path):
    with open(path) as fh:
        return json.load(fh)


def compute(account: str, d_from: str, d_to: str):
    bq = load(DATA / f"{account}_{d_from}_{d_to}_bq.json")
    cogs_raw = load(DATA / f"{account}_cogs_supabase.json")
    acct = load(DATA / f"{account}_account_costs.json")

    bcol = {c: i for i, c in enumerate(bq["columns"])}
    ccol = {c: i for i, c in enumerate(cogs_raw["columns"])}

    # --- landed cost per SKU (Supabase is the only source of truth for cost)
    cost_by_sku, cost_by_asin = {}, {}
    for r in cogs_raw["rows"]:
        landed = (r[ccol["purchase_cost"]] or 0) + (r[ccol["prep_cost"]] or 0) + (r[ccol["inbound_cost"]] or 0)
        rec = {
            "landed": round(landed, 4),
            "purchase": r[ccol["purchase_cost"]] or 0,
            "brand": (r[ccol["brand"]] or "").strip(),
            "group": (r[ccol["product_group"]] or "").strip(),
            "has_cost": (r[ccol["purchase_cost"]] or 0) > 0,
        }
        cost_by_sku[r[ccol["sku"]]] = rec
        asin = (r[ccol["asin"]] or "").strip()
        # An ASIN-level fallback lets a re-listed SKU inherit its product's cost.
        if asin and rec["has_cost"] and asin not in cost_by_asin:
            cost_by_asin[asin] = rec

    rows = bq["rows"]
    g = lambda r, c: r[bcol[c]]

    # --- allocation weights ---------------------------------------------------
    ad_report_total = sum(g(r, "ad_spend") for r in rows)
    storage_report_total = sum(g(r, "storage") for r in rows)
    units_total = sum(g(r, "units") for r in rows) or 1
    ad_factor = (acct["advertising"] / ad_report_total) if ad_report_total else 0.0
    storage_factor = (acct["storage"] / storage_report_total) if storage_report_total else 0.0
    inbound_pool = acct["inbound_logistics"]
    overhead_pool = (acct["removals_disposal"] + acct["returns_processing"]
                     + acct["subscription"] + acct["other_adjustments"])

    # Pass 1 — everything that does not depend on portfolio totals.
    skus = []
    for r in rows:
        sku = g(r, "sku")
        asin = g(r, "asin")
        c = cost_by_sku.get(sku) or cost_by_asin.get(asin) or {}
        brand = (c.get("brand") or g(r, "bq_brand") or "").strip() or "Unassigned"
        group = (c.get("group") or "").strip() or "Unassigned"
        units = g(r, "units")
        gross = g(r, "gross")
        promo = g(r, "promo")
        refunds = g(r, "refund_amt")
        ret_units = g(r, "ret_units")
        ret_sellable = g(r, "ret_sellable")
        landed = c.get("landed", 0.0) if c.get("has_cost") else 0.0
        # Units whose cost is actually consumed: shipped less what came back sellable.
        cogs_units = max(units - ret_sellable, 0)
        s = {
            "sku": sku, "asin": asin, "name": g(r, "name"), "brand": brand, "group": group,
            "tier": g(r, "size_tier"), "status": g(r, "listing_status"), "fc": g(r, "fulfillment_channel"),
            "price": g(r, "price"), "onHand": g(r, "on_hand"),
            "units": units, "gross": gross, "promo": promo, "refunds": refunds,
            "retUnits": ret_units, "retSellable": ret_sellable,
            "referral": g(r, "referral"), "fba": g(r, "fba_fee"), "otherFee": g(r, "other_fee"),
            "reimb": g(r, "reimb"),
            "storage": round(g(r, "storage") * storage_factor, 2),
            "ads": round(g(r, "ad_spend") * ad_factor, 2),
            "adSales": round(g(r, "ad_sales") * ad_factor, 2),
            "sessions": g(r, "sessions"), "bb": g(r, "buy_box"),
            "landed": landed, "hasCost": bool(c.get("has_cost")),
            "cogs": round(landed * cogs_units, 2),
            "netSales": round(gross - promo - refunds, 2),
        }
        skus.append(s)

    net_sales_total = sum(s["netSales"] for s in skus) or 1
    positive_net = sum(max(s["netSales"], 0) for s in skus) or 1

    # Pass 2 — allocate the account-level pools.
    for s in skus:
        s["inbound"] = round(inbound_pool * (s["units"] / units_total), 2)
        s["overhead"] = round(overhead_pool * (max(s["netSales"], 0) / positive_net), 2)
        s["amazonFees"] = round(s["referral"] + s["fba"] + s["otherFee"] + s["storage"] + s["inbound"], 2)
        s["contrib"] = round(s["netSales"] + s["reimb"] - s["amazonFees"] - s["ads"] - s["cogs"], 2)
        s["netProfit"] = round(s["contrib"] - s["overhead"], 2)
        s["margin"] = round(s["netProfit"] / s["netSales"], 4) if s["netSales"] else 0.0
        s["tacos"] = round(s["ads"] / s["netSales"], 4) if s["netSales"] > 0 else 0.0
        s["acos"] = round(s["ads"] / s["adSales"], 4) if s["adSales"] > 0 else 0.0
        s["refundRate"] = round(s["retUnits"] / s["units"], 4) if s["units"] else 0.0
        s["feeRatio"] = round((s["referral"] + s["fba"]) / s["netSales"], 4) if s["netSales"] > 0 else 0.0
        s["promoRatio"] = round(s["promo"] / s["gross"], 4) if s["gross"] > 0 else 0.0
        # Profit per unit before advertising — the ceiling on what a click may cost.
        s["cmBeforeAds"] = round(s["netSales"] + s["reimb"] - s["amazonFees"] - s["cogs"], 2)
        s["beAcos"] = round(s["cmBeforeAds"] / s["netSales"], 4) if s["netSales"] > 0 else 0.0
        s["adShare"] = round(s["adSales"] / s["netSales"], 4) if s["netSales"] > 0 else 0.0

    return skus, acct, bq, {
        "ad_factor": ad_factor, "storage_factor": storage_factor,
        "ad_report_total": ad_report_total, "storage_report_total": storage_report_total,
        "inbound_pool": inbound_pool, "overhead_pool": overhead_pool,
    }


def rollup(items):
    """Sum the money columns of a list of SKU records into one node."""
    keys = ["units", "gross", "promo", "refunds", "retUnits", "retSellable", "referral", "fba",
            "otherFee", "reimb", "storage", "inbound", "ads", "adSales", "cogs", "overhead",
            "amazonFees", "netSales", "contrib", "netProfit", "sessions", "cmBeforeAds"]
    n = {k: round(sum(s[k] for s in items), 2) for k in keys}
    n["skuCount"] = len(items)
    n["noCostSales"] = round(sum(s["netSales"] for s in items if not s["hasCost"]), 2)
    n["margin"] = round(n["netProfit"] / n["netSales"], 4) if n["netSales"] else 0.0
    n["tacos"] = round(n["ads"] / n["netSales"], 4) if n["netSales"] > 0 else 0.0
    n["acos"] = round(n["ads"] / n["adSales"], 4) if n["adSales"] > 0 else 0.0
    n["refundRate"] = round(n["retUnits"] / n["units"], 4) if n["units"] else 0.0
    n["feeRatio"] = round((n["referral"] + n["fba"]) / n["netSales"], 4) if n["netSales"] > 0 else 0.0
    n["adShare"] = round(n["adSales"] / n["netSales"], 4) if n["netSales"] > 0 else 0.0
    n["beAcos"] = round(n["cmBeforeAds"] / n["netSales"], 4) if n["netSales"] > 0 else 0.0
    return n


def find_issues(skus, totals):
    """Rank every leak we can put a dollar figure on. Categories overlap by
    design (a loss-making SKU is usually also an ads or a refund problem), so
    the pool is a gross opportunity, not a sum of independent wins."""
    out = []
    brand_margin = totals["margin"]

    for s in skus:
        tag = f'{s["brand"]} · {s["sku"]}'

        if s["netSales"] > 0 and s["netProfit"] < 0 and s["hasCost"]:
            out.append(dict(kind="loss", sev="critical", scope=tag, sku=s["sku"], brand=s["brand"],
                            impact=round(-s["netProfit"], 2),
                            title="Sells at a loss",
                            detail=f'{s["units"]:,} units, {money(s["netSales"])} net sales, '
                                   f'{money(s["netProfit"])} net profit ({pct(s["margin"])}).',
                            action="Reprice or renegotiate landed cost; if neither moves, stop advertising it and run the stock down."))

        if s["ads"] > MATERIAL and s["netSales"] > 0:
            allowed = s["adSales"] * max(s["beAcos"], 0)
            waste = round(s["ads"] - allowed, 2)
            if waste > MATERIAL:
                out.append(dict(kind="ads", sev="serious", scope=tag, sku=s["sku"], brand=s["brand"],
                                impact=waste,
                                title="Ad spend above break-even",
                                detail=f'{money(s["ads"])} spent for {money(s["adSales"])} attributed sales '
                                       f'(ACOS {pct(s["acos"])} vs break-even {pct(s["beAcos"])}).',
                                action="Cut bids to the break-even ACOS, negative out the converting-but-unprofitable terms, and re-check in 14 days."))

        if s["units"] >= 20 and s["refundRate"] > TARGET_REFUND_RATE and s["netSales"] > 0:
            excess_units = (s["refundRate"] - TARGET_REFUND_RATE) * s["units"]
            per_unit_cm = s["contrib"] / s["units"] if s["units"] else 0
            impact = round(excess_units * max(per_unit_cm, 0) + excess_units * s["landed"] *
                           (1 - (s["retSellable"] / s["retUnits"] if s["retUnits"] else 1)), 2)
            if impact > MATERIAL:
                out.append(dict(kind="refunds", sev="serious", scope=tag, sku=s["sku"], brand=s["brand"],
                                impact=impact,
                                title=f'Refund rate {pct(s["refundRate"])}',
                                detail=f'{s["retUnits"]:,} of {s["units"]:,} units came back, '
                                       f'{s["retUnits"] - s["retSellable"]:,} of them unsellable. '
                                       f'{money(s["refunds"])} refunded.',
                                action="Pull the return reasons for this ASIN, fix the listing claim or the packaging behind them, and re-measure after 30 days."))

        if s["units"] == 0 and (s["storage"] + s["otherFee"] + s["overhead"]) > MATERIAL:
            out.append(dict(kind="dead", sev="warning", scope=tag, sku=s["sku"], brand=s["brand"],
                            impact=round(s["storage"] + s["otherFee"], 2),
                            title="No sales, still costing money",
                            detail=f'Zero units sold in the window, {money(s["storage"] + s["otherFee"])} of storage and fees, '
                                   f'{s["onHand"]:,} units on hand.',
                            action="Liquidate, remove, or relist with a working offer — the inventory is only accruing storage."))

        if s["netSales"] > 1000 and s["feeRatio"] > TARGET_FEE_RATIO:
            impact = round((s["feeRatio"] - TARGET_FEE_RATIO) * s["netSales"], 2)
            if impact > MATERIAL:
                out.append(dict(kind="fees", sev="warning", scope=tag, sku=s["sku"], brand=s["brand"],
                                impact=impact,
                                title=f'Amazon fees are {pct(s["feeRatio"])} of net sales',
                                detail=f'{money(s["referral"])} referral + {money(s["fba"])} FBA on {money(s["netSales"])} '
                                       f'net sales. Size tier: {s["tier"] or "unknown"}.',
                                action="Re-measure the carton for the size tier, and check whether a multipack or a price move lifts the fee-to-price ratio."))

        if s["gross"] > 1000 and s["promoRatio"] > 0.10:
            impact = round((s["promoRatio"] - TARGET_PROMO_RATIO) * s["gross"], 2)
            if impact > MATERIAL:
                out.append(dict(kind="promo", sev="warning", scope=tag, sku=s["sku"], brand=s["brand"],
                                impact=impact,
                                title=f'Promotions give away {pct(s["promoRatio"])} of gross',
                                detail=f'{money(s["promo"])} of rebates on {money(s["gross"])} gross sales.',
                                action="Cut the coupon or deal depth on this SKU and watch unit velocity for two weeks before deciding it was load-bearing."))

        if s["retUnits"] >= 10 and s["retSellable"] / s["retUnits"] < 0.5 and s["landed"] > 0:
            impact = round((s["retUnits"] - s["retSellable"]) * s["landed"], 2)
            if impact > MATERIAL:
                out.append(dict(kind="unsellable", sev="warning", scope=tag, sku=s["sku"], brand=s["brand"],
                                impact=impact,
                                title="Returns come back unsellable",
                                detail=f'{s["retUnits"] - s["retSellable"]:,} of {s["retUnits"]:,} returned units '
                                       f'could not be resold — {money(impact)} of landed cost written off.',
                                action="Check the disposition reasons; damaged-in-transit points at packaging, defective at the supplier."))

        if s["sessions"] >= MIN_SESSIONS_FOR_BB and 0 < s["bb"] < MIN_BUY_BOX and s["netSales"] > 0:
            impact = round(s["netSales"] * (MIN_BUY_BOX - s["bb"]) * max(s["margin"], 0), 2)
            out.append(dict(kind="buybox", sev="warning", scope=tag, sku=s["sku"], brand=s["brand"],
                            impact=max(impact, 0),
                            title=f'Buy Box only {pct(s["bb"])}',
                            detail=f'{s["sessions"]:,} sessions in the window with the Buy Box held {pct(s["bb"])} of the time.',
                            action="Find who is taking the box — a competing offer, a price-parity trip, or an out-of-stock gap — and close it."))

        if not s["hasCost"] and s["netSales"] > 500:
            out.append(dict(kind="nocost", sev="critical", scope=tag, sku=s["sku"], brand=s["brand"],
                            impact=0.0, at_risk=round(s["netSales"], 2),
                            title="No landed cost on file",
                            detail=f'{money(s["netSales"])} of net sales with purchase_cost = 0 in Supabase, '
                                   f'so its profit is overstated by whatever the product actually costs.',
                            action="Add purchase_cost for this SKU in public.cogs — until then every profit number on this row is fiction."))

    out.sort(key=lambda f: (-f["impact"], -f.get("at_risk", 0), f["kind"]))
    return out


def money(v):
    return f'-${abs(v):,.0f}' if v < 0 else f'${v:,.0f}'


def pct(v):
    return f'{v * 100:.1f}%'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--account", required=True)
    ap.add_argument("--from", dest="d_from", required=True)
    ap.add_argument("--to", dest="d_to", required=True)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    skus, acct, bq, alloc = compute(args.account, args.d_from, args.d_to)
    totals = rollup(skus)
    findings = find_issues(skus, totals)

    # Brand → product group tree, biggest net sales first at every level.
    tree = []
    brands = sorted({s["brand"] for s in skus})
    for b in brands:
        b_skus = [s for s in skus if s["brand"] == b]
        groups = []
        for gname in sorted({s["group"] for s in b_skus}):
            g_skus = [s for s in b_skus if s["group"] == gname]
            groups.append({"name": gname, "totals": rollup(g_skus),
                           "skus": [s["sku"] for s in sorted(g_skus, key=lambda x: -x["netSales"])]})
        groups.sort(key=lambda g: -g["totals"]["netSales"])
        tree.append({"name": b, "totals": rollup(b_skus), "groups": groups})
    tree.sort(key=lambda b: -b["totals"]["netSales"])

    report = {
        "meta": {
            "account": args.account,
            "accountName": acct.get("account_name", args.account),
            "accountId": acct.get("account_id"),
            "from": args.d_from, "to": args.d_to,
            "generated": dt.date.today().isoformat(),
            "skuCount": len(skus),
            "days": (dt.date.fromisoformat(args.d_to) - dt.date.fromisoformat(args.d_from)).days + 1,
        },
        "totals": totals,
        "accountCosts": acct,
        "alloc": {k: round(v, 6) for k, v in alloc.items()},
        "tree": tree,
        "skus": skus,
        "findings": findings,
        "coverage": {
            "withCost": sum(1 for s in skus if s["hasCost"]),
            "noCost": sum(1 for s in skus if not s["hasCost"]),
            "noCostSales": round(sum(s["netSales"] for s in skus if not s["hasCost"]), 2),
            "noCostUnits": sum(s["units"] for s in skus if not s["hasCost"]),
        },
    }

    tpl = (HERE / "report_template.html").read_text()
    html = (tpl.replace("{{ACCOUNT}}", args.account)
               .replace("/*__REPORT_JSON__*/null", json.dumps(report, separators=(",", ":"))))
    out = args.out or str(HERE / f"{args.account.lower()}-brand-profit-analysis.html")
    pathlib.Path(out).write_text(html)

    t = totals
    print(f'{args.account} {args.d_from}..{args.d_to}  {len(skus)} SKUs, {len(tree)} brands')
    for k in ["gross", "promo", "refunds", "netSales", "referral", "fba", "otherFee", "storage",
              "inbound", "reimb", "ads", "cogs", "overhead", "contrib", "netProfit"]:
        print(f'  {k:>10}: {t[k]:>14,.2f}')
    print(f'  {"margin":>10}: {t["margin"]*100:>13.1f}%   TACOS {t["tacos"]*100:.1f}%  '
          f'refund {t["refundRate"]*100:.1f}%  fees {t["feeRatio"]*100:.1f}%')
    print(f'  cost coverage: {report["coverage"]["withCost"]}/{len(skus)} SKUs, '
          f'{report["coverage"]["noCostSales"]:,.0f} net sales with no cost')
    print(f'  findings: {len(findings)}, pool {sum(f["impact"] for f in findings):,.0f}')
    print(f'  wrote {out}')


if __name__ == "__main__":
    main()
