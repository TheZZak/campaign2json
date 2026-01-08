import { useState } from 'react';
import { FolderOpen, X, Check } from 'lucide-react';
import { Button, IconButton, Textarea } from './ui';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
}

const IMPORT_PLACEHOLDER = `Paste your existing campaign configuration here...

Example format:
{
  "F25Withdrawal": {
    "1": { "message": "We'll process your request...", "risk": "high" },
    "2": { "message": "Great, good luck!", "risk": "low" }
  }
}`;

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [importText, setImportText] = useState('');

  if (!isOpen) return null;

  const handleImport = () => {
    onImport(importText);
    setImportText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-slate-400" />
              Load Existing Campaign
            </div>
            <div className="text-sm text-slate-600">
              Paste an existing campaign configuration to edit it.
            </div>
          </div>
          <IconButton title="Close" onClick={onClose}>
            <X className="w-4 h-4" />
          </IconButton>
        </div>
        
        <div className="mt-4">
          <Textarea
            rows={12}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={IMPORT_PLACEHOLDER}
          />
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            className="bg-slate-900 text-white ring-slate-900 hover:ring-slate-900"
            onClick={handleImport}
          >
            <Check className="w-4 h-4 mr-1.5" />
            Load Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}
