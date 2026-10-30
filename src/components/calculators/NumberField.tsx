interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

export default function NumberField({
  id,
  label,
  value,
  onChange,
  unit,
  placeholder,
  min,
  max,
  step = 1,
  error,
  hint,
  disabled = false,
}: NumberFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-xs font-semibold tracking-wide text-ink">
        <span>{label}</span>
        {hint && (
          <span id={`${id}-hint`} className="text-[0.65rem] font-normal text-muted">
            {hint}
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          disabled={disabled}
          className="tool-input pr-14 tabular-nums"
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[0.7rem] text-muted">
          {unit}
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
