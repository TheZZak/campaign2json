import type { CampaignNode } from '../types';

export function pathToString(path: string[]): string {
  return path.join('.');
}

export function sortNumericKeys<T>(obj: Record<string, T> | undefined | null): Record<string, T> {
  const keys = Object.keys(obj || {}).sort((a, b) => Number(a) - Number(b));
  const out: Record<string, T> = {};
  for (const k of keys) {
    out[k] = (obj as Record<string, T>)[k];
  }
  return out;
}

export function normalizeTree<T>(nodeMap: Record<string, T> | undefined | null): Record<string, T> {
  const keys = Object.keys(nodeMap || {}).sort((a, b) => Number(a) - Number(b));
  const out: Record<string, T> = {};
  let i = 1;
  for (const k of keys) {
    out[String(i)] = (nodeMap as Record<string, T>)[k];
    i++;
  }
  return out;
}

export function getNodeAt(
  root: Record<string, CampaignNode>,
  path: string[]
): CampaignNode | null {
  let cur: Record<string, CampaignNode> | undefined = root;
  let node: CampaignNode | null = null;
  
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    node = cur?.[key] ?? null;
    if (!node) return null;
    if (i === path.length - 1) return node;
    cur = node.then;
  }
  return null;
}

export function ensureThen(
  root: Record<string, CampaignNode>,
  path: string[]
): void {
  const node = getNodeAt(root, path);
  if (!node) return;
  if (!node.then) node.then = {};
}

export function defaultNode(): CampaignNode {
  return {
    message: '',
    risk: 'low',
    needs_followup: false,
  };
}

export function setNodeAt(
  root: Record<string, CampaignNode>,
  path: string[],
  updater: (prev: CampaignNode) => CampaignNode
): void {
  if (path.length === 0) return;
  
  let cur: Record<string, CampaignNode> | undefined = root;
  
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (i === path.length - 1) {
      cur[key] = updater(cur[key] || defaultNode());
      return;
    }
    const node: CampaignNode | undefined = cur[key];
    if (!node) return;
    if (!node.then) node.then = {};
    cur = node.then;
  }
}

export function deleteNodeAt(
  root: Record<string, CampaignNode>,
  path: string[]
): void {
  if (path.length === 0) return;
  
  if (path.length === 1) {
    delete root[path[0]];
    return;
  }
  
  const parentPath = path.slice(0, -1);
  const lastKey = path[path.length - 1];
  const parent = getNodeAt(root, parentPath);
  
  if (!parent?.then) return;
  delete parent.then[lastKey];
}

export function traverse(
  root: Record<string, CampaignNode>,
  cb: (node: CampaignNode, path: string[]) => void,
  basePath: string[] = []
): void {
  const keys = Object.keys(root || {}).sort((a, b) => Number(a) - Number(b));
  
  for (const k of keys) {
    const node = root[k];
    const path = [...basePath, k];
    cb(node, path);
    if (node?.then) {
      traverse(node.then, cb, path);
    }
  }
}
