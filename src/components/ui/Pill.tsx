import React from 'react';

type PillTone = 'neutral' | 'warning' | 'error';

interface PillProps {
  children: React.ReactNode;
  tone?: PillTone;
}

export function Pill({ children, tone = 'neutral' }: PillProps) {
  const toneClasses: Record<PillTone, string> = {
    error: 'bg-red-50 text-red-700 ring-red-200',
    warning: 'bg-amber-50 text-amber-800 ring-amber-200',
    neutral: 'bg-slate-50 text-slate-700 ring-slate-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

