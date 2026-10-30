import { formatCurrency } from '../../lib/format';

interface ResultBreakdownProps {
  principalLabel: string;
  principal: number;
  gainLabel: string;
  gain: number;
}

/** 本息构成条：只用输入值计算比例，不绘制或暗示任何历史收益。 */
export default function ResultBreakdown({
  principalLabel,
  principal,
  gainLabel,
  gain,
}: ResultBreakdownProps) {
  const safePrincipal = Math.max(0, principal);
  const safeGain = Math.max(0, gain);
  const visualTotal = safePrincipal + safeGain;
  const principalWidth = visualTotal > 0 ? (safePrincipal / visualTotal) * 100 : 100;

  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden bg-paper-deep"
        aria-hidden="true"
      >
        <div className="bg-ink" style={{ width: `${principalWidth}%` }} />
        {safeGain > 0 && <div className="bg-accent" style={{ width: `${100 - principalWidth}%` }} />}
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-[0.68rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-ink" aria-hidden="true" />
          {principalLabel} {formatCurrency(principal)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
          {gainLabel} {formatCurrency(gain)}
        </span>
      </div>
      {gain < 0 && (
        <p className="mt-2 text-[0.65rem] leading-5 text-muted">
          当前参数下收益为负，构成条仅展示本金部分。
        </p>
      )}
    </div>
  );
}
