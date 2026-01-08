import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  children: React.ReactNode;
}

export function IconButton({ title, children, className = '', ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      title={title}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-lg text-sm ring-1 ring-slate-200 hover:ring-slate-300 active:scale-95 transition-all ${className}`}
    >
      {children}
    </button>
  );
}
