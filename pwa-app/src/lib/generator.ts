/**
 * Dispute Letter Generator
 */

import { jsPDF } from 'jspdf';
import { CreditFields, RuleFlag, RiskProfile } from './rules';
import { CaseLaw } from './caselaw';

export interface ConsumerInfo {
  name?: string;
  address?: string;
  state?: string;
}

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
 * Generate a comprehensive Forensic Investigation Report
 */
export function generateForensicReport(
  fields: CreditFields, 
  flags: RuleFlag[], 
  risk: RiskProfile, 
  caseLaw: CaseLaw[],
  consumer: ConsumerInfo,
  discoveryAnswers: Record<string, string>
) {
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Forensic Investigation Report', 105, y, { align: 'center' });
  y += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report ID: FIR-${Date.now().toString(36).toUpperCase()}`, 105, y, { align: 'center' });
  y += 15;

  // Subject Information
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, 180, 25, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('INVESTIGATION SUBJECT', 20, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${consumer.name || 'Not Provided'}`, 20, y + 15);
  doc.text(`Account: ${fields.furnisherOrCollector || fields.originalCreditor || 'Unknown'}`, 100, y + 15);
  doc.text(`Account: ${fields.furnisherOrCollector || 'REDACTED'}`, 20, y + 20);
  doc.text(`Jurisdiction: ${fields.stateCode || 'Federal'}`, 100, y + 20);
  y += 35;

  // Risk Assessment
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FORENSIC RISK ASSESSMENT', 15, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Overall Risk Index: ${risk.overallScore}/100`, 20, y);
  doc.text(`Dispute Strength: ${risk.disputeStrength.toUpperCase()}`, 100, y);
  y += 7;
  doc.text(`Litigation Potential: ${risk.litigationPotential ? 'HIGH' : 'LOW'}`, 20, y);
  y += 15;

  // Violations & Discovery
  doc.setFont('helvetica', 'bold');
  doc.text('DETECTED VIOLATIONS & DISCOVERY', 15, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  flags.forEach((flag, i) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text(`${i+1}. ${flag.ruleName} [${flag.ruleId}]`, 20, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(flag.explanation, 160);
    doc.text(lines, 25, y);
    y += (lines.length * 4) + 2;

    // Discovery Answers
    if (flag.discoveryQuestions) {
      flag.discoveryQuestions.forEach((q, j) => {
        const ans = discoveryAnswers[`${flag.ruleId}-${j}`];
        if (ans) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'bold');
          doc.text(`Q: ${q}`, 30, y);
          y += 4;
          doc.setFont('helvetica', 'italic');
          const ansLines = doc.splitTextToSize(`A: ${ans}`, 150);
          doc.text(ansLines, 30, y);
          y += (ansLines.length * 4) + 2;
          doc.setFont('helvetica', 'normal');
        }
      });
    }

    doc.text(`Success Prob: ${flag.successProbability}% | Citations: ${flag.legalCitations.join(', ')}`, 25, y);
    y += 7;
  });
  y += 5;

  // Evidence Checklist
  const verifiedEvidence = Array.from(new Set(flags.flatMap(f => f.suggestedEvidence)))
    .filter((_, i) => discoveryAnswers[`ev-${i}`] === 'checked');
  
  if (verifiedEvidence.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('VERIFIED EVIDENCE ATTACHMENTS', 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    verifiedEvidence.forEach(ev => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`[X] ${ev}`, 20, y);
      y += 6;
    });
    y += 5;
  }

  // Case Law
  if (caseLaw.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('RELEVANT LEGAL PRECEDENTS', 15, y);
    y += 8;
    doc.setFontSize(9);
    caseLaw.forEach(cl => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text(cl.case, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(cl.citation, 100, y);
      y += 5;
      const relevance = doc.splitTextToSize(`Relevance: ${cl.relevance}`, 165);
      doc.text(relevance, 25, y);
      y += (relevance.length * 4) + 4;
    });
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text('CONFIDENTIAL FORENSIC ANALYSIS - FOR EDUCATIONAL USE ONLY', 105, 290, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' });
  }

  doc.save(`Forensic_Report_${fields.furnisherOrCollector?.replace(/\s+/g, '_') || 'Account'}.pdf`);
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

  return `${consumer.name || '[YOUR NAME]'}
${consumer.address || '[YOUR ADDRESS]'}

${today}

${bureauName}
[Bureau Address - See Below]

RE: FORMAL DISPUTE UNDER FCRA Â§ 611
Account: ${creditorName}
${fields.currentBalance ? `Balance Shown: $${fields.currentBalance}` : ''}

Dear Sir/Madam:

I am writing to formally dispute the accuracy of the above-referenced account pursuant to the Fair Credit Reporting Act, 15 U.S.C. Â§ 1681i.

Upon careful review of my credit report, I have identified the following inaccuracies and violations:
${disputeReasons}

LEGAL BASIS FOR DISPUTE:

Under FCRA Â§ 611(a), you are required to conduct a reasonable investigation of disputed information within 30 days. Under FCRA Â§ 623(a)(1), furnishers are prohibited from reporting information they know or have reasonable cause to believe is inaccurate.

${flags.some(f => ['B1', 'B2', 'B3', 'K6'].includes(f.ruleId)) ?
`The timeline discrepancies identified above constitute potential violations of FCRA Â§ 605(a), which establishes the 7-year reporting period calculated from the Date of First Delinquency.` : ''}

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

RE: DEBT VALIDATION REQUEST UNDER FDCPA ? 809
Alleged Account from: ${originalCreditor}
${fields.currentBalance ? `Amount Claimed: $${fields.currentBalance}` : ''}

SENT VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED

Dear Sir/Madam:

This letter is written pursuant to the Fair Debt Collection Practices Act, 15 U.S.C. ? 1692g, to formally request validation of the alleged debt referenced above.

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
${flags.filter(f => f.ruleId.startsWith('B') || f.ruleId === 'K6').map(f => `? ${f.explanation}`).join('\n')}

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
  narrative += `This inaccurate reporting has caused material damage to my credit score and overall financial well-being. `;
  if (flags.some(f => ['B1', 'B2', 'B3', 'K6'].includes(f.ruleId))) {
    narrative += `Furthermore, the company appears to be engaging in illegal "debt re-aging" by manipulating reporting dates to extend the 7-year legal reporting limit under FCRA ?605.\n\n`;
  } else {
    narrative += `This constitutes a failure to maintain reasonable procedures to ensure maximum possible accuracy under FCRA ?607(b).\n\n`;
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
