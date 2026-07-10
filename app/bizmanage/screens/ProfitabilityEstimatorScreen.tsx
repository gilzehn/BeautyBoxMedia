'use client';

import { useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { ProfitabilityResult, estimateProfitability } from '@/lib/aiTools';
import { AiBadge, CopyButton, ScreenHead, formatMoney } from './shared';

interface Field {
  key: keyof Inputs;
  label: string;
  placeholder: string;
}

interface Inputs {
  unitPrice: string;
  cogs: string;
  amazonFeePct: string;
  fulfillmentCost: string;
  adSpendPerUnit: string;
  monthlyUnits: string;
}

const FIELDS: Field[] = [
  { key: 'unitPrice', label: 'Unit price ($)', placeholder: '29.99' },
  { key: 'cogs', label: 'COGS per unit ($)', placeholder: '7.50' },
  { key: 'amazonFeePct', label: 'Amazon referral fee (%)', placeholder: '15' },
  { key: 'fulfillmentCost', label: 'Fulfillment per unit ($)', placeholder: '5.20' },
  { key: 'adSpendPerUnit', label: 'Ad spend per unit ($)', placeholder: '4.00' },
  { key: 'monthlyUnits', label: 'Units per month', placeholder: '800' },
];

const pct = (n: number) => `${n.toFixed(1)}%`;

export default function ProfitabilityEstimatorScreen() {
  const [inputs, setInputs] = useState<Inputs>({
    unitPrice: '',
    cogs: '',
    amazonFeePct: '15',
    fulfillmentCost: '',
    adSpendPerUnit: '',
    monthlyUnits: '',
  });
  const [result, setResult] = useState<ProfitabilityResult | null>(null);

  const handleGenerate = (e: FormEvent) => {
    e.preventDefault();
    setResult(
      estimateProfitability({
        unitPrice: Number(inputs.unitPrice) || 0,
        cogs: Number(inputs.cogs) || 0,
        amazonFeePct: Number(inputs.amazonFeePct) || 0,
        fulfillmentCost: Number(inputs.fulfillmentCost) || 0,
        adSpendPerUnit: Number(inputs.adSpendPerUnit) || 0,
        monthlyUnits: Number(inputs.monthlyUnits) || 0,
      })
    );
  };

  const plainText = result
    ? [
        'Profitability estimate',
        `Referral fee per unit: ${formatMoney(result.referralFee)}`,
        `Unit margin before ads: ${formatMoney(result.unitMarginPreAd)} (${pct(result.marginPctPreAd)})`,
        `Unit margin after ads: ${formatMoney(result.unitMarginPostAd)} (${pct(result.marginPctPostAd)})`,
        `Break-even ACOS: ${pct(result.breakEvenAcosPct)}`,
        '',
        'Monthly P&L',
        `Revenue: ${formatMoney(result.monthly.revenue)}`,
        `COGS: ${formatMoney(result.monthly.cogs)}`,
        `Amazon fees: ${formatMoney(result.monthly.fees)}`,
        `Fulfillment: ${formatMoney(result.monthly.fulfillment)}`,
        `Ad spend: ${formatMoney(result.monthly.adSpend)}`,
        `Profit: ${formatMoney(result.monthly.profit)}`,
        '',
        ...result.commentary,
      ].join('\n')
    : '';

  return (
    <>
      <ScreenHead
        title="Profitability Estimator"
        badge={<AiBadge label="AI insights" />}
        meta="Unit economics and break-even ACOS for a product"
      />

      <form className={styles.formCard} onSubmit={handleGenerate}>
        <div className={styles.formGrid3}>
          {FIELDS.map((f) => (
            <label key={f.key} className={styles.field}>
              <span className={styles.label}>{f.label}</span>
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={inputs[f.key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                required
              />
            </label>
          ))}
        </div>
        <button type="submit" className="btn btn-primary">
          Estimate
        </button>
      </form>

      {result && (
        <div className={styles.outputWrap}>
          <div className={styles.outputHead}>
            <h3 className={styles.outputTitle}>Estimate</h3>
            <CopyButton text={plainText} label="Copy estimate" />
          </div>
          <div className={styles.outputGrid}>
            <div className={styles.outputCard}>
              <div className={styles.outputCardTitle}>Unit economics</div>
              <div className={styles.statRow}>
                <span>Referral fee</span>
                <span>{formatMoney(result.referralFee)}</span>
              </div>
              <div className={styles.statRow}>
                <span>Margin before ads</span>
                <span>
                  {formatMoney(result.unitMarginPreAd)} · {pct(result.marginPctPreAd)}
                </span>
              </div>
              <div className={styles.statRow}>
                <span>Margin after ads</span>
                <span className={result.unitMarginPostAd >= 0 ? styles.moneyPositive : styles.moneyNegative}>
                  {formatMoney(result.unitMarginPostAd)} · {pct(result.marginPctPostAd)}
                </span>
              </div>
              <div className={styles.statRow}>
                <span>Break-even ACOS</span>
                <span>{pct(result.breakEvenAcosPct)}</span>
              </div>
            </div>

            <div className={styles.outputCard}>
              <div className={styles.outputCardTitle}>Monthly P&amp;L</div>
              <div className={styles.statRow}>
                <span>Revenue</span>
                <span>{formatMoney(result.monthly.revenue)}</span>
              </div>
              <div className={styles.statRow}>
                <span>COGS</span>
                <span>{formatMoney(result.monthly.cogs)}</span>
              </div>
              <div className={styles.statRow}>
                <span>Amazon fees</span>
                <span>{formatMoney(result.monthly.fees)}</span>
              </div>
              <div className={styles.statRow}>
                <span>Fulfillment</span>
                <span>{formatMoney(result.monthly.fulfillment)}</span>
              </div>
              <div className={styles.statRow}>
                <span>Ad spend</span>
                <span>{formatMoney(result.monthly.adSpend)}</span>
              </div>
              <div className={`${styles.statRow} ${styles.statRowStrong}`}>
                <span>Profit</span>
                <span className={result.monthly.profit >= 0 ? styles.moneyPositive : styles.moneyNegative}>
                  {formatMoney(result.monthly.profit)}
                </span>
              </div>
            </div>

            <div className={styles.outputCard}>
              <div className={styles.outputCardTitle}>Commentary</div>
              <ul className={styles.outputList}>
                {result.commentary.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
