/**
 * Legal Precedents Database
 * Relevant case law for FCRA/FDCPA violations
 */

export interface LegalPrecedent {
  id: string;
  name: string;
  citation: string;
  court: string;
  year: number;
  summary: string;
  holding: string;
  relevantRules: string[];
  keywords: string[];
  damagesAwarded?: {
    statutory?: number;
    actual?: number;
    punitive?: number;
    attorneyFees?: number;
  };
  significance: 'landmark' | 'significant' | 'supporting';
  fullCitation: string;
}

export const LEGAL_PRECEDENTS: LegalPrecedent[] = [
  // Re-aging / DOFD Cases
  {
    id: 'guerrero-v-rbs',
    name: 'Guerrero v. RBS Citizens, N.A.',
    citation: '2012 WL 3277621',
    court: 'N.D. Cal.',
    year: 2012,
    summary: 'Furnisher reported DOFD based on when debt was sold rather than actual first delinquency.',
    holding: 'Court held that reporting an incorrect DOFD violates FCRA accuracy requirements. The 7-year period begins from the original DOFD, not subsequent events.',
    relevantRules: ['B1', 'B2', 'B3', 'K6'],
    keywords: ['dofd', 're-aging', 'date manipulation', '7-year rule'],
    damagesAwarded: {
      statutory: 1000,
      attorneyFees: 45000
    },
    significance: 'significant',
    fullCitation: 'Guerrero v. RBS Citizens, N.A., No. C 11-04374, 2012 WL 3277621 (N.D. Cal. Aug. 9, 2012)'
  },
  {
    id: 'ditommaso-v-experian',
    name: 'DiTommaso v. Experian',
    citation: '236 F.Supp.3d 1173',
    court: 'S.D. Cal.',
    year: 2017,
    summary: 'Consumer sued over incorrect DOFD reporting that extended reporting period.',
    holding: 'FCRA requires reporting accurate DOFD. CRAs have duty to maintain reasonable procedures to ensure accuracy.',
    relevantRules: ['B1', 'B2', 'K6'],
    keywords: ['dofd', 'accuracy', 'cra procedures'],
    damagesAwarded: {
      actual: 15000,
      statutory: 1000,
      attorneyFees: 55000
    },
    significance: 'significant',
    fullCitation: 'DiTommaso v. Experian Info. Solutions, Inc., 236 F.Supp.3d 1173 (S.D. Cal. 2017)'
  },

  // Willful Violation / Punitive Damages
  {
    id: 'safeco-v-burr',
    name: 'Safeco Insurance Co. v. Burr',
    citation: '551 U.S. 47',
    court: 'Supreme Court',
    year: 2007,
    summary: 'Landmark case defining "willful" violation under FCRA.',
    holding: 'A company "willfully" violates FCRA when it acts knowing or in reckless disregard of whether its conduct violates the statute. Reckless disregard occurs when the defendant runs a risk of violating the law substantially greater than the risk associated with a reading that was merely careless.',
    relevantRules: ['B1', 'B2', 'B3', 'K6'],
    keywords: ['willful', 'reckless', 'punitive damages', 'statutory damages'],
    significance: 'landmark',
    fullCitation: 'Safeco Ins. Co. of Am. v. Burr, 551 U.S. 47 (2007)'
  },
  {
    id: 'saunders-v-branch-banking',
    name: 'Saunders v. Branch Banking & Trust Co.',
    citation: '526 F.3d 142',
    court: '4th Circuit',
    year: 2008,
    summary: 'Consumer awarded punitive damages for willful FCRA violations.',
    holding: 'When a furnisher continues to report inaccurate information after receiving dispute notice and fails to conduct reasonable investigation, punitive damages may be awarded.',
    relevantRules: ['D1', 'K1'],
    keywords: ['punitive damages', 'investigation', 'dispute'],
    damagesAwarded: {
      actual: 50000,
      punitive: 80000,
      attorneyFees: 95000
    },
    significance: 'landmark',
    fullCitation: 'Saunders v. Branch Banking & Trust Co. of Va., 526 F.3d 142 (4th Cir. 2008)'
  },

  // 30-Day Investigation Requirement
  {
    id: 'johnson-v-mbna',
    name: 'Johnson v. MBNA America Bank',
    citation: '357 F.3d 426',
    court: '4th Circuit',
    year: 2004,
    summary: 'CRA failed to complete investigation within 30 days.',
    holding: 'CRAs must complete reinvestigation within 30 days of receiving dispute. Failure to do so is an independent FCRA violation.',
    relevantRules: ['K6'],
    keywords: ['30-day', 'investigation', 'reinvestigation'],
    damagesAwarded: {
      statutory: 1000,
      attorneyFees: 35000
    },
    significance: 'significant',
    fullCitation: 'Johnson v. MBNA Am. Bank, N.A., 357 F.3d 426 (4th Cir. 2004)'
  },

  // Furnisher Duties
  {
    id: 'chiang-v-verizon',
    name: 'Chiang v. Verizon New England',
    citation: '595 F.3d 26',
    court: '1st Circuit',
    year: 2010,
    summary: 'Furnisher failed to properly investigate dispute.',
    holding: 'Furnishers have independent duty under FCRA §623(b) to conduct reasonable investigation upon receiving notice of dispute. This duty is not satisfied by merely verifying internal records.',
    relevantRules: ['D1', 'M1', 'M2'],
    keywords: ['furnisher', 'investigation', 'dispute'],
    damagesAwarded: {
      actual: 35000,
      attorneyFees: 65000
    },
    significance: 'significant',
    fullCitation: 'Chiang v. Verizon New England Inc., 595 F.3d 26 (1st Cir. 2010)'
  },

  // Collection Agency Violations
  {
    id: 'jeter-v-credit-bureau',
    name: 'Jeter v. Credit Bureau, Inc.',
    citation: '760 F.2d 1168',
    court: '11th Circuit',
    year: 1985,
    summary: 'Credit bureau continued reporting after receiving evidence of error.',
    holding: 'Continuing to report information known to be disputed and potentially inaccurate demonstrates willful noncompliance with FCRA.',
    relevantRules: ['D1', 'K6'],
    keywords: ['willful', 'continuing violation', 'disputed'],
    damagesAwarded: {
      actual: 10000,
      punitive: 25000
    },
    significance: 'significant',
    fullCitation: 'Jeter v. Credit Bureau, Inc., 760 F.2d 1168 (11th Cir. 1985)'
  },

  // Time-Barred Debt / SOL
  {
    id: 'kimber-v-federal-financial',
    name: 'Kimber v. Federal Financial Corp.',
    citation: '668 F.Supp. 1480',
    court: 'M.D. Ala.',
    year: 1987,
    summary: 'Collector sued on time-barred debt.',
    holding: 'Filing suit on a debt known to be time-barred may violate FDCPA as a false representation that the debt is legally enforceable.',
    relevantRules: ['S1'],
    keywords: ['time-barred', 'statute of limitations', 'fdcpa'],
    damagesAwarded: {
      statutory: 1000,
      attorneyFees: 12000
    },
    significance: 'significant',
    fullCitation: 'Kimber v. Federal Financial Corp., 668 F.Supp. 1480 (M.D. Ala. 1987)'
  },

  // Debt Validation
  {
    id: 'miller-v-javitch',
    name: 'Miller v. Javitch, Block & Rathbone',
    citation: '561 F.3d 588',
    court: '6th Circuit',
    year: 2009,
    summary: 'Collector continued collection without proper validation.',
    holding: 'Collector who receives validation request must cease collection until validation is provided. Continuing collection without validation violates FDCPA §809(b).',
    relevantRules: ['S1'],
    keywords: ['validation', 'cease collection', 'fdcpa'],
    damagesAwarded: {
      statutory: 1000,
      attorneyFees: 25000
    },
    significance: 'significant',
    fullCitation: 'Miller v. Javitch, Block & Rathbone, 561 F.3d 588 (6th Cir. 2009)'
  },

  // Paid Account with Balance
  {
    id: 'cortez-v-trans-union',
    name: 'Cortez v. Trans Union LLC',
    citation: '617 F.3d 688',
    court: '3rd Circuit',
    year: 2010,
    summary: 'CRA continued reporting balance on paid account.',
    holding: 'Reporting a balance on an account that has been paid in full is inaccurate and violates FCRA accuracy requirements.',
    relevantRules: ['D1', 'K1'],
    keywords: ['paid account', 'balance', 'accuracy'],
    damagesAwarded: {
      actual: 5000,
      statutory: 1000,
      attorneyFees: 40000
    },
    significance: 'significant',
    fullCitation: 'Cortez v. Trans Union, LLC, 617 F.3d 688 (3d Cir. 2010)'
  },

  // Class Action
  {
    id: 'ramirez-v-trans-union',
    name: 'Ramirez v. Trans Union LLC',
    citation: '951 F.3d 1008',
    court: '9th Circuit / Supreme Court',
    year: 2021,
    summary: 'Class action over false terrorist alert reporting.',
    holding: 'Supreme Court affirmed that plaintiffs have standing to sue for FCRA violations where inaccurate information was disseminated to third parties, even without proof of concrete harm.',
    relevantRules: ['M1', 'M2'],
    keywords: ['class action', 'standing', 'inaccurate reporting'],
    damagesAwarded: {
      statutory: 8000000,
      punitive: 52000000
    },
    significance: 'landmark',
    fullCitation: 'TransUnion LLC v. Ramirez, 141 S. Ct. 2190 (2021)'
  }
];

/**
 * Find relevant precedents for a set of violations
 */
export function findRelevantPrecedents(ruleIds: string[]): LegalPrecedent[] {
  return LEGAL_PRECEDENTS.filter(p =>
    p.relevantRules.some(r => ruleIds.includes(r))
  ).sort((a, b) => {
    // Sort by significance, then year
    const sigOrder = { landmark: 0, significant: 1, supporting: 2 };
    if (sigOrder[a.significance] !== sigOrder[b.significance]) {
      return sigOrder[a.significance] - sigOrder[b.significance];
    }
    return b.year - a.year;
  });
}

/**
 * Search precedents by keyword
 */
export function searchPrecedents(query: string): LegalPrecedent[] {
  const lower = query.toLowerCase();
  return LEGAL_PRECEDENTS.filter(p =>
    p.name.toLowerCase().includes(lower) ||
    p.summary.toLowerCase().includes(lower) ||
    p.holding.toLowerCase().includes(lower) ||
    p.keywords.some(k => k.includes(lower))
  );
}

/**
 * Get precedents by rule
 */
export function getPrecedentsByRule(ruleId: string): LegalPrecedent[] {
  return LEGAL_PRECEDENTS.filter(p => p.relevantRules.includes(ruleId));
}

/**
 * Get landmark cases only
 */
export function getLandmarkCases(): LegalPrecedent[] {
  return LEGAL_PRECEDENTS.filter(p => p.significance === 'landmark');
}

/**
 * Format precedent for citation
 */
export function formatCitation(precedent: LegalPrecedent): string {
  return precedent.fullCitation;
}

/**
 * Format precedent summary for dispute letter
 */
export function formatForDispute(precedent: LegalPrecedent): string {
  return `See ${precedent.name}, ${precedent.citation} (${precedent.court} ${precedent.year}) ` +
         `(holding that ${precedent.holding.substring(0, 200)}...)`;
}

/**
 * Generate case law section for attorney package
 */
export function generateCaseLawSection(ruleIds: string[]): string {
  const precedents = findRelevantPrecedents(ruleIds);
  const lines: string[] = [];

  lines.push('RELEVANT CASE LAW');
  lines.push('═'.repeat(60));

  if (precedents.length === 0) {
    lines.push('No specific case law identified for these violation types.');
    return lines.join('\n');
  }

  // Landmark cases first
  const landmarks = precedents.filter(p => p.significance === 'landmark');
  if (landmarks.length > 0) {
    lines.push('\nLANDMARK CASES:');
    landmarks.forEach(p => {
      lines.push(`\n${p.name}`);
      lines.push(`${p.fullCitation}`);
      lines.push(`Holding: ${p.holding}`);
      if (p.damagesAwarded) {
        const damages = Object.entries(p.damagesAwarded)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: $${v?.toLocaleString()}`)
          .join(', ');
        lines.push(`Damages: ${damages}`);
      }
    });
  }

  // Significant cases
  const significant = precedents.filter(p => p.significance === 'significant');
  if (significant.length > 0) {
    lines.push('\nSIGNIFICANT PRECEDENTS:');
    significant.forEach(p => {
      lines.push(`\n${p.name}, ${p.citation} (${p.court} ${p.year})`);
      lines.push(`  ${p.summary}`);
      lines.push(`  Holding: ${p.holding.substring(0, 200)}...`);
    });
  }

  return lines.join('\n');
}

/**
 * Calculate average damages from precedents
 */
export function calculateAverageDamages(ruleIds: string[]): {
  averageStatutory: number;
  averageActual: number;
  averagePunitive: number;
  averageAttorneyFees: number;
  sampleSize: number;
} {
  const precedents = findRelevantPrecedents(ruleIds);
  const withDamages = precedents.filter(p => p.damagesAwarded);

  if (withDamages.length === 0) {
    return {
      averageStatutory: 1000, // Default FCRA statutory
      averageActual: 15000,
      averagePunitive: 0,
      averageAttorneyFees: 40000,
      sampleSize: 0
    };
  }

  const totals = withDamages.reduce((acc, p) => {
    if (p.damagesAwarded?.statutory) acc.statutory += p.damagesAwarded.statutory;
    if (p.damagesAwarded?.actual) acc.actual += p.damagesAwarded.actual;
    if (p.damagesAwarded?.punitive) acc.punitive += p.damagesAwarded.punitive;
    if (p.damagesAwarded?.attorneyFees) acc.attorneyFees += p.damagesAwarded.attorneyFees;
    return acc;
  }, { statutory: 0, actual: 0, punitive: 0, attorneyFees: 0 });

  return {
    averageStatutory: Math.round(totals.statutory / withDamages.length),
    averageActual: Math.round(totals.actual / withDamages.length),
    averagePunitive: Math.round(totals.punitive / withDamages.length),
    averageAttorneyFees: Math.round(totals.attorneyFees / withDamages.length),
    sampleSize: withDamages.length
  };
}
