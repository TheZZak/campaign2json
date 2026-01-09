import { useMemo, useState } from 'react';
import {
  Plus,
  FolderOpen,
  Copy,
  CheckCircle,
  AlertCircle,
  GitBranch,
  PencilLine,
  Rocket,
  Inbox,
  X,
  Layers,
} from 'lucide-react';
import type { CampaignNode } from '../types';
import {
  deepClone,
  pathToString,
  normalizeTree,
  getNodeAt,
  ensureThen,
  setNodeAt,
  deleteNodeAt,
  defaultNode,
} from '../utils';
import { exportCampaign } from '../utils/export';
import { buildIssues } from '../utils/validation';
import { useToast } from '../hooks';
import { Button, Pill } from './ui';
import { TreeNode } from './TreeNode';
import { NodeEditor } from './NodeEditor';
import { OutputPanel } from './OutputPanel';
import { ImportModal } from './ImportModal';
import { Toast } from './Toast';

const DEFAULT_CAMPAIGNS: Record<string, Record<string, CampaignNode>> = {
  'F25Withdrawal': {
    '1': {
      message: "We'll process your withdrawal request. A coordinator will contact you within 24 hours.",
      risk: 'high',
      needs_followup: true,
    },
    '2': {
      message: "Great! We're glad you're continuing with the course. Good luck, {FirstName}!",
      risk: 'low',
      needs_followup: false,
    },
    '3': {
      message: 'No problem, {FirstName}. What would help you decide?',
      risk: 'medium',
      needs_followup: true,
      then: {
        '1': {
          message: 'An advisor will contact you shortly to discuss your options.',
          risk: 'medium',
          needs_followup: true,
          _label: 'Talk to advisor',
        },
        '2': {
          message: "We'll send you financial aid information right away.",
          risk: 'medium',
          needs_followup: true,
          _label: 'Financial info',
        },
      },
    },
  },
};

export default function CampaignJsonBuilder() {
  const [campaigns, setCampaigns] = useState<Record<string, Record<string, CampaignNode>>>(() =>
    deepClone(DEFAULT_CAMPAIGNS)
  );
  const [activeCampaign, setActiveCampaign] = useState('F25Withdrawal');
  const [selectedPath, setSelectedPath] = useState('1');
  const [importOpen, setImportOpen] = useState(false);
  const [renamingCampaign, setRenamingCampaign] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const { toast, showToast } = useToast();

  const campaignNames = Object.keys(campaigns);
  const rootNodes = campaigns[activeCampaign] || {};

  const selectedNode = useMemo(() => {
    const p = selectedPath.split('.').filter(Boolean);
    return getNodeAt(rootNodes, p);
  }, [rootNodes, selectedPath]);

  const allIssues = useMemo(() => {
    const result: Record<string, ReturnType<typeof buildIssues>> = {};
    for (const name of campaignNames) {
      result[name] = buildIssues(name, campaigns[name]);
    }
    return result;
  }, [campaigns, campaignNames]);

  const issues = allIssues[activeCampaign] || [];

  const exportedAll = useMemo(() => {
    const out: Record<string, Record<string, unknown>> = {};
    for (const name of campaignNames) {
      const exp = exportCampaign(name, campaigns[name]);
      out[name] = exp[name];
    }
    return out;
  }, [campaigns, campaignNames]);

  const exportedText = useMemo(
    () => JSON.stringify(exportedAll, null, 2),
    [exportedAll]
  );

  const totalErrors = useMemo(() => {
    return Object.values(allIssues).reduce(
      (sum, arr) => sum + arr.filter((i) => i.type === 'error').length,
      0
    );
  }, [allIssues]);

  function updateRootNodes(updater: (prev: Record<string, CampaignNode>) => Record<string, CampaignNode>) {
    setCampaigns((prev) => ({
      ...prev,
      [activeCampaign]: updater(prev[activeCampaign] || {}),
    }));
  }

  function select(pathArr: string[]) {
    setSelectedPath(pathToString(pathArr));
  }

  function addCampaign() {
    const base = 'NewCampaign';
    let name = base;
    let i = 1;
    while (campaigns[name]) {
      name = `${base}${i}`;
      i++;
    }
    setCampaigns((prev) => ({
      ...prev,
      [name]: { '1': { ...defaultNode(), message: 'New message...' } },
    }));
    setActiveCampaign(name);
    setSelectedPath('1');
    showToast(`Created campaign: ${name}`);
  }

  function deleteCampaign(name: string) {
    if (campaignNames.length <= 1) {
      showToast('Cannot delete the last campaign.');
      return;
    }
    if (!window.confirm(`Delete campaign "${name}"?`)) return;
    setCampaigns((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (activeCampaign === name) {
      const remaining = campaignNames.filter((n) => n !== name);
      setActiveCampaign(remaining[0] || '');
      setSelectedPath('1');
    }
    showToast(`Deleted campaign: ${name}`);
  }

  function startRenameCampaign(name: string) {
    setRenamingCampaign(name);
    setRenameValue(name);
  }

  function finishRenameCampaign() {
    if (!renamingCampaign) return;
    const newName = renameValue.replace(/\s+/g, '').trim();
    if (!newName) {
      setRenamingCampaign(null);
      return;
    }
    if (newName !== renamingCampaign && campaigns[newName]) {
      showToast('Campaign name already exists.');
      return;
    }
    if (newName !== renamingCampaign) {
      setCampaigns((prev) => {
        const next: Record<string, Record<string, CampaignNode>> = {};
        for (const key of Object.keys(prev)) {
          if (key === renamingCampaign) {
            next[newName] = prev[key];
          } else {
            next[key] = prev[key];
          }
        }
        return next;
      });
      if (activeCampaign === renamingCampaign) {
        setActiveCampaign(newName);
      }
    }
    setRenamingCampaign(null);
  }

  function addTopLevel() {
    updateRootNodes((prev) => {
      const next = deepClone(prev);
      const normalized = normalizeTree(next);
      const newKey = String(Object.keys(normalized).length + 1);
      normalized[newKey] = { ...defaultNode(), message: 'New message...' };
      setSelectedPath(newKey);
      return normalized;
    });
  }

  function addChildOption(pathArr: string[]) {
    updateRootNodes((prev) => {
      const next = deepClone(prev);
      ensureThen(next, pathArr);
      const parent = getNodeAt(next, pathArr);
      if (!parent) return prev;

      const children = parent.then || {};
      const normalized = normalizeTree(children);
      const newKey = String(Object.keys(normalized).length + 1);
      normalized[newKey] = {
        ...defaultNode(),
        message: 'New message...',
        _label: `Option ${newKey}`,
      };
      parent.then = normalized;

      setSelectedPath(pathToString([...pathArr, newKey]));
      return next;
    });
  }

  function deleteNode(pathArr: string[]) {
    if (!window.confirm(`Delete node ${pathToString(pathArr)}?`)) return;

    updateRootNodes((prev) => {
      const next = deepClone(prev);
      deleteNodeAt(next, pathArr);

      if (pathArr.length === 1) {
        const normalized = normalizeTree(next);
        setSelectedPath(Object.keys(normalized)[0] || '1');
        return normalized;
      }

      const parentPath = pathArr.slice(0, -1);
      const parent = getNodeAt(next, parentPath);
      if (parent?.then) parent.then = normalizeTree(parent.then);
      setSelectedPath('1');
      return next;
    });
  }

  function updateSelected(updater: (n: CampaignNode) => CampaignNode) {
    const pathArr = selectedPath.split('.').filter(Boolean);
    updateRootNodes((prev) => {
      const next = deepClone(prev);
      setNodeAt(next, pathArr, (n) => updater({ ...(n || defaultNode()) }));
      return next;
    });
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(exportedText);
      showToast('Copied JSON to clipboard!');
    } catch {
      const el = document.createElement('textarea');
      el.value = exportedText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('Copied JSON to clipboard!');
    }
  }

  function handleImport(text: string) {
    try {
      const parsed = JSON.parse(text);
      const names = Object.keys(parsed || {});
      
      if (names.length === 0) {
        throw new Error('No campaigns found in JSON.');
      }

      const imported: Record<string, Record<string, CampaignNode>> = {};
      for (const name of names) {
        const roots = parsed[name];
        if (!roots || typeof roots !== 'object') {
          throw new Error(`Campaign "${name}" must be an object.`);
        }
        imported[name] = normalizeTree(deepClone(roots as Record<string, CampaignNode>));
      }

      setCampaigns((prev) => ({ ...prev, ...imported }));
      setActiveCampaign(names[0]);
      setSelectedPath('1');
      setImportOpen(false);
      showToast(`Imported ${names.length} campaign(s): ${names.join(', ')}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      alert(`Import failed: ${message}`);
    }
  }

  const errorCount = issues.filter((x) => x.type === 'error').length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="rounded-[2rem] bg-white p-6 md:p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-start lg:justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                campaign2json
              </h1>
              <p className="text-slate-500 max-w-2xl leading-relaxed">
                Build campaign response flows. Export JSON for AWS Connect.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button onClick={() => setImportOpen(true)} className="bg-slate-50 hover:bg-slate-100 ring-slate-200 shrink-0">
                <FolderOpen className="w-4 h-4 mr-1.5" />
                Import
              </Button>
              <Button
                className="bg-blue-600 text-white ring-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 shrink-0"
                onClick={copyJson}
              >
                <Copy className="w-4 h-4 mr-1.5" />
                Copy All
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Campaigns</span>
              <Pill>{campaignNames.length}</Pill>
              {totalErrors > 0 && (
                <Pill tone="error">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {totalErrors} errors
                </Pill>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {campaignNames.map((name) => {
                const hasErrors = (allIssues[name] || []).some((i) => i.type === 'error');
                const isActive = name === activeCampaign;
                const isRenaming = name === renamingCampaign;

                return (
                  <div
                    key={name}
                    className={`group flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white ring-slate-900'
                        : 'bg-white ring-slate-200 hover:ring-slate-300 text-slate-700'
                    }`}
                    onClick={() => {
                      if (!isRenaming) {
                        setActiveCampaign(name);
                        setSelectedPath('1');
                      }
                    }}
                  >
                    {hasErrors && (
                      <AlertCircle className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-red-500'}`} />
                    )}
                    {isRenaming ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value.replace(/\s+/g, ''))}
                        onBlur={finishRenameCampaign}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishRenameCampaign();
                          if (e.key === 'Escape') setRenamingCampaign(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="bg-transparent border-none outline-none w-32 text-sm font-medium"
                      />
                    ) : (
                      <span onDoubleClick={() => startRenameCampaign(name)}>{name}</span>
                    )}
                    {isActive && campaignNames.length > 1 && !isRenaming && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCampaign(name);
                        }}
                        className="ml-1 opacity-50 hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              <Button
                onClick={addCampaign}
                className="bg-slate-50 hover:bg-slate-100 ring-slate-200 px-3 py-2"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Double-click to rename. Click X to delete.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 h-full min-h-[400px] lg:min-h-[600px] flex flex-col">
            <div className="mb-4 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-slate-400" />
                {activeCampaign}
              </h2>
              <div className="flex items-center gap-2">
                <Pill>{Object.keys(rootNodes).length} options</Pill>
                <Pill tone={errorCount > 0 ? 'error' : 'neutral'}>
                  {errorCount === 0 ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errorCount}
                    </span>
                  )}
                </Pill>
              </div>
            </div>

            <div className="mb-4">
              <Button onClick={addTopLevel} className="w-full bg-slate-50 hover:bg-slate-100 ring-slate-200">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Response
              </Button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 px-1 custom-scrollbar">
              {Object.keys(rootNodes).length === 0 ? (
                <div className="rounded-[1.5rem] border-2 border-dashed border-slate-100 p-12 text-center flex flex-col items-center gap-4">
                  <Inbox className="w-12 h-12 text-slate-300" />
                  <p className="text-sm text-slate-400 font-medium">
                    Empty campaign.<br />
                    Add a response to start.
                  </p>
                </div>
              ) : (
                Object.keys(rootNodes)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((k) => (
                    <TreeNode
                      key={k}
                      node={rootNodes[k]}
                      path={[k]}
                      selectedPath={selectedPath}
                      onSelect={(p) => select(p)}
                      onAddChild={(p) => addChildOption(p)}
                      onDelete={(p) => deleteNode(p)}
                    />
                  ))
              )}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 h-full min-h-[400px] lg:min-h-[600px]">
            <div className="mb-6 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PencilLine className="w-5 h-5 text-slate-400" />
                Editor
              </h2>
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-mono">
                {activeCampaign} / {selectedPath}
              </div>
            </div>
            
            <div className="bg-white rounded-[1.5rem]">
              <NodeEditor
                node={selectedNode}
                onUpdate={updateSelected}
                onDelete={() => deleteNode(selectedPath.split('.'))}
              />
            </div>
          </div>

          <div className="lg:col-span-3 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 h-full">
            <div className="mb-6 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-slate-400" />
                Export
              </h2>
              <Pill>{campaignNames.length} campaigns</Pill>
            </div>
            
            <OutputPanel
              exportedText={exportedText}
              issues={issues}
              onCopy={copyJson}
            />
          </div>
        </div>
      </div>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <Toast message={toast} />
    </div>
  );
}
