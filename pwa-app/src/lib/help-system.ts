/**
 * Contextual Help & Guidance System
 * Provides intelligent tips, tutorials, and context-aware assistance
 */

export interface HelpTip {
    id: string;
    title: string;
    content: string;
    category: HelpCategory;
    relatedTopics: string[];
    actionable: boolean;
    action?: HelpAction;
}

export interface HelpAction {
    label: string;
    type: 'navigate' | 'external' | 'modal' | 'function';
    target: string;
}

export type HelpCategory =
    | 'getting_started'
    | 'violations'
    | 'disputes'
    | 'legal'
    | 'technical'
    | 'deadlines'
    | 'evidence';

export interface ContextualGuide {
    trigger: string;
    condition: (context: Record<string, unknown>) => boolean;
    guide: HelpTip;
}

// Comprehensive help tips database
const HELP_TIPS: HelpTip[] = [
    {
        id: 'dofd_importance',
        title: 'Why DOFD Is Critical',
        content: 'The Date of First Delinquency (DOFD) determines when negative information must be removed from your credit report. Under FCRA § 605, most negative items must be removed 7 years after the DOFD. Collectors often illegally re-set this date to extend reporting time.',
        category: 'violations',
        relatedTopics: ['re-aging', 'fcra-605', '7-year-rule'],
        actionable: true,
        action: { label: 'Learn More', type: 'external', target: 'https://www.consumerfinance.gov/compliance/supervision-examinations/fcra-section-605/' }
    },
    {
        id: 'reaging_detection',
        title: 'How to Detect Re-Aging',
        content: 'Re-aging occurs when a collector reports a newer DOFD than the original. Compare the DOFD against: (1) Date account first went 30+ days late, (2) Original creditor\'s charge-off date minus 180 days, (3) Previous credit reports. Any forward movement of DOFD is illegal.',
        category: 'violations',
        relatedTopics: ['dofd', 'collection-violations', 'evidence'],
        actionable: true,
        action: { label: 'Run Detection', type: 'function', target: 'detectReaging' }
    },
    {
        id: 'dispute_timeline',
        title: 'Understanding Dispute Deadlines',
        content: 'Credit bureaus have 30 days to investigate disputes (extendable to 45 if you submit additional information). Furnishers must respond within 30 days of receiving bureau notice. Track these deadlines carefully - failure to respond timely is itself a violation.',
        category: 'deadlines',
        relatedTopics: ['fcra-611', 'investigation', 'furnisher-duties'],
        actionable: false
    },
    {
        id: 'method_of_verification',
        title: 'Requesting Method of Verification',
        content: 'Under FCRA § 611(a)(6)(B)(iii), you can request the method used to verify disputed information. This often exposes inadequate investigations. If the bureau cannot provide specific verification procedures, it suggests a boilerplate e-OSCAR response.',
        category: 'disputes',
        relatedTopics: ['fcra-611', 'investigation', 'evidence'],
        actionable: true,
        action: { label: 'Generate MOV Request', type: 'function', target: 'generateMOVRequest' }
    },
    {
        id: 'cfpb_complaint',
        title: 'When to File a CFPB Complaint',
        content: 'File a CFPB complaint when: (1) Bureau fails to respond in 30-45 days, (2) Bureau provides a "verified" response without investigation, (3) Same inaccuracy reappears after deletion, (4) Collector continues reporting despite disputes.',
        category: 'disputes',
        relatedTopics: ['cfpb', 'regulatory', 'escalation'],
        actionable: true,
        action: { label: 'Prepare CFPB Complaint', type: 'navigate', target: '/analysis?tab=narrative' }
    },
    {
        id: 'statutory_liability',
        title: 'Understanding FCRA Liability',
        content: 'FCRA provides for: Actual impact (no cap), Statutory liability of 100 units-1,000 unit liability per willful violation, Accountability (no cap for willful violations), Attorney fees and costs. Multiple violations can significantly increase recovery potential.',
        category: 'legal',
        relatedTopics: ['fcra-616', 'fcra-617', 'lawsuit'],
        actionable: false
    },
    {
        id: 'evidence_preservation',
        title: 'Preserving Evidence',
        content: 'For potential litigation: (1) Save screenshots with timestamps, (2) Keep all correspondence in original format, (3) Document all phone calls, (4) Send disputes via certified mail with return receipt, (5) Never discard any credit reports.',
        category: 'evidence',
        relatedTopics: ['litigation', 'chain-of-custody', 'documentation'],
        actionable: true,
        action: { label: 'Open Evidence Manager', type: 'function', target: 'openEvidenceManager' }
    },
    {
        id: 'collection_validation',
        title: 'Debt Validation Rights',
        content: 'Under FDCPA § 809, you have 30 days from first contact to request validation. During this period, the collector must cease collection activity. They must provide: Name of original creditor, Amount owed, and Proof you owe the debt.',
        category: 'legal',
        relatedTopics: ['fdcpa', 'validation', 'collection'],
        actionable: true,
        action: { label: 'Generate Validation Letter', type: 'navigate', target: '/analysis?tab=lettereditor&type=validation' }
    },
    {
        id: 'statute_of_limitations',
        title: 'Statute of Limitations (SOL)',
        content: 'SOL limits how long a creditor can sue for debt collection. This is DIFFERENT from the 7-year credit reporting period. SOL varies by state (3-10 years) and debt type. A time-barred debt can still be reported but cannot be sued upon.',
        category: 'legal',
        relatedTopics: ['sol', 'state-laws', 'collections'],
        actionable: false
    },
    {
        id: 'multi_bureau_strategy',
        title: 'Disputing All Three Bureaus',
        content: 'Always dispute with all three bureaus simultaneously. Use different specific language for each to avoid automated rejection. Include the same evidence but customize the request. This creates leverage as bureaus often have different data.',
        category: 'disputes',
        relatedTopics: ['strategy', 'bureaus', 'disputes'],
        actionable: true,
        action: { label: 'Open Multi-Bureau Tab', type: 'navigate', target: '/analysis?tab=multibureau' }
    }
];

// Contextual guides that trigger based on user state
const CONTEXTUAL_GUIDES: ContextualGuide[] = [
    {
        trigger: 'high_violations',
        condition: (ctx) => (ctx.violationCount as number) >= 3,
        guide: {
            id: 'high_violations_guide',
            title: 'Multiple Violations Detected',
            content: 'With 3+ violations detected, you have a strong case. Consider: (1) Filing disputes with all bureaus, (2) Consulting an FCRA attorney, (3) Documenting everything for potential litigation.',
            category: 'violations',
            relatedTopics: ['strategy', 'attorney', 'impact'],
            actionable: true,
            action: { label: 'View Recommendations', type: 'navigate', target: '/analysis?tab=actions' }
        }
    },
    {
        trigger: 'reaging_detected',
        condition: (ctx) => !!(ctx.reagingDetected),
        guide: {
            id: 'reaging_detected_guide',
            title: 'Re-Aging Pattern Detected!',
            content: 'Our analysis detected potential date manipulation. This is a serious FCRA violation (§ 605(c)). This finding significantly strengthens your dispute position.',
            category: 'violations',
            relatedTopics: ['reaging', 'dofd', 'violation'],
            actionable: true,
            action: { label: 'Generate Re-Aging Dispute', type: 'function', target: 'generateReagingDispute' }
        }
    },
    {
        trigger: 'approaching_removal',
        condition: (ctx) => {
            const daysToRemoval = ctx.daysToRemoval as number | undefined;
            return typeof daysToRemoval === 'number' && daysToRemoval <= 180 && daysToRemoval > 0;
        },
        guide: {
            id: 'approaching_removal_guide',
            title: 'Account Approaching Removal Date',
            content: 'This account should fall off within 6 months. Consider whether disputing is worth the effort, or simply wait for automatic removal.',
            category: 'deadlines',
            relatedTopics: ['removal', 'timing', 'strategy'],
            actionable: false
        }
    },
    {
        trigger: 'no_dofd',
        condition: (ctx) => !(ctx.dofd),
        guide: {
            id: 'missing_dofd_guide',
            title: 'Missing Date of First Delinquency',
            content: 'The DOFD is not being reported. Under FCRA § 623(a)(5), furnishers MUST report DOFD for collection and charge-off accounts. This itself is a violation.',
            category: 'violations',
            relatedTopics: ['dofd', 'fcra-623', 'furnisher'],
            actionable: true,
            action: { label: 'Learn About DOFD Requirements', type: 'modal', target: 'dofdRequirements' }
        }
    }
];

/**
 * Get all help tips for a category
 */
export function getHelpTipsByCategory(category: HelpCategory): HelpTip[] {
    return HELP_TIPS.filter(tip => tip.category === category);
}

/**
 * Search help tips
 */
export function searchHelpTips(query: string): HelpTip[] {
    const lowerQuery = query.toLowerCase();
    return HELP_TIPS.filter(tip =>
        tip.title.toLowerCase().includes(lowerQuery) ||
        tip.content.toLowerCase().includes(lowerQuery) ||
        tip.relatedTopics.some(t => t.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Get contextual guides based on current state
 */
export function getContextualGuides(context: Record<string, unknown>): HelpTip[] {
    return CONTEXTUAL_GUIDES
        .filter(guide => guide.condition(context))
        .map(guide => guide.guide);
}

/**
 * Get a specific help tip by ID
 */
export function getHelpTip(id: string): HelpTip | undefined {
    return HELP_TIPS.find(tip => tip.id === id);
}

/**
 * Get related tips
 */
export function getRelatedTips(tipId: string): HelpTip[] {
    const currentTip = getHelpTip(tipId);
    if (!currentTip) return [];

    return HELP_TIPS.filter(tip =>
        tip.id !== tipId &&
        tip.relatedTopics.some(t => currentTip.relatedTopics.includes(t))
    ).slice(0, 3);
}

/**
 * Get all categories with counts
 */
export function getHelpCategories(): { category: HelpCategory; count: number; label: string }[] {
    const categoryLabels: Record<HelpCategory, string> = {
        getting_started: 'Getting Started',
        violations: 'Violations & Errors',
        disputes: 'Dispute Process',
        legal: 'Legal Rights',
        technical: 'Technical Help',
        deadlines: 'Deadlines & Timing',
        evidence: 'Evidence & Documentation'
    };

    const categories: HelpCategory[] = ['getting_started', 'violations', 'disputes', 'legal', 'technical', 'deadlines', 'evidence'];

    return categories.map(category => ({
        category,
        count: HELP_TIPS.filter(t => t.category === category).length,
        label: categoryLabels[category]
    }));
}

/**
 * Get quick tips for dashboard display
 */
export function getQuickTips(limit: number = 5): HelpTip[] {
    return HELP_TIPS.filter(t => t.actionable).slice(0, limit);
}

/**
 * Generate a tutorial flow
 */
export function getTutorialFlow(flowId: string): HelpTip[] {
    const flows: Record<string, string[]> = {
        'first_dispute': [
            'dofd_importance',
            'dispute_timeline',
            'evidence_preservation',
            'multi_bureau_strategy'
        ],
        'reaging_case': [
            'dofd_importance',
            'reaging_detection',
            'method_of_verification',
            'cfpb_complaint'
        ],
        'collection_defense': [
            'collection_validation',
            'statute_of_limitations',
            'statutory_liability',
            'evidence_preservation'
        ]
    };

    const tipIds = flows[flowId] || [];
    return tipIds.map(id => getHelpTip(id)).filter((t): t is HelpTip => t !== undefined);
}
