import { describe, it, expect } from 'vitest';
import {
  normalizeTree,
  sortNumericKeys,
  pathToString,
  getNodeAt,
  defaultNode,
} from '../tree';
import { exportCampaign } from '../export';
import { buildIssues } from '../validation';
import { makeChoicesBlock, replaceOrAppendChoices } from '../choices';
import type { CampaignNode } from '../../types';

describe('tree utilities', () => {
  describe('normalizeTree', () => {
    it('should renumber keys to be consecutive starting at 1', () => {
      const input: Record<string, { v: number }> = { '2': { v: 2 }, '10': { v: 10 }, '1': { v: 1 } };
      const result = normalizeTree<{ v: number }>(input);
      
      expect(Object.keys(result)).toEqual(['1', '2', '3']);
      expect(result['1'].v).toBe(1);
      expect(result['2'].v).toBe(2);
      expect(result['3'].v).toBe(10);
    });

    it('should handle empty object', () => {
      expect(normalizeTree({})).toEqual({});
    });

    it('should handle null/undefined', () => {
      expect(normalizeTree(null)).toEqual({});
      expect(normalizeTree(undefined)).toEqual({});
    });
  });

  describe('sortNumericKeys', () => {
    it('should sort keys numerically', () => {
      const input = { '10': 'a', '2': 'b', '1': 'c' };
      const result = sortNumericKeys(input);
      
      expect(Object.keys(result)).toEqual(['1', '2', '10']);
    });
  });

  describe('pathToString', () => {
    it('should join path parts with dots', () => {
      expect(pathToString(['3', '1', '2'])).toBe('3.1.2');
      expect(pathToString(['1'])).toBe('1');
      expect(pathToString([])).toBe('');
    });
  });

  describe('getNodeAt', () => {
    const tree: Record<string, CampaignNode> = {
      '1': { message: 'Node 1' },
      '2': {
        message: 'Node 2',
        then: {
          '1': { message: 'Node 2.1' },
          '2': {
            message: 'Node 2.2',
            then: {
              '1': { message: 'Node 2.2.1' },
            },
          },
        },
      },
    };

    it('should get root level node', () => {
      const node = getNodeAt(tree, ['1']);
      expect(node?.message).toBe('Node 1');
    });

    it('should get nested node', () => {
      const node = getNodeAt(tree, ['2', '1']);
      expect(node?.message).toBe('Node 2.1');
    });

    it('should get deeply nested node', () => {
      const node = getNodeAt(tree, ['2', '2', '1']);
      expect(node?.message).toBe('Node 2.2.1');
    });

    it('should return null for non-existent path', () => {
      expect(getNodeAt(tree, ['99'])).toBeNull();
      expect(getNodeAt(tree, ['1', '1'])).toBeNull();
    });
  });

  describe('defaultNode', () => {
    it('should create a default node', () => {
      const node = defaultNode();
      expect(node.message).toBe('');
      expect(node.risk).toBe('low');
      expect(node.needs_followup).toBe(false);
    });
  });
});

describe('export utilities', () => {
  describe('exportCampaign', () => {
    it('should export campaign with normalized keys', () => {
      const tree: Record<string, CampaignNode> = {
        '1': {
          message: 'Q',
          risk: 'low',
          then: {
            '2': { message: 'B', risk: 'high' },
          },
        },
      };
      
      const result = exportCampaign('TestCampaign', tree);
      
      expect(result.TestCampaign).toBeDefined();
      const root1 = result.TestCampaign['1'] as any;
      expect(root1.then['1']).toBeDefined();
      expect(root1.then['1'].message).toBe('B');
    });

    it('should strip _label from output', () => {
      const tree: Record<string, CampaignNode> = {
        '1': {
          message: 'Test',
          _label: 'This should be stripped',
        },
      };
      
      const result = exportCampaign('Test', tree);
      
      expect((result.Test['1'] as any)._label).toBeUndefined();
    });
  });
});

describe('validation utilities', () => {
  describe('buildIssues', () => {
    it('should report empty campaign name', () => {
      const issues = buildIssues('', { '1': { message: 'Test' } });
      expect(issues.some((i) => i.type === 'error')).toBe(true);
    });

    it('should report empty message', () => {
      const issues = buildIssues('Test', { '1': { message: '' } });
      expect(issues.some((i) => i.type === 'error')).toBe(true);
    });

    it('should report no options', () => {
      const issues = buildIssues('Test', {});
      expect(issues.some((i) => i.type === 'error')).toBe(true);
    });

    it('should pass valid config', () => {
      const issues = buildIssues('Test', {
        '1': { message: 'Valid message', risk: 'low' },
      });
      
      const errors = issues.filter((i) => i.type === 'error');
      expect(errors.length).toBe(0);
    });
  });
});

describe('choices utilities', () => {
  describe('makeChoicesBlock', () => {
    it('should create Reply block from labels', () => {
      const block = makeChoicesBlock(['Option A', 'Option B']);
      expect(block).toBe('Reply:\n1 - Option A\n2 - Option B');
    });

    it('should use default labels for empty strings', () => {
      const block = makeChoicesBlock(['', 'B']);
      expect(block).toContain('1 - Option 1');
      expect(block).toContain('2 - B');
    });
  });

  describe('replaceOrAppendChoices', () => {
    it('should append Reply block to message without one', () => {
      const result = replaceOrAppendChoices('Hello', 'Reply:\n1 - A');
      expect(result).toBe('Hello\n\nReply:\n1 - A');
    });

    it('should replace existing Reply block', () => {
      const original = 'Hello\n\nReply:\n1 - Old';
      const result = replaceOrAppendChoices(original, 'Reply:\n1 - New');
      expect(result).toContain('Reply:\n1 - New');
      expect(result).not.toContain('Old');
    });
  });
});

