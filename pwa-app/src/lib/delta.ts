import { AnalysisRecord, CreditFields } from './types';

export interface DeltaResult {
  field: string;
  oldValue: string;
  newValue: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface SeriesInsight {
  id: string;
  type: 'reaging' | 'removal_extension' | 'balance_shift' | 'status_flip' | 'reporting_shift';
  severity: 'high' | 'medium' | 'low';
  title: string;
  summary: string;
  evidence: string[];
}

export interface SeriesSnapshot {
  timestamp: number;
  label: string;
  dofd?: string;
  removal?: string;
  balance?: string;
  status?: string;
  reported?: string;
  lastPayment?: string;
  bureau?: string;
}

export interface SeriesSnapshotOption {
  id: string;
  timestamp: number;
  label: string;
  fields: CreditFields;
  isCurrent: boolean;
}

export function computeExpectedRemovalDate(dofd?: string, bureau?: string) {
  if (!dofd) return null;
  const date = parseDateSafe(dofd);
  if (!date) return null;
  const bufferDays = 180;
  const expected = new Date(date.getTime());
  expected.setDate(expected.getDate() + (365 * 7) + bufferDays);
  return {
    expected,
    bufferDays,
    bureau: bureau || 'bureau'
  };
}

export function exportComparisonCsv(deltas: DeltaResult[]): string {
  const header = ['Field', 'Before', 'After', 'Impact', 'Description'];
  const rows = deltas.map(delta => [
    delta.field,
    delta.oldValue,
    delta.newValue,
    delta.impact,
    delta.description || ''
  ]);
  return [header, ...rows]
    .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function exportComparisonDossier(
  deltas: DeltaResult[],
  insights: SeriesInsight[],
  snapshots: SeriesSnapshot[]
): string {
  const lines: string[] = [];
  lines.push('FORENSIC COMPARISON DOSSIER');
  lines.push('='.repeat(72));
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('SNAPSHOT TIMELINE');
  snapshots.forEach(snapshot => {
    lines.push(`- ${snapshot.label}: Bureau ${snapshot.bureau || '—'} | DOFD ${snapshot.dofd || '—'} | Removal ${snapshot.removal || '—'} | Balance ${snapshot.balance || '—'} | Status ${snapshot.status || '—'} | Last Pay ${snapshot.lastPayment || '—'} | Reported ${snapshot.reported || '—'}`);
  });
  lines.push('');
  lines.push('SERIES INSIGHTS');
  if (insights.length === 0) {
    lines.push('No series anomalies detected.');
  } else {
    insights.forEach(insight => {
      lines.push(`- [${insight.severity.toUpperCase()}] ${insight.title}: ${insight.summary}`);
      insight.evidence.forEach(item => lines.push(`  • ${item}`));
    });
  }
  lines.push('');
  lines.push('DELTA CHANGES');
  if (deltas.length === 0) {
    lines.push('No field-level deltas detected.');
  } else {
    deltas.forEach(delta => {
      lines.push(`- ${delta.field}: ${delta.oldValue} → ${delta.newValue} (${delta.impact})`);
      if (delta.description) {
        lines.push(`  ${delta.description}`);
      }
    });
  }
  return lines.join('\n');
}

/**
 * Compare two credit reports to find forensic differences
 */
export function compareReports(oldReport: CreditFields, newReport: CreditFields): DeltaResult[] {
  const deltas: DeltaResult[] = [];
  const fieldsToCompare: (keyof CreditFields)[] = [
    'dofd', 'dateOpened', 'currentBalance', 'accountStatus', 
    'estimatedRemovalDate', 'chargeOffDate', 'dateLastPayment'
  ];

  for (const field of fieldsToCompare) {
    const oldVal = oldReport[field] || 'Not Reported';
    const newVal = newReport[field] || 'Not Reported';

    if (oldVal !== newVal) {
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      let description = '';

      if (field === 'dofd') {
        impact = 'negative';
        description = `DOFD changed from ${oldVal} to ${newVal}. This is definitive proof of debt re-aging.`;
      } else if (field === 'estimatedRemovalDate') {
        const oldDate = new Date(oldVal);
        const newDate = new Date(newVal);
        if (newDate > oldDate) {
          impact = 'negative';
          description = `Removal date extended by ${Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months.`;
        } else {
          impact = 'positive';
          description = `Removal date accelerated. Item will fall off sooner.`;
        }
      } else if (field === 'currentBalance') {
        const oldBal = parseFloat((oldVal as string).replace(/[$,]/g, '')) || 0;
        const newBal = parseFloat((newVal as string).replace(/[$,]/g, '')) || 0;
        if (newBal > oldBal) {
          impact = 'negative';
          description = `Balance increased by $${(newBal - oldBal).toFixed(2)}. Check for illegal fee stacking.`;
        } else if (newBal < oldBal) {
          impact = 'positive';
          description = `Balance decreased. Payments are being applied.`;
        }
      } else if (field === 'accountStatus') {
        if (oldVal.toLowerCase().includes('paid') && newVal.toLowerCase().includes('balance')) {
          impact = 'negative';
          description = `Zombie Debt Alert: Account previously reported as PAID is now reporting a balance.`;
        } else if (oldVal.toLowerCase().includes('discharged') && newVal.toLowerCase().includes('collect')) {
          impact = 'negative';
          description = `Bankruptcy Violation: Discharged debt is being resuscitated for collection.`;
        }
      }

      deltas.push({
        field: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
        oldValue: oldVal as string,
        newValue: newVal as string,
        impact,
        description
      });
    }
  }

  return deltas;
}

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const parseDateSafe = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseBalanceSafe = (value?: string) => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

export function compareReportSeries(records: AnalysisRecord[], current: CreditFields): SeriesInsight[] {
  const currentKey = normalizeName(current.originalCreditor || current.furnisherOrCollector || '');
  if (!currentKey) return [];

  const relevant = records
    .filter(record => {
      const key = normalizeName(record.fields.originalCreditor || record.fields.furnisherOrCollector || '');
      return key && (key.includes(currentKey) || currentKey.includes(key));
    })
    .map(record => ({
      timestamp: record.timestamp,
      fields: record.fields
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (relevant.length === 0) return [];

  const series = [
    ...relevant,
    { timestamp: Date.now(), fields: current }
  ];

  const formatStamp = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const insights: SeriesInsight[] = [];

  const dofdValues = series
    .map(item => ({ value: item.fields.dofd, stamp: item.timestamp }))
    .filter(item => item.value);
  const dofdUnique = Array.from(new Set(dofdValues.map(item => item.value)));
  if (dofdUnique.length >= 2) {
    insights.push({
      id: 'series-dofd',
      type: 'reaging',
      severity: 'high',
      title: 'DOFD shifted across reports',
      summary: `Date of First Delinquency changes detected across ${dofdUnique.length} snapshots, indicating potential re-aging.`,
      evidence: dofdValues.map(item => `${formatStamp(item.stamp)} → ${item.value}`)
    });
  }

  const removalDates = series
    .map(item => ({ date: parseDateSafe(item.fields.estimatedRemovalDate), raw: item.fields.estimatedRemovalDate, stamp: item.timestamp }))
    .filter(item => item.date);
  if (removalDates.length >= 2) {
    const earliest = removalDates[0];
    const latest = removalDates[removalDates.length - 1];
    if (earliest.date && latest.date && latest.date.getTime() - earliest.date.getTime() > 1000 * 60 * 60 * 24 * 60) {
      insights.push({
        id: 'series-removal',
        type: 'removal_extension',
        severity: 'high',
        title: 'Removal date extended',
        summary: 'Estimated removal date moved later, extending reporting timeline beyond prior expectation.',
        evidence: removalDates.map(item => `${formatStamp(item.stamp)} → ${item.raw}`)
      });
    }
  }

  if (dofdUnique.length >= 2 && removalDates.length > 0) {
    const removalUnique = Array.from(new Set(removalDates.map(item => item.raw)));
    if (removalUnique.length <= 1) {
      insights.push({
        id: 'series-removal-static',
        type: 'removal_extension',
        severity: 'medium',
        title: 'Removal date unchanged despite DOFD shifts',
        summary: 'DOFD changed across snapshots but the reported removal date stayed static.',
        evidence: [
          ...dofdValues.map(item => `${formatStamp(item.stamp)} → DOFD ${item.value}`),
          `Removal date remained: ${removalUnique[0]}`
        ]
      });
    }
  }

  const removalLimitInsight = (() => {
    const dofdDate = parseDateSafe(current.dofd);
    const removalDate = parseDateSafe(current.estimatedRemovalDate);
    if (!dofdDate || !removalDate) return null;
    const expected = computeExpectedRemovalDate(current.dofd, current.bureau);
    const limit = expected?.expected || new Date(dofdDate.getTime());
    if (!expected) return null;
    if (removalDate.getTime() - limit.getTime() > 1000 * 60 * 60 * 24 * 30) {
      return {
        id: 'series-removal-limit',
        type: 'removal_extension',
        severity: 'high',
        title: 'Removal date exceeds FCRA limit',
        summary: 'Removal date appears later than DOFD + 7 years + 180 days.',
        evidence: [
          `DOFD: ${current.dofd || 'unknown'}`,
          `Expected removal: ${limit.toLocaleDateString('en-US')}`,
          `Reported removal: ${current.estimatedRemovalDate || 'unknown'}`
        ]
      } as SeriesInsight;
    }
    return null;
  })();
  if (removalLimitInsight) insights.push(removalLimitInsight);

  const removalBeforeDofdInsight = (() => {
    const dofdDate = parseDateSafe(current.dofd);
    const removalDate = parseDateSafe(current.estimatedRemovalDate);
    if (!dofdDate || !removalDate) return null;
    if (removalDate.getTime() < dofdDate.getTime()) {
      return {
        id: 'series-removal-before-dofd',
        type: 'removal_extension',
        severity: 'high',
        title: 'Removal date precedes DOFD',
        summary: 'Removal date appears earlier than the Date of First Delinquency, indicating corrupted reporting data.',
        evidence: [
          `DOFD: ${current.dofd || 'unknown'}`,
          `Removal: ${current.estimatedRemovalDate || 'unknown'}`
        ]
      } as SeriesInsight;
    }
    return null;
  })();
  if (removalBeforeDofdInsight) insights.push(removalBeforeDofdInsight);

  const balances = series
    .map(item => ({ value: parseBalanceSafe(item.fields.currentBalance), raw: item.fields.currentBalance, stamp: item.timestamp }))
    .filter(item => item.value !== null);
  if (balances.length >= 2) {
    const first = balances[0].value || 0;
    const last = balances[balances.length - 1].value || 0;
    if (last - first > 50) {
      insights.push({
        id: 'series-balance',
        type: 'balance_shift',
        severity: 'medium',
        title: 'Balance increased over time',
        summary: `Balance rose by $${(last - first).toFixed(2)} across report snapshots.`,
        evidence: balances.map(item => `${formatStamp(item.stamp)} → ${item.raw}`)
      });
    }
  }

  const lastPayments = series
    .map(item => ({ date: parseDateSafe(item.fields.dateLastPayment), raw: item.fields.dateLastPayment, stamp: item.timestamp }))
    .filter(item => item.date);
  if (lastPayments.length >= 2 && balances.length >= 2) {
    const firstPayment = lastPayments[0];
    const lastPayment = lastPayments[lastPayments.length - 1];
    const paymentShiftDays = Math.round((lastPayment.date!.getTime() - firstPayment.date!.getTime()) / (1000 * 60 * 60 * 24));
    const balanceShift = (balances[balances.length - 1].value || 0) - (balances[0].value || 0);
    if (paymentShiftDays > 120 && balanceShift > 50) {
      insights.push({
        id: 'series-payment-regression',
        type: 'balance_shift',
        severity: 'medium',
        title: 'Payment history regression',
        summary: 'Last payment date moved forward while balance increased, indicating potential fee stacking or revalidation.',
        evidence: [
          `${formatStamp(firstPayment.stamp)} → ${firstPayment.raw}`,
          `${formatStamp(lastPayment.stamp)} → ${lastPayment.raw}`,
          `Balance change: $${balanceShift.toFixed(2)}`
        ]
      });
    }
  }

  if (lastPayments.length >= 2 && dofdValues.length >= 1) {
    const latestPayment = lastPayments[lastPayments.length - 1];
    const dofdDate = parseDateSafe(current.dofd);
    if (latestPayment.date && dofdDate && latestPayment.date.getTime() - dofdDate.getTime() > 1000 * 60 * 60 * 24 * 30) {
      insights.push({
        id: 'series-payment-after-dofd',
        type: 'reporting_shift',
        severity: 'medium',
        title: 'Payment date after DOFD',
        summary: 'Last payment date significantly post-dates the reported DOFD, suggesting timeline inconsistency.',
        evidence: [
          `DOFD: ${current.dofd || 'unknown'}`,
          `Last Payment: ${latestPayment.raw || 'unknown'}`
        ]
      });
    }
  }

  const statusTrail = series
    .map(item => ({ value: item.fields.accountStatus || '', stamp: item.timestamp }))
    .filter(item => item.value);
  const hasPaid = statusTrail.some(item => item.value.toLowerCase().includes('paid') || item.value.toLowerCase().includes('closed'));
  const hasCollections = statusTrail.some(item => item.value.toLowerCase().includes('collect'));
  if (hasPaid && hasCollections) {
    insights.push({
      id: 'series-status',
      type: 'status_flip',
      severity: 'high',
      title: 'Status flip detected',
      summary: 'Account status shifts from paid/closed to collections across snapshots.',
      evidence: statusTrail.map(item => `${formatStamp(item.stamp)} → ${item.value}`)
    });
  }

  const reportedTrail = series
    .map(item => ({ date: parseDateSafe(item.fields.dateReportedOrUpdated), raw: item.fields.dateReportedOrUpdated, stamp: item.timestamp }))
    .filter(item => item.date);
  if (reportedTrail.length >= 2) {
    const latestReported = reportedTrail[reportedTrail.length - 1];
    const previousReported = reportedTrail[reportedTrail.length - 2];
    if (latestReported.date && previousReported.date && latestReported.date < previousReported.date) {
      insights.push({
        id: 'series-reporting',
        type: 'reporting_shift',
        severity: 'low',
        title: 'Reporting date reversal',
        summary: 'Date reported moved backward, which may indicate data corrections or inconsistencies.',
        evidence: reportedTrail.map(item => `${formatStamp(item.stamp)} → ${item.raw}`)
      });
    }
  }

  const reportedAfterRemoval = (() => {
    const reportedDate = parseDateSafe(current.dateReportedOrUpdated);
    const removalDate = parseDateSafe(current.estimatedRemovalDate);
    if (!reportedDate || !removalDate) return null;
    const diffDays = Math.round((reportedDate.getTime() - removalDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return {
        id: 'series-reported-after-removal',
        type: 'reporting_shift',
        severity: 'high',
        title: 'Reported after removal date',
        summary: 'Reported/updated date occurs after the estimated removal date.',
        evidence: [
          `Reported: ${current.dateReportedOrUpdated || 'unknown'}`,
          `Removal: ${current.estimatedRemovalDate || 'unknown'}`
        ]
      } as SeriesInsight;
    }
    return null;
  })();
  if (reportedAfterRemoval) insights.push(reportedAfterRemoval);

  if (reportedTrail.length >= 2 && statusTrail.length >= 2) {
    const latest = reportedTrail[reportedTrail.length - 1];
    const previous = reportedTrail[reportedTrail.length - 2];
    if (latest.date && previous.date) {
      const days = Math.round((latest.date.getTime() - previous.date.getTime()) / (1000 * 60 * 60 * 24));
      const statusChanged = statusTrail[statusTrail.length - 1].value !== statusTrail[statusTrail.length - 2].value;
      if (days <= 45 && statusChanged) {
        insights.push({
          id: 'series-rapid-reporting',
          type: 'reporting_shift',
          severity: 'medium',
          title: 'Rapid reporting change',
          summary: 'Reported date shifted quickly with a status change, suggesting revalidation or data refresh.',
          evidence: [
            `${formatStamp(previous.stamp)} → ${previous.raw}`,
            `${formatStamp(latest.stamp)} → ${latest.raw}`
          ]
        });
      }
    }
  }

  return insights;
}

export function buildReportSeries(records: AnalysisRecord[], current: CreditFields): SeriesSnapshot[] {
  const currentKey = normalizeName(current.originalCreditor || current.furnisherOrCollector || '');
  if (!currentKey) return [];

  const relevant = records
    .filter(record => {
      const key = normalizeName(record.fields.originalCreditor || record.fields.furnisherOrCollector || '');
      return key && (key.includes(currentKey) || currentKey.includes(key));
    })
    .map(record => ({
      timestamp: record.timestamp,
      fields: record.fields
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const series = [
    ...relevant,
    { timestamp: Date.now(), fields: current }
  ];

  return series.map(item => ({
    timestamp: item.timestamp,
    label: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dofd: item.fields.dofd,
    removal: item.fields.estimatedRemovalDate,
    balance: item.fields.currentBalance,
    status: item.fields.accountStatus,
    reported: item.fields.dateReportedOrUpdated,
    lastPayment: item.fields.dateLastPayment,
    bureau: item.fields.bureau
  }));
}

export function buildReportSeriesOptions(records: AnalysisRecord[], current: CreditFields): SeriesSnapshotOption[] {
  const currentKey = normalizeName(current.originalCreditor || current.furnisherOrCollector || '');
  if (!currentKey) return [];

  const relevant = records
    .filter(record => {
      const key = normalizeName(record.fields.originalCreditor || record.fields.furnisherOrCollector || '');
      return key && (key.includes(currentKey) || currentKey.includes(key));
    })
    .map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      label: new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      fields: record.fields,
      isCurrent: false
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const now = Date.now();
  return [
    ...relevant,
    {
      id: 'current',
      timestamp: now,
      label: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      fields: current,
      isCurrent: true
    }
  ];
}
