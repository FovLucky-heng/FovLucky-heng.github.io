import { useId, useState } from 'react';
import {
  calculateCompound,
  parseNumberInput,
  type CompoundInput,
  type CompoundResult,
} from '../../lib/calculators';
import { formatCurrency, formatPercent } from '../../lib/format';
import NumberField from './NumberField';
import ResultBreakdown from './ResultBreakdown';

const DEFAULTS = {
  principal: '100000',
  annualRate: '6',
  years: '10',
  frequency: '12',
};

const FREQUENCIES = [
  { value: '1', label: '每年复利' },
  { value: '2', label: '每半年复利' },
  { value: '4', label: '每季度复利' },
  { value: '12', label: '每月复利' },
];

interface InputErrors {
  principal?: string;
  annualRate?: string;
  years?: string;
  frequency?: string;
}

export default function CompoundCalculator() {
  const uid = useId();
  const ids = {
    principal: `${uid}-principal`,
    annualRate: `${uid}-rate`,
    years: `${uid}-years`,
    frequency: `${uid}-frequency`,
  };

  const [principal, setPrincipal] = useState(DEFAULTS.principal);
  const [annualRate, setAnnualRate] = useState(DEFAULTS.annualRate);
  const [years, setYears] = useState(DEFAULTS.years);
  const [frequency, setFrequency] = useState(DEFAULTS.frequency);

  const principalValue = parseNumberInput(principal);
  const rateValue = parseNumberInput(annualRate);
  const yearsValue = parseNumberInput(years);
  const frequencyValue = parseNumberInput(frequency);

  const errors: InputErrors = {};
  if (Number.isNaN(principalValue) || principalValue <= 0) {
    errors.principal = '初始本金需为大于 0 的数字。';
  } else if (principalValue > 100_000_000) {
    errors.principal = '演示上限为 1 亿元。';
  }

  if (Number.isNaN(rateValue)) {
    errors.annualRate = '请输入年化利率。';
  } else if (rateValue < -50 || rateValue > 50) {
    errors.annualRate = '年化利率请设在 -50% 到 50% 之间。';
  }

  if (Number.isNaN(yearsValue) || !Number.isInteger(yearsValue)) {
    errors.years = '投资年限需为整数。';
  } else if (yearsValue < 1 || yearsValue > 50) {
    errors.years = '投资年限请设在 1 到 50 年之间。';
  }

  if (Number.isNaN(frequencyValue) || ![1, 2, 4, 12].includes(frequencyValue)) {
    errors.frequency = '请选择有效的复利频率。';
  }

  const isValid = Object.keys(errors).length === 0;
  const result: CompoundResult | null = isValid
    ? calculateCompound({
        principal: principalValue,
        annualRatePct: rateValue,
        years: yearsValue,
        frequency: frequencyValue,
      } satisfies CompoundInput)
    : null;

  const frequencyLabel =
    FREQUENCIES.find((item) => item.value === frequency)?.label ?? '按所选频率';

  function reset() {
    setPrincipal(DEFAULTS.principal);
    setAnnualRate(DEFAULTS.annualRate);
    setYears(DEFAULTS.years);
    setFrequency(DEFAULTS.frequency);
  }

  return (
    <section aria-labelledby={`${uid}-title`}>
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 id={`${uid}-title`} className="font-serif text-2xl text-ink sm:text-3xl">
            复利计算器
          </h3>
          <span className="font-mono text-[0.62rem] tracking-widest text-muted">
            COMPOUND / 01
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          计算一笔本金在固定年化收益率下，经过若干年复利后的期末总额。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-line bg-paper-soft p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              id={ids.principal}
              label="初始本金"
              value={principal}
              onChange={setPrincipal}
              unit="元"
              min={0}
              max={100_000_000}
              step={1000}
              error={errors.principal}
              hint="0–1 亿"
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
              label="投资年限"
              value={years}
              onChange={setYears}
              unit="年"
              min={1}
              max={50}
              step={1}
              error={errors.years}
              hint="1–50 年"
            />
            <div>
              <label
                htmlFor={ids.frequency}
                className="mb-2 flex items-baseline justify-between gap-3 text-xs font-semibold tracking-wide text-ink"
              >
                <span>复利频率</span>
                <span className="text-[0.65rem] font-normal text-muted">每年计息次数</span>
              </label>
              <select
                id={ids.frequency}
                value={frequency}
                onChange={(event) => setFrequency(event.target.value)}
                className="tool-input select-arrow"
                aria-invalid={Boolean(errors.frequency)}
                aria-describedby={errors.frequency ? `${ids.frequency}-error` : undefined}
              >
                {FREQUENCIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.frequency && (
                <p id={`${ids.frequency}-error`} className="field-error">
                  {errors.frequency}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-[0.68rem] leading-5 text-muted">
              公式：FV = P × (1 + r/m)<sup>m×t</sup>
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
                ? `${frequencyLabel}，共 ${result.periods} 个计息期`
                : '请修正左侧参数后查看结果'}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
              <div>
                <dt className="text-[0.64rem] text-paper/45">累计收益</dt>
                <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-paper">
                  {result ? formatCurrency(result.totalInterest) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[0.64rem] text-paper/45">实际年化</dt>
                <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-paper">
                  {result ? formatPercent(result.effectiveAnnualRatePct) : '—'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex-1 bg-paper-soft p-5">
            {result ? (
              <ResultBreakdown
                principalLabel="本金"
                principal={principalValue}
                gainLabel="收益"
                gain={result.totalInterest}
              />
            ) : (
              <p className="text-xs leading-6 text-muted">
                结果会随输入实时更新。所有数字均按固定收益率与固定复利频率计算，不含费用、税收与通胀。
              </p>
            )}
            <p className="mt-4 border-t border-line pt-4 text-[0.65rem] leading-5 text-muted">
              仅为演示，不构成投资建议。实际收益会波动，历史表现不代表未来。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
