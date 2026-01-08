import type { CampaignNode } from '../types';
import { normalizeTree, sortNumericKeys } from './tree';

export function exportNode(node: CampaignNode): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  
  if (typeof node.message === 'string') {
    out.message = node.message;
  }
  
  if (node.risk) {
    out.risk = node.risk;
  }
  
  if (typeof node.needs_followup === 'boolean') {
    out.needs_followup = node.needs_followup;
  }
  
  if (node.then && Object.keys(node.then).length > 0) {
    const normalized = normalizeTree(node.then);
    const sorted = sortNumericKeys(normalized);
    out.then = {};
    
    for (const k of Object.keys(sorted)) {
      (out.then as Record<string, unknown>)[k] = exportNode(sorted[k]);
    }
  }
  
  return out;
}

export function exportCampaign(
  campaignName: string,
  rootNodes: Record<string, CampaignNode>
): Record<string, Record<string, unknown>> {
  const name = campaignName || 'CampaignName';
  const normalizedRoot = sortNumericKeys(normalizeTree(rootNodes || {}));
  
  const out: Record<string, Record<string, unknown>> = {};
  out[name] = {};
  
  for (const k of Object.keys(normalizedRoot)) {
    out[name][k] = exportNode(normalizedRoot[k]);
  }
  
  return out;
}
