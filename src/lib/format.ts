const LONG_DATE = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

const SHORT_NUMBER = new Intl.NumberFormat('zh-CN');

const CURRENCY = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
});

const PERCENT = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 统一用 UTC 渲染日期，避免构建机器时区导致日期漂移。 */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return LONG_DATE.format(date);
}

/** 卡片与档案使用的固定点分格式，例如 2026.10.18。 */
export function formatDateShort(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export function formatInteger(value: number): string {
  return SHORT_NUMBER.format(Math.round(value));
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return CURRENCY.format(value);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${PERCENT.format(value)}%`;
}
