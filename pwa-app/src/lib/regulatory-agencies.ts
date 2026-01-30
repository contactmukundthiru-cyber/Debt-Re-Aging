/**
 * Regulatory Agency Database
 * Contains contact information and complaint procedures for consumer protection agencies
 */

export interface RegulatoryAgency {
    id: string;
    name: string;
    acronym: string;
    jurisdiction: 'federal' | 'state';
    type: 'primary' | 'secondary';
    description: string;
    contactInfo: AgencyContact;
    complaintInfo: ComplaintInfo;
    relevantLaws: string[];
    bestFor: string[];
}

export interface AgencyContact {
    website: string;
    phone: string;
    address: string;
    email?: string;
    onlineComplaint: string;
}

export interface ComplaintInfo {
    averageResponseTime: string;
    successRate: string;
    processDescription: string;
    requiredDocuments: string[];
    tips: string[];
}

const FEDERAL_AGENCIES: RegulatoryAgency[] = [
    {
        id: 'cfpb',
        name: 'Consumer Financial Protection Bureau',
        acronym: 'CFPB',
        jurisdiction: 'federal',
        type: 'primary',
        description: 'Primary federal agency for consumer financial protection. Has enforcement authority over credit bureaus, collectors, and furnishers.',
        contactInfo: {
            website: 'https://www.consumerfinance.gov',
            phone: '1-855-411-2372',
            address: 'P.O. Box 4503, Iowa City, IA 52244',
            onlineComplaint: 'https://www.consumerfinance.gov/complaint/'
        },
        complaintInfo: {
            averageResponseTime: '15-60 days',
            successRate: 'Companies respond to 97% of complaints within 15 days',
            processDescription: 'Submit complaint online. Company must respond within 15 days. You can dispute their response. CFPB may take enforcement action.',
            requiredDocuments: [
                'Account information',
                'Description of the problem',
                'Steps already taken',
                'Desired resolution'
            ],
            tips: [
                'Be specific about dates and amounts',
                'Cite relevant laws (FCRA, FDCPA)',
                'Include all correspondence',
                'Request specific remedies'
            ]
        },
        relevantLaws: ['FCRA', 'FDCPA', 'FCBA', 'ECOA'],
        bestFor: ['Credit reporting disputes', 'Debt collection harassment', 'Furnisher violations']
    },
    {
        id: 'ftc',
        name: 'Federal Trade Commission',
        acronym: 'FTC',
        jurisdiction: 'federal',
        type: 'secondary',
        description: 'Enforces consumer protection laws and collects fraud reports. Cannot resolve individual complaints but uses data for enforcement.',
        contactInfo: {
            website: 'https://www.ftc.gov',
            phone: '1-877-382-4357',
            address: '600 Pennsylvania Avenue NW, Washington, DC 20580',
            onlineComplaint: 'https://reportfraud.ftc.gov'
        },
        complaintInfo: {
            averageResponseTime: 'N/A - Does not resolve individual complaints',
            successRate: 'N/A',
            processDescription: 'FTC collects reports for pattern detection and enforcement. They do not mediate individual disputes.',
            requiredDocuments: [
                'Company information',
                'Description of unfair practice',
                'Any evidence of fraud or deception'
            ],
            tips: [
                'File even if FTC cannot resolve individually',
                'Your report contributes to enforcement patterns',
                'Include detail about deceptive practices'
            ]
        },
        relevantLaws: ['FTC Act', 'FCRA', 'FDCPA'],
        bestFor: ['Fraud reports', 'Deceptive practices', 'Identity theft']
    }
];

// State Attorney General template
const STATE_AG_TEMPLATE: Partial<RegulatoryAgency> = {
    jurisdiction: 'state',
    type: 'secondary',
    complaintInfo: {
        averageResponseTime: '30-90 days',
        successRate: 'Varies by state',
        processDescription: 'State AG offices investigate consumer complaints and may take action against repeat offenders.',
        requiredDocuments: [
            'Your contact information',
            'Company contact information',
            'Description of problem',
            'Copies of relevant documents'
        ],
        tips: [
            'Check if your state has specific credit laws',
            'AGs often have fast-track mediation programs',
            'Some states allow direct lawsuits on AG complaints'
        ]
    },
    relevantLaws: ['State UDAP laws', 'State credit laws'],
    bestFor: ['State law violations', 'Pattern of abuse', 'Local enforcement']
};

/**
 * Get all federal agencies
 */
export function getFederalAgencies(): RegulatoryAgency[] {
    return FEDERAL_AGENCIES;
}

/**
 * Get agency by ID
 */
export function getAgency(id: string): RegulatoryAgency | undefined {
    return FEDERAL_AGENCIES.find(a => a.id === id);
}

/**
 * Get recommended agencies for a violation type
 */
export function getRecommendedAgencies(violationType: string): RegulatoryAgency[] {
    const typeKeywords: Record<string, string[]> = {
        'credit_reporting': ['cfpb'],
        'debt_collection': ['cfpb', 'ftc'],
        'reaging': ['cfpb'],
        'fraud': ['ftc', 'cfpb'],
        'identity_theft': ['ftc']
    };

    const agencyIds = typeKeywords[violationType] || ['cfpb'];
    return agencyIds.map(id => getAgency(id)).filter((a): a is RegulatoryAgency => a !== undefined);
}

/**
 * Generate state AG lookup
 */
export function getStateAGInfo(state: string): {
    name: string;
    website: string;
    phone: string;
    complaintUrl: string;
} {
    // State AG contact database
    const stateAGs: Record<string, { name: string; website: string; phone: string; complaintUrl: string }> = {
        'CA': {
            name: 'California Attorney General',
            website: 'https://oag.ca.gov',
            phone: '1-800-952-5225',
            complaintUrl: 'https://oag.ca.gov/consumers/general'
        },
        'TX': {
            name: 'Texas Attorney General',
            website: 'https://www.texasattorneygeneral.gov',
            phone: '1-800-621-0508',
            complaintUrl: 'https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint'
        },
        'NY': {
            name: 'New York Attorney General',
            website: 'https://ag.ny.gov',
            phone: '1-800-771-7755',
            complaintUrl: 'https://ag.ny.gov/consumer-frauds-bureau/file-complaint'
        },
        'FL': {
            name: 'Florida Attorney General',
            website: 'http://myfloridalegal.com',
            phone: '1-866-966-7226',
            complaintUrl: 'http://myfloridalegal.com/pages.nsf/main/aa49c37b49d09c5585256c9a006ede2b'
        }
        // Add more states as needed
    };

    return stateAGs[state] || {
        name: `${state} Attorney General`,
        website: `https://www.naag.org/attorneys-general/`,
        phone: 'See state website',
        complaintUrl: 'https://www.naag.org/attorneys-general/'
    };
}

/**
 * Generate a pre-filled complaint template for CFPB
 */
export function generateCFPBComplaintTemplate(
    companyName: string,
    issueDescription: string,
    desiredResolution: string
): string {
    return `
CFPB COMPLAINT SUBMISSION

PRODUCT: Credit reporting
SUB-PRODUCT: Credit reporting

ISSUE: Improper use of your credit report / Incorrect information on your report

COMPANY: ${companyName}

WHAT HAPPENED:
${issueDescription}

DESIRED RESOLUTION:
${desiredResolution}

STEPS ALREADY TAKEN:
1. Disputed directly with credit bureau(s)
2. Sent dispute letter to furnisher/collector
3. [Add any other steps]

DOCUMENTS TO ATTACH:
- Copy of credit report showing error
- Dispute letters sent
- Any responses received
- Evidence supporting the dispute

---
This template was generated by Credit Report Analyzer.
Review and customize before submitting to CFPB.
`.trim();
}

/**
 * Get escalation path for unresolved disputes
 */
export function getEscalationPath(currentStep: string): {
    nextStep: string;
    agency: string;
    reasoning: string;
    timeframe: string;
}[] {
    const paths: Record<string, typeof escalationPath> = {
        'initial_dispute': [
            { nextStep: 'CFPB Complaint', agency: 'cfpb', reasoning: 'If bureau does not respond in 30 days or provides inadequate response', timeframe: 'After 30-45 days' },
            { nextStep: 'Direct Furnisher Dispute', agency: 'furnisher', reasoning: 'If reinserted after deletion or continued inaccuracy', timeframe: 'Immediately after reinsertion' }
        ],
        'cfpb_complaint': [
            { nextStep: 'State AG Complaint', agency: 'state_ag', reasoning: 'For state law violations or if CFPB response unsatisfactory', timeframe: 'After CFPB response' },
            { nextStep: 'Private Lawsuit', agency: 'attorney', reasoning: 'For willful violations with impact', timeframe: 'Within statute of limitations' }
        ],
        'state_ag': [
            { nextStep: 'Private Right of Action', agency: 'attorney', reasoning: 'For continued violations despite regulatory complaints', timeframe: 'Within 2 years of violation discovery' }
        ]
    };

    return paths[currentStep] || [];
}

const escalationPath = [
    { nextStep: '', agency: '', reasoning: '', timeframe: '' }
];
