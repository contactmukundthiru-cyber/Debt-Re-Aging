/**
 * Forensic Affidavit Generator
 * 
 * Generates a formal, sworn statement of forensic findings.
 * This is designed to be used in legal proceedings or as a high-pressure
 * attachment to a dispute letter.
 */

import { RuleFlag, CreditFields, RiskProfile } from './rules';
import { ConsumerInfo } from './types';

export function generateForensicAffidavit(
    fields: Partial<CreditFields>,
    flags: RuleFlag[],
    risk: RiskProfile,
    consumer: ConsumerInfo
): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    let text = `AFFIDAVIT OF FORENSIC CREDIT ANALYSIS\n`;
    text += `======================================\n\n`;

    text += `STATE OF ${consumer.state || '[STATE]'}\n`;
    text += `COUNTY OF ${consumer.county || '[COUNTY]'}\n\n`;

    text += `I, ${consumer.name}, being of lawful age and first duly sworn upon my oath, state as follows:\n\n`;

    text += `1. INTRODUCTION: I am a consumer as defined by 15 U.S.C. § 1681a(c). This affidavit is prepared following a forensic audit of my credit disclosures provided by the consumer reporting agencies.\n\n`;

    text += `2. SUBJECT ACCOUNT: This analysis pertains to the account reported by ${fields.furnisherOrCollector || fields.originalCreditor || 'the Creditor'} under Account Identifier ${fields.accountType || '[ACCOUNT IDENTIFIER]'}.\n\n`;

    text += `3. FORENSIC FINDINGS: My audit of the data provided has identified the following material inaccuracies and/or legal violations:\n\n`;

    flags.forEach((flag, index) => {
        text += `   ${String.fromCharCode(97 + index)}) ${flag.ruleName.toUpperCase()}: ${flag.explanation}\n`;
        if (flag.legalCitations.length > 0) {
            text += `      LEGAL BASIS: Violates ${flag.legalCitations.join(', ')}.\n`;
        }
        text += `\n`;
    });

    text += `4. RISK ASSESSMENT: The forensic audit assigned this reporting a "Risk Score" of ${risk.overallScore}/100 and determined a "${risk.disputeStrength.toUpperCase()}" probability of legal inaccuracy. The detected patterns suggest ${risk.recommendedApproach}.\n\n`;

    text += `5. CERTIFICATION: I certify that I have reviewed the findings above and that they are true and correct to the best of my knowledge, information, and belief.\n\n`;

    text += `6. DEMAND: Pursuant to 15 U.S.C. § 1681i, I demand that the consumer reporting agency immediately delete this inaccurate information or provide a detailed method of verification (MOV) that addresses each specific forensic discrepancy listed above.\n\n`;

    text += `FURTHER AFFIANT SAYETH NOT.\n\n`;

    text += `__________________________________________\n`;
    text += `${consumer.name}, Affiant\n\n`;

    text += `Subscribed and sworn to before me this ____ day of ___________, 20____.\n\n`;
    text += `__________________________________________\n`;
    text += `NOTARY PUBLIC\n`;
    text += `My Commission Expires: ____________________\n`;

    return text;
}
