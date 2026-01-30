'use strict';

/**
 * Forensic Impact Assessment Engine
 * 
 * Provides qualitative analysis of reporting violations without providing 
 * monetary estimates. Logic focuses on:
 * - Statutory Accountability (FCRA/FDCPA)
 * - Civil Liability Risk for Furnishers
 * - Evidence Strength for Litigation
 * - Attorney Fee-Shifting Eligibility
 */

import { RuleFlag } from './rules';
import { AdvancedRuleFlag } from './rules-advanced';
import { DetectedPattern } from './pattern-engine';

export interface ForensicImpactAssessment {
  statutory: {
    eligible: boolean;
    violationCount: number;
    basis: string[];
  };
  culpability: {
    level: 'negligent' | 'willful' | 'systemic';
    indicators: string[];
    riskScore: number;
  };
  litigationViability: {
    strength: 'low' | 'moderate' | 'high' | 'critical';
    factors: string[];
    documentationNeeded: string[];
  };
  attorneyFees: {
    recoverable: boolean;
    statutoryBasis: string[];
  };
  executiveSummary: {
    overallSeverity: 'low' | 'moderate' | 'high' | 'critical';
    recommendation: string;
  };
}

/**
 * Assess the forensic impact of detected violations and patterns.
 */
export function assessForensicImpact(
  flags: (RuleFlag | AdvancedRuleFlag)[],
  patterns: any[] = []
): ForensicImpactAssessment {
  const highCount = flags.filter(f => f.severity === 'high').length;
  const mediumCount = flags.filter(f => f.severity === 'medium').length;

  const fcraViolations = flags.filter(f => 
    !f.ruleId.startsWith('CP') && 
    (f.legalCitations?.some(c => c.includes('FCRA')) ?? false)
  );

  const fdcpaViolations = flags.filter(f => 
    f.ruleId.startsWith('CP') || 
    (f.legalCitations?.some(c => c.includes('FDCPA') || c.includes('1692')) ?? false)
  );

  const isSystemic = patterns.length > 0 || flags.some(f => f.ruleId.startsWith('S'));
  const isWillful = highCount >= 3 || flags.some(f => ['B1', 'B2', 'K6'].includes(f.ruleId));

  const indicators: string[] = [];
  if (isSystemic) indicators.push('Pattern of systemic reporting non-compliance');
  if (isWillful) indicators.push('High-confidence indicators of intentional re-aging');
  if (fcraViolations.length > 0) indicators.push('Multiple violations of FCRA § 623');

  return {
    statutory: {
      eligible: flags.length > 0,
      violationCount: flags.length,
      basis: [
        ...(fcraViolations.length > 0 ? ['Fair Credit Reporting Act (Statutory Basis)'] : []),
        ...(fdcpaViolations.length > 0 ? ['Fair Debt Collection Practices Act (Statutory Basis)'] : [])
      ]
    },
    culpability: {
      level: isSystemic ? 'systemic' : (isWillful ? 'willful' : 'negligent'),
      indicators,
      riskScore: Math.min(100, (highCount * 25) + (mediumCount * 10) + (patterns.length * 15))
    },
    litigationViability: {
      strength: highCount >= 2 ? 'critical' : (highCount >= 1 ? 'high' : (mediumCount >= 2 ? 'moderate' : 'low')),
      factors: [
        ...(highCount > 0 ? ['Direct evidence of re-aging'] : []),
        ...(isSystemic ? ['Systemic pattern increases litigation viability'] : []),
        ...(fcraViolations.length > 0 ? ['Clear statutory non-compliance'] : [])
      ],
      documentationNeeded: [
        'Full credit report from all three bureaus',
        'Certified mail receipts for all disputes',
        'Original account opening documentation'
      ]
    },
    attorneyFees: {
      recoverable: flags.length > 0,
      statutoryBasis: [
        ...(fcraViolations.length > 0 ? ['15 U.S.C. § 1681n', '15 U.S.C. § 1681o'] : []),
        ...(fdcpaViolations.length > 0 ? ['15 U.S.C. § 1692k'] : [])
      ]
    },
    executiveSummary: {
      overallSeverity: highCount >= 3 ? 'critical' : (highCount >= 1 ? 'high' : 'moderate'),
      recommendation: (highCount > 0 || isSystemic) 
        ? 'High forensic priority. Immediate referral for institutional oversight or legal review is recommended.'
        : 'Moderately rated. Formal dispute and monitoring process recommended.'
    }
  };
}

/**
 * Format assessment for professional report export
 */
export function formatForensicReport(assessment: ForensicImpactAssessment): string {
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push('                FORENSIC IMPACT ASSESSMENT report');
  lines.push('================================================================');
  lines.push('');
  lines.push(`FORENSIC SEVERITY:     ${assessment.executiveSummary.overallSeverity.toUpperCase()}`);
  lines.push(`VIOLATION COUNT:       ${assessment.statutory.violationCount}`);
  lines.push(`CULPABILITY LEVEL:     ${assessment.culpability.level.toUpperCase()}`);
  lines.push(`LITIGATION VIABILITY:  ${assessment.litigationViability.strength.toUpperCase()}`);
  lines.push(`ATTORNEY FEES:         ${assessment.attorneyFees.recoverable ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
  lines.push('');
  lines.push('CULPABILITY INDICATORS:');
  assessment.culpability.indicators.forEach(i => lines.push(` - ${i}`));
  lines.push('');
  lines.push('STATUTORY BASIS:');
  assessment.statutory.basis.forEach(b => lines.push(` - ${b}`));
  lines.push('');
  lines.push('RECOMMENDATION:');
  lines.push(assessment.executiveSummary.recommendation);

  return lines.join('\n');
}
