/**
 * CFPB Complaint Builder
 * Complete complaint generation with all required fields
 */

import { CreditFields, RuleFlag } from './rules';

export interface CFPBComplaint {
  // Product Information
  productType: 'credit_reporting' | 'debt_collection' | 'credit_card' | 'mortgage';
  subProduct?: string;

  // Issue Details
  issueType: string;
  subIssue?: string;

  // Company Information
  companyName: string;
  companyState?: string;

  // Consumer Information
  consumerName: string;
  consumerAddress: string;
  consumerCity: string;
  consumerState: string;
  consumerZip: string;
  consumerEmail?: string;
  consumerPhone?: string;

  // Complaint Details
  narrative: string;
  desiredResolution: string;

  // Additional Info
  submittedToCompany: boolean;
  companyResponse?: string;
  serviceMemberStatus: boolean;
  consentToPublish: 'yes' | 'no' | 'with_consent';

  // Attachments
  hasAttachments: boolean;
  attachmentDescriptions: string[];
}

export const CFPB_ISSUE_TYPES = {
  credit_reporting: [
    { value: 'incorrect_info', label: 'Incorrect information on your report', subIssues: [
      'Information belongs to someone else',
      'Account status incorrect',
      'Account information incorrect',
      'Personal information incorrect',
      'Public record information inaccurate'
    ]},
    { value: 'improper_use', label: 'Improper use of your report', subIssues: [
      'Reporting company used your report improperly',
      'Credit inquiries on your report that you don\'t recognize'
    ]},
    { value: 'unable_to_get_report', label: 'Unable to get your credit report or credit score', subIssues: [
      'Problem getting your free annual credit report',
      'Problem getting a credit report from a non-traditional source'
    ]},
    { value: 'problem_with_investigation', label: 'Problem with a credit reporting company\'s investigation', subIssues: [
      'Their investigation did not fix an error on your report',
      'Investigation took more than 30 days',
      'Was not notified of investigation status or results',
      'Difficulty submitting a dispute or getting information about a dispute over the phone'
    ]},
    { value: 'problem_with_fraud_alert', label: 'Problem with a company\'s investigation into an existing problem', subIssues: [
      'Difficulty getting a response from the company',
      'Difficulty getting a response from a credit bureau'
    ]}
  ],
  debt_collection: [
    { value: 'attempts_collect_not_owed', label: 'Attempts to collect debt not owed', subIssues: [
      'Debt was paid',
      'Debt was discharged in bankruptcy',
      'Debt was result of identity theft',
      'Debt is not yours'
    ]},
    { value: 'written_notification', label: 'Written notification about debt', subIssues: [
      'Didn\'t receive enough information to verify debt',
      'Didn\'t receive notice of rights when contacted'
    ]},
    { value: 'false_statements', label: 'False statements or representation', subIssues: [
      'Attempted to collect wrong amount',
      'Impersonated attorney, law enforcement, or government official',
      'Indicated you committed crime by not paying debt'
    ]},
    { value: 'communication_tactics', label: 'Communication tactics', subIssues: [
      'Frequent or repeated calls',
      'Called before 8am or after 9pm',
      'Used obscene, profane, or abusive language',
      'Contacted you after you asked them to stop'
    ]},
    { value: 'threatened_actions', label: 'Threatened to take negative or legal action', subIssues: [
      'Threatened to sue you for very old debt',
      'Threatened arrest or jail if you don\'t pay',
      'Threatened to take legal action'
    ]}
  ]
};

/**
 * Build a complete CFPB complaint from analysis data
 */
export function buildCFPBComplaint(
  fields: CreditFields,
  flags: RuleFlag[],
  consumerInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    email?: string;
    phone?: string;
  }
): CFPBComplaint {
  // Determine product type
  const isCollection = (fields.accountType || '').toLowerCase().includes('collection') ||
                      (fields.furnisherOrCollector || '').toLowerCase().includes('collection');

  const productType = isCollection ? 'debt_collection' : 'credit_reporting';

  // Determine issue type based on flags
  const hasReaging = flags.some(f => ['B1', 'B2', 'B3', 'K6'].includes(f.ruleId));
  const hasIncorrectInfo = flags.some(f => ['D1', 'M1', 'M2'].includes(f.ruleId));
  const hasInvestigationIssue = flags.some(f => f.severity === 'high');

  let issueType = 'incorrect_info';
  let subIssue = 'Account information incorrect';

  if (hasReaging) {
    issueType = 'incorrect_info';
    subIssue = 'Account information incorrect';
  } else if (hasInvestigationIssue) {
    issueType = 'problem_with_investigation';
    subIssue = 'Their investigation did not fix an error on your report';
  }

  return {
    productType,
    issueType,
    subIssue,
    companyName: fields.furnisherOrCollector || fields.originalCreditor || '[COMPANY NAME]',
    consumerName: consumerInfo.name,
    consumerAddress: consumerInfo.address,
    consumerCity: consumerInfo.city,
    consumerState: consumerInfo.state,
    consumerZip: consumerInfo.zip,
    consumerEmail: consumerInfo.email,
    consumerPhone: consumerInfo.phone,
    narrative: generateCFPBNarrative(fields, flags),
    desiredResolution: generateDesiredResolution(flags),
    submittedToCompany: true,
    serviceMemberStatus: false,
    consentToPublish: 'with_consent',
    hasAttachments: true,
    attachmentDescriptions: generateAttachmentList(flags)
  };
}

/**
 * Generate comprehensive CFPB narrative
 */
export function generateCFPBNarrative(fields: CreditFields, flags: RuleFlag[]): string {
  const lines: string[] = [];

  // Opening
  lines.push(`I am filing this complaint regarding inaccurate information being reported on my credit file by ${fields.furnisherOrCollector || fields.originalCreditor || 'the furnisher'}.`);
  lines.push('');

  // Account identification
  lines.push('ACCOUNT INFORMATION:');
  lines.push(`- Original Creditor: ${fields.originalCreditor || 'Not provided'}`);
  lines.push(`- Current Furnisher: ${fields.furnisherOrCollector || 'Not provided'}`);
  lines.push(`- Account Type: ${fields.accountType || 'Not specified'}`);
  lines.push(`- Reported Balance: ${fields.currentBalance || 'Not provided'}`);
  lines.push(`- Date of First Delinquency: ${fields.dofd || 'Not provided'}`);
  lines.push(`- Estimated Removal Date: ${fields.estimatedRemovalDate || 'Not provided'}`);
  lines.push('');

  // Timeline of events
  lines.push('TIMELINE OF EVENTS:');
  if (fields.dateOpened) lines.push(`- Account opened: ${fields.dateOpened}`);
  if (fields.dofd) lines.push(`- First delinquency: ${fields.dofd}`);
  if (fields.chargeOffDate) lines.push(`- Charge-off date: ${fields.chargeOffDate}`);
  if (fields.dateLastPayment) lines.push(`- Last payment: ${fields.dateLastPayment}`);
  lines.push('');

  // Specific violations
  lines.push('SPECIFIC INACCURACIES AND VIOLATIONS:');
  lines.push('');

  const highFlags = flags.filter(f => f.severity === 'high');
  const mediumFlags = flags.filter(f => f.severity === 'medium');

  highFlags.forEach((flag, i) => {
    lines.push(`${i + 1}. ${flag.ruleName.toUpperCase()}`);
    lines.push(`   Issue: ${flag.explanation}`);
    lines.push(`   Why this matters: ${flag.whyItMatters}`);
    lines.push(`   Legal basis: ${flag.legalCitations.join(', ')}`);
    lines.push('');
  });

  if (mediumFlags.length > 0) {
    lines.push('ADDITIONAL CONCERNS:');
    mediumFlags.forEach(flag => {
      lines.push(`- ${flag.ruleName}: ${flag.explanation}`);
    });
    lines.push('');
  }

  // Previous attempts
  lines.push('PREVIOUS ATTEMPTS TO RESOLVE:');
  lines.push('I have previously disputed this information directly with the credit bureaus and/or the furnisher. Despite my disputes, the inaccurate information continues to be reported.');
  lines.push('');

  // Impact statement
  lines.push('IMPACT ON CONSUMER:');
  lines.push('This inaccurate reporting has negatively impacted my:');
  lines.push('- Credit score and creditworthiness');
  lines.push('- Ability to obtain credit at favorable terms');
  lines.push('- Housing opportunities (rental applications)');
  lines.push('- Employment opportunities (credit checks)');
  lines.push('- Overall financial well-being and stress levels');
  lines.push('');

  // Legal references
  lines.push('APPLICABLE LAW:');
  const citations = new Set<string>();
  flags.forEach(f => f.legalCitations.forEach(c => citations.add(c)));
  Array.from(citations).forEach(cite => {
    lines.push(`- ${cite}`);
  });
  lines.push('');

  // Closing
  lines.push('I request that the CFPB investigate this matter and take appropriate action to ensure the furnisher corrects or deletes the inaccurate information from my credit file.');

  return lines.join('\n');
}

/**
 * Generate desired resolution based on violations
 */
function generateDesiredResolution(flags: RuleFlag[]): string {
  const resolutions: string[] = [];

  resolutions.push('I am seeking the following resolution:');
  resolutions.push('');
  resolutions.push('1. Complete deletion of this inaccurate tradeline from all three credit bureaus (Experian, Equifax, TransUnion)');
  resolutions.push('');
  resolutions.push('2. Alternatively, correction of the following specific items:');

  if (flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId))) {
    resolutions.push('   - Correction of the Date of First Delinquency to the accurate date');
    resolutions.push('   - Correction of the estimated removal date to 7 years from the true DOFD');
  }

  if (flags.some(f => f.ruleId === 'D1')) {
    resolutions.push('   - Correction of the account status to reflect paid/closed status');
    resolutions.push('   - Correction of the balance to $0');
  }

  if (flags.some(f => ['K1', 'K7'].includes(f.ruleId))) {
    resolutions.push('   - Correction of the reported balance to reflect the accurate amount');
  }

  resolutions.push('');
  resolutions.push('3. Written confirmation from the furnisher that they have corrected their records');
  resolutions.push('');
  resolutions.push('4. Written confirmation from each credit bureau that the information has been corrected or deleted');
  resolutions.push('');
  resolutions.push('5. Investigation into the furnisher\'s credit reporting practices to prevent future violations');

  return resolutions.join('\n');
}

/**
 * Generate attachment list
 */
function generateAttachmentList(flags: RuleFlag[]): string[] {
  const attachments: string[] = [
    'Copy of credit report showing disputed information',
    'Copy of government-issued ID',
    'Proof of current address'
  ];

  if (flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId))) {
    attachments.push('Historical credit reports showing date changes');
    attachments.push('Timeline analysis showing re-aging evidence');
  }

  if (flags.some(f => f.ruleId === 'D1')) {
    attachments.push('Proof of payment (if applicable)');
    attachments.push('Settlement agreement (if applicable)');
  }

  attachments.push('Previous dispute letters sent');
  attachments.push('Response letters received (if any)');
  attachments.push('Certified mail receipts');

  return attachments;
}

/**
 * Format complaint for CFPB submission form
 */
export function formatForCFPBSubmission(complaint: CFPBComplaint): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('CFPB COMPLAINT - READY FOR SUBMISSION');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push('NOTE: Copy each section into the corresponding field on');
  lines.push('https://www.consumerfinance.gov/complaint/');
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('PRODUCT TYPE: ' + complaint.productType.replace('_', ' ').toUpperCase());
  lines.push('-'.repeat(60));
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('ISSUE TYPE: ' + complaint.issueType.replace(/_/g, ' ').toUpperCase());
  if (complaint.subIssue) {
    lines.push('SUB-ISSUE: ' + complaint.subIssue);
  }
  lines.push('-'.repeat(60));
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('COMPANY NAME: ' + complaint.companyName);
  lines.push('-'.repeat(60));
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('COMPLAINT NARRATIVE:');
  lines.push('-'.repeat(60));
  lines.push(complaint.narrative);
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('DESIRED RESOLUTION:');
  lines.push('-'.repeat(60));
  lines.push(complaint.desiredResolution);
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('ATTACHMENTS TO INCLUDE:');
  lines.push('-'.repeat(60));
  complaint.attachmentDescriptions.forEach((att, i) => {
    lines.push(`${i + 1}. ${att}`);
  });
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('CONSUMER INFORMATION (keep private)');
  lines.push('='.repeat(60));
  lines.push(`Name: ${complaint.consumerName}`);
  lines.push(`Address: ${complaint.consumerAddress}`);
  lines.push(`City: ${complaint.consumerCity}`);
  lines.push(`State: ${complaint.consumerState}`);
  lines.push(`ZIP: ${complaint.consumerZip}`);
  if (complaint.consumerEmail) lines.push(`Email: ${complaint.consumerEmail}`);
  if (complaint.consumerPhone) lines.push(`Phone: ${complaint.consumerPhone}`);

  return lines.join('\n');
}

/**
 * Get CFPB complaint URL
 */
export function getCFPBSubmissionURL(): string {
  return 'https://www.consumerfinance.gov/complaint/';
}

/**
 * Generate one-click CFPB complaint data for pre-filled form
 */
export function generateQuickComplaintData(
  fields: CreditFields,
  flags: RuleFlag[]
): {
  formUrl: string;
  summary: string;
  keyPoints: string[];
  estimatedTime: string;
} {
  const hasReaging = flags.some(f => ['B1', 'B2', 'B3', 'K6'].includes(f.ruleId));
  const creditor = fields.furnisherOrCollector || fields.originalCreditor || 'Unknown';

  const keyPoints: string[] = [];

  if (hasReaging) {
    keyPoints.push('Illegal debt re-aging detected (date manipulation)');
  }

  const highFlags = flags.filter(f => f.severity === 'high');
  if (highFlags.length > 0) {
    keyPoints.push(`${highFlags.length} high-severity FCRA violations`);
  }

  if (flags.some(f => f.ruleId === 'K6')) {
    keyPoints.push('Account reported beyond 7-year legal limit');
  }

  if (flags.some(f => f.legalCitations.some(c => c.includes('FDCPA')))) {
    keyPoints.push('FDCPA (debt collection) violations');
  }

  return {
    formUrl: 'https://www.consumerfinance.gov/complaint/',
    summary: `File complaint against ${creditor} for ${flags.length} documented violations`,
    keyPoints,
    estimatedTime: '10-15 minutes with prepared documentation',
  };
}

/**
 * Track complaint status suggestions
 */
export function getComplaintFollowUpSteps(): string[] {
  return [
    '1. Save your complaint confirmation number',
    '2. Check CFPB portal for company response (usually 15 days)',
    '3. Review and dispute company response if inadequate',
    '4. Request CFPB investigation if response is unsatisfactory',
    '5. Consider small claims court if no resolution after 60 days',
    '6. Consult with FCRA attorney for potential lawsuit if damages exceed $1000',
  ];
}

/**
 * Estimate complaint strength
 */
export function estimateComplaintStrength(flags: RuleFlag[]): {
  strength: 'strong' | 'moderate' | 'weak';
  score: number;
  factors: string[];
} {
  let score = 50; // Base score
  const factors: string[] = [];

  // High severity violations
  const highCount = flags.filter(f => f.severity === 'high').length;
  if (highCount >= 3) {
    score += 30;
    factors.push(`${highCount} high-severity violations documented`);
  } else if (highCount >= 1) {
    score += 15;
    factors.push(`${highCount} high-severity violation(s) documented`);
  }

  // Re-aging is particularly strong
  if (flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId))) {
    score += 20;
    factors.push('Clear evidence of date manipulation (re-aging)');
  }

  // Multiple legal citations
  const citations = new Set<string>();
  flags.forEach(f => f.legalCitations.forEach(c => citations.add(c)));
  if (citations.size >= 3) {
    score += 10;
    factors.push(`Multiple legal violations cited (${citations.size} statutes)`);
  }

  // Timeline issues
  if (flags.some(f => f.ruleId === 'K6')) {
    score += 15;
    factors.push('Account exceeds 7-year reporting limit');
  }

  // Cap at 100
  score = Math.min(100, score);

  return {
    strength: score >= 75 ? 'strong' : score >= 50 ? 'moderate' : 'weak',
    score,
    factors
  };
}
