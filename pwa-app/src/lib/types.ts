/**
 * Global Type Definitions
 */

export type FieldValue = string | number | boolean | Date | null | undefined;

/** Bureau-specific tactical advice */
export interface BureauTactics {
    experian?: string;
    equifax?: string;
    transunion?: string;
    all?: string;
}

/** Rule definition metadata */
export interface RuleDefinition {
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    successProbability: number;

    whyItMatters: string;
    suggestedEvidence: string[];
    legalCitations: string[];
    nextStep?: string; // Clear instruction for user
    discoveryQuestions?: string[];
    bureauTactics?: BureauTactics;
}

export interface RuleFlag {
    ruleId: string;
    ruleName: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'violation' | 'anomaly';
    confidence: number; // 0-100
    explanation: string;

    whyItMatters: string;
    suggestedEvidence: string[];
    fieldValues: Record<string, FieldValue>;
    legalCitations: string[];
    nextStep?: string;
    successProbability: number; // 0-100%
    discoveryQuestions?: string[]; // Questions to ask the consumer to find more proof
    bureauTactics?: BureauTactics; // Specific advice for each bureau
}

export interface CreditFields {
    originalCreditor?: string;
    furnisherOrCollector?: string;
    accountType?: string;
    accountStatus?: string;
    originalAmount?: string;
    currentValue?: string;
    initialValue?: string;
    creditLimit?: string;
    dateOpened?: string;
    dateReportedOrUpdated?: string;
    dofd?: string; // Date of First Delinquency
    chargeOffDate?: string;
    dateLastPayment?: string;
    dateLastActivity?: string;
    estimatedRemovalDate?: string;
    paymentHistory?: string;
    remarks?: string;
    bureau?: string;
    stateCode?: string;
    accountNumber?: string;
    phone?: string;
    // Allow dynamic field access with string keys only
    [key: string]: string | undefined;
}

export interface ScoreImpact {
    category: string;
    impact: number; // 0 to 100
    description: string;
}

export interface RiskProfile {
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    disputeStrength: 'weak' | 'moderate' | 'strong' | 'definitive';
    litigationPotential: boolean;
    detectedPatterns: PatternScore[];
    keyViolations: string[];
    recommendedApproach: string;
    summary: string;
    scoreBreakdown: ScoreImpact[];
}

export interface PatternScore {
    patternName: string;
    confidenceScore: number;
    legalStrength: 'weak' | 'moderate' | 'strong' | 'definitive';
    matchedRules: string[];
    description: string;
    recommendedAction: string;
}

export interface ConsumerInfo {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    county?: string;
    dob?: string;
    ssn?: string;
    email?: string;
    phone?: string;
}

export interface AnalyzedAccount {
    id: string;
    rawText: string;
    fields: CreditFields;
    flags: RuleFlag[];
    risk: RiskProfile;
    parsedFields?: any; // Avoiding circular with ParsedFields for now
}

export interface AnalysisRecord {
    id: string;
    timestamp: number;
    fileName?: string;
    fields: CreditFields;
    flags: RuleFlag[];
    riskProfile: RiskProfile;
    integrityHash: string; // SHA-256 for litigation-grade chain of custody
    tags?: string[];
}
