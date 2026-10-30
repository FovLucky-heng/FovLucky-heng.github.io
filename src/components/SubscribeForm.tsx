import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react';
import { INTEREST_OPTIONS } from '../lib/site';

interface FormValues {
  name: string;
  email: string;
  interest: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;
type Status = 'idle' | 'submitting' | 'success';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = '请填写你的姓名。';
  } else if (name.length < 2 || name.length > 30) {
    errors.name = '姓名长度请控制在 2–30 个字符。';
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = '请填写邮箱地址。';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = '邮箱格式看起来不正确，请检查后重试。';
  }

  if (!values.interest) {
    errors.interest = '请选择一个你最感兴趣的研究方向。';
  }

  return errors;
}

export default function SubscribeForm() {
  const nameId = useId();
  const emailId = useId();
  const interestId = useId();
  const statusId = useId();
  const timerRef = useRef<number | null>(null);
  const successRef = useRef<HTMLElement | null>(null);

  const [values, setValues] = useState<FormValues>({ name: '', email: '', interest: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [reference, setReference] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // 提交成功后表单高度会缩短，主动将成功反馈滚入视野并移动焦点。
  useEffect(() => {
    if (status !== 'success') return;
    const node = successRef.current;
    if (!node) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    node.focus({ preventScroll: true });
  }, [status]);

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      const target = document.getElementById(
        firstKey === 'name' ? nameId : firstKey === 'email' ? emailId : `${interestId}-group`,
      );
      target?.focus();
      return;
    }

    setStatus('submitting');
    const currentName = values.name.trim();

    // 演示模式：不发送网络请求，只用定时器模拟提交反馈。
    timerRef.current = window.setTimeout(() => {
      const suffix = String(Math.floor(1000 + Math.random() * 9000));
      setReference(`HY-${new Date().getFullYear()}-${suffix}`);
      setSubmittedName(currentName);
      setStatus('success');
    }, 850);
  }

  function resetForm() {
    setValues({ name: '', email: '', interest: '' });
    setErrors({});
    setStatus('idle');
    setReference('');
    setSubmittedName('');
  }

  if (status === 'success') {
    return (
      <section
        ref={successRef}
        tabIndex={-1}
        className="scroll-mt-28 border border-line bg-paper-soft p-7 sm:p-10"
        aria-labelledby="subscribe-success-title"
        aria-live="polite"
      >
        <div className="flex h-14 w-14 items-center justify-center border border-accent bg-accent-soft text-accent-deep">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.2 4.2L19 7" />
          </svg>
        </div>
        <p className="eyebrow mt-7">Demo submitted</p>
        <h2 id="subscribe-success-title" className="display-title mt-3 text-3xl">
          谢谢，{submittedName}。
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
          订阅意向已在<strong className="font-semibold text-ink">本页面模拟提交成功</strong>。
          这是纯前端演示，我们没有向服务器发送任何信息，也不会向你发送邮件。
        </p>

        <dl className="mt-7 grid gap-4 border-y border-line py-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="rule-label text-muted">DEMO REFERENCE</dt>
            <dd className="mt-1 font-mono text-ink">{reference}</dd>
          </div>
          <div>
            <dt className="rule-label text-muted">INTEREST</dt>
            <dd className="mt-1 text-ink">{values.interest}</dd>
          </div>
        </dl>

        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={resetForm} className="btn btn-primary">
            再填写一次
          </button>
          <a href="/research/" className="btn btn-outline">
            继续阅读研究
          </a>
        </div>
      </section>
    );
  }

  const isSubmitting = status === 'submitting';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border border-line bg-paper-soft p-6 sm:p-9"
      aria-describedby={statusId}
    >
      <div className="flex items-center justify-between border-b border-line pb-5">
        <div>
          <p className="eyebrow">Subscribe / 订阅意向</p>
          <p className="mt-2 text-xs text-muted">约 1 分钟完成 · 仅需三项信息</p>
        </div>
        <span className="hidden border border-line-dark px-2.5 py-1 font-mono text-[0.6rem] tracking-widest text-muted sm:inline-block">
          DEMO
        </span>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <label htmlFor={nameId} className="mb-2 block text-xs font-semibold tracking-wide text-ink">
            姓名 <span className="text-accent-deep">*</span>
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="如何称呼你"
            autoComplete="name"
            className="tool-input"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p id={`${nameId}-error`} className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={emailId} className="mb-2 block text-xs font-semibold tracking-wide text-ink">
            邮箱 <span className="text-accent-deep">*</span>
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            inputMode="email"
            className="tool-input"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p id={`${emailId}-error`} className="field-error">
              {errors.email}
            </p>
          )}
        </div>

        <fieldset
          id={`${interestId}-group`}
          tabIndex={-1}
          aria-describedby={errors.interest ? `${interestId}-error` : undefined}
          aria-invalid={Boolean(errors.interest)}
        >
          <legend className="mb-3 text-xs font-semibold tracking-wide text-ink">
            兴趣方向 <span className="text-accent-deep">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTEREST_OPTIONS.map((option, index) => {
              const isSelected = values.interest === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 border p-3.5 transition-colors ${
                    isSelected
                      ? 'border-ink bg-accent-soft/55'
                      : 'border-line hover:border-line-dark hover:bg-white/40'
                  } ${index === INTEREST_OPTIONS.length - 1 ? 'sm:col-span-2' : ''}`}
                >
                  <input
                    type="radio"
                    name="interest"
                    value={option.value}
                    checked={isSelected}
                    onChange={(event) => updateField('interest', event.target.value)}
                    className="mt-1 h-3.5 w-3.5 accent-[#0b1f33]"
                    disabled={isSubmitting}
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{option.label}</span>
                    <span className="mt-0.5 block text-[0.68rem] leading-5 text-muted">
                      {option.hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.interest && (
            <p id={`${interestId}-error`} className="field-error">
              {errors.interest}
            </p>
          )}
        </fieldset>
      </div>

      <div className="mt-7 border-t border-line pt-5">
        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border border-paper/40 border-t-paper" aria-hidden="true" />
              模拟提交中…
            </>
          ) : (
            <>
              提交订阅意向
              <span aria-hidden="true">↗</span>
            </>
          )}
        </button>
        <p id={statusId} className="mt-4 text-[0.68rem] leading-5 text-muted" aria-live="polite">
          纯前端演示：提交不会发送邮件，也不会把信息存入数据库。请勿填写真实敏感信息。
        </p>
      </div>
    </form>
  );
}
