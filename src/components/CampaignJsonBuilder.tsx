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
} from 'lucide-react';
import type { CampaignNode } from '../types';
import {
  deepClone,
  pathToString,
  normalizeTree,
  sortNumericKeys,
  getNodeAt,
  ensureThen,
  setNodeAt,
  deleteNodeAt,
  defaultNode,
} from '../utils';
import { exportCampaign } from '../utils/export';
import { buildIssues } from '../utils/validation';
import { makeChoicesBlock, replaceOrAppendChoices } from '../utils/choices';
import { useToast } from '../hooks';
import { Button, Input, Pill } from './ui';
import { TreeNode } from './TreeNode';
import { NodeEditor } from './NodeEditor';
import { OutputPanel } from './OutputPanel';
import { ImportModal } from './ImportModal';
import { Toast } from './Toast';

const DEFAULT_CAMPAIGN: Record<string, CampaignNode> = {
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
      '3': {
        message: 'Academic support will reach out to help you succeed.',
        risk: 'medium',
        needs_followup: true,
        _label: 'Academic support',
      },
    },
  },
};

export default function CampaignJsonBuilder() {
  const [campaignName, setCampaignName] = useState('F25Withdrawal');
  const [rootNodes, setRootNodes] = useState<Record<string, CampaignNode>>(() =>
    deepClone(DEFAULT_CAMPAIGN)
  );
  const [selectedPath, setSelectedPath] = useState('1');
  const [importOpen, setImportOpen] = useState(false);

  const { toast, showToast } = useToast();

  const selectedNode = useMemo(() => {
    const p = selectedPath.split('.').filter(Boolean);
    return getNodeAt(rootNodes, p);
  }, [rootNodes, selectedPath]);

  const issues = useMemo(
    () => buildIssues(campaignName, rootNodes),
    [campaignName, rootNodes]
  );

  const exported = useMemo(
    () => exportCampaign(campaignName, rootNodes),
    [campaignName, rootNodes]
  );

  const exportedText = useMemo(
    () => JSON.stringify(exported, null, 2),
    [exported]
  );

  function select(pathArr: string[]) {
    setSelectedPath(pathToString(pathArr));
  }

  function addTopLevel() {
    setRootNodes((prev) => {
      const next = deepClone(prev);
      const normalized = normalizeTree(next);
      const newKey = String(Object.keys(normalized).length + 1);
      normalized[newKey] = { ...defaultNode(), message: 'New message...' };
      setSelectedPath(newKey);
      return normalized;
    });
  }

  function addChildOption(pathArr: string[]) {
    setRootNodes((prev) => {
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

    setRootNodes((prev) => {
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
    setRootNodes((prev) => {
      const next = deepClone(prev);
      setNodeAt(next, pathArr, (n) => updater({ ...(n || defaultNode()) }));
      return next;
    });
  }

  function renumberSelectedChildren() {
    updateSelected((n) => {
      if (!n.then) return n;
      n.then = normalizeTree(n.then);
      return n;
    });
    showToast('Renumbered options.');
  }

  function syncChoicesIntoMessage() {
    const pathArr = selectedPath.split('.').filter(Boolean);
    const node = getNodeAt(rootNodes, pathArr);
    const children = node?.then ? sortNumericKeys(normalizeTree(node.then)) : null;
    
    if (!children || Object.keys(children).length === 0) {
      showToast('This node has no choices.');
      return;
    }

    const labels = Object.keys(children).map(
      (k) => children[k]._label || `Option ${k}`
    );
    const block = makeChoicesBlock(labels);

    updateSelected((n) => {
      n.message = replaceOrAppendChoices(n.message || '', block);
      return n;
    });

    showToast('Inserted/updated Reply list in message.');
  }

  function updateChildLabel(key: string, label: string) {
    const pathArr = selectedPath.split('.').filter(Boolean);
    setRootNodes((prev) => {
      const next = deepClone(prev);
      const parent = getNodeAt(next, pathArr);
      if (!parent?.then?.[key]) return prev;
      parent.then[key]._label = label;
      return next;
    });
  }

  function removeChildOption(key: string) {
    const pathArr = selectedPath.split('.').filter(Boolean);
    setRootNodes((prev) => {
      const next = deepClone(prev);
      const parent = getNodeAt(next, pathArr);
      if (!parent?.then) return prev;
      delete parent.then[key];
      parent.then = normalizeTree(parent.then);
      return next;
    });
    showToast('Option removed.');
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
      
      if (names.length !== 1) {
        throw new Error('Expected JSON with exactly one campaign root key.');
      }
      
      const name = names[0];
      const roots = parsed[name] as unknown;
      
      if (!roots || typeof roots !== 'object') {
        throw new Error('Campaign root must be an object.');
      }

      const cleaned = deepClone(roots as Record<string, CampaignNode>);
      const norm = normalizeTree(cleaned);

      setCampaignName(name);
      setRootNodes(norm);
      setSelectedPath('1');
      setImportOpen(false);
      showToast('Imported successfully!');
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
          <div className="flex flex-col lg:flex-row gap-6 lg:items-start lg:justify-between mb-8">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                Campaign Response Builder
              </h1>
              <p className="text-slate-500 max-w-2xl leading-relaxed">
                Design the conversation flow for your campaign. Link responses together to create a choice menu for students. When ready, copy the code for AWS Connect.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button onClick={addTopLevel} className="bg-slate-50 hover:bg-slate-100 ring-slate-200 shrink-0">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Response
              </Button>
              <Button onClick={() => setImportOpen(true)} className="bg-slate-50 hover:bg-slate-100 ring-slate-200 shrink-0">
                <FolderOpen className="w-4 h-4 mr-1.5" />
                Load Existing
              </Button>
              <Button
                className="bg-blue-600 text-white ring-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 shrink-0"
                onClick={copyJson}
              >
                <Copy className="w-4 h-4 mr-1.5" />
                Copy for AWS Connect
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end border-t border-slate-100 pt-8">
            <div className="lg:col-span-5 space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Campaign ID (No spaces)</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value.replace(/\s+/g, ''))}
                placeholder="e.g., F25Withdrawal"
                className="text-lg py-3 px-4 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <p className="text-[11px] text-slate-400 font-medium ml-1 italic">
                Must match the <strong>CampaignId</strong> set in Student Success systems.
              </p>
            </div>
            
            <div className="lg:col-span-3 space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Status</label>
              <div className="flex flex-wrap gap-2 py-1">
                <Pill>{Object.keys(rootNodes || {}).length} options</Pill>
                <Pill tone={errorCount > 0 ? 'error' : 'neutral'}>
                  {errorCount === 0 ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> All clear
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errorCount} to fix
                    </span>
                  )}
                </Pill>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider text-right block">Currently Editing</label>
              <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl text-sm font-mono flex items-center justify-between shadow-inner">
                <span className="opacity-50">Path:</span>
                <span className="font-bold text-blue-400">Response {selectedPath}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 h-full min-h-[400px] lg:min-h-[600px] flex flex-col">
            <div className="mb-6 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-slate-400" />
                Conversation Flow
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Visual Map</span>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {Object.keys(rootNodes || {}).length === 0 ? (
                <div className="rounded-[1.5rem] border-2 border-dashed border-slate-100 p-12 text-center flex flex-col items-center gap-4">
                  <Inbox className="w-12 h-12 text-slate-300" />
                  <p className="text-sm text-slate-400 font-medium">
                    Empty flow. <br />
                    Start by adding a response.
                  </p>
                  <Button onClick={addTopLevel} className="text-blue-600 bg-blue-50 ring-blue-100">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Response
                  </Button>
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
                Workspace
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Edit Content</span>
            </div>
            
            <div className="bg-white rounded-[1.5rem]">
              <NodeEditor
                node={selectedNode}
                onUpdate={updateSelected}
                onAddChild={() => addChildOption(selectedPath.split('.'))}
                onDelete={() => deleteNode(selectedPath.split('.'))}
                onRenumber={renumberSelectedChildren}
                onSyncChoices={syncChoicesIntoMessage}
                onJumpToChild={(k) => setSelectedPath(`${selectedPath}.${k}`)}
                onRemoveChild={removeChildOption}
                onUpdateChildLabel={updateChildLabel}
              />
            </div>
          </div>

          <div className="lg:col-span-3 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 h-full">
            <div className="mb-6 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-slate-400" />
                Final Steps
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Export</span>
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
