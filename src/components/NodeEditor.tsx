import {
  MessageSquare,
  AlertTriangle,
  Check,
  Zap,
  Phone,
  GitBranch,
  Pencil,
  Trash2,
  Plus,
  MousePointerClick,
  Hash,
  List,
} from 'lucide-react';
import type { CampaignNode, Risk } from '../types';
import { Button, IconButton, Input, Select, Textarea, Toggle } from './ui';

interface NodeEditorProps {
  node: CampaignNode | null;
  onUpdate: (updater: (n: CampaignNode) => CampaignNode) => void;
  onAddChild: () => void;
  onDelete: () => void;
  onRenumber: () => void;
  onSyncChoices: () => void;
  onJumpToChild: (key: string) => void;
  onRemoveChild: (key: string) => void;
  onUpdateChildLabel: (key: string, label: string) => void;
}

export function NodeEditor({
  node,
  onUpdate,
  onAddChild,
  onDelete,
  onRenumber,
  onSyncChoices,
  onJumpToChild,
  onRemoveChild,
  onUpdateChildLabel,
}: NodeEditorProps) {
  if (!node) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-600 text-center">
        <MousePointerClick className="w-8 h-8 mx-auto mb-3 text-slate-300" />
        Click on a response in the flow to edit it here.
      </div>
    );
  }

  const hasChildren = !!node.then && Object.keys(node.then).length > 0;
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
          <Select
            value={(node.risk || 'low') as Risk}
            onChange={(e) => onUpdate((n) => ({ ...n, risk: e.target.value as Risk }))}
          >
            <option value="high">● High Priority</option>
            <option value="medium">● Medium Priority</option>
            <option value="low">● Low Priority</option>
          </Select>
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

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-slate-400" />
            Choices for Student
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={onRenumber} 
              disabled={!hasChildren} 
              title="Fix option numbers to be 1, 2, 3..."
              className="px-2 py-1 text-xs bg-slate-50"
            >
              <Hash className="w-3 h-3 mr-1" />
              Renumber
            </Button>
            <Button 
              onClick={onSyncChoices} 
              disabled={!hasChildren} 
              title="Add 'Reply: 1 - ...' to the message"
              className="px-2 py-1 text-xs bg-slate-50"
            >
              <List className="w-3 h-3 mr-1" />
              Reply List
            </Button>
          </div>
        </div>

        {!hasChildren ? (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-600 mb-3">
              This response <strong>ends the conversation</strong>.
            </p>
            <Button 
              onClick={onAddChild}
              className="bg-blue-50 text-blue-700 ring-blue-100 hover:bg-blue-100"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Choice (Yes/No, etc.)
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.keys(node.then!)
              .sort((a, b) => Number(a) - Number(b))
              .map((k) => {
                const child = node.then![k];
                return (
                  <div key={k} className="flex items-center gap-2 group p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-10 h-10 shrink-0 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                      #{k}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        value={child._label || ''}
                        placeholder={`e.g. "Talk to advisor"`}
                        onChange={(e) => onUpdateChildLabel(k, e.target.value)}
                        className="bg-transparent border-none focus:ring-0 px-1 py-1 text-sm font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton title="Edit this response" onClick={() => onJumpToChild(k)} className="bg-white hover:bg-blue-50 hover:text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </IconButton>
                      <IconButton title="Remove this option" onClick={() => onRemoveChild(k)} className="bg-white hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                );
              })}

            <div className="pt-2 border-t border-slate-50">
              <Button 
                onClick={onAddChild}
                className="w-full bg-slate-50 hover:bg-slate-100 border-dashed border-slate-300"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Another Choice
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
        <Button
          className="w-full sm:w-auto text-red-600 hover:bg-red-50 ring-0 shadow-none font-bold"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete This Response
        </Button>
        <div className="hidden sm:block flex-1" />
        {hasChildren && (
          <Button onClick={onAddChild} className="w-full sm:w-auto bg-blue-600 text-white ring-blue-600 hover:bg-blue-700 shadow-md">
            <Plus className="w-4 h-4 mr-1.5" />
            New Follow-up
          </Button>
        )}
      </div>
    </div>
  );
}
