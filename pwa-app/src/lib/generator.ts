/**
 * Dispute Letter Generator
 */

import { CreditFields, RuleFlag, RiskProfile } from './rules';

export interface ConsumerInfo {
  name?: string;
  address?: string;
  state?: string;
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
    disputeReasons += `\n• ${flag.ruleName}: ${flag.explanation}\n`;
  }

  return `${consumer.name || '[YOUR NAME]'}
${consumer.address || '[YOUR ADDRESS]'}

${today}

${bureauName}
[Bureau Address - See Below]

RE: FORMAL DISPUTE UNDER FCRA § 611
Account: ${creditorName}
${fields.currentBalance ? `Balance Shown: $${fields.currentBalance}` : ''}

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

${consumer.name || '[YOUR SIGNATURE]'}

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

  return `${consumer.name || '[YOUR NAME]'}
${consumer.address || '[YOUR ADDRESS]'}

${today}

${creditorName}
[Collector Address]

RE: DEBT VALIDATION REQUEST UNDER FDCPA § 809
Alleged Account from: ${originalCreditor}
${fields.currentBalance ? `Amount Claimed: $${fields.currentBalance}` : ''}

SENT VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED

Dear Sir/Madam:

This letter is written pursuant to the Fair Debt Collection Practices Act, 15 U.S.C. § 1692g, to formally request validation of the alleged debt referenced above.

I DO NOT ACKNOWLEDGE THAT I OWE THIS DEBT.

Please provide the following documentation:

1. PROOF OF DEBT:
   - Complete payment history from the original creditor
   - The original signed contract or agreement bearing my signature
   - Evidence of how you calculated the amount claimed

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

${consumer.name || '[YOUR SIGNATURE]'}

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
| Current Balance | $${fields.currentBalance || '0'} |
| Original Amount | $${fields.originalAmount || 'Not Found'} |
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
 * Generate CFPB complaint narrative
 */
export function generateCFPBNarrative(
  fields: CreditFields,
  flags: RuleFlag[]
): string {
  const highSeverity = flags.filter(f => f.severity === 'high');
  const creditor = fields.furnisherOrCollector || fields.originalCreditor || 'the furnisher';

  return `COMPLAINT AGAINST: ${creditor}

SUMMARY OF COMPLAINT:
I am filing this complaint because ${creditor} is reporting inaccurate information on my credit report that violates the Fair Credit Reporting Act (FCRA).

SPECIFIC VIOLATIONS:
${flags.map((f, i) => `${i + 1}. ${f.ruleName}: ${f.explanation}`).join('\n\n')}

HARM CAUSED:
This inaccurate reporting has caused damage to my credit score and ability to obtain credit, housing, and/or employment.

ACTIONS ALREADY TAKEN:
- Reviewed my credit report and identified specific violations
- [I have/have not] already disputed this with the credit bureaus
- [Add any other actions taken]

REQUESTED RESOLUTION:
1. Complete deletion of this inaccurately reported account from all three credit bureaus
2. Confirmation in writing that the account has been removed
3. ${highSeverity.length >= 2 ? 'Investigation into potential willful violations of the FCRA' : 'Correction of all inaccuracies identified'}

SUPPORTING EVIDENCE:
I have documentation supporting the violations listed above, including:
${flags.map(f => f.suggestedEvidence.join(', ')).join('; ')}

I declare under penalty of perjury that the information provided in this complaint is true and accurate to the best of my knowledge.
`;
}
