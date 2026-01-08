import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  XCircle,
  Lightbulb,
  ChevronRight,
  Copy,
} from 'lucide-react';
import type { ValidationIssue } from '../types';
import { Button, Pill } from './ui';

interface OutputPanelProps {
  exportedText: string;
  issues: ValidationIssue[];
  onCopy: () => void;
}

export function OutputPanel({ exportedText, issues, onCopy }: OutputPanelProps) {
  const hasErrors = issues.some((i) => i.type === 'error');
  
  return (
    <div className="space-y-6">
      <div className={`rounded-3xl p-5 ${hasErrors ? 'bg-red-50 ring-1 ring-red-200' : 'bg-green-50 ring-1 ring-green-200'} transition-all shadow-sm`}>
        <div className="flex items-start gap-4">
          <span className="shrink-0">
            {hasErrors ? (
              <AlertTriangle className="w-8 h-8 text-red-500" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
          </span>
          <div className="min-w-0">
            <div className={`font-bold text-lg mb-1 ${hasErrors ? 'text-red-700' : 'text-green-700'}`}>
              {hasErrors ? 'Fix Issues' : 'Ready to Ship'}
            </div>
            <div className={`text-sm leading-relaxed ${hasErrors ? 'text-red-600' : 'text-green-600'}`}>
              {hasErrors 
                ? `${issues.filter((i) => i.type === 'error').length} things need your attention before you can use this.`
                : 'Your flow looks great! You can now copy the code below.'
              }
            </div>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-bold text-slate-700 uppercase tracking-widest ml-1 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-400" />
            Checklist
          </div>
          <div className="max-h-60 overflow-auto rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 space-y-3">
            {issues.slice(0, 30).map((it, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                <span className="shrink-0 mt-0.5">
                  {it.type === 'error' ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                  )}
                </span>
                <span className="font-medium">
                  {it.msg.replace('Response ', 'Option #').replace(': message is empty', ' needs a message')}
                </span>
              </div>
            ))}
            {issues.length > 30 && (
              <div className="text-xs text-slate-400 italic pt-2 border-t border-slate-200">
                + {issues.length - 30} more issues...
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100">
        <details className="group">
          <summary className="cursor-pointer text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-between list-none">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
              <span>TECHNICAL PREVIEW</span>
            </div>
            <Pill tone="neutral">JSON</Pill>
          </summary>
          <div className="mt-4 space-y-3">
            <Button
              className="w-full bg-slate-900 text-white ring-slate-900 hover:bg-slate-800 shadow-md font-bold py-3"
              onClick={onCopy}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Configuration
            </Button>
            <pre className="max-h-[300px] overflow-auto rounded-2xl bg-slate-950 p-4 text-[11px] font-mono text-blue-300 ring-1 ring-slate-900 shadow-inner leading-normal">
              {exportedText}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}
