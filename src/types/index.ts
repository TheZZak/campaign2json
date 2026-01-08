/**
 * Campaign Flow Types
 * 
 * These types define the structure of campaign decision trees
 * used by Student Success for SMS/voice campaigns.
 */

export type Risk = 'low' | 'medium' | 'high';

export const RISKS: Risk[] = ['low', 'medium', 'high'];

/**
 * A single node in the campaign decision tree.
 * Can have nested children via the `then` property.
 */
export interface CampaignNode {
  /** The message to send to the student */
  message: string;
  /** Risk level for follow-up prioritization */
  risk?: Risk;
  /** Whether a coordinator needs to follow up */
  needs_followup?: boolean;
  /** Nested options (sub-menu) */
  then?: Record<string, CampaignNode>;
  /** UI-only label for the option (not exported to JSON) */
  _label?: string;
}

/**
 * Root structure of a campaign config.
 * Key is the campaign ID (e.g., "F25Withdrawal")
 */
export type CampaignConfig = Record<string, Record<string, CampaignNode>>;

/**
 * Validation issue found in the campaign config
 */
export interface ValidationIssue {
  type: 'error' | 'warning';
  msg: string;
}

