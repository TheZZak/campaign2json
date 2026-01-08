import React from 'react';

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl p-4 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white placeholder:text-slate-400 min-h-[120px] ${className}`}
    />
  );
}

