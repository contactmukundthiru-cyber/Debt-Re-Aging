/**
 * Dispute Letter Generator
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { CreditFields, RuleFlag, RiskProfile, ConsumerInfo } from './types';
import { CaseLaw } from './caselaw';
import { BRANDING } from '../config/branding';
import { BUREAU_ADDRESSES } from './constants';
import { generateForensicHash } from './utils';

// Extend jsPDF module to include autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

function addForensicFooter(doc: jsPDF, caseId: string) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = (doc as any).internal.pageSize.getWidth();
  const pageHeight = (doc as any).internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('courier', 'normal');
    
    const footerText = `FORENSIC_FINGERPRINT::${caseId} | SESSION_INTEGRITY::VERIFIED | PAGE ${i} OF ${pageCount}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Tiny decorative bar
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.1);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  }
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
  const pageWidth = (doc as any).internal.pageSize.getWidth();
  
  // 1. HEADER section
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FORENSIC_ANALYSIS_MANIFEST', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`GENERATED: ${new Date().toISOString()}`, pageWidth - 15, 20, { align: 'right' });
  
  const caseId = generateForensicHash({
    account: fields.accountNumber,
    opened: fields.dateOpened,
    consumer: consumer.name
  });
  doc.text(`CASE ID: ${caseId}`, 15, 35);
  
  // 2. CONSUMER section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSUMER INFORMATION', 15, 55);
  
  doc.autoTable({
    startY: 60,
    head: [['Field', 'Value']],
    body: [
      ['Name', consumer.name || 'N/A'],
      ['Address', consumer.address || 'N/A'],
      ['City/State/ZIP', `${consumer.city || ''}, ${consumer.state || ''} ${consumer.zip || ''}`]
    ],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
  });
  
  // 3. ACCOUNT DETAILS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TRADELINE EVIDENCE', 15, doc.lastAutoTable.finalY + 15);
  
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Field', 'Reported Value']],
    body: [
      ['Original Creditor', fields.originalCreditor || 'N/A'],
      ['Current Furnisher', fields.furnisherOrCollector || 'N/A'],
      ['Account Type', fields.accountType || 'N/A'],
      ['Account Status', fields.accountStatus || 'N/A'],
      ['Current Value', fields.currentValue || 'N/A'],
      ['Date Opened', fields.dateOpened || 'N/A'],
      ['DOFD', fields.dofd || 'N/A'],
      ['Charge-Off Date', fields.chargeOffDate || 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
  });
  
  // 4. VIOLATIONS section
  if (flags.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('VIOLATIONS DETECTED', 15, 20);
    
    const violationData = flags.map((flag, index) => [
      (index + 1).toString(),
      flag.ruleId,
      flag.ruleName,
      flag.severity.toUpperCase(),
      flag.explanation.substring(0, 80) + '...'
    ]);
    
    doc.autoTable({
      startY: 30,
      head: [['#', 'ID', 'Violation', 'Severity', 'Summary']],
      body: violationData,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
      styles: { fontSize: 9 }
    });
  }
  
  // 5. RISK PROFILE
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FORENSIC RISK ASSESSMENT', 15, 20);
  
  doc.autoTable({
    startY: 30,
    head: [['Metric', 'Value']],
    body: [
      ['Overall Score', `${risk.overallScore}/100`],
      ['Risk Level', risk.riskLevel.toUpperCase()],
      ['Dispute Strength', risk.disputeStrength.toUpperCase()],
      ['Litigation Potential', risk.litigationPotential ? 'YES' : 'NO'],
      ['Key Violations', risk.keyViolations.join(', ') || 'None']
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
  });
  
  // 6. CASE LAW
  if (caseLaw.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RELEVANT CASE LAW', 15, doc.lastAutoTable.finalY + 15);
    
    const caseLawData = caseLaw.map(cl => [
      cl.case,
      cl.citation,
      cl.relevance
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Case', 'Citation', 'Relevance']],
      body: caseLawData,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      styles: { fontSize: 8 }
    });
  }

  // 7. FINAL SEAL
  addForensicFooter(doc, caseId);

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
  const bureauKey = (fields.bureau || '').toLowerCase();
  const bureauInfo = (BUREAU_ADDRESSES as any)[bureauKey] || {
    name: fields.bureau || '[CREDIT BUREAU NAME]',
    address: '[Bureau Address]',
    city: '[City]',
    state: '[ST]',
    zip: '[ZIP]'
  };

  let disputeReasons = '';
  for (const flag of flags) {
    disputeReasons += `\n• ${flag.ruleName}: ${flag.explanation}\n`;
  }

  return `${consumer.name}
${consumer.address}
${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

${bureauInfo.name}
${bureauInfo.address}
${bureauInfo.city}, ${bureauInfo.state} ${bureauInfo.zip}

RE: FORMAL DISPUTE UNDER FCRA § 611
CERTIFICATE OF AUDIT: ZENITH-V5-${Math.random().toString(36).substring(7).toUpperCase()}

Dear Sir/Madam:

I am writing to formally dispute the accuracy of the above-referenced account under the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681i. A forensic audit using the Zenith V5 engine has identified systemic reporting failures on this trade line.

Upon careful review of my credit report, I have identified the following inaccuracies and violations:
${disputeReasons}

LEGAL BASIS FOR DISPUTE:

Pursuant to FCRA § 611(a)(1)(A), you are required to conduct a reasonable investigation of this dispute within 30 days of receipt. The Zenith V5 forensic engine has identified specific violations that require immediate correction:

${flags.map(f => `- ${f.ruleId}: ${f.explanation}`).join('\n')}

REQUESTED REMEDY:

1. Immediate deletion of the inaccurate trade line
2. Notification of all parties who received this report in the past 6 months
3. Updated credit report reflecting the correction
4. Method of Verification documentation for each disputed item

This matter requires your prompt attention. Failure to properly investigate and correct these errors may result in legal action under FCRA § 616-617.

Sincerely,

${consumer.name}

Enclosures: Copy of credit report with disputed items highlighted
`;
}

/**
 * Generate validation letter to creditor/collector
 */
export function generateValidationLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerInfo
): string {
  const today = new Date().toISOString().split('T')[0];
  const creditor = fields.furnisherOrCollector || fields.originalCreditor || '[CREDITOR/COLLECTOR]';

  return `${consumer.name}
${consumer.address}
${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

${creditor}
[Collection Agency/Creditor Address]

RE: DEBT VALIDATION REQUEST - ACCOUNT #${fields.accountNumber || '[ACCOUNT NUMBER]'}

To Whom It May Concern:

I am writing to request validation of the alleged debt referenced above, pursuant to my rights under the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692g.

This request is timely and I hereby dispute the validity of this debt. Please provide the following documentation:

REQUIRED VALIDATION DOCUMENTS:

1. Original signed contract or agreement bearing my signature
2. Complete payment history from account opening to present
3. Assignment or sale documentation proving your authority to collect
4. Calculation of the current balance including all fees and interest
5. License to collect debt in ${consumer.state || '[STATE]'}
6. Original creditor's name and complete address
7. Date of first delinquency (DOFD) with supporting documentation

FORENSIC CONCERNS IDENTIFIED:

${flags.length > 0 ? flags.map(f => `- ${f.ruleId}: ${f.explanation}`).join('\n') : 'No specific violations detected yet.'}

CEASE COLLECTION ACTIVITIES:

Until you provide proper validation, please cease all collection activities including:
- Credit reporting
- Telephone calls
- Written collection notices
- Legal proceedings

Failure to validate this debt while continuing collection activities may constitute violations of the FDCPA.

Please respond within 30 days of this request.

Sincerely,

${consumer.name}
`;
}

/**
 * Generate case summary for attorney review
 */
export function generateCaseSummary(
  fields: CreditFields,
  flags: RuleFlag[],
  risk: RiskProfile,
  consumer: ConsumerInfo
): string {
  return `# FORENSIC CASE SUMMARY

**Generated:** ${new Date().toLocaleString()}
**Case ID:** ZENITH-V5-${Math.random().toString(36).substring(7).toUpperCase()}

## CONSUMER INFORMATION
- **Name:** ${consumer.name}
- **Address:** ${consumer.address}, ${consumer.city}, ${consumer.state} ${consumer.zip}

## ACCOUNT DETAILS
- **Original Creditor:** ${fields.originalCreditor || 'Unknown'}
- **Current Furnisher:** ${fields.furnisherOrCollector || 'Unknown'}
- **Account Type:** ${fields.accountType || 'Unknown'}
- **Account Status:** ${fields.accountStatus || 'Unknown'}
- **Current Value:** ${fields.currentValue || 'Not reported'}
- **Date Opened:** ${fields.dateOpened || 'Unknown'}
- **DOFD:** ${fields.dofd || 'Not reported'}
- **Charge-Off Date:** ${fields.chargeOffDate || 'N/A'}

## RISK ASSESSMENT
- **Overall Score:** ${risk.overallScore}/100
- **Risk Level:** ${risk.riskLevel}
- **Dispute Strength:** ${risk.disputeStrength}
- **Litigation Potential:** ${risk.litigationPotential ? 'YES' : 'NO'}

## VIOLATIONS DETECTED (${flags.length})

${flags.map((f, i) => `${i + 1}. **${f.ruleId} - ${f.ruleName}** (${f.severity.toUpperCase()})
   - ${f.explanation}
   - Legal Basis: ${f.legalCitations.join(', ')}
`).join('\n')}

## RECOMMENDED ACTIONS
${risk.recommendedApproach}

---
*This summary was generated by the Zenith V5 Forensic Engine for attorney review.*
`;
}

/**
 * Generate CFPB complaint narrative
 */
export function generateCFPBNarrative(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerInfo
): string {
  const bureauName = fields.bureau || 'the credit reporting agency';
  
  return `COMPLAINT NARRATIVE

I am filing this complaint against ${bureauName} for violations of the Fair Credit Reporting Act (FCRA).

ISSUE DESCRIPTION:
${fields.furnisherOrCollector || 'A furnisher'} is reporting inaccurate information on my credit report. Despite my disputes, the errors remain uncorrected.

SPECIFIC ERRORS IDENTIFIED:
${flags.map(f => `- ${f.ruleName}: ${f.explanation}`).join('\n')}

IMPACT:
These inaccuracies have ${flags.length > 2 ? 'significantly' : ''} damaged my creditworthiness and may have affected my ability to obtain credit, employment, or housing.

ATTEMPTS TO RESOLVE:
I have attempted to dispute these errors directly with ${bureauName} but the issues persist.

REQUESTED RESOLUTION:
1. Immediate correction of all inaccurate information
2. Notification to all parties who received my credit report
3. Compensation for damages caused by these reporting errors

CONSUMER INFORMATION:
Name: ${consumer.name}
Address: ${consumer.address}, ${consumer.city}, ${consumer.state} ${consumer.zip}
`;
}

/**
 * Generate furnisher direct dispute letter
 */
export function generateFurnisherLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerInfo
): string {
  const today = new Date().toISOString().split('T')[0];
  const furnisher = fields.furnisherOrCollector || fields.originalCreditor || '[FURNISHER NAME]';

  return `${consumer.name}
${consumer.address}
${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

${furnisher}
[Furnisher Address]

RE: DIRECT DISPUTE UNDER FCRA § 623(a)(8)

To Whom It May Concern:

I am writing to directly dispute the accuracy of information you are reporting to credit reporting agencies regarding my account.

ACCOUNT INFORMATION:
- Account Number: ${fields.accountNumber || '[ACCOUNT NUMBER]'}
- Account Type: ${fields.accountType || '[TYPE]'}

DISPUTED INFORMATION:
${flags.map(f => `- ${f.ruleName}: ${f.explanation}`).join('\n')}

REQUIRED ACTION:
Under FCRA § 623(a)(8), you are required to:
1. Conduct an investigation of this dispute
2. Review all relevant information provided
3. Report the results to all CRAs to which you furnished the information
4. Notify me of the investigation results

If you cannot verify the accuracy of the disputed information, you must cease reporting it immediately.

Please respond within 30 days as required by law.

Sincerely,

${consumer.name}
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
  const collector = fields.furnisherOrCollector || '[COLLECTION AGENCY]';

  return `${consumer.name}
${consumer.address}
${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

${collector}
[Collection Agency Address]

RE: CEASE AND DESIST - ACCOUNT #${fields.accountNumber || '[ACCOUNT NUMBER]'}

NOTICE TO CEASE COMMUNICATION

Pursuant to the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692c(c), I hereby demand that you immediately cease all communication with me regarding the alleged debt referenced above.

This includes but is not limited to:
- Telephone calls
- Text messages
- Emails
- Postal mail
- Third-party contact

EXCEPTION:
You may contact me solely to advise that:
1. Collection efforts are terminated
2. You intend to invoke specified remedies (e.g., legal action)

VIOLATIONS NOTED:
${flags.length > 0 ? flags.map(f => `- ${f.ruleName}`).join('\n') : 'No specific violations noted at this time.'}

LEGAL WARNING:
Any further communication in violation of this cease and desist notice will be documented and may result in legal action under the FDCPA.

Sincerely,

${consumer.name}

cc: Consumer Financial Protection Bureau
    State Attorney General
`;
}

/**
 * Generate intent to sue letter
 */
export function generateIntentToSueLetter(
  fields: CreditFields,
  flags: RuleFlag[],
  consumer: ConsumerInfo
): string {
  const today = new Date().toISOString().split('T')[0];
  const defendant = fields.furnisherOrCollector || fields.bureau || '[DEFENDANT NAME]';

  return `${consumer.name}
${consumer.address}
${consumer.city}, ${consumer.state} ${consumer.zip}

${today}

VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED

${defendant}
[Defendant Address]

RE: NOTICE OF INTENT TO LITIGATE

Dear Counsel:

This letter serves as formal notice of my intent to file legal action against ${defendant} for violations of the Fair Credit Reporting Act (FCRA) and/or Fair Debt Collection Practices Act (FDCPA).

VIOLATIONS ALLEGED:
${flags.map(f => `${f.ruleId} - ${f.ruleName}: ${f.explanation}`).join('\n\n')}

DAMAGES:
- Actual damages for credit harm
- Statutory damages under FCRA § 616-617 (willful noncompliance)
- Attorney fees and costs
- Punitive damages (if applicable)

CURE PERIOD:
You have 30 days from the date of this letter to:
1. Correct all disputed information
2. Provide written confirmation of corrections
3. Compensate for damages incurred

Failure to resolve this matter will result in immediate filing of a lawsuit in federal court.

Sincerely,

${consumer.name}

NOTICE: This letter constitutes settlement communication pursuant to Federal Rule of Evidence 408.
`;
}

/**
 * Utility to generate a PDF Blob from raw string content
 */
export function generatePDFBlob(content: string): Blob {
  const doc = new jsPDF();
  const splitText = doc.splitTextToSize(content, 180);
  doc.text(splitText, 15, 15);
  return doc.output('blob');
}

/**
 * Generate a PDF letter from content and save with filename
 */
export function generatePDFLetter(content: string, filename: string): void {
  const doc = new jsPDF();
  const splitText = doc.splitTextToSize(content, 180);
  doc.text(splitText, 15, 15);
  doc.save(filename);
}
