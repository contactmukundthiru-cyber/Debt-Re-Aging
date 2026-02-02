/**
 * Advanced Dispute Letter Generator
 * Generates customized, legally-compliant dispute letters
 */

import { CreditFields, RuleFlag } from './rules';
import { generateForensicHash } from './utils';

export interface DisputeLetterConfig {
  type: 'bureau' | 'furnisher' | 'validation' | 'cease-desist' | 'intent-to-sue';
  bureau?: 'experian' | 'equifax' | 'transunion' | 'all';
  tone: 'standard' | 'firm' | 'legal';
  includeEvidence: boolean;
  requestMethod: boolean;
  demandDeletion: boolean;
  mentionLitigation: boolean;
  includeStateLaw: boolean;
  language: 'en' | 'es';
}

export interface ConsumerDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ssn4?: string;
  dob?: string;
  phone?: string;
  email?: string;
}

const BUREAU_ADDRESSES = {
  experian: {
    name: 'Experian',
    address: 'P.O. Box 4500',
    city: 'Allen',
    state: 'TX',
    zip: '75013'
  },
  equifax: {
    name: 'Equifax Information Services LLC',
    address: 'P.O. Box 740256',
    city: 'Atlanta',
    state: 'GA',
    zip: '30374'
  },
  transunion: {
    name: 'TransUnion LLC',
    address: 'P.O. Box 2000',
    city: 'Chester',
    state: 'PA',
    zip: '19016'
  }
};

/**
 * Generate a comprehensive dispute letter
 */
export function generateDisputeLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerDetails,
  config: DisputeLetterConfig
): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const highFlags = flags.filter(f => f.severity === 'high');
  const mediumFlags = flags.filter(f => f.severity === 'medium');

  let letter = '';

  // Header
  letter += `${consumer.name}\n`;
  letter += `${consumer.address}\n`;
  letter += `${consumer.city}, ${consumer.state} ${consumer.zip}\n`;
  if (consumer.phone) letter += `Phone: ${consumer.phone}\n`;
  if (consumer.email) letter += `Email: ${consumer.email}\n`;
  letter += `\n${date}\n\n`;

  // Bureau address
  if (config.type === 'bureau' && config.bureau && config.bureau !== 'all') {
    const bureau = BUREAU_ADDRESSES[config.bureau];
    letter += `${bureau.name}\n`;
    letter += `${bureau.address}\n`;
    letter += `${bureau.city}, ${bureau.state} ${bureau.zip}\n\n`;
  } else if (config.type === 'furnisher' || config.type === 'validation') {
    letter += `${fields.furnisherOrCollector || '[FURNISHER NAME]'}\n`;
    letter += `[FURNISHER ADDRESS]\n\n`;
  }

  // Subject line
  const forensicId = generateForensicHash({
    account: fields.accountNumber,
    opened: fields.dateOpened,
    consumer: consumer.name
  });

  letter += `RE: FORMAL DISPUTE - ${config.type === 'validation' ? 'DEBT VALIDATION REQUEST' : 'REQUEST FOR INVESTIGATION'}\n`;
  letter += `TRADELINE FORENSIC ID: ${forensicId}\n`;
  letter += `Account: ${fields.originalCreditor || fields.furnisherOrCollector || '[ACCOUNT NAME]'}\n`;
  if (fields.currentValue) letter += `Reported Stated Value: ${fields.currentValue}\n`;
  letter += `\n`;

  // Identification
  letter += `For identification purposes:\n`;
  letter += `Full Name: ${consumer.name}\n`;
  if (consumer.ssn4) letter += `Last 4 SSN: ${consumer.ssn4}\n`;
  if (consumer.dob) letter += `Date of Birth: ${consumer.dob}\n`;
  letter += `\n`;

  // Opening
  if (config.tone === 'legal') {
    letter += `This letter constitutes a formal dispute pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681 et seq., and serves as notice of your violations of federal law.\n\n`;
  } else if (config.tone === 'firm') {
    letter += `I am writing to formally dispute the accuracy of information being reported on my credit file. This dispute is made pursuant to my rights under the Fair Credit Reporting Act.\n\n`;
  } else {
    letter += `I am writing to dispute inaccurate information appearing on my credit report regarding the above-referenced account.\n\n`;
  }

  // Specific violations
  letter += `SPECIFIC INACCURACIES AND VIOLATIONS:\n\n`;

  highFlags.forEach((flag, i) => {
    letter += `${i + 1}. ${flag.ruleName}\n`;
    letter += `   ${flag.explanation}\n`;
    if (flag.legalCitations.length > 0) {
      letter += `   Legal Basis: ${flag.legalCitations.join(', ')}\n`;
    }
    letter += `\n`;
  });

  if (mediumFlags.length > 0 && config.tone !== 'standard') {
    letter += `Additional concerns:\n`;
    mediumFlags.forEach((flag, i) => {
      letter += `- ${flag.ruleName}: ${flag.explanation}\n`;
    });
    letter += `\n`;
  }

  // Evidence section
  if (config.includeEvidence && highFlags.length > 0) {
    letter += `SUPPORTING EVIDENCE:\n\n`;
    const allEvidence = new Set<string>();
    highFlags.forEach(f => f.suggestedEvidence.forEach(e => allEvidence.add(e)));
    Array.from(allEvidence).forEach(e => {
      letter += `- ${e}\n`;
    });
    letter += `\n`;
  }

  // Request method of verification
  if (config.requestMethod) {
    letter += `DEMAND FOR METHOD OF VERIFICATION:\n\n`;
    letter += `Pursuant to FCRA § 611(a)(7), I demand that you provide me with:\n`;
    letter += `1. A description of the reinvestigation procedures used\n`;
    letter += `2. The business name and address of any furnisher contacted\n`;
    letter += `3. A telephone number for the furnisher, if reasonably available\n`;
    letter += `4. The specific information that was modified or deleted\n\n`;
  }

  // Demands
  letter += `DEMANDS:\n\n`;

  if (config.demandDeletion) {
    letter += `1. Immediately delete this inaccurate tradeline from my credit file, or\n`;
    letter += `2. Correct the information to accurately reflect the true DOFD and removal date\n\n`;
  } else {
    letter += `1. Conduct a thorough reinvestigation of this disputed information\n`;
    letter += `2. Correct any inaccurate information discovered\n`;
    letter += `3. Provide written notice of the results within 30 days\n\n`;
  }

  // Litigation mention
  if (config.mentionLitigation || config.tone === 'legal') {
    letter += `NOTICE OF INTENT:\n\n`;
    letter += `Please be advised that I am documenting all violations for potential legal action. `;
    letter += `Under FCRA § 616 and § 617, I may be entitled to recover:\n`;
    letter += `- Evaluation of actual impact categories\n`;
    letter += `- Statutory liability for non-compliance per violation\n`;
    letter += `- Accountability for willful noncompliance\n`;
    letter += `- Attorney's fees and costs\n\n`;
    letter += `Your response to this dispute will be considered in determining whether your conduct constitutes willful noncompliance.\n\n`;
  }

  // State law mention
  if (config.includeStateLaw && consumer.state) {
    letter += `Additionally, this dispute is made pursuant to applicable state consumer protection laws, including but not limited to the ${consumer.state} Consumer Protection Act and any state-specific credit reporting statutes.\n\n`;
  }

  // Closing
  letter += `Please acknowledge receipt of this dispute in writing and provide your response within the time limits prescribed by law (30 days for credit reporting agencies, 30 days for data furnishers).\n\n`;

  letter += `Sincerely,\n\n\n`;
  letter += `________________________\n`;
  letter += `${consumer.name}\n\n`;

  // Enclosures
  letter += `Enclosures:\n`;
  letter += `- Copy of government-issued ID\n`;
  letter += `- Proof of address (utility bill or bank statement)\n`;
  if (config.includeEvidence) {
    letter += `- Supporting documentation as referenced above\n`;
  }
  letter += `\n`;

  // Footer
  letter += `---\n`;
  letter += `Sent via Certified Mail, Return Receipt Requested\n`;
  letter += `Tracking Number: ______________________\n`;

  return letter;
}

/**
 * Generate a debt validation letter (FDCPA)
 */
export function generateValidationLetter(
  fields: CreditFields,
  consumer: ConsumerDetails,
  config: { tone: 'standard' | 'firm' | 'legal' }
): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  let letter = '';

  letter += `${consumer.name}\n`;
  letter += `${consumer.address}\n`;
  letter += `${consumer.city}, ${consumer.state} ${consumer.zip}\n`;
  letter += `\n${date}\n\n`;

  letter += `${fields.furnisherOrCollector || '[COLLECTION AGENCY NAME]'}\n`;
  letter += `[COLLECTION AGENCY ADDRESS]\n\n`;

  letter += `RE: DEBT VALIDATION REQUEST PURSUANT TO FDCPA § 809(b)\n`;
  letter += `Alleged Account: ${fields.originalCreditor || '[ORIGINAL CREDITOR]'}\n`;
  letter += `Claimed Amount: ${fields.currentValue || '[AMOUNT]'}\n\n`;

  letter += `Dear Sir or Madam:\n\n`;

  letter += `This letter is a formal request for validation of the alleged debt referenced above, made within thirty (30) days of your initial communication, as is my right under the Fair Debt Collection Practices Act, 15 U.S.C. § 1692g.\n\n`;

  letter += `CEASE COLLECTION ACTIVITIES:\n\n`;
  letter += `Pursuant to FDCPA § 809(b), you must cease all collection activities on this alleged debt until you have provided proper validation. This includes:\n`;
  letter += `- No further collection calls\n`;
  letter += `- No credit reporting\n`;
  letter += `- No letters demanding payment\n`;
  letter += `- No threats of legal action\n\n`;

  letter += `VALIDATION REQUIREMENTS:\n\n`;
  letter += `Please provide the following documentation:\n\n`;

  letter += `1. PROOF OF DEBT:\n`;
  letter += `   - Original signed contract or credit agreement bearing my signature\n`;
  letter += `   - Complete account statements from the original creditor\n`;
  letter += `   - Documentation showing the chain of title if this debt was purchased\n\n`;

  letter += `2. PROOF OF AMOUNT:\n`;
  letter += `   - Itemized accounting of principal, interest, and fees\n`;
  letter += `   - Documentation authorizing any fees or interest charged\n`;
  letter += `   - Calculation methodology used to arrive at the claimed balance\n\n`;

  letter += `3. PROOF OF AUTHORITY:\n`;
  letter += `   - Your license to collect debts in ${consumer.state || '[MY STATE]'}\n`;
  letter += `   - Documentation proving you own or have authority to collect this debt\n`;
  letter += `   - Bill of sale or assignment agreement if debt was purchased\n\n`;

  letter += `4. PROOF OF ACCURATE REPORTING:\n`;
  letter += `   - Documentation showing the Date of First Delinquency (DOFD)\n`;
  letter += `   - Proof that the DOFD being reported is accurate\n`;
  letter += `   - Your policies and procedures for verifying accuracy before credit reporting\n\n`;

  if (config.tone === 'legal' || config.tone === 'firm') {
    letter += `WARNING:\n\n`;
    letter += `Be advised that:\n`;
    letter += `- Reporting unverified debt to credit bureaus violates FDCPA § 807(8)\n`;
    letter += `- Continuing collection without validation violates FDCPA § 809(b)\n`;
    letter += `- These violations carry statutory liability of up to 1,000 unit liability\n`;
    letter += `- I am maintaining detailed records for potential litigation\n\n`;
  }

  letter += `Your written response to this validation request is required. Telephone calls regarding this debt will not be accepted until written validation has been provided.\n\n`;

  letter += `Sincerely,\n\n\n`;
  letter += `________________________\n`;
  letter += `${consumer.name}\n\n`;

  letter += `---\n`;
  letter += `This letter does not constitute acknowledgment of this debt, any portion thereof, or waiver of any rights I may have under applicable state or federal law.\n`;

  return letter;
}

/**
 * Generate cease and desist letter
 */
export function generateCeaseDesistLetter(
  fields: CreditFields,
  consumer: ConsumerDetails,
  reasons: string[]
): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  let letter = '';

  letter += `${consumer.name}\n`;
  letter += `${consumer.address}\n`;
  letter += `${consumer.city}, ${consumer.state} ${consumer.zip}\n`;
  letter += `\n${date}\n\n`;

  letter += `${fields.furnisherOrCollector || '[COLLECTION AGENCY NAME]'}\n`;
  letter += `[COLLECTION AGENCY ADDRESS]\n\n`;

  letter += `RE: CEASE AND DESIST COMMUNICATION DEMAND\n`;
  letter += `Pursuant to FDCPA § 805(c)\n\n`;

  letter += `Dear Sir or Madam:\n\n`;

  letter += `This letter is formal notice that I am exercising my right under the Fair Debt Collection Practices Act, 15 U.S.C. § 1692c(c), to demand that you CEASE ALL COMMUNICATION with me regarding the alleged debt referenced above.\n\n`;

  letter += `REASONS FOR THIS DEMAND:\n\n`;
  reasons.forEach((reason, i) => {
    letter += `${i + 1}. ${reason}\n`;
  });
  letter += `\n`;

  letter += `LEGAL REQUIREMENTS:\n\n`;
  letter += `Upon receipt of this letter, you are legally required to:\n`;
  letter += `- Immediately cease all communication attempts\n`;
  letter += `- Not contact me by phone, mail, email, text, or any other means\n`;
  letter += `- Not contact third parties about this alleged debt\n`;
  letter += `- Not report or re-report this debt to credit bureaus without verification\n\n`;

  letter += `PERMITTED COMMUNICATIONS:\n\n`;
  letter += `Under FDCPA § 805(c), you may only contact me to:\n`;
  letter += `1. Advise that collection efforts are being terminated\n`;
  letter += `2. Notify me that you may invoke specified remedies\n`;
  letter += `3. Notify me that you intend to invoke a specified remedy\n\n`;

  letter += `Any communication outside these narrow exceptions will constitute a willful violation of federal law and will be documented for legal action.\n\n`;

  letter += `Sincerely,\n\n\n`;
  letter += `________________________\n`;
  letter += `${consumer.name}\n`;

  return letter;
}

/**
 * Generate intent to sue letter
 */
export function generateIntentToSueLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerDetails,
  attorney?: { name: string; firm: string; }
): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  let letter = '';

  if (attorney) {
    letter += `${attorney.firm}\n`;
    letter += `${attorney.name}, Esq.\n`;
    letter += `[ATTORNEY ADDRESS]\n`;
  } else {
    letter += `${consumer.name}\n`;
    letter += `${consumer.address}\n`;
    letter += `${consumer.city}, ${consumer.state} ${consumer.zip}\n`;
  }
  letter += `\n${date}\n\n`;

  letter += `VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED\n\n`;

  letter += `${fields.furnisherOrCollector || '[DEFENDANT NAME]'}\n`;
  letter += `Registered Agent for Service of Process\n`;
  letter += `[ADDRESS]\n\n`;

  letter += `RE: NOTICE OF INTENT TO FILE LAWSUIT\n`;
  letter += `FCRA and FDCPA Violations\n`;
  letter += `Consumer: ${consumer.name}\n\n`;

  letter += `Dear Sir or Madam:\n\n`;

  letter += `This letter serves as formal notice of my intent to file a lawsuit against your company for violations of the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681 et seq., and the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692 et seq.\n\n`;

  letter += `DOCUMENTED VIOLATIONS:\n\n`;

  const highFlags = flags.filter(f => f.severity === 'high');
  highFlags.forEach((flag, i) => {
    letter += `${i + 1}. ${flag.ruleName}\n`;
    letter += `   Violation: ${flag.explanation}\n`;
    letter += `   Legal Citations: ${flag.legalCitations.join(', ')}\n\n`;
  });

  letter += `DAMAGES CLAIMED:\n\n`;
  letter += `Pursuant to FCRA §§ 616-617 and FDCPA § 813, I intend to seek:\n`;
  letter += `- Actual impact suffered as a result of your violations\n`;
  letter += `- Statutory liability of 100 units to 1,000 unit liability per FCRA violation\n`;
  letter += `- Statutory liability up to 1,000 unit liability under FDCPA\n`;
  letter += `- Accountability for willful noncompliance\n`;
  letter += `- Reasonable attorney's fees and costs\n\n`;

  letter += `SETTLEMENT DEMAND:\n\n`;
  letter += `To avoid the expense and inconvenience of litigation, I am willing to discuss settlement. Any settlement must include:\n`;
  letter += `1. Complete deletion of this tradeline from all credit bureaus\n`;
  letter += `2. Monetary compensation for impact caused\n`;
  letter += `3. Written confirmation that no further reporting will occur\n\n`;

  letter += `TIME TO RESPOND:\n\n`;
  letter += `You have fourteen (14) days from receipt of this letter to respond with a settlement offer. Absent a reasonable settlement, I will proceed with filing suit in the appropriate court.\n\n`;

  letter += `All future communications regarding this matter should be directed to:\n`;
  if (attorney) {
    letter += `${attorney.name}, Esq.\n`;
    letter += `${attorney.firm}\n`;
  } else {
    letter += `${consumer.name}\n`;
    letter += `${consumer.address}\n`;
    letter += `${consumer.city}, ${consumer.state} ${consumer.zip}\n`;
  }
  letter += `\n`;

  letter += `This letter is not an exhaustive statement of facts or claims and is without prejudice to any rights or remedies which may be available.\n\n`;

  letter += `Sincerely,\n\n\n`;
  letter += `________________________\n`;
  if (attorney) {
    letter += `${attorney.name}, Esq.\n`;
    letter += `Attorney for ${consumer.name}\n`;
  } else {
    letter += `${consumer.name}\n`;
    letter += `Pro Se\n`;
  }

  return letter;
}

/**
 * Get letter templates by violation type
 */
export function getLetterRecommendations(flags: RuleFlag[]): {
  type: DisputeLetterConfig['type'];
  reason: string;
  priority: 'high' | 'medium' | 'low';
}[] {
  const recommendations: { type: DisputeLetterConfig['type']; reason: string; priority: 'high' | 'medium' | 'low' }[] = [];

  const hasReaging = flags.some(f => ['B1', 'B2', 'B3'].includes(f.ruleId));
  const hasTimeline = flags.some(f => ['K6', 'E1'].includes(f.ruleId));
  const hasCollection = flags.some(f => ['D1', 'M2'].includes(f.ruleId));
  const hasHighSeverity = flags.some(f => f.severity === 'high');
  const multipleViolations = flags.length >= 3;

  if (hasReaging || hasTimeline) {
    recommendations.push({
      type: 'bureau',
      reason: 'Timeline/re-aging violations detected - dispute directly with credit bureaus',
      priority: 'high'
    });
  }

  if (hasCollection) {
    recommendations.push({
      type: 'validation',
      reason: 'Collection account with data issues - request full debt validation',
      priority: 'high'
    });
  }

  if (hasHighSeverity && multipleViolations) {
    recommendations.push({
      type: 'intent-to-sue',
      reason: 'Multiple high-severity violations may support legal action',
      priority: 'medium'
    });
  }

  if (flags.some(f => f.ruleId === 'S1')) {
    recommendations.push({
      type: 'cease-desist',
      reason: 'Debt may be time-barred - cease collection demand appropriate',
      priority: 'medium'
    });
  }

  return recommendations;
}
