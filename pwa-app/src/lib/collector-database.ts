/**
 * Collector Database
 * Known collection agencies and violation patterns
 */

export interface CollectorProfile {
  id: string;
  names: string[];  // Various names/DBAs used
  parentCompany?: string;
  type: 'debt_buyer' | 'collection_agency' | 'law_firm' | 'creditor';

  // Violation history
  violations: {
    cfpbComplaints: number;
    lawsuits: number;
    fcraViolations: number;
    fdcpaViolations: number;
    lastUpdated: string;
  };

  // Common issues
  knownIssues: string[];

  // Regulatory actions
  regulatoryActions: {
    date: string;
    agency: string;
    action: string;
    amount?: number;
  }[];

  // Contact information
  contact: {
    address?: string;
    phone?: string;
    registeredAgent?: string;
  };

  // Risk assessment
  riskLevel: 'high' | 'medium' | 'low';
  litigationSuccess: 'high' | 'medium' | 'low';

  // Notes
  notes: string;
}

export interface CollectorMatch {
  collector: CollectorProfile;
  confidence: 'high' | 'medium' | 'low';
  matchedName: string;
  recommendations: string[];
}

/**
 * Database of known collectors with violation history
 */
export const COLLECTOR_DATABASE: CollectorProfile[] = [
  {
    id: 'portfolio-recovery',
    names: ['Portfolio Recovery Associates', 'PRA', 'Portfolio Recovery', 'PRA Group'],
    parentCompany: 'PRA Group, Inc.',
    type: 'debt_buyer',
    violations: {
      cfpbComplaints: 15000,
      lawsuits: 5000,
      fcraViolations: 2500,
      fdcpaViolations: 3000,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Re-aging of debt collection dates',
      'Suing on time-barred debt',
      'Inadequate debt validation',
      'Incorrect balance reporting',
      'Continuing collection after disputes'
    ],
    regulatoryActions: [
      {
        date: '2015-09',
        agency: 'CFPB',
        action: 'Consent Order for collection practices',
        amount: 19000000
      }
    ],
    contact: {
      address: '120 Corporate Blvd, Norfolk, VA 23502',
      registeredAgent: 'CT Corporation System'
    },
    riskLevel: 'high',
    litigationSuccess: 'high',
    notes: 'One of the largest debt buyers in the US. Heavily litigated. Extensive CFPB complaint history.'
  },
  {
    id: 'midland-credit',
    names: ['Midland Credit Management', 'MCM', 'Midland Funding', 'Encore Capital'],
    parentCompany: 'Encore Capital Group',
    type: 'debt_buyer',
    violations: {
      cfpbComplaints: 12000,
      lawsuits: 8000,
      fcraViolations: 2000,
      fdcpaViolations: 2500,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Filing lawsuits without proper documentation',
      'Re-aging DOFD on purchased debts',
      'Robo-signed affidavits',
      'Suing wrong consumers',
      'Collection on discharged debts'
    ],
    regulatoryActions: [
      {
        date: '2015-09',
        agency: 'CFPB',
        action: 'Consent Order for collection practices',
        amount: 42000000
      }
    ],
    contact: {
      address: '350 Camino de la Reina, San Diego, CA 92108',
      registeredAgent: 'Corporation Service Company'
    },
    riskLevel: 'high',
    litigationSuccess: 'high',
    notes: 'Largest debt buyer in US. Extensive litigation history. Multiple class actions.'
  },
  {
    id: 'lvnv-funding',
    names: ['LVNV Funding', 'LVNV Funding LLC', 'Resurgent Capital'],
    parentCompany: 'Sherman Financial Group',
    type: 'debt_buyer',
    violations: {
      cfpbComplaints: 8000,
      lawsuits: 4000,
      fcraViolations: 1500,
      fdcpaViolations: 1800,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Inadequate documentation for purchased debts',
      'DOFD manipulation',
      'Collection on time-barred debts',
      'Failure to validate debts',
      'Improper credit reporting'
    ],
    regulatoryActions: [],
    contact: {
      address: 'Greenville, SC',
      registeredAgent: 'Registered Agent Solutions'
    },
    riskLevel: 'high',
    litigationSuccess: 'medium',
    notes: 'Major debt buyer known for purchasing old debts and aggressive collection.'
  },
  {
    id: 'cavalry-spv',
    names: ['Cavalry SPV', 'Cavalry Portfolio Services', 'Cavalry Investments'],
    type: 'debt_buyer',
    violations: {
      cfpbComplaints: 5000,
      lawsuits: 2000,
      fcraViolations: 800,
      fdcpaViolations: 1000,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Pursuing time-barred debts',
      'Insufficient validation documentation',
      'Re-aging collection accounts',
      'Inaccurate balance reporting'
    ],
    regulatoryActions: [],
    contact: {},
    riskLevel: 'medium',
    litigationSuccess: 'medium',
    notes: 'Debt buyer with moderate complaint history.'
  },
  {
    id: 'convergent',
    names: ['Convergent Outsourcing', 'Convergent Revenue Cycle', 'Convergent Healthcare'],
    type: 'collection_agency',
    violations: {
      cfpbComplaints: 3000,
      lawsuits: 500,
      fcraViolations: 400,
      fdcpaViolations: 600,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Medical debt collection issues',
      'HIPAA concerns',
      'Balance inflation',
      'Improper credit reporting of medical debts'
    ],
    regulatoryActions: [],
    contact: {
      address: 'Renton, WA'
    },
    riskLevel: 'medium',
    litigationSuccess: 'medium',
    notes: 'Specializes in medical and healthcare debt collection.'
  },
  {
    id: 'enhanced-recovery',
    names: ['Enhanced Recovery Company', 'ERC', 'Enhanced Recovery Corp'],
    type: 'collection_agency',
    violations: {
      cfpbComplaints: 6000,
      lawsuits: 1500,
      fcraViolations: 700,
      fdcpaViolations: 900,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Harassing phone calls',
      'Collection on debts already paid',
      'Failure to validate',
      'Threatening language'
    ],
    regulatoryActions: [
      {
        date: '2020-01',
        agency: 'FTC',
        action: 'Settlement for debt collection practices',
        amount: 4000000
      }
    ],
    contact: {
      address: 'Jacksonville, FL'
    },
    riskLevel: 'medium',
    litigationSuccess: 'medium',
    notes: 'Large third-party collector with significant complaint volume.'
  },
  {
    id: 'transworld',
    names: ['Transworld Systems', 'TSI', 'Transworld Systems Inc'],
    type: 'collection_agency',
    violations: {
      cfpbComplaints: 4000,
      lawsuits: 800,
      fcraViolations: 500,
      fdcpaViolations: 600,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Student loan collection issues',
      'Medical debt practices',
      'Validation failures',
      'Credit reporting errors'
    ],
    regulatoryActions: [],
    contact: {
      address: 'Rohnert Park, CA'
    },
    riskLevel: 'medium',
    litigationSuccess: 'low',
    notes: 'One of the oldest collection agencies. Handles student loans and medical debt.'
  },
  {
    id: 'ic-system',
    names: ['IC System', 'IC System Inc', 'I.C. System'],
    type: 'collection_agency',
    violations: {
      cfpbComplaints: 3500,
      lawsuits: 600,
      fcraViolations: 400,
      fdcpaViolations: 500,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Utility debt collection',
      'Medical debt practices',
      'Communication violations',
      'Validation issues'
    ],
    regulatoryActions: [],
    contact: {
      address: 'St. Paul, MN'
    },
    riskLevel: 'low',
    litigationSuccess: 'low',
    notes: 'Large collector handling utility and medical accounts.'
  },
  {
    id: 'national-credit',
    names: ['National Credit Adjusters', 'NCA', 'National Credit Systems'],
    type: 'collection_agency',
    violations: {
      cfpbComplaints: 2000,
      lawsuits: 400,
      fcraViolations: 300,
      fdcpaViolations: 400,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Aggressive collection tactics',
      'Validation deficiencies',
      'Credit reporting accuracy'
    ],
    regulatoryActions: [],
    contact: {},
    riskLevel: 'medium',
    litigationSuccess: 'low',
    notes: 'Regional collector with moderate complaint history.'
  },
  {
    id: 'credit-collection-services',
    names: ['Credit Collection Services', 'CCS', 'CCS Collection'],
    type: 'collection_agency',
    violations: {
      cfpbComplaints: 1500,
      lawsuits: 300,
      fcraViolations: 200,
      fdcpaViolations: 300,
      lastUpdated: '2025-01'
    },
    knownIssues: [
      'Utility debt issues',
      'Balance disputes',
      'Communication timing'
    ],
    regulatoryActions: [],
    contact: {},
    riskLevel: 'low',
    litigationSuccess: 'low',
    notes: 'Handles utility and telecommunications debt.'
  }
];

/**
 * Search for collector in database
 */
export function findCollector(name: string): CollectorMatch | null {
  const normalizedSearch = normalizeCollectorName(name);

  for (const collector of COLLECTOR_DATABASE) {
    for (const collectorName of collector.names) {
      const normalizedCollector = normalizeCollectorName(collectorName);

      // Exact match
      if (normalizedCollector === normalizedSearch) {
        return {
          collector,
          confidence: 'high',
          matchedName: collectorName,
          recommendations: generateRecommendations(collector)
        };
      }

      // Partial match
      if (normalizedCollector.includes(normalizedSearch) ||
          normalizedSearch.includes(normalizedCollector)) {
        return {
          collector,
          confidence: 'medium',
          matchedName: collectorName,
          recommendations: generateRecommendations(collector)
        };
      }

      // Fuzzy match (shared words)
      const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
      const collectorWords = normalizedCollector.split(' ').filter(w => w.length > 2);
      const matchingWords = searchWords.filter(w => collectorWords.includes(w));

      if (matchingWords.length >= 2 || (matchingWords.length === 1 && searchWords.length === 1)) {
        return {
          collector,
          confidence: 'low',
          matchedName: collectorName,
          recommendations: generateRecommendations(collector)
        };
      }
    }
  }

  return null;
}

/**
 * Normalize collector name for matching
 */
function normalizeCollectorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(llc|inc|corp|ltd|lp|company|co|group|services|associates|management|funding)\b/g, '')
    .trim();
}

/**
 * Generate recommendations based on collector profile
 */
function generateRecommendations(collector: CollectorProfile): string[] {
  const recs: string[] = [];

  if (collector.riskLevel === 'high') {
    recs.push('This collector has a high complaint volume. Document all communications carefully.');
  }

  if (collector.violations.cfpbComplaints > 5000) {
    recs.push(`CFPB has received ${collector.violations.cfpbComplaints.toLocaleString()}+ complaints. Consider filing a CFPB complaint.`);
  }

  if (collector.type === 'debt_buyer') {
    recs.push('This is a debt buyer. Request complete chain of title documentation.');
    recs.push('Demand original signed contract from the original creditor.');
  }

  if (collector.regulatoryActions.length > 0) {
    const action = collector.regulatoryActions[0];
    recs.push(`Previous regulatory action: ${action.agency} ${action.action} (${action.date}).`);
  }

  collector.knownIssues.forEach(issue => {
    if (issue.toLowerCase().includes('re-aging') || issue.toLowerCase().includes('dofd')) {
      recs.push('Known for date manipulation issues. Verify DOFD carefully against original records.');
    }
    if (issue.toLowerCase().includes('time-barred') || issue.toLowerCase().includes('statute')) {
      recs.push('Known for collecting on time-barred debts. Verify statute of limitations in your state.');
    }
    if (issue.toLowerCase().includes('validation')) {
      recs.push('Known validation issues. Send debt validation letter immediately.');
    }
  });

  if (collector.litigationSuccess === 'high') {
    recs.push('Litigation against this collector has been successful. Consider consulting an FCRA attorney.');
  }

  return recs;
}

/**
 * Get collector risk summary
 */
export function getCollectorRiskSummary(collector: CollectorProfile): {
  overallRisk: 'high' | 'medium' | 'low';
  factors: string[];
  score: number;
} {
  let score = 0;
  const factors: string[] = [];

  // CFPB complaints
  if (collector.violations.cfpbComplaints > 10000) {
    score += 30;
    factors.push('Very high CFPB complaint volume');
  } else if (collector.violations.cfpbComplaints > 5000) {
    score += 20;
    factors.push('High CFPB complaint volume');
  } else if (collector.violations.cfpbComplaints > 2000) {
    score += 10;
    factors.push('Moderate CFPB complaint volume');
  }

  // Lawsuits
  if (collector.violations.lawsuits > 3000) {
    score += 20;
    factors.push('Frequently sued by consumers');
  } else if (collector.violations.lawsuits > 1000) {
    score += 10;
    factors.push('Significant lawsuit history');
  }

  // Regulatory actions
  if (collector.regulatoryActions.length > 0) {
    score += 25;
    factors.push('Previous regulatory enforcement action');
  }

  // Debt buyer status
  if (collector.type === 'debt_buyer') {
    score += 15;
    factors.push('Debt buyer (higher documentation risk)');
  }

  // Known issues count
  if (collector.knownIssues.length > 4) {
    score += 10;
    factors.push('Multiple known issue patterns');
  }

  return {
    overallRisk: score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low',
    factors,
    score: Math.min(100, score)
  };
}

/**
 * Format collector report
 */
export function formatCollectorReport(match: CollectorMatch): string {
  const c = match.collector;
  const summary = getCollectorRiskSummary(c);
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('        COLLECTOR INTELLIGENCE REPORT');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`Collector: ${match.matchedName}`);
  if (c.parentCompany) lines.push(`Parent Company: ${c.parentCompany}`);
  lines.push(`Type: ${c.type.replace('_', ' ').toUpperCase()}`);
  lines.push(`Match Confidence: ${match.confidence.toUpperCase()}`);
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('RISK ASSESSMENT');
  lines.push('─'.repeat(60));
  lines.push(`Overall Risk Level: ${summary.overallRisk.toUpperCase()}`);
  lines.push(`Risk Score: ${summary.score}/100`);
  lines.push('');
  lines.push('Risk Factors:');
  summary.factors.forEach(f => lines.push(`  • ${f}`));
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('VIOLATION HISTORY');
  lines.push('─'.repeat(60));
  lines.push(`CFPB Complaints: ${c.violations.cfpbComplaints.toLocaleString()}`);
  lines.push(`Consumer Lawsuits: ${c.violations.lawsuits.toLocaleString()}`);
  lines.push(`FCRA Violations: ${c.violations.fcraViolations.toLocaleString()}`);
  lines.push(`FDCPA Violations: ${c.violations.fdcpaViolations.toLocaleString()}`);
  lines.push(`Last Updated: ${c.violations.lastUpdated}`);
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('KNOWN ISSUES');
  lines.push('─'.repeat(60));
  c.knownIssues.forEach(issue => lines.push(`  • ${issue}`));
  lines.push('');

  if (c.regulatoryActions.length > 0) {
    lines.push('─'.repeat(60));
    lines.push('REGULATORY ACTIONS');
    lines.push('─'.repeat(60));
    c.regulatoryActions.forEach(action => {
      lines.push(`  ${action.date}: ${action.agency}`);
      lines.push(`    ${action.action}`);
      if (action.amount) lines.push(`    Penalty: $${action.amount.toLocaleString()}`);
    });
    lines.push('');
  }

  lines.push('─'.repeat(60));
  lines.push('RECOMMENDATIONS');
  lines.push('─'.repeat(60));
  match.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('NOTES');
  lines.push('─'.repeat(60));
  lines.push(c.notes);

  return lines.join('\n');
}

/**
 * Get all collectors sorted by risk
 */
export function getAllCollectorsByRisk(): CollectorProfile[] {
  return [...COLLECTOR_DATABASE].sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });
}

/**
 * Search collectors by name
 */
export function searchCollectors(query: string): CollectorProfile[] {
  const normalized = normalizeCollectorName(query);
  return COLLECTOR_DATABASE.filter(c =>
    c.names.some(name => normalizeCollectorName(name).includes(normalized))
  );
}
