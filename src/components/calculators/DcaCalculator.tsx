import { useId, useState } from 'react';
import {
  calculateDca,
  parseNumberInput,
  type DcaInput,
  type DcaResult,
} from '../../lib/calculators';
import { formatCurrency } from '../../lib/format';
import NumberField from './NumberField';
import ResultBreakdown from './ResultBreakdown';

const DEFAULTS = {
  monthlyAmount: '3000',
  annualRate: '6',
  years: '10',
  timing: 'end' as const,
};

interface InputErrors {
  monthlyAmount?: string;
  annualRate?: string;
  years?: string;
}

export default function DcaCalculator() {
  const uid = useId();
  const ids = {
    monthlyAmount: `${uid}-monthly`,
    annualRate: `${uid}-rate`,
    years: `${uid}-years`,
    timing: `${uid}-timing`,
  };

  const [monthlyAmount, setMonthlyAmount] = useState(DEFAULTS.monthlyAmount);
  const [annualRate, setAnnualRate] = useState(DEFAULTS.annualRate);
  const [years, setYears] = useState(DEFAULTS.years);
  const [timing, setTiming] = useState<'begin' | 'end'>(DEFAULTS.timing);

  const monthlyValue = parseNumberInput(monthlyAmount);
  const rateValue = parseNumberInput(annualRate);
  const yearsValue = parseNumberInput(years);

  const errors: InputErrors = {};
  if (Number.isNaN(monthlyValue) || monthlyValue <= 0) {
    errors.monthlyAmount = '每月定投金额需为大于 0 的数字。';
  } else if (monthlyValue > 10_000_000) {
    errors.monthlyAmount = '演示上限为每月 1,000 万元。';
  }

  if (Number.isNaN(rateValue)) {
    errors.annualRate = '请输入年化收益率。';
  } else if (rateValue < -50 || rateValue > 50) {
    errors.annualRate = '年化收益率请设在 -50% 到 50% 之间。';
  }

  if (Number.isNaN(yearsValue) || !Number.isInteger(yearsValue)) {
    errors.years = '定投年限需为整数。';
  } else if (yearsValue < 1 || yearsValue > 50) {
    errors.years = '定投年限请设在 1 到 50 年之间。';
  }

  const isValid = Object.keys(errors).length === 0;
  const result: DcaResult | null = isValid
    ? calculateDca({
        monthlyAmount: monthlyValue,
        annualRatePct: rateValue,
        years: yearsValue,
        timing,
      } satisfies DcaInput)
    : null;

  function reset() {
    setMonthlyAmount(DEFAULTS.monthlyAmount);
    setAnnualRate(DEFAULTS.annualRate);
    setYears(DEFAULTS.years);
    setTiming(DEFAULTS.timing);
  }

  return (
    <section aria-labelledby={`${uid}-title`}>
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 id={`${uid}-title`} className="font-serif text-2xl text-ink sm:text-3xl">
            定投计算器
          </h3>
          <span className="font-mono text-[0.62rem] tracking-widest text-muted">
            MONTHLY DCA / 02
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          模拟每月固定金额投入、按固定年化收益率复利后的期末总额。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-line bg-paper-soft p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              id={ids.monthlyAmount}
              label="每月定投"
              value={monthlyAmount}
              onChange={setMonthlyAmount}
              unit="元"
              min={0}
              max={10_000_000}
              step={100}
              error={errors.monthlyAmount}
              hint="每月固定投入"
            />
            <NumberField
              id={ids.annualRate}
              label="年化收益率"
              value={annualRate}
              onChange={setAnnualRate}
              unit="%"
              min={-50}
              max={50}
              step={0.1}
              error={errors.annualRate}
              hint="-50%–50%"
            />
            <NumberField
              id={ids.years}
              label="定投年限"
              value={years}
              onChange={setYears}
              unit="年"
              min={1}
              max={50}
              step={1}
              error={errors.years}
              hint="1–50 年"
            />
            <fieldset>
              <legend className="mb-2 text-xs font-semibold tracking-wide text-ink">
                投入时点
              </legend>
              <div className="grid grid-cols-2 border border-line-dark" id={ids.timing}>
                <label className={`cursor-pointer border-r border-line-dark px-3 py-3 text-center text-xs transition-colors ${timing === 'end' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}>
                  <input
                    type="radio"
                    name={`${uid}-timing`}
                    value="end"
                    checked={timing === 'end'}
                    onChange={() => setTiming('end')}
                    className="sr-only"
                  />
                  月末投入
                </label>
                <label className={`cursor-pointer px-3 py-3 text-center text-xs transition-colors ${timing === 'begin' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}>
                  <input
                    type="radio"
                    name={`${uid}-timing`}
                    value="begin"
                    checked={timing === 'begin'}
                    onChange={() => setTiming('begin')}
                    className="sr-only"
                  />
                  月初投入
                </label>
              </div>
            </fieldset>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-[0.68rem] leading-5 text-muted">
              公式：PMT × [((1+i)<sup>n</sup> − 1) / i]
            </p>
            <button type="button" onClick={reset} className="btn btn-outline min-h-0 px-4 py-2.5 text-xs">
              恢复示例参数
            </button>
          </div>
        </div>

        <div className="flex flex-col border border-line">
          <div className="bg-ink p-6 text-paper sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="rule-label text-paper/45">Estimated result / 测算结果</p>
              <span className="border border-paper/20 px-2 py-0.5 font-mono text-[0.55rem] tracking-widest text-paper/50">
                DEMO
              </span>
            </div>
            <p className="mt-5 text-xs text-paper/55">期末总额</p>
            <p
              className="mt-1 break-words font-serif text-[2.2rem] font-semibold leading-tight tabular-nums text-paper sm:text-[2.65rem]"
              aria-live="polite"
              aria-atomic="true"
            >
              {result ? formatCurrency(result.futureValue) : '—'}
            </p>
            <p className="mt-2 text-[0.7rem] text-paper/45">
              {result
                ? `${result.months} 个月 · ${timing === 'begin' ? '月初' : '月末'}投入`
                : '请修正左侧参数后查看结果'}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
              <div>
                <dt className="text-[0.64rem] text-paper/45">累计投入</dt>
                <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-paper">
                  {result ? formatCurrency(result.totalContributions) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[0.64rem] text-paper/45">预计收益</dt>
                <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-paper">
                  {result ? formatCurrency(result.totalGain) : '—'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex-1 bg-paper-soft p-5">
            {result ? (
              <ResultBreakdown
                principalLabel="累计投入"
                principal={result.totalContributions}
                gainLabel="预计收益"
                gain={result.totalGain}
              />
            ) : (
              <p className="text-xs leading-6 text-muted">
                结果会随输入实时更新。模型假设每月固定投入、按月复利，且收益率保持不变。
              </p>
            )}
            <p className="mt-4 border-t border-line pt-4 text-[0.65rem] leading-5 text-muted">
              仅为演示，不构成投资建议。未扣除手续费、税费与跟踪误差，实际定投收益可能显著不同。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
