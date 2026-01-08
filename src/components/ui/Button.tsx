import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`h-10 rounded-2xl px-4 text-sm font-medium shadow-sm ring-1 ring-slate-200 hover:ring-slate-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center justify-center min-w-max transition-all leading-none ${className}`}
    >
      {children}
    </button>
  );
}

