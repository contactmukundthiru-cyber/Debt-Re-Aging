import { assessForensicImpact, formatForensicReport } from '../lib/impact-assessment-engine';
import { RuleFlag } from '../lib/rules';

describe('Forensic Impact Assessment Engine', () => {
  const highSeverityFlag: RuleFlag = {
    ruleId: 'B1',
    ruleName: 'Re-aging',
    severity: 'high',
    category: 'violation',
    confidence: 100,
    explanation: 'Suspicious date opened.',
    whyItMatters: 'Legal time limit.',
    suggestedEvidence: [],
    fieldValues: {},
    legalCitations: ['FCRA § 623'],
    successProbability: 85
  };

  const mediumSeverityFlag: RuleFlag = {
    ruleId: 'D1',
    ruleName: 'Paid with Balance',
    severity: 'medium',
    category: 'violation',
    confidence: 100,
    explanation: 'Reporting non-zero value.',
    whyItMatters: 'Accuracy.',
    suggestedEvidence: [],
    fieldValues: {},
    legalCitations: ['FCRA § 623'],
    successProbability: 60
  };

  test('detects high-severity violations and marks as critical', () => {
    const flags = [highSeverityFlag, highSeverityFlag, highSeverityFlag];
    const assessment = assessForensicImpact(flags, []);
    
    expect(assessment.executiveSummary.overallSeverity).toBe('critical');
    expect(assessment.culpability.level).toBe('willful');
    expect(assessment.attorneyFees.recoverable).toBe(true);
  });

  test('identifies systemic patterns', () => {
    const flags = [mediumSeverityFlag];
    const patterns = [{ id: 'SYS-1', name: 'Batch Reporting Pattern' }];
    const assessment = assessForensicImpact(flags, patterns as any);
    
    expect(assessment.culpability.level).toBe('systemic');
    expect(assessment.culpability.indicators).toContain('Pattern of systemic reporting non-compliance');
  });

  test('preserves statutory eligibility without monetary claims', () => {
    const assessment = assessForensicImpact([mediumSeverityFlag], []);
    
    expect(assessment.statutory.eligible).toBe(true);
    expect(assessment.statutory.basis).toContain('Fair Credit Reporting Act (Statutory Basis)');
    // Ensure no dollar signs in the executive summary
    expect(assessment.executiveSummary.recommendation).not.toMatch(/\$/);
  });

  test('formats a professional report', () => {
    const assessment = assessForensicImpact([highSeverityFlag], []);
    const report = formatForensicReport(assessment);
    
    expect(report).toContain('FORENSIC IMPACT ASSESSMENT report');
    expect(report).toContain('CULPABILITY LEVEL:     WILLFUL');
    expect(report).not.toMatch(/\$/);
  });
});
