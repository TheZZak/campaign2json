import { Phone, Check, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { CampaignNode } from '../types';
import { pathToString } from '../utils';
import { IconButton, Pill } from './ui';

interface TreeNodeProps {
  node: CampaignNode;
  path: string[];
  selectedPath: string;
  onSelect: (path: string[]) => void;
  onAddChild: (path: string[]) => void;
  onDelete: (path: string[]) => void;
  level?: number;
}

export function TreeNode({
  node,
  path,
  selectedPath,
  onSelect,
  onAddChild,
  onDelete,
  level = 0,
}: TreeNodeProps) {
  const isSelected = selectedPath === pathToString(path);
  const hasThen = !!node.then && Object.keys(node.then).length > 0;
  const risk = node.risk || '';

  return (
    <div className="w-full">
      <div
        className={`flex items-start justify-between gap-3 rounded-2xl px-4 py-3 ring-1 transition cursor-pointer ${
          isSelected
            ? 'bg-slate-900 text-white ring-slate-900 shadow-md'
            : 'bg-white ring-slate-200 hover:ring-slate-300 hover:bg-slate-50'
        }`}
        style={{ marginLeft: level * 16 }}
        onClick={() => onSelect(path)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(path)}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
              isSelected ? 'text-white/70 border-white/20' : 'text-slate-400 border-slate-200'
            }`}>
              #{path[path.length - 1]}
            </span>
            {risk && (
              <Pill tone={risk === 'high' ? 'error' : risk === 'medium' ? 'warning' : 'neutral'}>
                {risk}
              </Pill>
            )}
            {node.needs_followup && (
              <Pill tone={isSelected ? 'neutral' : 'warning'}>
                <Phone className="w-3 h-3 mr-1" />
                call
              </Pill>
            )}
            {hasThen ? (
              <Pill>
                <ChevronRight className="w-3 h-3 mr-0.5" />
                menu
              </Pill>
            ) : (
              <Pill tone="neutral">
                <Check className="w-3 h-3 mr-0.5" />
                final
              </Pill>
            )}
          </div>
          <div className={`text-sm leading-relaxed ${isSelected ? 'text-white' : 'text-slate-900'} break-words line-clamp-2`}>
            {node.message?.trim() || '(empty message)'}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <IconButton
            title="Add follow-up question"
            onClick={() => onAddChild(path)}
            className={`w-8 h-8 flex items-center justify-center ${isSelected ? 'ring-white/30 hover:ring-white/50 text-white bg-white/10' : 'bg-slate-50'}`}
          >
            <Plus className="w-4 h-4" />
          </IconButton>
          <IconButton
            title="Delete this response"
            onClick={() => onDelete(path)}
            className={`w-8 h-8 flex items-center justify-center ${isSelected ? 'ring-white/30 hover:ring-white/50 text-white bg-white/10' : 'bg-slate-50'}`}
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {hasThen && (
        <div className="mt-3 space-y-3 relative">
          <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-slate-200" style={{ marginLeft: level * 16 }} />
          
          {Object.keys(node.then!)
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => (
              <TreeNode
                key={`${pathToString(path)}.${k}`}
                node={node.then![k]}
                path={[...path, k]}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onAddChild={onAddChild}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}
