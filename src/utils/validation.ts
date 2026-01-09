import type { CampaignNode, ValidationIssue } from '../types';
import { RISKS } from '../types';
import { traverse, pathToString } from './tree';

export function buildIssues(
  campaignName: string,
  rootNodes: Record<string, CampaignNode>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!campaignName.trim()) {
    issues.push({ type: 'error', msg: 'Enter a Campaign ID (e.g., F25Withdrawal)' });
  }

  const rootKeys = Object.keys(rootNodes || {});
  if (rootKeys.length === 0) {
    issues.push({ type: 'error', msg: 'Add at least one response option' });
  }

  traverse(rootNodes || {}, (node, path) => {
    const p = pathToString(path);
    const friendlyPath = `Response ${p}`;

    if (!node?.message?.trim()) {
      issues.push({ type: 'error', msg: `${friendlyPath} needs a message` });
    }

    if (node?.risk && !RISKS.includes(node.risk)) {
      issues.push({ type: 'error', msg: `${friendlyPath} has invalid priority level` });
    }

    const hasThen = !!node?.then && Object.keys(node.then).length > 0;
    if (hasThen) {
      const keys = Object.keys(node.then!);
      const numeric = keys
        .map((k) => Number(k))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);

      if (numeric.length !== keys.length) {
        issues.push({
          type: 'warning',
          msg: `${friendlyPath} has non-numeric option keys`,
        });
      }

      for (let i = 0; i < numeric.length; i++) {
        if (numeric[i] !== i + 1) {
          issues.push({
            type: 'warning',
            msg: `${friendlyPath} options should be numbered 1, 2, 3...`,
          });
          break;
        }
      }
    }
  });

  return issues;
}
