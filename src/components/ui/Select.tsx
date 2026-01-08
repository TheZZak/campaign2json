import React from 'react';

export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full h-10 rounded-2xl px-4 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white ${className}`}
    >
      {children}
    </select>
  );
}

