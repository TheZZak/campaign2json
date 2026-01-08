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
      className={`h-9 w-9 inline-flex items-center justify-center rounded-xl text-sm shadow-sm ring-1 ring-slate-200 hover:ring-slate-300 active:scale-[0.99] transition-all leading-none ${className}`}
    >
      {children}
    </button>
  );
}

