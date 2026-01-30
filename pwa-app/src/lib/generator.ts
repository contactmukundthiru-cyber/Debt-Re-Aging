/**
 * Dispute Letter Generator
 */

import { jsPDF } from 'jspdf';
import { CreditFields, RuleFlag, RiskProfile, ConsumerInfo } from './types';
import { CaseLaw } from './caselaw';
export type { ConsumerInfo };

/**
 * Generate a professional PDF dispute letter
 */
export function generatePDFLetter(content: string, filename: string) {
  const doc = new jsPDF();

  // Basic PDF styling
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const splitText = doc.splitTextToSize(content, 180);
  doc.text(splitText, 15, 20);

  doc.save(filename);
}

/**
 * Generate a PDF blob from plain text content.
 */
export function generatePDFBlob(content: string): Blob {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const splitText = doc.splitTextToSize(content, 180);
  doc.text(splitText, 15, 20);
  return doc.output('blob');
}


function buildForensicReportContent(
  fields: CreditFields,
  flags: RuleFlag[],
  risk: RiskProfile,
  caseLaw: CaseLaw[],
  consumer: ConsumerInfo,
  discoveryAnswers: Record<string, string>
): string {
  const today = new Date().toISOString().split('T')[0];
  const lines: string[] = [];

  lines.push('FORENSIC CREDIT ANALYSIS REPORT');
  lines.push(`Generated: ${today}`);
  lines.push('');
  lines.push('CONSUMER PROFILE');
  lines.push(`${consumer.name}`);
  lines.push(`${consumer.address}`);
  lines.push(`${consumer.city}, ${consumer.state} ${consumer.zip}`);
  lines.push('');
  lines.push('ACCOUNT OVERVIEW');
  lines.push(`Original Creditor: ${fields.originalCreditor || 'Unknown'}`);
  lines.push(`Current Furnisher: ${fields.furnisherOrCollector || 'Unknown'}`);
  lines.push(`Account Type: ${fields.accountType || 'Unknown'}`);
  lines.push(`Current Stated Value: ${fields.currentValue || 'Not Provided'}`);
  lines.push(`Date Opened: ${fields.dateOpened || 'Not Provided'}`);
  lines.push(`Date of First Delinquency: ${fields.dofd || 'Not Provided'}`);
  lines.push(`Estimated Removal Date: ${fields.estimatedRemovalDate || 'Not Provided'}`);
  lines.push('');
  lines.push('RISK PROFILE');
  lines.push(`Overall Score: ${risk.overallScore}/100`);
  lines.push(`Risk Level: ${risk.riskLevel.toUpperCase()}`);
  lines.push(`Dispute Strength: ${risk.disputeStrength.toUpperCase()}`);
  lines.push(`Litigation Potential: ${risk.litigationPotential ? 'YES' : 'NO'}`);
  lines.push('');
  lines.push('VIOLATION SUMMARY');
  if (flags.length === 0) {
    lines.push('No rule violations detected yet.');
  } else {
    flags.forEach((flag, index) => {
      lines.push(`${index + 1}. ${flag.ruleName} [${flag.ruleId}] (${flag.severity.toUpperCase()})`);
      lines.push(`   Finding: ${flag.explanation}`);
      if (flag.legalCitations.length > 0) {
        lines.push(`   Legal Basis: ${flag.legalCitations.join(', ')}`);
      }
      if (flag.suggestedEvidence.length > 0) {
        lines.push(`   Evidence Requested: ${flag.suggestedEvidence.join('; ')}`);
      }
    });
  }

  if (caseLaw.length > 0) {
    lines.push('');
    lines.push('RELEVANT CASE LAW');
    caseLaw.forEach(cl => {
      lines.push(`- ${cl.case} (${cl.citation})`);
    });
  }

  const verifiedAnswers = Object.entries(discoveryAnswers || {}).filter(([, value]) => value);
  if (verifiedAnswers.length > 0) {
    lines.push('');
    lines.push('VERIFIED DISCOVERY ANSWERS');
    verifiedAnswers.forEach(([key, value]) => {
      lines.push(`- ${key}: ${value}`);
    });
  }

  return lines.join('\n');
}

function buildForensicReportDoc(
  fields: CreditFields,
  flags: RuleFlag[],
  risk: RiskProfile,
  caseLaw: CaseLaw[],
  consumer: ConsumerInfo,
  discoveryAnswers: Record<string, string>
): jsPDF {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const content = buildForensicReportContent(fields, flags, risk, caseLaw, consumer, discoveryAnswers);
  const splitText = doc.splitTextToSize(content, 180);
  doc.text(splitText, 15, 20);
  return doc;
}

export function generateForensicReport(
  fields: CreditFields,
  flags: RuleFlag[],
  risk: RiskProfile,
  caseLaw: CaseLaw[],
  consumer: ConsumerInfo,
  discoveryAnswers: Record<string, string>
) {
  const doc = buildForensicReportDoc(fields, flags, risk, caseLaw, consumer, discoveryAnswers);
  doc.save(`Forensic_Report_${fields.furnisherOrCollector?.replace(/\s+/g, '_') || 'Account'}.pdf`);
}

/**
 * Generate a forensic report PDF blob.
 */
export function generateForensicReportBlob(
  fields: CreditFields,
  flags: RuleFlag[],
  risk: RiskProfile,
  caseLaw: CaseLaw[],
  consumer: ConsumerInfo,
  discoveryAnswers: Record<string, string>
): Blob {
  const doc = buildForensicReportDoc(fields, flags, risk, caseLaw, consumer, discoveryAnswers);
  return doc.output('blob');
}

/**
 * Generate bureau dispute letter
 */
export function generateBureauLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerInfo
): string {
  const today = new Date().toISOString().split('T')[0];
  const bureauName = fields.bureau || '[CREDIT BUREAU NAME]';
  const creditorName = fields.furnisherOrCollector || fields.originalCreditor || '[CREDITOR NAME]';

  let disputeReasons = '';
  for (const flag of flags) {
    disputeReasons += `\nâÿ¢ ${flag.ruleName}: ${flag.explanation}\n`;
  }

  return `${consumer.name}
${consumer.address}
${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

${bureauName}
[Bureau Address - See Below]

RE: FORMAL DISPUTE UNDER FCRA § 611
Account: ${creditorName}
${fields.currentValue ? `Stated Value: ${fields.currentValue}` : ''}

Dear Sir/Madam:

I am writing to formally dispute the accuracy of the above-referenced account pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681i.

Upon careful review of my credit report, I have identified the following inaccuracies and violations:
${disputeReasons}

LEGAL BASIS FOR DISPUTE:

Under FCRA § 611(a), you are required to conduct a reasonable investigation of disputed information within 30 days. Under FCRA § 623(a)(1), furnishers are prohibited from reporting information they know or have reasonable cause to believe is inaccurate.

${flags.some(f => ['B1', 'B2', 'B3', 'K6'].includes(f.ruleId)) ?
      `The timeline discrepancies identified above constitute potential violations of FCRA § 605(a), which establishes the 7-year reporting period calculated from the Date of First Delinquency.` : ''}

I REQUEST THE FOLLOWING:

1. Conduct a thorough investigation of these disputes
2. Provide me with copies of any documents used to verify this account
3. ${flags.length >= 3 ? 'DELETE this account due to multiple inaccuracies' : 'CORRECT all inaccurate information identified above'}
4. Send me an updated copy of my credit report reflecting these changes

Please note that failure to comply with this dispute within the statutory timeframe may result in further action, including complaints to the Consumer Financial Protection Bureau and potential litigation.

Sincerely,

${consumer.name}

---
BUREAU ADDRESSES:
Equifax: P.O. Box 740256, Atlanta, GA 30374
Experian: P.O. Box 4500, Allen, TX 75013
TransUnion: P.O. Box 2000, Chester, PA 19016
`;
}

/**
 * Generate debt validation letter to furnisher/collector
 */
export function generateValidationLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerInfo
): string {
  const today = new Date().toISOString().split('T')[0];
  const creditorName = fields.furnisherOrCollector || '[DEBT COLLECTOR NAME]';
  const originalCreditor = fields.originalCreditor || '[ORIGINAL CREDITOR]';

  return `${consumer.name}
${consumer.address}
${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

${creditorName}
[Collector Address]

RE: DEBT VALIDATION REQUEST UNDER FDCPA § 809
Alleged Account from: ${originalCreditor}
${fields.currentValue ? `Stated Value: ${fields.currentValue}` : ''}

SENT VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED

Dear Sir/Madam:

This letter is written pursuant to the Fair Debt Collection Practices Act, 15 U.S.C. § 1692g, to formally request validation of the alleged debt referenced above.

I DO NOT ACKNOWLEDGE THAT I OWE THIS DEBT.

Please provide the following documentation:

1. PROOF OF DEBT:
   - Complete payment history from the original creditor
   - The original signed contract or agreement bearing my signature
   - Evidence of how you calculated the value reported

2. CHAIN OF TITLE:
   - Documentation showing how you acquired this debt
   - Assignment or purchase agreement with all parties listed
   - License to collect debts in ${consumer.state || 'my state'}

3. DATE OF FIRST DELINQUENCY:
   - Written verification of the actual Date of First Delinquency
   - This date must come from the original creditor's records

4. YOUR AUTHORITY:
   - Your debt collection license number for ${consumer.state || 'this state'}
   - Proof you are authorized to collect this specific debt

${flags.some(f => f.ruleId.startsWith('B') || f.ruleId === 'K6') ?
      `NOTICE OF POTENTIAL VIOLATIONS:
My records indicate the following concerns with this account:
${flags.filter(f => f.ruleId.startsWith('B') || f.ruleId === 'K6').map(f => `• ${f.explanation}`).join('\n')}

If you cannot provide proper documentation addressing these discrepancies, you must cease collection activities and remove this tradeline from all credit bureaus.
` : ''}

LEGAL NOTICE:

Until you provide this validation, you must:
- Cease all collection activities
- Not report this debt to any credit bureau
- Not contact me except to provide the requested documentation

Failure to comply with this request will be documented and may be used as evidence of FDCPA violations in any future legal proceedings.

Respond within 30 days.

Sincerely,

${consumer.name}

CC: [Your Records]
`;
}

/**
 * Generate case summary document
 */
export function generateCaseSummary(
  fields: CreditFields,
  flags: RuleFlag[],
  risk: RiskProfile
): string {
  const today = new Date().toISOString().split('T')[0];

  let flagDetails = '';
  for (const flag of flags) {
    flagDetails += `
### ${flag.ruleId}: ${flag.ruleName}
**Severity:** ${flag.severity.toUpperCase()}
**Finding:** ${flag.explanation}
**Legal Basis:** ${flag.legalCitations.join(', ')}
**Evidence Needed:** ${flag.suggestedEvidence.join('; ')}
`;
  }

  return `# Credit Report Analysis Summary
Generated: ${today}

## Account Information
| Field | Value |
|-------|-------|
| Original Creditor | ${fields.originalCreditor || 'Not Found'} |
| Current Furnisher | ${fields.furnisherOrCollector || 'Not Found'} |
| Account Type | ${fields.accountType || 'Not Found'} |
| Current Stated Value | ${fields.currentValue || '0'} |
| Initial Stated Value | ${fields.initialValue || 'Not Found'} |
| Date Opened | ${fields.dateOpened || 'Not Found'} |
| Date of First Delinquency | ${fields.dofd || 'NOT FOUND - CRITICAL'} |
| Charge-Off Date | ${fields.chargeOffDate || 'Not Found'} |
| Est. Removal Date | ${fields.estimatedRemovalDate || 'Not Calculated'} |

## Risk Assessment

**Overall Score:** ${risk.overallScore}/100
**Risk Level:** ${risk.riskLevel.toUpperCase()}
**Dispute Strength:** ${risk.disputeStrength.toUpperCase()}
**Litigation Potential:** ${risk.litigationPotential ? 'YES' : 'No'}

### Recommended Approach
${risk.recommendedApproach}

## Violations Detected (${flags.length})
${flagDetails || 'No violations detected.'}

## Key Violations
${risk.keyViolations.length > 0 ? risk.keyViolations.map(v => `- ${v}`).join('\n') : 'None identified'}

---
*This analysis is for informational purposes only and does not constitute legal advice.*
`;
}

/**
 * Generate furnisher/collector letter (more aggressive than bureau)
 */
export function generateFurnisherLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerInfo
): string {
  const today = new Date().toISOString().split('T')[0];
  const creditorName = fields.furnisherOrCollector || fields.originalCreditor || '[FURNISHER NAME]';
  const originalCreditor = fields.originalCreditor || '[ORIGINAL CREDITOR]';

  let violations = '';
  for (const flag of flags) {
    violations += `\n• ${flag.ruleName} (${flag.ruleId}): ${flag.explanation}\n`;
    violations += `  Legal Basis: ${flag.legalCitations.join(', ')}\n`;
  }

  const hasReagingFlags = flags.some(f => ['B1', 'B2', 'B3', 'K6', 'K7'].includes(f.ruleId));
  const hasFDCPAFlags = flags.some(f => f.legalCitations.some(c => c.includes('FDCPA')));

  return `${consumer.name}
${consumer.address}
${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

${creditorName}
[Furnisher Address]

RE: FORMAL NOTICE OF DISPUTED INFORMATION AND DEMAND FOR CORRECTION
Account Allegedly from: ${originalCreditor}
${fields.currentValue ? `Disputed Value: ${fields.currentValue}` : ''}

SENT VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED

Dear Sir/Madam:

I am writing as a formal notice under the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681s-2, regarding your duty as a furnisher of information to credit reporting agencies.

My investigation has revealed the following FCRA and/or FDCPA violations associated with your reporting of the above-referenced account:
${violations}

LEGAL OBLIGATIONS YOU ARE VIOLATING:

1. Under FCRA § 623(a)(1)(A), you may not furnish information to a consumer reporting agency that you know or have reasonable cause to believe is inaccurate.

2. Under FCRA § 623(a)(2), after being notified of a dispute, you must investigate and report the results to the credit bureaus.

3. Under FCRA § 623(b), upon receipt of notice from a CRA that information is disputed, you must conduct an investigation and modify, delete, or verify the information.
${hasReagingFlags ? `
NOTICE OF ILLEGAL RE-AGING:
The date discrepancies identified above indicate that your company may be engaged in illegal "debt re-aging" - the practice of reporting false dates to extend the 7-year reporting period under FCRA § 605. This constitutes:
• Willful noncompliance with FCRA (subject to statutory liability per violation plus accountability impact)
• Potential fraud and unfair debt collection practices
` : ''}
${hasFDCPAFlags ? `
FDCPA VIOLATIONS:
Your conduct also appears to violate the Fair Debt Collection Practices Act, including but not limited to:
• 15 U.S.C. § 1692e - False or misleading representations
• 15 U.S.C. § 1692f - Unfair practices
` : ''}

DEMAND FOR IMMEDIATE ACTION:

Within 30 days of receipt of this letter, you must:

1. Permanently delete this inaccurate tradeline from all three major credit bureaus (Equifax, Experian, TransUnion)
2. Provide me with written confirmation of deletion
3. Cease and desist from re-inserting or re-reporting this account without valid documentation proving accuracy

NOTICE OF PRESERVED RIGHTS:

This letter is sent without prejudice to any legal claims I may have. If you fail to comply, I reserve the right to:
• File complaints with the CFPB, FTC, and state attorney general
• Pursue statutory liability under FCRA
• Seek actual impact for harm to my credit standing
• Pursue accountability impact and attorney's fees

Your response is required within 30 days.

Sincerely,

${consumer.name}

Enclosures: Credit report excerpt showing disputed tradeline
CC: [Your Records]
`;
}

/**
 * Generate cease and desist letter
 */
export function generateCeaseDesistLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerInfo
): string {
  const today = new Date().toISOString().split('T')[0];
  const creditorName = fields.furnisherOrCollector || '[DEBT COLLECTOR NAME]';
  const originalCreditor = fields.originalCreditor || '[ORIGINAL CREDITOR]';

  return `${consumer.name}
${consumer.address}
${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

${creditorName}
[Collector Address]

RE: CEASE AND DESIST COMMUNICATION
Alleged Debt from: ${originalCreditor}
${fields.currentValue ? `Stated Value: ${fields.currentValue}` : ''}

SENT VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED

Dear Sir/Madam:

Pursuant to my rights under the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692c(c), I am formally demanding that you CEASE AND DESIST all further communications with me regarding the alleged debt referenced above.

EFFECTIVE IMMEDIATELY, you must:

1. STOP all telephone calls to me, my family members, and my place of employment
2. STOP all written correspondence except as permitted by law
3. STOP all credit bureau reporting until you can validate this debt with original documentation

NOTICE OF PRIOR VIOLATIONS:

Your previous collection activities have already resulted in the following potential FDCPA and FCRA violations:
${flags.map(f => `• ${f.ruleName}: ${f.explanation}`).join('\n')}

PERMITTED COMMUNICATIONS ONLY:

Under 15 U.S.C. § 1692c(c), after receipt of this cease and desist notice, you may only contact me to:
1. Advise that collection efforts are being terminated
2. Notify me that you may invoke specific legal remedies
3. Notify me that you are invoking a specific legal remedy

Any communication outside these narrow exceptions will constitute a violation of federal law.

WARNING:

Any further contact in violation of this cease and desist order will be documented and used as evidence in legal proceedings. Violations of the FDCPA are subject to:
• Statutory liability per violation
• Actual impact for reputational and credit harm
• Class action liability
• Payment of consumer's attorney's fees

REQUIRED ACKNOWLEDGMENT:

Please confirm in writing within 10 days that you have received this cease and desist notice and will comply with its terms.

This letter is sent without prejudice to my legal rights, all of which are expressly reserved.

Sincerely,

${consumer.name}

CC: [Your Records]
`;
}

/**
 * Generate intent to sue letter
 */
export function generateIntentToSueLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerInfo,
  riskProfile?: RiskProfile
): string {
  const today = new Date().toISOString().split('T')[0];
  const creditorName = fields.furnisherOrCollector || fields.originalCreditor || '[COMPANY NAME]';

  const highSeverityFlags = flags.filter(f => f.severity === 'high');

  return `${consumer.name}` + '\n' + `${consumer.address}` + '\n' + `${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

${creditorName}
[Company Address]

VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED

RE: FINAL NOTICE OF INTENT TO FILE LAWSUIT
DEMAND FOR IMMEDIATE RESOLUTION

Dear Sir/Madam:

PLEASE GOVERN YOURSELF ACCORDINGLY.

This letter serves as formal notice that unless the matters set forth below are resolved within FIFTEEN (15) DAYS of your receipt of this letter, I intend to file a civil lawsuit against your company in federal court for violations of the Fair Credit Reporting Act (15 U.S.C. § 1681 et seq.) and the Fair Debt Collection Practices Act (15 U.S.C. § 1692 et seq.).

DOCUMENTED VIOLATIONS:

My investigation has documented the following ${highSeverityFlags.length} HIGH-SEVERITY and ${flags.length - highSeverityFlags.length} additional violations:

${flags.map((f, i) => `${i + 1}. ${f.ruleId} - ${f.ruleName}
   Severity: ${f.severity.toUpperCase()}
   Finding: ${f.explanation}
   Legal Citations: ${f.legalCitations.join(', ')}
   Success Probability: ${f.successProbability}%
`).join('\n')}

LIABILITY & IMPACT SOUGHT:

If legal action becomes necessary, I will seek:

1. STATUTORY LIABILITY under 15 U.S.C. § 1681n(a)(1)(A):
   - Statutory liability per willful violation
   - Documented violations: ${flags.length}

2. ACTUAL IMPACT for:
   - Credit score deterioration
   - Denial of credit applications
   - Higher interest rates paid
   - Reputational harm

3. ACCOUNTABILITY IMPACT under 15 U.S.C. § 1681n(a)(2):
   - For willful noncompliance, courts may award accountability impact without limitation

4. ATTORNEY'S FEES AND COSTS under 15 U.S.C. § 1681n(a)(3)

CASE STRENGTH ASSESSMENT:
${riskProfile ? `
My forensic analysis shows:
• Overall Case Score: ${riskProfile.overallScore}/100
• Dispute Strength: ${riskProfile.disputeStrength.toUpperCase()}
• Litigation Potential: ${riskProfile.litigationPotential ? 'HIGH' : 'MODERATE'}
` : ''}
SETTLEMENT DEMAND:

To avoid the expense and inconvenience of litigation for both parties, I am prepared to resolve this matter if you:

1. IMMEDIATELY delete all disputed information from all three credit bureaus
2. Provide written confirmation of permanent deletion within 15 days
3. Agree to cease all collection activities
4. Pay appropriate remediation value (to be negotiated)

DEADLINE:

You have FIFTEEN (15) DAYS from receipt of this letter to respond with an acceptable resolution. Absent a satisfactory response, I will proceed with legal action without further notice.

This letter may be used as evidence of your prior knowledge of these violations. Your failure to act will be characterized as willful noncompliance.

Sincerely,

${consumer.name}

CC: [Attorney/Records]
    Consumer Financial Protection Bureau (pending complaint)
`;
}

/**
 * Generate CFPB complaint narrative
 */
export function generateCFPBNarrative(
  fields: CreditFields,
  flags: RuleFlag[],
  discoveryAnswers: Record<string, string> = {}
): string {
  const creditor = fields.furnisherOrCollector || fields.originalCreditor || 'the furnisher';
  let narrative = `COMPLAINT AGAINST: ${creditor}\n\n`;

  narrative += `SUMMARY OF COMPLAINT:\n`;
  narrative += `I am filing this complaint because of multiple serious violations of the Fair Credit Reporting Act (FCRA) and the Fair Debt Collection Practices Act (FDCPA) by ${creditor}. This entity is reporting inaccurate information that they have failed to correct despite legal requirements.\n\n`;

  narrative += `SPECIFIC VIOLATIONS & FACTUAL DISCOVERY:\n`;
  flags.forEach((flag, i) => {
    narrative += `${i + 1}. ${flag.ruleName}: ${flag.explanation}\n`;

    // Include relevant discovery answers to bolster the narrative
    if (flag.discoveryQuestions) {
      flag.discoveryQuestions.forEach((q, j) => {
        const ans = discoveryAnswers[`${flag.ruleId}-${j}`];
        if (ans) {
          narrative += `   - Verified Fact: ${ans}\n`;
        }
      });
    }
    narrative += `\n`;
  });

  narrative += `HARM CAUSED:\n`;
  narrative += `This inaccurate reporting has caused material damage to my credit standing and overall reputational well-being. `;
  if (flags.some(f => ['B1', 'B2', 'B3', 'K6'].includes(f.ruleId))) {
    narrative += `Furthermore, the company appears to be engaging in illegal "debt re-aging" by manipulating reporting dates to extend the 7-year legal reporting limit under FCRA § 605.\n\n`;
  } else {
    narrative += `This constitutes a failure to maintain reasonable procedures to ensure maximum possible accuracy under FCRA § 607(b).\n\n`;
  }

  narrative += `DESIRED RESOLUTION:\n`;
  narrative += `1. Immediate and permanent deletion of this inaccurate tradeline from all credit bureaus.\n`;
  narrative += `2. A formal investigation by the CFPB into the systemic reporting inaccuracies at ${creditor}.\n`;
  narrative += `3. Written confirmation once deletion is complete.\n\n`;

  narrative += `SUPPORTING EVIDENCE:\n`;
  const verifiedEvidence = Array.from(new Set(flags.flatMap(f => f.suggestedEvidence)))
    .filter((_, i) => discoveryAnswers[`ev-${i}`] === 'checked');

  if (verifiedEvidence.length > 0) {
    narrative += `I have the following evidence ready to upload upon request:\n`;
    verifiedEvidence.forEach(ev => narrative += `- ${ev}\n`);
  } else {
    narrative += `I have detailed records supporting all claims above and will provide them upon request.`;
  }

  return narrative;
}
