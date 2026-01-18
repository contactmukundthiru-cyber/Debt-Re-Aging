/**
 * Application-wide type definitions
 * Provides proper typing for components and eliminates 'any' usage
 */

import { RuleFlag, RiskProfile, CreditFields } from '../lib/rules';
import { CaseLaw } from '../lib/caselaw';
import { Dispute, DisputeStatus } from '../lib/dispute-tracker';
import { AnalysisRecord } from '../lib/storage';

// ============================================================================
// Step Component Types
// ============================================================================

export type Step = 1 | 2 | 3 | 4 | 5 | 6;

export type ExportTab = 'letters' | 'attorney' | 'evidence' | 'cfpb' | 'summary';

// ============================================================================
// Consumer Information
// ============================================================================

export interface ConsumerInfo {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ssn?: string;
  dob?: string;
  phone?: string;
  email?: string;
}

// ============================================================================
// Analysis Result Types
// ============================================================================

export interface AnalyzedAccount {
  id: string;
  creditor: string;
  collector?: string;
  accountNumber?: string;
  accountType: string;
  balance: string;
  status: string;
  openDate?: string;
  dofd?: string;
  flags: RuleFlag[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExecutiveSummary {
  totalAccounts: number;
  accountsWithIssues: number;
  totalViolations: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  discrepancies: AccountDiscrepancy[];
  recommendations: string[];
}

export interface AccountDiscrepancy {
  field: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  values: DiscrepancyValue[];
}

export interface DiscrepancyValue {
  source: string;
  value: string;
}

// ============================================================================
// Dispute Tracking Types
// ============================================================================

export interface DisputeStats {
  total: number;
  active: number;
  resolved: number;
  favorable: number;
  unfavorable: number;
  pending: number;
  averageResolutionDays: number;
  successRate: number;
}

// ============================================================================
// Damage Estimation Types
// ============================================================================

export interface DamageEstimate {
  statutory: {
    min: number;
    max: number;
    expected: number;
  };
  actual: {
    creditDenials: number;
    emotionalDistress: number;
    outOfPocket: number;
    total: number;
  };
  punitive: {
    eligible: boolean;
    min: number;
    max: number;
    expected: number;
  };
  attorneyFees: {
    min: number;
    max: number;
    expected: number;
  };
  total: {
    min: number;
    max: number;
    expected: number;
  };
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsData {
  timeline: TimelineEvent[];
  breakdown: ScoreBreakdown;
  patterns: PatternInsight[];
  actions: ActionItem[];
  metrics: ForensicMetrics;
}

export interface TimelineEvent {
  date: string;
  type: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ScoreBreakdown {
  categories: ScoreCategory[];
  total: number;
}

export interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  issues: string[];
}

export interface PatternInsight {
  id: string;
  name: string;
  description: string;
  confidence: number;
  affectedRules: string[];
}

export interface ActionItem {
  priority: number;
  action: string;
  deadline?: string;
  reason: string;
}

export interface ForensicMetrics {
  dateIntegrity: number;
  balanceConsistency: number;
  statusAccuracy: number;
  complianceScore: number;
}

// ============================================================================
// Evidence and Attorney Package Types
// ============================================================================

export interface EvidencePackage {
  createdAt: string;
  consumer: ConsumerInfo;
  violations: ViolationEvidence[];
  documents: EvidenceDocument[];
  timeline: TimelineEvent[];
  summary: string;
}

export interface ViolationEvidence {
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  legalBasis: string[];
}

export interface EvidenceDocument {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface AttorneyPackage {
  caseNumber: string;
  createdAt: string;
  consumer: ConsumerInfo;
  summary: CaseSummary;
  violations: DetailedViolation[];
  damages: DamageEstimate;
  evidence: EvidencePackage;
  recommendations: string[];
}

export interface CaseSummary {
  overview: string;
  keyFindings: string[];
  legalBasis: string[];
  recommendedActions: string[];
}

export interface DetailedViolation {
  ruleId: string;
  ruleName: string;
  statute: string;
  description: string;
  evidence: string[];
  damages: {
    statutory: number;
    actual: number;
  };
}

// ============================================================================
// Complaint Strength Estimation
// ============================================================================

export interface ComplaintStrength {
  score: number; // 0-100
  level: 'weak' | 'moderate' | 'strong' | 'very_strong';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// ============================================================================
// Function Types for Step Components
// ============================================================================

export type CreateDisputeFunction = (
  account: Dispute['account'],
  type: Dispute['type'],
  reason: string,
  violations: string[],
  bureau?: 'experian' | 'equifax' | 'transunion'
) => Dispute;

export type UpdateDisputeStatusFunction = (
  disputeId: string,
  newStatus: DisputeStatus,
  notes?: string
) => Dispute | null;

export type LoadDisputesFunction = () => Dispute[];

export type GetDisputeStatsFunction = () => DisputeStats;

export type GenerateLetterFunction = (
  fields: Partial<CreditFields>,
  flags: RuleFlag[],
  consumer: ConsumerInfo
) => string;

export type BuildPackageFunction = (
  fields: Partial<CreditFields>,
  flags: RuleFlag[],
  consumer: ConsumerInfo,
  riskProfile: RiskProfile
) => EvidencePackage | AttorneyPackage;

export type FormatPackageFunction = (pkg: EvidencePackage | AttorneyPackage) => string;

export type EstimateComplaintStrengthFunction = (
  flags: RuleFlag[],
  evidence: Record<string, string>
) => ComplaintStrength;

export type GenerateForensicReportFunction = (
  fields: Partial<CreditFields>,
  flags: RuleFlag[]
) => string;

export type FieldsToSimpleFunction = (fields: Record<string, unknown>) => Partial<CreditFields>;
