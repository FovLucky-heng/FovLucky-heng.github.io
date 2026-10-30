/** 纯函数计算器，便于独立验证；不访问网络或浏览器 API。 */

/** 空字符串、非数字与 Infinity 都返回 NaN，交由界面统一提示。 */
export function parseNumberInput(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export interface CompoundInput {
  principal: number;
  annualRatePct: number;
  years: number;
  frequency: number;
}

export interface CompoundResult {
  futureValue: number;
  totalInterest: number;
  effectiveAnnualRatePct: number;
  periods: number;
}

export interface DcaInput {
  monthlyAmount: number;
  annualRatePct: number;
  years: number;
  timing: 'begin' | 'end';
}

export interface DcaResult {
  futureValue: number;
  totalContributions: number;
  totalGain: number;
  months: number;
}

/**
 * 复利终值：
 * FV = P × (1 + r/m)^(m×t)
 * 其中 r 为年利率，m 为每年复利次数，t 为年数。
 */
export function calculateCompound(input: CompoundInput): CompoundResult {
  const periodicRate = input.annualRatePct / 100 / input.frequency;
  const periods = input.years * input.frequency;
  const growth = Math.pow(1 + periodicRate, periods);
  const futureValue = input.principal * growth;

  return {
    futureValue,
    totalInterest: futureValue - input.principal,
    effectiveAnnualRatePct: (Math.pow(1 + periodicRate, input.frequency) - 1) * 100,
    periods,
  };
}

/**
 * 定投终值（月末投入）：
 * FV = PMT × ((1+i)^n − 1) / i
 * 月初投入时，在月末年金基础上再乘以 (1+i)。
 * i 为月利率，n 为总月数。
 */
export function calculateDca(input: DcaInput): DcaResult {
  const monthlyRate = input.annualRatePct / 100 / 12;
  const months = Math.round(input.years * 12);
  const totalContributions = input.monthlyAmount * months;

  let futureValue: number;
  if (Math.abs(monthlyRate) < 1e-12) {
    futureValue = totalContributions;
  } else {
    const annuityFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    futureValue =
      input.monthlyAmount *
      annuityFactor *
      (input.timing === 'begin' ? 1 + monthlyRate : 1);
  }

  return {
    futureValue,
    totalContributions,
    totalGain: futureValue - totalContributions,
    months,
  };
}
