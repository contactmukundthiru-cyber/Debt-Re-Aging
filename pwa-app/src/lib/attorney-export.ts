/**
 * Attorney Export Package
 * Generate comprehensive documentation for legal consultation
 */

import { CreditFields, RuleFlag, RiskProfile } from './rules';
import { buildEvidencePackage, calculateDamages, EvidencePackage } from './evidence-builder';
import { findCollector, formatCollectorReport, CollectorMatch } from './collector-database';
import { buildDeadlineTracker, DeadlineTracker } from './countdown';

export interface AttorneyPackage {
  caseId: string;
  generatedAt: string;

  // Client information
  client: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    email?: string;
  };

  // Case summary
  caseSummary: {
    accountType: string;
    creditor: string;
    collector?: string;
    balance: string;
    totalViolations: number;
    highSeverityCount: number;
    caseStrength: 'strong' | 'moderate' | 'weak';
    litigationPotential: boolean;
    estimatedDamages: {
      statutory: { min: number; max: number };
      actual: number;
      punitive: boolean;
      total: { min: number; max: number };
    };
  };

  // Detailed violations
  violations: {
    ruleId: string;
    ruleName: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    legalCitations: string[];
    evidence: string[];
    analysis: string;
  }[];

  // Timeline
  timeline: {
    date: string;
    event: string;
    significance: string;
    flagged: boolean;
  }[];

  // Deadlines
  deadlines: {
    type: string;
    date: string;
    daysRemaining: number;
    status: string;
  }[];

  // Collector intelligence
  collectorIntel?: {
    name: string;
    type: string;
    riskLevel: string;
    cfpbComplaints: number;
    regulatoryActions: string[];
    knownIssues: string[];
  };

  // Legal analysis
  legalAnalysis: {
    applicableStatutes: {
      statute: string;
      section: string;
      relevance: string;
      damages: string;
    }[];
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };

  // Evidence checklist
  evidenceChecklist: {
    item: string;
    status: 'obtained' | 'needed' | 'optional';
    source: string;
  }[];

  // Procedural history
  proceduralHistory: {
    date: string;
    action: string;
    result?: string;
  }[];

  // Fee analysis
  feeAnalysis: {
    contingencyViable: boolean;
    estimatedFees: string;
    notes: string;
  };
}

/**
 * Build comprehensive attorney package
 */
export function buildAttorneyPackage(
  fields: CreditFields,
  flags: RuleFlag[],
  riskProfile: RiskProfile,
  clientInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    email?: string;
  },
  proceduralHistory?: { date: string; action: string; result?: string }[]
): AttorneyPackage {
  const caseId = `ATT-${Date.now().toString(36).toUpperCase()}`;
  const damages = calculateDamages(flags, fields);

  // Find collector information
  let collectorIntel: AttorneyPackage['collectorIntel'] | undefined;
  const collectorName = fields.furnisherOrCollector || fields.originalCreditor;
  if (collectorName) {
    const match = findCollector(collectorName);
    if (match) {
      collectorIntel = {
        name: match.collector.names[0],
        type: match.collector.type,
        riskLevel: match.collector.riskLevel,
        cfpbComplaints: match.collector.violations.cfpbComplaints,
        regulatoryActions: match.collector.regulatoryActions.map(a =>
          `${a.date}: ${a.agency} - ${a.action}`
        ),
        knownIssues: match.collector.knownIssues
      };
    }
  }

  // Build deadline tracker
  const tracker = buildDeadlineTracker(fields);

  return {
    caseId,
    generatedAt: new Date().toISOString(),

    client: clientInfo,

    caseSummary: {
      accountType: fields.accountType || 'Unknown',
      creditor: fields.originalCreditor || 'Unknown',
      collector: fields.furnisherOrCollector,
      balance: fields.currentBalance || '$0',
      totalViolations: flags.length,
      highSeverityCount: flags.filter(f => f.severity === 'high').length,
      caseStrength: riskProfile.disputeStrength === 'strong' ? 'strong' :
                    riskProfile.disputeStrength === 'moderate' ? 'moderate' : 'weak',
      litigationPotential: riskProfile.litigationPotential,
      estimatedDamages: {
        statutory: damages.statutory,
        actual: damages.actual.estimated,
        punitive: damages.punitive.possible,
        total: damages.total
      }
    },

    violations: flags.map(f => ({
      ruleId: f.ruleId,
      ruleName: f.ruleName,
      severity: f.severity,
      description: f.explanation,
      legalCitations: f.legalCitations,
      evidence: f.suggestedEvidence,
      analysis: generateViolationAnalysis(f, fields)
    })),

    timeline: buildTimeline(fields, flags),

    deadlines: tracker.countdowns.map(c => ({
      type: c.type,
      date: c.targetDate.toISOString().split('T')[0],
      daysRemaining: c.daysRemaining,
      status: c.isExpired ? 'EXPIRED' : c.urgency.toUpperCase()
    })),

    collectorIntel,

    legalAnalysis: buildLegalAnalysis(flags, riskProfile, fields),

    evidenceChecklist: buildEvidenceChecklist(flags, fields),

    proceduralHistory: proceduralHistory || [],

    feeAnalysis: analyzeFees(flags, riskProfile, damages)
  };
}

/**
 * Generate analysis for specific violation
 */
function generateViolationAnalysis(flag: RuleFlag, fields: CreditFields): string {
  const analyses: Record<string, string> = {
    'B1': `The DOFD (${fields.dofd || 'unknown'}) occurs after the Date Opened (${fields.dateOpened || 'unknown'}), which is chronologically impossible and suggests data manipulation or reporting error.`,
    'B2': `The account was opened on ${fields.dateOpened || 'unknown'}, but the DOFD is reported as ${fields.dofd || 'unknown'}. A gap of more than 6 months between account opening and first delinquency, combined with collection status, strongly indicates re-aging.`,
    'B3': `The DOFD (${fields.dofd || 'unknown'}) is reported after the charge-off date (${fields.chargeOffDate || 'unknown'}). This is impossible - an account must be delinquent before it can be charged off.`,
    'D1': `The account shows status "${fields.accountStatus || 'unknown'}" but reports a balance of ${fields.currentBalance || 'unknown'}. A paid or closed account should report $0 balance.`,
    'K6': `Based on the reported DOFD of ${fields.dofd || 'unknown'}, this account has exceeded the 7-year + 180-day reporting limit under FCRA §605 and must be removed.`,
    'S1': `Based on the last payment date of ${fields.dateLastPayment || 'unknown'} and the state of ${fields.stateCode || 'unknown'}, this debt may have exceeded the statute of limitations for legal collection.`
  };

  return analyses[flag.ruleId] ||
    `${flag.explanation} This constitutes a violation of ${flag.legalCitations.join(', ')}.`;
}

/**
 * Build timeline for attorney package
 */
function buildTimeline(fields: CreditFields, flags: RuleFlag[]): AttorneyPackage['timeline'] {
  const events: AttorneyPackage['timeline'] = [];

  if (fields.dateOpened) {
    events.push({
      date: fields.dateOpened,
      event: 'Account Opened',
      significance: 'Original account creation with creditor',
      flagged: false
    });
  }

  if (fields.dateLastPayment) {
    events.push({
      date: fields.dateLastPayment,
      event: 'Last Payment Made',
      significance: 'SOL clock begins from this date',
      flagged: false
    });
  }

  if (fields.dofd) {
    const dofdflagged = flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId));
    events.push({
      date: fields.dofd,
      event: 'Date of First Delinquency (DOFD)',
      significance: '7-year reporting clock begins here - CRITICAL DATE',
      flagged: dofdflagged
    });
  }

  if (fields.chargeOffDate) {
    events.push({
      date: fields.chargeOffDate,
      event: 'Charge-Off',
      significance: 'Account written off by original creditor',
      flagged: flags.some(f => f.ruleId === 'B3')
    });
  }

  if (fields.estimatedRemovalDate) {
    events.push({
      date: fields.estimatedRemovalDate,
      event: 'Reported Removal Date',
      significance: 'Date furnisher claims account will be removed',
      flagged: flags.some(f => f.ruleId === 'K6')
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Build legal analysis section
 */
function buildLegalAnalysis(
  flags: RuleFlag[],
  riskProfile: RiskProfile,
  fields: CreditFields
): AttorneyPackage['legalAnalysis'] {
  const statutes: AttorneyPackage['legalAnalysis']['applicableStatutes'] = [];
  const seenStatutes = new Set<string>();

  flags.forEach(flag => {
    flag.legalCitations.forEach(cite => {
      if (!seenStatutes.has(cite)) {
        seenStatutes.add(cite);
        statutes.push(getStatuteDetails(cite, flag));
      }
    });
  });

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Analyze strengths
  if (flags.filter(f => f.severity === 'high').length >= 2) {
    strengths.push('Multiple high-severity violations documented');
  }

  if (flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId))) {
    strengths.push('Clear evidence of date manipulation (re-aging)');
    strengths.push('Re-aging violations often indicate willful conduct supporting punitive damages');
  }

  if (flags.some(f => f.ruleId === 'K6')) {
    strengths.push('Account exceeds 7-year reporting limit - clear FCRA §605 violation');
  }

  if (riskProfile.litigationPotential) {
    strengths.push('Case profile suggests strong litigation potential');
  }

  // Analyze weaknesses
  if (!fields.dofd) {
    weaknesses.push('DOFD not clearly documented - may require additional evidence');
  }

  if (flags.filter(f => f.severity === 'high').length === 0) {
    weaknesses.push('No high-severity violations - case strength is moderate');
  }

  if (!fields.stateCode) {
    weaknesses.push('Consumer state unknown - cannot assess state-specific protections');
  }

  // Generate recommendations
  if (flags.some(f => f.severity === 'high')) {
    recommendations.push('File FCRA lawsuit in federal court');
    recommendations.push('Demand jury trial for enhanced damages potential');
  }

  if (flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId))) {
    recommendations.push('Subpoena complete account history from original creditor');
    recommendations.push('Request Metro 2 reporting history from all three bureaus');
  }

  recommendations.push('Preserve all credit report evidence with timestamps');
  recommendations.push('Document any actual damages (credit denials, higher rates)');

  return {
    applicableStatutes: statutes,
    strengths,
    weaknesses,
    recommendations
  };
}

/**
 * Get statute details
 */
function getStatuteDetails(cite: string, flag: RuleFlag): AttorneyPackage['legalAnalysis']['applicableStatutes'][0] {
  const details: Record<string, Omit<AttorneyPackage['legalAnalysis']['applicableStatutes'][0], 'relevance'>> = {
    'FCRA §605': {
      statute: 'Fair Credit Reporting Act §605',
      section: '15 U.S.C. § 1681c',
      damages: 'Statutory $100-$1,000; Actual; Punitive for willful; Attorney fees'
    },
    'FCRA §611': {
      statute: 'Fair Credit Reporting Act §611',
      section: '15 U.S.C. § 1681i',
      damages: 'Statutory $100-$1,000; Actual; Punitive for willful; Attorney fees'
    },
    'FCRA §623': {
      statute: 'Fair Credit Reporting Act §623',
      section: '15 U.S.C. § 1681s-2',
      damages: 'Actual damages; Punitive for willful; Attorney fees (limited private right)'
    },
    'FDCPA §807': {
      statute: 'Fair Debt Collection Practices Act §807',
      section: '15 U.S.C. § 1692e',
      damages: 'Statutory up to $1,000; Actual; Attorney fees'
    },
    'FDCPA §809': {
      statute: 'Fair Debt Collection Practices Act §809',
      section: '15 U.S.C. § 1692g',
      damages: 'Statutory up to $1,000; Actual; Attorney fees'
    }
  };

  const base = details[cite] || {
    statute: cite,
    section: 'See full text',
    damages: 'Varies by violation type'
  };

  return {
    ...base,
    relevance: `Violated by: ${flag.ruleName} - ${flag.explanation.substring(0, 100)}...`
  };
}

/**
 * Build evidence checklist
 */
function buildEvidenceChecklist(flags: RuleFlag[], fields: CreditFields): AttorneyPackage['evidenceChecklist'] {
  const checklist: AttorneyPackage['evidenceChecklist'] = [];

  // Always needed
  checklist.push({
    item: 'Current credit report from all three bureaus',
    status: 'needed',
    source: 'AnnualCreditReport.com'
  });

  checklist.push({
    item: 'Government-issued ID',
    status: 'needed',
    source: 'Client'
  });

  checklist.push({
    item: 'Proof of current address',
    status: 'needed',
    source: 'Client - utility bill or bank statement'
  });

  // Re-aging specific
  if (flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId))) {
    checklist.push({
      item: 'Historical credit reports showing original DOFD',
      status: 'needed',
      source: 'Client archives or credit monitoring service'
    });

    checklist.push({
      item: 'Original creditor account statements',
      status: 'needed',
      source: 'Subpoena to original creditor'
    });
  }

  // Balance/payment issues
  if (flags.some(f => ['D1', 'K1', 'K7'].includes(f.ruleId))) {
    checklist.push({
      item: 'Payment records (bank statements, canceled checks)',
      status: 'needed',
      source: 'Client'
    });

    checklist.push({
      item: 'Settlement agreement if applicable',
      status: 'optional',
      source: 'Client'
    });
  }

  // Dispute history
  checklist.push({
    item: 'All dispute letters sent',
    status: 'needed',
    source: 'Client'
  });

  checklist.push({
    item: 'Certified mail receipts',
    status: 'needed',
    source: 'Client'
  });

  checklist.push({
    item: 'Bureau/furnisher response letters',
    status: 'needed',
    source: 'Client'
  });

  // Damages evidence
  checklist.push({
    item: 'Credit denial letters',
    status: 'optional',
    source: 'Client'
  });

  checklist.push({
    item: 'Documentation of higher interest rates paid',
    status: 'optional',
    source: 'Client loan documents'
  });

  return checklist;
}

/**
 * Analyze fee viability
 */
function analyzeFees(
  flags: RuleFlag[],
  riskProfile: RiskProfile,
  damages: ReturnType<typeof calculateDamages>
): AttorneyPackage['feeAnalysis'] {
  const highCount = flags.filter(f => f.severity === 'high').length;
  const contingencyViable = highCount >= 2 || damages.total.max >= 5000;

  let estimatedFees = '';
  if (contingencyViable) {
    estimatedFees = 'Fee-shifting under FCRA makes contingency arrangement viable';
  } else {
    estimatedFees = 'Limited damages may require hourly arrangement or hybrid fee structure';
  }

  let notes = '';
  if (riskProfile.litigationPotential) {
    notes = 'Strong case for fee-shifting. FCRA provides for attorney fees to prevailing plaintiffs. ';
  }
  if (damages.punitive.possible) {
    notes += 'Punitive damages potential enhances case value. ';
  }
  if (highCount >= 3) {
    notes += 'Multiple violations may support class action investigation.';
  }

  return {
    contingencyViable,
    estimatedFees,
    notes: notes.trim()
  };
}

/**
 * Format attorney package as document
 */
export function formatAttorneyPackage(pkg: AttorneyPackage): string {
  const lines: string[] = [];

  lines.push('═'.repeat(70));
  lines.push('         ATTORNEY CONSULTATION PACKAGE');
  lines.push('              FCRA/FDCPA MATTER');
  lines.push('═'.repeat(70));
  lines.push('');
  lines.push(`Case ID: ${pkg.caseId}`);
  lines.push(`Generated: ${new Date(pkg.generatedAt).toLocaleString()}`);
  lines.push('');
  lines.push('═'.repeat(70));
  lines.push('CLIENT INFORMATION');
  lines.push('═'.repeat(70));
  lines.push(`Name: ${pkg.client.name}`);
  lines.push(`Address: ${pkg.client.address}`);
  lines.push(`City/State/ZIP: ${pkg.client.city}, ${pkg.client.state} ${pkg.client.zip}`);
  if (pkg.client.phone) lines.push(`Phone: ${pkg.client.phone}`);
  if (pkg.client.email) lines.push(`Email: ${pkg.client.email}`);
  lines.push('');

  lines.push('═'.repeat(70));
  lines.push('CASE SUMMARY');
  lines.push('═'.repeat(70));
  lines.push(`Account Type: ${pkg.caseSummary.accountType}`);
  lines.push(`Original Creditor: ${pkg.caseSummary.creditor}`);
  if (pkg.caseSummary.collector) lines.push(`Current Collector: ${pkg.caseSummary.collector}`);
  lines.push(`Reported Balance: ${pkg.caseSummary.balance}`);
  lines.push('');
  lines.push(`Total Violations: ${pkg.caseSummary.totalViolations}`);
  lines.push(`High Severity: ${pkg.caseSummary.highSeverityCount}`);
  lines.push(`Case Strength: ${pkg.caseSummary.caseStrength.toUpperCase()}`);
  lines.push(`Litigation Potential: ${pkg.caseSummary.litigationPotential ? 'YES' : 'NO'}`);
  lines.push('');
  lines.push('ESTIMATED DAMAGES:');
  lines.push(`  Statutory: $${pkg.caseSummary.estimatedDamages.statutory.min} - $${pkg.caseSummary.estimatedDamages.statutory.max}`);
  lines.push(`  Actual: $${pkg.caseSummary.estimatedDamages.actual}`);
  lines.push(`  Punitive Possible: ${pkg.caseSummary.estimatedDamages.punitive ? 'YES' : 'NO'}`);
  lines.push(`  TOTAL RANGE: $${pkg.caseSummary.estimatedDamages.total.min} - $${pkg.caseSummary.estimatedDamages.total.max}`);
  lines.push('');

  lines.push('═'.repeat(70));
  lines.push('VIOLATIONS');
  lines.push('═'.repeat(70));
  pkg.violations.forEach((v, i) => {
    lines.push('');
    lines.push(`${i + 1}. ${v.ruleName} [${v.ruleId}] - ${v.severity.toUpperCase()}`);
    lines.push(`   ${v.description}`);
    lines.push(`   Legal Citations: ${v.legalCitations.join(', ')}`);
    lines.push(`   Analysis: ${v.analysis}`);
  });
  lines.push('');

  lines.push('═'.repeat(70));
  lines.push('LEGAL ANALYSIS');
  lines.push('═'.repeat(70));
  lines.push('');
  lines.push('APPLICABLE STATUTES:');
  pkg.legalAnalysis.applicableStatutes.forEach(s => {
    lines.push(`  ${s.statute} (${s.section})`);
    lines.push(`    Damages: ${s.damages}`);
    lines.push(`    Relevance: ${s.relevance}`);
    lines.push('');
  });
  lines.push('CASE STRENGTHS:');
  pkg.legalAnalysis.strengths.forEach(s => lines.push(`  • ${s}`));
  lines.push('');
  lines.push('POTENTIAL WEAKNESSES:');
  pkg.legalAnalysis.weaknesses.forEach(w => lines.push(`  • ${w}`));
  lines.push('');
  lines.push('RECOMMENDATIONS:');
  pkg.legalAnalysis.recommendations.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));
  lines.push('');

  if (pkg.collectorIntel) {
    lines.push('═'.repeat(70));
    lines.push('COLLECTOR INTELLIGENCE');
    lines.push('═'.repeat(70));
    lines.push(`Name: ${pkg.collectorIntel.name}`);
    lines.push(`Type: ${pkg.collectorIntel.type}`);
    lines.push(`Risk Level: ${pkg.collectorIntel.riskLevel.toUpperCase()}`);
    lines.push(`CFPB Complaints: ${pkg.collectorIntel.cfpbComplaints.toLocaleString()}`);
    if (pkg.collectorIntel.regulatoryActions.length > 0) {
      lines.push('Regulatory Actions:');
      pkg.collectorIntel.regulatoryActions.forEach(a => lines.push(`  • ${a}`));
    }
    lines.push('Known Issues:');
    pkg.collectorIntel.knownIssues.forEach(i => lines.push(`  • ${i}`));
    lines.push('');
  }

  lines.push('═'.repeat(70));
  lines.push('EVIDENCE CHECKLIST');
  lines.push('═'.repeat(70));
  pkg.evidenceChecklist.forEach(e => {
    const status = e.status === 'obtained' ? '☑' : e.status === 'needed' ? '☐' : '○';
    lines.push(`${status} ${e.item}`);
    lines.push(`    Source: ${e.source}`);
  });
  lines.push('');

  lines.push('═'.repeat(70));
  lines.push('FEE ANALYSIS');
  lines.push('═'.repeat(70));
  lines.push(`Contingency Viable: ${pkg.feeAnalysis.contingencyViable ? 'YES' : 'NO'}`);
  lines.push(`Assessment: ${pkg.feeAnalysis.estimatedFees}`);
  lines.push(`Notes: ${pkg.feeAnalysis.notes}`);
  lines.push('');

  lines.push('═'.repeat(70));
  lines.push('CONFIDENTIAL - ATTORNEY WORK PRODUCT');
  lines.push('═'.repeat(70));

  return lines.join('\n');
}
