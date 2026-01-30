import { DisputeStatus } from './dispute-tracker';

export type ResponseOutcome =
  | 'deleted'
  | 'updated'
  | 'verified'
  | 'insufficient'
  | 'partial'
  | 'unknown';

export interface ResponseAnalysis {
  outcome: ResponseOutcome;
  confidence: number;
  signals: string[];
  recommendedStatus: DisputeStatus;
  nextSteps: string[];
  index?: ResponseIndex;
  items?: ResponseItem[];
}

export interface ResponseIndex {
  bureau?: string;
  accountRefs: string[];
  sections: string[];
}

export interface ResponseItem {
  accountRef: string;
  outcome: ResponseOutcome;
  evidence: string[];
}

const SIGNALS: { outcome: ResponseOutcome; keywords: string[] }[] = [
  {
    outcome: 'deleted',
    keywords: ['deleted', 'removed', 'suppressed', 'no longer on your report', 'account removed']
  },
  {
    outcome: 'updated',
    keywords: ['updated', 'modified', 'corrected', 'revised', 'information updated']
  },
  {
    outcome: 'verified',
    keywords: ['verified', 'confirmed', 'accurate', 'remains', 'investigation complete']
  },
  {
    outcome: 'insufficient',
    keywords: ['insufficient', 'frivolous', 'incomplete', 'unable to process', 'need more information']
  },
  {
    outcome: 'partial',
    keywords: ['some items', 'partial', 'one or more', 'certain items', 'not all']
  }
];

const NEXT_STEPS: Record<ResponseOutcome, string[]> = {
  deleted: [
    'Capture updated report showing deletion',
    'Send confirmation letter to bureaus if removal not reflected',
    'Update dispute tracker as favorable resolution'
  ],
  updated: [
    'Verify the correction details line by line',
    'Re-dispute if any inaccuracies remain',
    'Log response date for compliance tracking'
  ],
  verified: [
    'Request method of verification (MOV) within 15 days',
    'Escalate to CFPB if evidence contradicts verification',
    'Prepare intent-to-sue escalation if violations persist'
  ],
  insufficient: [
    'Gather requested documentation',
    'Resubmit dispute with complete evidence',
    'Track resubmission date to restart response window'
  ],
  partial: [
    'Identify which items remain',
    'Re-file disputes for unresolved accounts',
    'Add unresolved items to escalation plan'
  ],
  unknown: [
    'Manually review the response letter',
    'Tag outcomes for each account line item',
    'Update dispute status accordingly'
  ]
};

export function analyzeBureauResponse(text: string): ResponseAnalysis {
  const normalized = text.toLowerCase();
  const hits: Record<ResponseOutcome, number> = {
    deleted: 0,
    updated: 0,
    verified: 0,
    insufficient: 0,
    partial: 0,
    unknown: 0
  };

  const signals: string[] = [];

  SIGNALS.forEach(({ outcome, keywords }) => {
    keywords.forEach(keyword => {
      if (normalized.includes(keyword)) {
        hits[outcome] += 1;
        signals.push(keyword);
      }
    });
  });

  const sorted = Object.entries(hits)
    .filter(([key]) => key !== 'unknown')
    .sort((a, b) => b[1] - a[1]);

  const top = sorted[0];
  const outcome = top && top[1] > 0 ? (top[0] as ResponseOutcome) : 'unknown';
  const totalSignals = sorted.reduce((sum, [, count]) => sum + count, 0);
  const confidence = totalSignals > 0 ? Math.min(95, Math.round((top?.[1] || 0) / totalSignals * 100)) : 0;

  const recommendedStatus: DisputeStatus =
    outcome === 'deleted' ? 'resolved_favorable' :
    outcome === 'updated' ? 'response_received' :
    outcome === 'verified' ? 'escalated' :
    outcome === 'insufficient' ? 'response_received' :
    outcome === 'partial' ? 'response_received' :
    'response_received';

  return {
    outcome,
    confidence,
    signals: Array.from(new Set(signals)),
    recommendedStatus,
    nextSteps: NEXT_STEPS[outcome],
    index: extractResponseIndex(text),
    items: extractResponseItems(text)
  };
}

export function extractResponseIndex(text: string): ResponseIndex {
  const normalized = text.toLowerCase();
  const bureauMatches = [
    { name: 'experian', pattern: /experian/g },
    { name: 'equifax', pattern: /equifax/g },
    { name: 'transunion', pattern: /transunion|trans union/g }
  ];

  const bureauCounts = bureauMatches.map(item => ({
    name: item.name,
    count: (normalized.match(item.pattern) || []).length
  }));
  const bureau = bureauCounts.sort((a, b) => b.count - a.count)[0];

  const accountRefs: string[] = [];
  const accountPattern = /(account|acct|account number|account no\.|account #)\s*[:#-]?\s*([a-z0-9-]{4,})/gi;
  let match = accountPattern.exec(text);
  while (match) {
    accountRefs.push(match[2]);
    match = accountPattern.exec(text);
  }

  const sections: string[] = [];
  const sectionSignals = [
    'deleted',
    'removed',
    'updated',
    'verified',
    'remains',
    'insufficient',
    'frivolous',
    'investigation complete'
  ];
  sectionSignals.forEach(signal => {
    if (normalized.includes(signal)) {
      sections.push(signal);
    }
  });

  return {
    bureau: bureau?.count ? bureau.name : undefined,
    accountRefs: Array.from(new Set(accountRefs)),
    sections: Array.from(new Set(sections))
  };
}

export function extractResponseItems(text: string): ResponseItem[] {
  const lines = text.split(/\\r?\\n/);
  const items: ResponseItem[] = [];
  const accountPattern = /(account|acct|account number|account no\\.|account #)\\s*[:#-]?\\s*([a-z0-9-]{4,})/i;

  const detectOutcome = (context: string): ResponseOutcome => {
    const normalized = context.toLowerCase();
    const matchMap: Record<ResponseOutcome, string[]> = {
      deleted: ['deleted', 'removed', 'suppressed', 'no longer', 'account removed'],
      updated: ['updated', 'modified', 'corrected', 'revised', 'information updated'],
      verified: ['verified', 'confirmed', 'accurate', 'remains', 'investigation complete'],
      insufficient: ['insufficient', 'frivolous', 'incomplete', 'unable to process', 'need more information'],
      partial: ['partial', 'some items', 'one or more', 'not all'],
      unknown: []
    };

    const counts = Object.entries(matchMap).map(([key, keywords]) => ({
      outcome: key as ResponseOutcome,
      hits: keywords.reduce((sum, keyword) => sum + (normalized.includes(keyword) ? 1 : 0), 0)
    }));

    const best = counts.sort((a, b) => b.hits - a.hits)[0];
    return best && best.hits > 0 ? best.outcome : 'unknown';
  };

  lines.forEach((line, index) => {
    const match = line.match(accountPattern);
    if (!match) return;
    const accountRef = match[2];
    const windowStart = Math.max(0, index - 2);
    const windowEnd = Math.min(lines.length, index + 3);
    const context = lines.slice(windowStart, windowEnd).join(' ');
    const outcome = detectOutcome(context);
    const evidence = lines.slice(windowStart, windowEnd).filter(Boolean);

    items.push({ accountRef, outcome, evidence });
  });

  const unique: Record<string, ResponseItem> = {};
  items.forEach(item => {
    if (!unique[item.accountRef]) {
      unique[item.accountRef] = item;
      return;
    }
    if (unique[item.accountRef].outcome === 'unknown' && item.outcome !== 'unknown') {
      unique[item.accountRef] = item;
    }
  });

  return Object.values(unique);
}

export function summarizeResponseItems(items: ResponseItem[]): {
  result: 'deleted' | 'corrected' | 'verified' | 'no_response' | 'partial';
  details: string;
} | null {
  if (items.length === 0) return null;

  const outcomes = items.map(item => item.outcome);
  const hasDeleted = outcomes.includes('deleted');
  const hasUpdated = outcomes.includes('updated');
  const hasVerified = outcomes.includes('verified');
  const hasPartial = outcomes.includes('partial');
  const hasInsufficient = outcomes.includes('insufficient');

  if ((hasDeleted || hasUpdated) && (hasVerified || hasPartial)) {
    return {
      result: 'partial',
      details: 'Mixed outcomes detected across accounts.'
    };
  }

  if (hasDeleted) {
    return {
      result: hasUpdated ? 'corrected' : 'deleted',
      details: 'At least one account deleted or removed.'
    };
  }

  if (hasUpdated) {
    return {
      result: 'corrected',
      details: 'Account updated or corrected.'
    };
  }

  if (hasVerified) {
    return {
      result: 'verified',
      details: 'Accounts verified as accurate.'
    };
  }

  if (hasInsufficient) {
    return {
      result: 'no_response',
      details: 'Response indicates insufficient information or inability to process.'
    };
  }

  return {
    result: 'partial',
    details: 'Partial response detected.'
  };
}
