/**
 * Evidence Package Builder
 * Compiles comprehensive court-ready documentation
 */

import { CreditFields, RuleFlag, RiskProfile } from './types';
import { ForensicImpactAssessment, assessForensicImpact } from './impact-assessment-engine';

export interface EvidenceItem {
  id: string;
  category: 'primary' | 'supporting' | 'reference';
  title: string;
  description: string;
  source: string;
  dateObtained?: string;
  verified: boolean;
  attachmentType?: 'document' | 'screenshot' | 'letter' | 'record';
  relevantRules: string[];
}

export interface EvidencePackage {
  caseId: string;
  createdAt: string;
  consumer: {
    name: string;
    state: string;
  };
  account: {
    creditor: string;
    collector?: string;
    accountNumber?: string;
    value: string;
  };
  summary: {
    totalViolations: number;
    highSeverity: number;
    impactAssessment: ForensicImpactAssessment;
    caseStrength: 'strong' | 'moderate' | 'weak';
  };
  timeline: TimelineEntry[];
  violations: ViolationDetail[];
  evidence: EvidenceItem[];
  legalBasis: LegalCitation[];
  recommendations: string[];
}

export interface TimelineEntry {
  date: string;
  event: string;
  significance: 'critical' | 'important' | 'contextual';
  source: string;
  flagged: boolean;
}

export interface ViolationDetail {
  ruleId: string;
  ruleName: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  evidence: string[];
  legalCitations: string[];
  potentialImpact: string;
}

export interface LegalCitation {
  statute: string;
  section: string;
  title: string;
  relevance: string;
  impact: string;
}

/**
 * Build a comprehensive evidence package
 */
export function buildEvidencePackage(
  fields: CreditFields,
  flags: RuleFlag[],
  riskProfile: RiskProfile,
  consumerName: string,
  consumerState: string
): EvidencePackage {
  const caseId = generateCaseId();
  const now = new Date().toISOString();

  return {
    caseId,
    createdAt: now,
    consumer: {
      name: consumerName,
      state: consumerState
    },
    account: {
      creditor: fields.originalCreditor || 'Unknown',
      collector: fields.furnisherOrCollector,
      value: fields.currentValue || '0.00'
    },
    summary: {
      totalViolations: flags.length,
      highSeverity: flags.filter(f => f.severity === 'high').length,
      impactAssessment: assessImpact(flags, fields),
      caseStrength: riskProfile.disputeStrength === 'strong' ? 'strong' :
                    riskProfile.disputeStrength === 'moderate' ? 'moderate' : 'weak'
    },
    timeline: buildDetailedTimeline(fields, flags),
    violations: buildViolationDetails(flags),
    evidence: buildEvidenceList(flags, fields),
    legalBasis: buildLegalBasis(flags),
    recommendations: buildRecommendations(flags, riskProfile)
  };
}

/**
 * Generate unique case ID
 */
function generateCaseId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CASE-${timestamp}-${random}`.toUpperCase();
}

/**
 * Assess impact of violations using the forensic engine
 */
export function assessImpact(flags: RuleFlag[], fields: CreditFields): ForensicImpactAssessment {
  return assessForensicImpact(flags, []);
}

/**
 * Build detailed timeline
 */
function buildDetailedTimeline(fields: CreditFields, flags: RuleFlag[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  if (fields.dateOpened) {
    entries.push({
      date: fields.dateOpened,
      event: 'Account Opened',
      significance: 'contextual',
      source: 'Credit Report',
      flagged: false
    });
  }

  if (fields.dateLastPayment) {
    entries.push({
      date: fields.dateLastPayment,
      event: 'Last Payment Made',
      significance: 'important',
      source: 'Credit Report',
      flagged: false
    });
  }

  if (fields.dofd) {
    const dofdflagged = flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId));
    entries.push({
      date: fields.dofd,
      event: 'Date of First Delinquency (DOFD)',
      significance: 'critical',
      source: 'Credit Report',
      flagged: dofdflagged
    });
  }

  if (fields.chargeOffDate) {
    const chargeOffFlagged = flags.some(f => f.ruleId === 'B3');
    entries.push({
      date: fields.chargeOffDate,
      event: 'Account Charged Off',
      significance: 'important',
      source: 'Credit Report',
      flagged: chargeOffFlagged
    });
  }

  if (fields.estimatedRemovalDate) {
    const removalFlagged = flags.some(f => f.ruleId === 'K6');
    entries.push({
      date: fields.estimatedRemovalDate,
      event: 'Estimated Removal Date',
      significance: 'critical',
      source: 'Credit Report',
      flagged: removalFlagged
    });
  }

  // Sort by date
  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Build violation details
 */
function buildViolationDetails(flags: RuleFlag[]): ViolationDetail[] {
  return flags.map(flag => ({
    ruleId: flag.ruleId,
    ruleName: flag.ruleName,
    severity: flag.severity,
    description: flag.explanation,
    evidence: flag.suggestedEvidence,
    legalCitations: flag.legalCitations,
    potentialImpact: flag.severity === 'high' ? 'High Forensic Severity' :
                      flag.severity === 'medium' ? 'Moderate Forensic Severity' : 'Contextual'
  }));
}

/**
 * Build evidence list
 */
function buildEvidenceList(flags: RuleFlag[], fields: CreditFields): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  let idCounter = 1;

  // Primary evidence: Credit reports
  evidence.push({
    id: `EV-${idCounter++}`,
    category: 'primary',
    title: 'Current Credit Report',
    description: 'Credit report showing the disputed account and dates',
    source: 'Credit Bureau',
    verified: true,
    attachmentType: 'document',
    relevantRules: flags.map(f => f.ruleId)
  });

  // Re-aging specific evidence
  if (flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId))) {
    evidence.push({
      id: `EV-${idCounter++}`,
      category: 'primary',
      title: 'Historical Credit Reports',
      description: 'Previous credit reports showing original DOFD before manipulation',
      source: 'AnnualCreditReport.com archives',
      verified: false,
      attachmentType: 'document',
      relevantRules: ['B1', 'B2', 'B3']
    });

    evidence.push({
      id: `EV-${idCounter++}`,
      category: 'primary',
      title: 'Timeline Comparison Analysis',
      description: 'Side-by-side comparison showing date changes',
      source: 'Generated Analysis',
      verified: true,
      attachmentType: 'document',
      relevantRules: ['B1', 'B2', 'B3']
    });
  }

  // Value/payment evidence
  if (flags.some(f => ['D1', 'K1', 'K7'].includes(f.ruleId))) {
    evidence.push({
      id: `EV-${idCounter++}`,
      category: 'primary',
      title: 'Payment Records',
      description: 'Bank statements, canceled checks, or receipts showing payments',
      source: 'Consumer Records',
      verified: false,
      attachmentType: 'document',
      relevantRules: ['D1', 'K1', 'K7']
    });
  }

  // Supporting evidence
  evidence.push({
    id: `EV-${idCounter++}`,
    category: 'supporting',
    title: 'Dispute Correspondence',
    description: 'Copies of all dispute letters sent to bureaus and furnisher',
    source: 'Consumer Records',
    verified: false,
    attachmentType: 'letter',
    relevantRules: flags.map(f => f.ruleId)
  });

  evidence.push({
    id: `EV-${idCounter++}`,
    category: 'supporting',
    title: 'Certified Mail Receipts',
    description: 'Proof of delivery for all dispute correspondence',
    source: 'USPS',
    verified: false,
    attachmentType: 'record',
    relevantRules: flags.map(f => f.ruleId)
  });

  // Reference materials
  evidence.push({
    id: `EV-${idCounter++}`,
    category: 'reference',
    title: 'FCRA Section 605 Text',
    description: '7-year reporting limitation statute',
    source: '15 U.S.C. § 1681c',
    verified: true,
    attachmentType: 'document',
    relevantRules: ['K6', 'B2']
  });

  evidence.push({
    id: `EV-${idCounter++}`,
    category: 'reference',
    title: 'Metro 2 Format Requirements',
    description: 'Industry standard for DOFD reporting',
    source: 'CDIA Metro 2 Format Guide',
    verified: true,
    attachmentType: 'document',
    relevantRules: ['M1', 'M2']
  });

  return evidence;
}

/**
 * Build legal basis citations
 */
function buildLegalBasis(flags: RuleFlag[]): LegalCitation[] {
  const citations: LegalCitation[] = [];
  const seen = new Set<string>();

  const citationDetails: Record<string, Omit<LegalCitation, 'relevance'>> = {
    'FCRA §605': {
      statute: 'Fair Credit Reporting Act',
      section: '15 U.S.C. § 1681c',
      title: 'Requirements relating to information contained in consumer reports',
      impact: 'Statutory Accountability; Punitive for Willful Noncompliance; Attorney Fee-Shifting'
    },
    'FCRA §611': {
      statute: 'Fair Credit Reporting Act',
      section: '15 U.S.C. § 1681i',
      title: 'Procedure in case of disputed accuracy',
      impact: 'Statutory Accountability; Punitive for Willful Noncompliance; Attorney Fee-Shifting'
    },
    'FCRA §623': {
      statute: 'Fair Credit Reporting Act',
      section: '15 U.S.C. § 1681s-2',
      title: 'Responsibilities of furnishers of information',
      impact: 'Civil Liability; Punitive for Willful Noncompliance; Attorney Fee-Shifting'
    },
    'FDCPA §807': {
      statute: 'Fair Debt Collection Practices Act',
      section: '15 U.S.C. § 1692e',
      title: 'False or misleading representations',
      impact: 'Statutory Accountability; Civil Liability; Attorney Fee-Shifting'
    },
    'FDCPA §809': {
      statute: 'Fair Debt Collection Practices Act',
      section: '15 U.S.C. § 1692g',
      title: 'Validation of debts',
      impact: 'Statutory Accountability; Civil Liability; Attorney Fee-Shifting'
    }
  };

  flags.forEach(flag => {
    flag.legalCitations.forEach(cite => {
      if (!seen.has(cite) && citationDetails[cite]) {
        seen.add(cite);
        citations.push({
          ...citationDetails[cite],
          relevance: `Violated by: ${flag.ruleName}`
        });
      }
    });
  });

  return citations;
}

/**
 * Build recommendations
 */
function buildRecommendations(flags: RuleFlag[], riskProfile: RiskProfile): string[] {
  const recs: string[] = [];

  // Always include
  recs.push('Preserve all evidence including original credit reports');
  recs.push('Document any material impact on credit eligibility or reported terms');

  // Based on case strength
  if (riskProfile.litigationPotential) {
    recs.push('Consult with FCRA/consumer protection attorney');
    recs.push('Consider formal litigation to ensure full statutory compliance');
  }

  // Re-aging specific
  if (flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId))) {
    recs.push('Request complete account history from original creditor');
    recs.push('File CFPB complaint citing date manipulation');
  }

  // Collection specific
  if (flags.some(f => f.ruleId === 'S1')) {
    recs.push('Research statute of limitations in your state');
    recs.push('Send cease and desist if debt is time-barred');
  }

  // Multiple violations
  if (flags.length >= 3) {
    recs.push('Document pattern of violations for forensic integrity assessment');
    recs.push('Consider class action investigation if others are similarly affected');
  }

  return recs;
}

/**
 * Generate formatted evidence package document
 */
export function formatEvidencePackage(pkg: EvidencePackage): string {
  const lines: string[] = [];

  lines.push('═'.repeat(70));
  lines.push('                    EVIDENCE PACKAGE');
  lines.push('                  FCRA/FDCPA VIOLATIONS');
  lines.push('═'.repeat(70));
  lines.push('');
  lines.push(`Case ID: ${pkg.caseId}`);
  lines.push(`Generated: ${new Date(pkg.createdAt).toLocaleString()}`);
  lines.push(`Consumer: ${pkg.consumer.name}`);
  lines.push(`State: ${pkg.consumer.state}`);
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('ACCOUNT INFORMATION');
  lines.push('─'.repeat(70));
  lines.push(`Original Creditor: ${pkg.account.creditor}`);
  if (pkg.account.collector) lines.push(`Collection Agency: ${pkg.account.collector}`);
  lines.push(`Reported Value: ${pkg.account.value}`);
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('CASE SUMMARY');
  lines.push('─'.repeat(70));
  lines.push(`Total Violations: ${pkg.summary.totalViolations}`);
  lines.push(`High Severity: ${pkg.summary.highSeverity}`);
  lines.push(`Case Strength: ${pkg.summary.caseStrength.toUpperCase()}`);
  lines.push('');
  lines.push('LIABILITY ASSESSMENT:');
  lines.push(`  Statutory Accountability: ${pkg.summary.impactAssessment.statutory.eligible ? 'ELIBIGLE' : 'PENDING'}`);
  lines.push(`  Violation Logic: ${pkg.summary.impactAssessment.statutory.basis.join('; ')}`);
  lines.push(`  Culpability Level: ${pkg.summary.impactAssessment.culpability.level.toUpperCase()}`);
  lines.push(`  Attorney Fees: ${pkg.summary.impactAssessment.attorneyFees.recoverable ? 'RECOVERABLE' : 'PENDING'}`);
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('TIMELINE OF EVENTS');
  lines.push('─'.repeat(70));
  pkg.timeline.forEach(entry => {
    const marker = entry.flagged ? '⚠️ ' : '   ';
    const sig = entry.significance === 'critical' ? '[CRITICAL]' :
                entry.significance === 'important' ? '[IMPORTANT]' : '';
    lines.push(`${marker}${entry.date} - ${entry.event} ${sig}`);
    if (entry.flagged) lines.push(`      ↳ Source: ${entry.source}`);
  });
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('DOCUMENTED VIOLATIONS');
  lines.push('─'.repeat(70));
  pkg.violations.forEach((v, i) => {
    lines.push(`${i + 1}. ${v.ruleName} [${v.ruleId}] - ${v.severity.toUpperCase()}`);
    lines.push(`   ${v.description}`);
    lines.push(`   Legal Basis: ${v.legalCitations.join(', ')}`);
    lines.push(`   Forensic Impact: ${v.potentialImpact}`);
    lines.push('');
  });
  lines.push('─'.repeat(70));
  lines.push('EVIDENCE CHECKLIST');
  lines.push('─'.repeat(70));
  ['primary', 'supporting', 'reference'].forEach(cat => {
    lines.push(`\n${cat.toUpperCase()} EVIDENCE:`);
    pkg.evidence.filter(e => e.category === cat).forEach(e => {
      const check = e.verified ? '☑' : '☐';
      lines.push(`${check} ${e.title}`);
      lines.push(`    ${e.description}`);
      lines.push(`    Source: ${e.source}`);
    });
  });
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('LEGAL BASIS');
  lines.push('─'.repeat(70));
  pkg.legalBasis.forEach(cite => {
    lines.push(`\n${cite.statute}`);
    lines.push(`Section: ${cite.section}`);
    lines.push(`Title: ${cite.title}`);
    lines.push(`Relevance: ${cite.relevance}`);
    lines.push(`Statutory Impact: ${cite.impact}`);
  });
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('RECOMMENDED ACTIONS');
  lines.push('─'.repeat(70));
  pkg.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });
  lines.push('');
  lines.push('═'.repeat(70));
  lines.push('THIS DOCUMENT IS CONFIDENTIAL ATTORNEY-CLIENT WORK PRODUCT');
  lines.push('═'.repeat(70));

  return lines.join('\n');
}
