import {
  MessageSquare,
  AlertTriangle,
  Check,
  Zap,
  Phone,
  Trash2,
  MousePointerClick,
} from 'lucide-react';
import type { CampaignNode, Risk } from '../types';
import { Button, Select, Textarea, Toggle } from './ui';

interface NodeEditorProps {
  node: CampaignNode | null;
  onUpdate: (updater: (n: CampaignNode) => CampaignNode) => void;
  onDelete: () => void;
}

export function NodeEditor({
  node,
  onUpdate,
  onDelete,
}: NodeEditorProps) {
  if (!node) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-600 text-center">
        <MousePointerClick className="w-8 h-8 mx-auto mb-3 text-slate-300" />
        Click on a response in the flow to edit it here.
      </div>
    );
  }

  const messageLength = (node.message || '').length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          Message to Student
        </label>
        <Textarea
          rows={10}
          value={node.message || ''}
          onChange={(e) => onUpdate((n) => ({ ...n, message: e.target.value }))}
          placeholder="Type what the student will receive...&#10;&#10;Tip: Use {FirstName} to include their name automatically."
          className="text-base"
        />
        <div className="flex justify-between items-center px-1">
          <span className="text-xs text-slate-500 font-medium">{messageLength} characters</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            messageLength > 160 
              ? 'bg-amber-100 text-amber-700' 
              : messageLength > 0 ? 'bg-green-100 text-green-700' : 'text-slate-400'
          }`}>
            {messageLength > 160 ? (
              <>
                <AlertTriangle className="w-3 h-3" />
                Multi-part SMS
              </>
            ) : messageLength > 0 ? (
              <>
                <Check className="w-3 h-3" />
                Standard SMS
              </>
            ) : 'Empty'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 items-end">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-400" />
            Priority
          </label>
          <div className="relative">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${
              node.risk === 'high' ? 'bg-red-500' : node.risk === 'medium' ? 'bg-amber-500' : 'bg-green-500'
            }`} />
            <Select
              value={(node.risk || 'low') as Risk}
              onChange={(e) => onUpdate((n) => ({ ...n, risk: e.target.value as Risk }))}
              className={`pl-8 ${
                node.risk === 'high' 
                  ? 'ring-red-300 bg-red-50' 
                  : node.risk === 'medium' 
                    ? 'ring-amber-300 bg-amber-50' 
                    : 'ring-green-300 bg-green-50'
              }`}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            Coordinator Call
          </label>
          <div className="bg-white px-4 h-10 rounded-2xl ring-1 ring-slate-200 w-full flex items-center">
            <Toggle
              checked={!!node.needs_followup}
              onChange={(v) => onUpdate((n) => ({ ...n, needs_followup: v }))}
              label="Call needed"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
        <Button
          className="w-full sm:w-auto text-red-600 hover:bg-red-50 ring-0 shadow-none font-bold"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete This Response
        </Button>
      </div>
    </div>
  );
}
