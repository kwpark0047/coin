import type { ClassBreakdown } from './aggregatePortfolio';
import type { PortfolioHolding } from './portfolioModel';

export type AlertFieldId =
  | 'usd_krw_rate'
  | 'btc_price_krw'
  | 'portfolio_value'
  | 'btc_ratio'
  | 'daily_pnl'
  | 'fear_greed_index'
  | 'korean_asset_value'
  | 'us_asset_value'
  | 'crypto_asset_value';

export interface AlertFieldMeta {
  id: AlertFieldId;
  label: string;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
}

export const ALERT_FIELDS: AlertFieldMeta[] = [
  { id: 'usd_krw_rate', label: '원/달러 환율', unit: 'KRW', min: 1000, max: 2000, step: 1 },
  { id: 'btc_price_krw', label: 'BTC 가격 (KRW)', unit: 'KRW', min: 0, step: 100000 },
  { id: 'portfolio_value', label: '포트폴리오 총가치', unit: 'KRW', min: 0, step: 100000 },
  { id: 'btc_ratio', label: 'BTC 비중', unit: '%', min: 0, max: 100, step: 1 },
  { id: 'daily_pnl', label: '일간 손익', unit: 'KRW', step: 10000 },
  { id: 'fear_greed_index', label: '공포탐욕 지수', unit: '점', min: 0, max: 100, step: 1 },
  { id: 'korean_asset_value', label: '국내 자산 가치', unit: 'KRW', min: 0, step: 100000 },
  { id: 'us_asset_value', label: '미국 자산 가치', unit: 'KRW', min: 0, step: 100000 },
  { id: 'crypto_asset_value', label: '암호화폐 자산 가치', unit: 'KRW', min: 0, step: 100000 },
];

export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

export const OPERATOR_LABELS: Record<AlertOperator, string> = {
  gt: '> (초과)',
  gte: '>= (이상)',
  lt: '< (미만)',
  lte: '<= (이하)',
  eq: '= (같음)',
};

export type LogicOperator = 'AND' | 'OR';

export interface AlertCondition {
  fieldId: AlertFieldId;
  operator: AlertOperator;
  value: number;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: AlertCondition[];
  logicOperator: LogicOperator;
  message: string;
  cooldownMinutes: number;
  lastTriggeredAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface AlertSnapshot {
  usd_krw_rate: number;
  btc_price_krw: number;
  portfolio_value: number;
  btc_ratio: number;
  daily_pnl: number;
  fear_greed_index: number;
  korean_asset_value: number;
  us_asset_value: number;
  crypto_asset_value: number;
}

const STORAGE_KEY = 'wemarket-alert-rules';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultRule(): AlertRule {
  return {
    id: generateId(),
    name: '',
    enabled: true,
    conditions: [{ fieldId: 'usd_krw_rate', operator: 'gte', value: 1350 }],
    logicOperator: 'AND',
    message: '조건이 충족되었습니다.',
    cooldownMinutes: 60,
    lastTriggeredAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function loadRules(): AlertRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) { console.warn('Failed to load alert rules:', err); }
  return [];
}

export function saveRules(rules: AlertRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function addRule(rule: AlertRule): AlertRule[] {
  const rules = loadRules();
  rules.push(rule);
  saveRules(rules);
  return rules;
}

export function updateRule(updated: AlertRule): AlertRule[] {
  const rules = loadRules().map((r) => (r.id === updated.id ? updated : r));
  saveRules(rules);
  return rules;
}

export function deleteRule(id: string): AlertRule[] {
  const rules = loadRules().filter((r) => r.id !== id);
  saveRules(rules);
  return rules;
}

export function toggleRule(id: string): AlertRule[] {
  const rules = loadRules().map((r) =>
    r.id === id ? { ...r, enabled: !r.enabled, updatedAt: Date.now() } : r,
  );
  saveRules(rules);
  return rules;
}

export function buildSnapshot(
  classBreakdown: ClassBreakdown[],
  holdings: PortfolioHolding[],
  totalValueKRW: number,
  exchangeRate: number,
  btcRatio: number,
  dailyPnL: number,
): AlertSnapshot {
  const classMap = new Map(classBreakdown.map((b) => [b.assetClass, b.valueKRW]));
  const btcHolding = holdings.find((h) => h.symbol === 'BTC');
  const btcPriceKRW = btcHolding ? btcHolding.priceKRW : exchangeRate * 65000;

  return {
    usd_krw_rate: exchangeRate,
    btc_price_krw: btcPriceKRW,
    portfolio_value: totalValueKRW,
    btc_ratio: btcRatio,
    daily_pnl: dailyPnL,
    fear_greed_index: 45,
    korean_asset_value: classMap.get('korean') ?? 0,
    us_asset_value: classMap.get('us') ?? 0,
    crypto_asset_value: classMap.get('crypto') ?? 0,
  };
}

export function evaluateCondition(
  condition: AlertCondition,
  snapshot: AlertSnapshot,
): boolean {
  const current = snapshot[condition.fieldId];
  switch (condition.operator) {
    case 'gt':
      return current > condition.value;
    case 'gte':
      return current >= condition.value;
    case 'lt':
      return current < condition.value;
    case 'lte':
      return current <= condition.value;
    case 'eq':
      return Math.abs(current - condition.value) < 0.01;
  }
}

export function evaluateRule(
  rule: AlertRule,
  snapshot: AlertSnapshot,
): boolean {
  if (rule.conditions.length === 0) return false;
  if (rule.logicOperator === 'AND') {
    return rule.conditions.every((c) => evaluateCondition(c, snapshot));
  }
  return rule.conditions.some((c) => evaluateCondition(c, snapshot));
}
