import { useId, useState, type KeyboardEvent } from 'react';
import CompoundCalculator from './calculators/CompoundCalculator';
import DcaCalculator from './calculators/DcaCalculator';

type TabKey = 'compound' | 'dca';

const TABS: Array<{ key: TabKey; index: string; label: string }> = [
  { key: 'compound', index: '01', label: '复利计算器' },
  { key: 'dca', index: '02', label: '定投计算器' },
];

export default function CalculatorTabs() {
  const uid = useId().replace(/:/g, '');
  const [active, setActive] = useState<TabKey>('compound');

  function selectTab(key: TabKey) {
    setActive(key);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = TABS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = TABS[nextIndex];
    setActive(nextTab.key);
    document.getElementById(`${uid}-tab-${nextTab.key}`)?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="选择计算器"
        className="mb-8 grid w-full grid-cols-2 border border-line-dark bg-paper-soft sm:inline-flex sm:w-auto"
      >
        {TABS.map((tab, index) => {
          const selected = active === tab.key;
          return (
            <button
              key={tab.key}
              id={`${uid}-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${uid}-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium transition-colors ${
                selected ? 'bg-ink text-paper' : 'text-muted hover:bg-paper-deep/50 hover:text-ink'
              }`}
            >
              <span className={`font-mono text-[0.6rem] ${selected ? 'text-accent-soft' : 'text-accent-deep'}`}>
                {tab.index}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {TABS.map((tab) => (
        <div
          key={tab.key}
          id={`${uid}-panel-${tab.key}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${tab.key}`}
          tabIndex={0}
          hidden={active !== tab.key}
        >
          {tab.key === 'compound' ? <CompoundCalculator /> : <DcaCalculator />}
        </div>
      ))}
    </div>
  );
}
