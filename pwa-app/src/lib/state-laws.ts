/**
 * State-Specific Legal Guidance for Credit Reporting & Debt Collection
 * Comprehensive database of state laws affecting debt disputes
 */

export interface StateLawProfile {
  code: string;
  name: string;
  sol: {
    writtenContracts: number;
    oralContracts: number;
    promissoryNotes: number;
    openAccounts: number;
  };
  interestCaps: {
    judgments: number;
    medical: number;
    consumer: number;
  };
  consumerProtections: {
    hasMiniCFPA: boolean;
    hasDebtBuyerLaw: boolean;
    hasMedicalDebtProtections: boolean;
    hasIdentityTheftProtections: boolean;
    hasPrivateRightOfAction: boolean;
  };
  keyStatutes: string[];
  specialNotes: string[];
  regulatoryBody: {
    name: string;
    url: string;
    complaintUrl?: string;
  };
}

// Comprehensive state law database
export const STATE_LAWS: Record<string, StateLawProfile> = {
  AL: {
    code: 'AL',
    name: 'Alabama',
    sol: { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6 },
    interestCaps: { judgments: 7.5, medical: 8.0, consumer: 8.0 },
    consumerProtections: {
      hasMiniCFPA: false, hasDebtBuyerLaw: false, hasMedicalDebtProtections: false,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: false
    },
    keyStatutes: ['Ala. Code § 6-2-34 (SOL)', 'Ala. Code § 8-8-1 (Interest)'],
    specialNotes: ['No state FDCPA equivalent', 'Must rely on federal protections'],
    regulatoryBody: { name: 'Alabama Attorney General', url: 'https://www.alabamaag.gov' }
  },
  AK: {
    code: 'AK',
    name: 'Alaska',
    sol: { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3 },
    interestCaps: { judgments: 10.5, medical: 5.0, consumer: 10.5 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: false, hasMedicalDebtProtections: false,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: ['AS 09.10.053 (SOL)', 'AS 45.50.471 (Consumer Protection)'],
    specialNotes: ['Short 3-year SOL on all debt types', 'Strong unfair practices act'],
    regulatoryBody: { name: 'Alaska Attorney General', url: 'https://law.alaska.gov' }
  },
  CA: {
    code: 'CA',
    name: 'California',
    sol: { writtenContracts: 4, oralContracts: 2, promissoryNotes: 4, openAccounts: 4 },
    interestCaps: { judgments: 10.0, medical: 5.0, consumer: 10.0 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: true, hasMedicalDebtProtections: true,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: [
      'Cal. Civ. Code § 1788 (Rosenthal FDCPA)',
      'Cal. Civ. Code § 1788.50-58 (Debt Buyer Law)',
      'Cal. Bus. & Prof. Code § 17200 (UCL)',
      'Cal. Civ. Code § 1798.99.80 (CCPA)'
    ],
    specialNotes: [
      'Rosenthal Act extends FDCPA to original creditors',
      'Debt buyers must provide extensive documentation',
      'Strong medical debt protections (SB 1061)',
      '$1,000 statutory damages per violation under Rosenthal'
    ],
    regulatoryBody: {
      name: 'California DFPI',
      url: 'https://dfpi.ca.gov',
      complaintUrl: 'https://dfpi.ca.gov/file-a-complaint/'
    }
  },
  CO: {
    code: 'CO',
    name: 'Colorado',
    sol: { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6 },
    interestCaps: { judgments: 8.0, medical: 8.0, consumer: 12.0 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: true, hasMedicalDebtProtections: true,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: [
      'C.R.S. § 5-16-101 (Fair Debt Collection)',
      'C.R.S. § 6-1-101 (Consumer Protection Act)',
      'HB 21-1198 (Medical Debt Protection)'
    ],
    specialNotes: [
      'Colorado Fair Debt Collection Practices Act',
      'Strong medical debt protections enacted 2021',
      'Collectors must be licensed'
    ],
    regulatoryBody: { name: 'Colorado Attorney General', url: 'https://coag.gov' }
  },
  FL: {
    code: 'FL',
    name: 'Florida',
    sol: { writtenContracts: 5, oralContracts: 4, promissoryNotes: 5, openAccounts: 5 },
    interestCaps: { judgments: 9.0, medical: 9.0, consumer: 18.0 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: false, hasMedicalDebtProtections: false,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: [
      'Fla. Stat. § 559.55-785 (Consumer Collection Practices Act)',
      'Fla. Stat. § 501.201 (Deceptive Practices Act)'
    ],
    specialNotes: [
      'Florida Consumer Collection Practices Act (FCCPA)',
      'More restrictive than federal FDCPA in some areas',
      'Homestead protections are strong'
    ],
    regulatoryBody: { name: 'Florida AG Consumer Protection', url: 'https://myfloridalegal.com' }
  },
  GA: {
    code: 'GA',
    name: 'Georgia',
    sol: { writtenContracts: 6, oralContracts: 4, promissoryNotes: 6, openAccounts: 6 },
    interestCaps: { judgments: 7.0, medical: 7.0, consumer: 7.0 },
    consumerProtections: {
      hasMiniCFPA: false, hasDebtBuyerLaw: false, hasMedicalDebtProtections: false,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: ['O.C.G.A. § 9-3-24 (SOL)', 'O.C.G.A. § 10-1-390 (FBPA)'],
    specialNotes: ['Fair Business Practices Act provides some protections', 'No state FDCPA equivalent'],
    regulatoryBody: { name: 'Georgia Governor\'s Office of Consumer Protection', url: 'https://consumer.georgia.gov' }
  },
  AZ: {
    code: 'AZ',
    name: 'Arizona',
    sol: { writtenContracts: 6, oralContracts: 3, promissoryNotes: 6, openAccounts: 6 },
    interestCaps: { judgments: 10.0, medical: 3.0, consumer: 10.0 },
    consumerProtections: {
      hasMiniCFPA: false, hasDebtBuyerLaw: false, hasMedicalDebtProtections: true,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: ['A.R.S. § 12-548 (SOL)', 'A.R.S. § 44-1521 (Consumer Fraud)'],
    specialNotes: ['Prop 209 (2022) lowered medical interest rates to 3%', 'Strong consumer fraud statute'],
    regulatoryBody: { name: 'Arizona Attorney General', url: 'https://azag.gov' }
  },
  NJ: {
    code: 'NJ',
    name: 'New Jersey',
    sol: { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6 },
    interestCaps: { judgments: 6.0, medical: 6.0, consumer: 6.0 },
    consumerProtections: {
      hasMiniCFPA: false, hasDebtBuyerLaw: false, hasMedicalDebtProtections: false,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: ['N.J.S.A. 2A:14-1 (SOL)', 'N.J.S.A. 56:8-1 (Consumer Fraud Act)'],
    specialNotes: ['CFA is one of the strongest in the nation', 'Treble damages and attorney fees'],
    regulatoryBody: { name: 'NJ Division of Consumer Affairs', url: 'https://njconsumeraffairs.gov' }
  },
  PA: {
    code: 'PA',
    name: 'Pennsylvania',
    sol: { writtenContracts: 4, oralContracts: 4, promissoryNotes: 4, openAccounts: 4 },
    interestCaps: { judgments: 6.0, medical: 6.0, consumer: 6.0 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: false, hasMedicalDebtProtections: false,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: ['42 Pa. C.S. § 5525 (SOL)', '73 P.S. § 201-1 (UTPCPL)'],
    specialNotes: ['Fair Credit Extension Uniformity Act (FCEUA)', 'Strong wage garnishment protections'],
    regulatoryBody: { name: 'PA Attorney General', url: 'https://attorneygeneral.gov' }
  },
  IL: {
    code: 'IL',
    name: 'Illinois',
    sol: { writtenContracts: 5, oralContracts: 5, promissoryNotes: 5, openAccounts: 5 },
    interestCaps: { judgments: 9.0, medical: 5.0, consumer: 9.0 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: true, hasMedicalDebtProtections: true,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: [
      '815 ILCS 505 (Consumer Fraud Act)',
      '225 ILCS 425 (Collection Agency Act)',
      'HB 2547 (Medical Debt Relief Act)'
    ],
    specialNotes: [
      'Collection Agency Act requires licensing',
      'Medical debt cannot appear on credit reports if paid within 365 days',
      'Strong Consumer Fraud Act with treble damages'
    ],
    regulatoryBody: { name: 'Illinois Attorney General', url: 'https://illinoisattorneygeneral.gov' }
  },
  MA: {
    code: 'MA',
    name: 'Massachusetts',
    sol: { writtenContracts: 6, oralContracts: 6, promissoryNotes: 6, openAccounts: 6 },
    interestCaps: { judgments: 12.0, medical: 6.0, consumer: 20.0 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: true, hasMedicalDebtProtections: true,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: [
      'M.G.L. c. 93A (Consumer Protection)',
      '940 CMR 7.00 (Debt Collection Regulations)',
      'M.G.L. c. 93 § 49 (Medical Debt)'
    ],
    specialNotes: [
      'Very strong 93A consumer protection statute',
      'Multiple damages (up to 3x) plus attorney fees',
      'Detailed debt collection regulations'
    ],
    regulatoryBody: { name: 'Massachusetts Attorney General', url: 'https://mass.gov/ago' }
  },
  NY: {
    code: 'NY',
    name: 'New York',
    sol: { writtenContracts: 3, oralContracts: 3, promissoryNotes: 3, openAccounts: 3 },
    interestCaps: { judgments: 9.0, medical: 2.0, consumer: 16.0 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: true, hasMedicalDebtProtections: true,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: [
      'NY Gen. Bus. Law § 349 (Deceptive Practices)',
      'NY Gen. Bus. Law § 600 (Debt Collection)',
      'NY CCFA 2022 (SOL reduction)',
      '23 NYCRR 1 (DFS Debt Collection Rules)'
    ],
    specialNotes: [
      'SOL reduced to 3 years by CCFA in 2022',
      'NYC has additional local protections',
      'DFS heavily regulates debt collection',
      'Medical debt protections under state law',
      'Time-barred debt disclosure requirements'
    ],
    regulatoryBody: {
      name: 'NY Department of Financial Services',
      url: 'https://dfs.ny.gov',
      complaintUrl: 'https://dfs.ny.gov/complaint'
    }
  },
  TX: {
    code: 'TX',
    name: 'Texas',
    sol: { writtenContracts: 4, oralContracts: 4, promissoryNotes: 4, openAccounts: 4 },
    interestCaps: { judgments: 5.0, medical: 5.0, consumer: 10.0 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: true, hasMedicalDebtProtections: false,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: [
      'Tex. Fin. Code § 392 (Debt Collection Act)',
      'Tex. Bus. & Com. Code § 17 (DTPA)'
    ],
    specialNotes: [
      'Texas Debt Collection Act (TDCA)',
      'Strong homestead exemption',
      'Can\'t garnish wages for most consumer debt',
      '4-year SOL is relatively consumer-friendly'
    ],
    regulatoryBody: { name: 'Texas Attorney General', url: 'https://texasattorneygeneral.gov' }
  },
  WA: {
    code: 'WA',
    name: 'Washington',
    sol: { writtenContracts: 6, oralContracts: 3, promissoryNotes: 6, openAccounts: 6 },
    interestCaps: { judgments: 12.0, medical: 12.0, consumer: 12.0 },
    consumerProtections: {
      hasMiniCFPA: true, hasDebtBuyerLaw: false, hasMedicalDebtProtections: true,
      hasIdentityTheftProtections: true, hasPrivateRightOfAction: true
    },
    keyStatutes: [
      'RCW 19.16 (Collection Agency Act)',
      'RCW 19.86 (Consumer Protection Act)',
      'HB 1531 (Medical Debt Collection)'
    ],
    specialNotes: [
      'Collection Agency Act requires licensing',
      'Strong CPA with private right of action',
      'Medical debt protections enacted'
    ],
    regulatoryBody: { name: 'Washington Attorney General', url: 'https://atg.wa.gov' }
  }
};

// Default profile for states not specifically listed
const DEFAULT_STATE: StateLawProfile = {
  code: 'XX',
  name: 'Default',
  sol: { writtenContracts: 5, oralContracts: 4, promissoryNotes: 5, openAccounts: 5 },
  interestCaps: { judgments: 8.0, medical: 6.0, consumer: 10.0 },
  consumerProtections: {
    hasMiniCFPA: false, hasDebtBuyerLaw: false, hasMedicalDebtProtections: false,
    hasIdentityTheftProtections: true, hasPrivateRightOfAction: false
  },
  keyStatutes: ['Consult state statutes'],
  specialNotes: ['State-specific research recommended'],
  regulatoryBody: { name: 'State Attorney General', url: '' }
};

/**
 * Get state law profile
 */
export function getStateLaws(stateCode: string): StateLawProfile {
  return STATE_LAWS[stateCode.toUpperCase()] || { ...DEFAULT_STATE, code: stateCode, name: stateCode };
}

/**
 * Generate state-specific guidance based on account details
 */
export function generateStateGuidance(
  stateCode: string,
  dateLastPayment?: string,
  accountType?: string,
  currentBalance?: string
): {
  solStatus: 'expired' | 'expiring' | 'active' | 'unknown';
  solExpiry?: string;
  protections: string[];
  recommendations: string[];
  legalResources: string[];
} {
  const state = getStateLaws(stateCode);
  const result = {
    solStatus: 'unknown' as 'expired' | 'expiring' | 'active' | 'unknown',
    solExpiry: undefined as string | undefined,
    protections: [] as string[],
    recommendations: [] as string[],
    legalResources: [] as string[]
  };

  // Calculate SOL status
  if (dateLastPayment) {
    const lastPay = new Date(dateLastPayment);
    const now = new Date();
    const solYears = state.sol.writtenContracts;
    const solExpiry = new Date(lastPay);
    solExpiry.setFullYear(solExpiry.getFullYear() + solYears);

    result.solExpiry = solExpiry.toISOString().split('T')[0];

    if (now > solExpiry) {
      result.solStatus = 'expired';
      result.protections.push(`SOL expired on ${result.solExpiry} (${solYears} years)`);
      result.recommendations.push('Send cease and desist letter citing expired SOL');
      result.recommendations.push('If sued, raise SOL as affirmative defense');
    } else {
      const monthsLeft = Math.floor((solExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (monthsLeft <= 6) {
        result.solStatus = 'expiring';
        result.protections.push(`SOL expires in ${monthsLeft} months on ${result.solExpiry}`);
        result.recommendations.push('Do NOT make any payment - this could restart SOL');
        result.recommendations.push('Do NOT acknowledge the debt in writing');
      } else {
        result.solStatus = 'active';
      }
    }
  }

  // Add state-specific protections
  if (state.consumerProtections.hasMiniCFPA) {
    result.protections.push(`${state.name} has state debt collection law (stronger than federal)`);
  }
  if (state.consumerProtections.hasDebtBuyerLaw) {
    result.protections.push('Debt buyers must provide documentation before collection');
  }
  if (state.consumerProtections.hasMedicalDebtProtections && accountType?.toLowerCase().includes('medical')) {
    result.protections.push('Enhanced medical debt protections apply');
  }
  if (state.consumerProtections.hasPrivateRightOfAction) {
    result.protections.push('Private right of action available for violations');
  }

  // Add recommendations
  if (state.consumerProtections.hasMiniCFPA) {
    result.recommendations.push(`Cite ${state.name} state law in addition to federal FDCPA`);
  }

  // Legal resources
  result.legalResources.push(`File complaint with ${state.regulatoryBody.name}`);
  if (state.regulatoryBody.complaintUrl) {
    result.legalResources.push(`Online complaint: ${state.regulatoryBody.complaintUrl}`);
  }
  result.legalResources.push('File CFPB complaint at consumerfinance.gov/complaint');
  result.legalResources.push('Find FCRA attorney at NACA (consumeradvocates.org)');

  return result;
}

/**
 * Get all states with enhanced protections
 */
export function getStatesWithEnhancedProtections(): string[] {
  return Object.entries(STATE_LAWS)
    .filter(([_, profile]) =>
      profile.consumerProtections.hasMiniCFPA ||
      profile.consumerProtections.hasDebtBuyerLaw
    )
    .map(([code, _]) => code);
}
