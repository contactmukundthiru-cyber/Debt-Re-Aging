'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditFields, RuleFlag } from '../../lib/types';
import { ConsumerInfo } from '../../lib/types';
import { Step } from '../../lib/constants';
import { Dispute, DisputeStatus, addCommunication, addDocument, setDisputeOutcome, updateDisputeNotes, updateDocumentTags } from '../../lib/dispute-tracker';
import { analyzeBureauResponse, extractResponseIndex, ResponseAnalysis, summarizeResponseItems } from '../../lib/response-analyzer';
import { isPDF, extractPDFText, extractPDFTextViaOCR } from '../../lib/pdf';
import { isImage, performOCR } from '../../lib/ocr';
import { buildNoResponseNotice, buildCFPBOutline, buildMOVRequest } from '../../lib/follow-up-letters';
import { generatePDFBlob } from '../../lib/generator';
import { buildStatusNote } from '../../lib/status-templates';

interface DisputeStats {
  total: number;
  active: number;
  resolved: number;
  successRate: number;
  avgResolutionDays: number;
  byStatus: Record<DisputeStatus, number>;
  byType: Record<'bureau' | 'furnisher' | 'validation' | 'cfpb' | 'legal', number>;
}

interface Step6TrackProps {
  disputes: Dispute[];
  setDisputes: (disputes: Dispute[]) => void;
  disputeStats: DisputeStats | null;
  setDisputeStats: (stats: DisputeStats | null) => void;
  editableFields: CreditFields;
  consumer: ConsumerInfo;
  flags: RuleFlag[];
  createDispute: (
    account: Dispute['account'],
    type: Dispute['type'],
    reason: string,
    violations: string[],
    bureau?: Dispute['bureau']
  ) => Dispute;
  loadDisputes: () => Dispute[];
  getDisputeStats: () => DisputeStats;
  updateDisputeStatus: (disputeId: string, newStatus: DisputeStatus, notes?: string) => Dispute | null;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  reset: () => void;
  missingFields?: number;
  overdueDeadlines?: number;
}

const Step6Track: React.FC<Step6TrackProps> = ({
  disputes,
  setDisputes,
  disputeStats,
  setDisputeStats,
  editableFields,
  consumer,
  flags,
  createDispute,
  loadDisputes,
  getDisputeStats,
  updateDisputeStatus,
  setStep,
  reset,
  missingFields,
  overdueDeadlines
}) => {
  const [selectedDisputeId, setSelectedDisputeId] = React.useState<string>(disputes[0]?.id || '');
  const [responseText, setResponseText] = React.useState('');
  const [analysis, setAnalysis] = React.useState<ResponseAnalysis | null>(null);
  const [previewDocId, setPreviewDocId] = React.useState<string | null>(null);
  const [filterBureau, setFilterBureau] = React.useState<'all' | Dispute['bureau'] | 'unknown'>('all');
  const [filterStatus, setFilterStatus] = React.useState<'all' | DisputeStatus>('all');
  const [expandedDisputeId, setExpandedDisputeId] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = React.useState<DisputeStatus>('submitted');
  const [commType, setCommType] = React.useState<'all' | 'sent' | 'received'>('all');
  const [commMethod, setCommMethod] = React.useState<'all' | 'mail' | 'email' | 'phone' | 'online'>('all');
  const [commSearch, setCommSearch] = React.useState('');
  const [noteDrafts, setNoteDrafts] = React.useState<Record<string, string>>({});
  const [selectedDocIds, setSelectedDocIds] = React.useState<string[]>([]);
  const [docTagInput, setDocTagInput] = React.useState('');
  const [reasonTemplate, setReasonTemplate] = React.useState<'custom' | 'deadline' | 'response' | 'escalation' | 'resolved'>('custom');
  const [qualityScore, setQualityScore] = React.useState(0);
  const [showHealthPanel, setShowHealthPanel] = React.useState(false);
  const [trendRange, setTrendRange] = React.useState<'weekly' | 'monthly'>('weekly');

  const getDaysRemaining = React.useCallback((date: string) => {
    const due = new Date(date);
    const diff = due.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, []);

  const filteredDisputes = React.useMemo(() => {
    return disputes.filter(dispute => {
      if (filterBureau !== 'all') {
        const bureau = dispute.bureau || 'unknown';
        if (bureau !== filterBureau) return false;
      }
      if (filterStatus !== 'all' && dispute.status !== filterStatus) return false;
      return true;
    });
  }, [disputes, filterBureau, filterStatus]);

  const filteredCommunications = React.useMemo(() => {
    const items = filteredDisputes.flatMap(dispute => dispute.communications.map(comm => ({
      ...comm,
      disputeId: dispute.id,
      creditor: dispute.account.creditor,
      status: dispute.status
    })));

    return items.filter(item => {
      if (commType !== 'all' && item.type !== commType) return false;
      if (commMethod !== 'all' && item.method !== commMethod) return false;
      if (commSearch.trim()) {
        const term = commSearch.toLowerCase();
        const target = `${item.subject} ${item.summary} ${item.creditor}`.toLowerCase();
        if (!target.includes(term)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredDisputes, commMethod, commSearch, commType]);

  const buildWeeklyTrends = React.useCallback((items: Dispute[]) => {
    const weeks = Array.from({ length: 8 }, (_, idx) => {
      const end = new Date();
      end.setDate(end.getDate() - (7 * (7 - idx)));
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      return { start, end, label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` };
    });

    return weeks.map(week => {
      const created = items.filter(d => {
        const date = new Date(d.createdAt);
        return date >= week.start && date <= week.end;
      }).length;
      const overdue = items.filter(d => {
        const deadline = new Date(d.deadlines.responseDeadline);
        return deadline >= week.start && deadline <= week.end && getDaysRemaining(d.deadlines.responseDeadline) < 0;
      }).length;
      return { label: week.label, created, overdue };
    });
  }, [getDaysRemaining]);

  const analytics = React.useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + idx, 1);
      return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString('en-US', { month: 'short' }), date };
    });

    const monthCounts = months.map(month => ({
      ...month,
      total: filteredDisputes.filter(d => {
        const created = new Date(d.createdAt);
        return created.getFullYear() === month.date.getFullYear() && created.getMonth() === month.date.getMonth();
      }).length
    }));

    const maxCount = Math.max(1, ...monthCounts.map(item => item.total));

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const oneEightyDaysAgo = new Date(now);
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

    const recent = filteredDisputes.filter(d => new Date(d.createdAt) >= ninetyDaysAgo);
    const previous = filteredDisputes.filter(d => {
      const created = new Date(d.createdAt);
      return created >= oneEightyDaysAgo && created < ninetyDaysAgo;
    });

    const favorable = (d: Dispute) => d.outcome && (d.outcome.result === 'deleted' || d.outcome.result === 'corrected');
    const successRate = (bucket: Dispute[]) => {
      const resolved = bucket.filter(d => d.outcome).length;
      return resolved > 0 ? Math.round((bucket.filter(favorable).length / resolved) * 100) : 0;
    };

    const recentSuccess = successRate(recent);
    const previousSuccess = successRate(previous);
    const successDelta = recentSuccess - previousSuccess;

    const bureauStats = filteredDisputes.reduce((acc, dispute) => {
      const key = dispute.bureau || 'unknown';
      if (!acc[key]) {
        acc[key] = { total: 0, favorable: 0, resolved: 0 };
      }
      acc[key].total += 1;
      if (dispute.outcome) {
        acc[key].resolved += 1;
        if (dispute.outcome.result === 'deleted' || dispute.outcome.result === 'corrected') {
          acc[key].favorable += 1;
        }
      }
      return acc;
    }, {} as Record<string, { total: number; favorable: number; resolved: number }>);

    const bureauRows = Object.entries(bureauStats).map(([bureau, stats]) => {
      const success = stats.resolved > 0 ? Math.round((stats.favorable / stats.resolved) * 100) : 0;
      return { bureau, ...stats, success };
    }).sort((a, b) => b.success - a.success);

    const averageResponse = Object.entries(bureauStats).map(([bureau, stats]) => {
      const resolved = filteredDisputes.filter(d => d.bureau === bureau && d.outcome);
      const avgDays = resolved.length === 0 ? 0 : Math.round(resolved.reduce((sum, item) => {
        const created = new Date(item.createdAt);
        const resolvedDate = new Date(item.outcome?.date || item.updatedAt);
        return sum + Math.ceil((resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / resolved.length);
      return { bureau, avgDays };
    });

    const slaTrends = Object.keys(bureauStats).map(bureau => {
      const resolved = filteredDisputes.filter(d => (d.bureau || 'unknown') === bureau && d.outcome);
      const now = Date.now();
      const windows = [30, 60, 90].map(days => {
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        const bucket = resolved.filter(item => new Date(item.createdAt).getTime() >= cutoff);
        const avgDays = bucket.length === 0 ? 0 : Math.round(bucket.reduce((sum, item) => {
          const created = new Date(item.createdAt);
          const resolvedDate = new Date(item.outcome?.date || item.updatedAt);
          return sum + Math.ceil((resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / bucket.length);
        return { days, avgDays, count: bucket.length };
      });
      return { bureau, windows };
    });

    return {
      monthCounts,
      maxCount,
      recentSuccess,
      previousSuccess,
      successDelta,
      bureauRows,
      averageResponse,
      slaTrends,
      weeklyTrends: buildWeeklyTrends(filteredDisputes)
    };
  }, [filteredDisputes, buildWeeklyTrends]);

  const maxWeeklyCreated = Math.max(1, ...analytics.weeklyTrends.map(item => item.created));
  const maxWeeklyOverdue = Math.max(1, ...analytics.weeklyTrends.map(item => item.overdue));

  const upcomingDeadlines = React.useMemo(() => {
    const now = Date.now();
    return disputes
      .map(dispute => {
        const date = new Date(dispute.deadlines.responseDeadline);
        return {
          dispute,
          date,
          daysRemaining: getDaysRemaining(dispute.deadlines.responseDeadline)
        };
      })
      .filter(item => !Number.isNaN(item.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4)
      .map(item => ({
        id: item.dispute.id,
        creditor: item.dispute.account.creditor,
        bureau: item.dispute.bureau || 'bureau',
        date: item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        daysRemaining: item.daysRemaining
      }));
  }, [disputes, getDaysRemaining]);

  React.useEffect(() => {
    if (disputes.length === 0) {
      setSelectedDisputeId('');
      return;
    }
    if (!selectedDisputeId || !disputes.find(item => item.id === selectedDisputeId)) {
      setSelectedDisputeId(disputes[0].id);
    }
  }, [disputes, selectedDisputeId]);

  React.useEffect(() => {
    setAnalysis(null);
  }, [selectedDisputeId]);

  const selectedDispute = disputes.find(item => item.id === selectedDisputeId) || disputes[0];
  const selectedDocuments = selectedDispute?.documents || [];

  const analyzeResponse = () => {
    if (!responseText.trim()) return;
    setAnalysis(analyzeBureauResponse(responseText));
  };

  const applyStatus = () => {
    if (!analysis || !selectedDispute) return;
    updateDisputeStatus(selectedDispute.id, analysis.recommendedStatus, `Auto-analysis: ${analysis.outcome}`);
    addCommunication(selectedDispute.id, {
      date: new Date().toISOString(),
      type: 'received',
      method: 'mail',
      subject: 'Bureau Response Analysis',
      summary: `Outcome: ${analysis.outcome} (${analysis.confidence}%). Signals: ${analysis.signals.join(', ') || 'none'}. Next: ${analysis.nextSteps.join(' | ')}`
    });
    addDocument(selectedDispute.id, {
      name: 'response_analysis.txt',
      type: 'response',
      notes: `Auto-analysis: ${analysis.outcome} (${analysis.confidence}%).`,
      content: [
        'BUREAU RESPONSE ANALYSIS',
        '',
        `Outcome: ${analysis.outcome}`,
        `Confidence: ${analysis.confidence}%`,
        `Signals: ${analysis.signals.join(', ') || 'none'}`,
        '',
        'Next Steps:',
        analysis.nextSteps.map(step => `- ${step}`).join('\\n'),
        '',
        analysis.index ? `Detected Bureau: ${analysis.index.bureau || 'unknown'}` : '',
        analysis.index ? `Account References: ${analysis.index.accountRefs.join(', ') || 'none'}` : ''
      ].filter(Boolean).join('\\n')
    });
    if (analysis.items) {
      const summary = summarizeResponseItems(analysis.items);
      if (summary) {
        setDisputeOutcome(selectedDispute.id, {
          result: summary.result,
          details: summary.details,
          followUpRequired: summary.result !== 'deleted' && summary.result !== 'corrected'
        });

        const followups = buildOutcomeFollowups(summary.result, selectedDispute);
        followups.forEach(item => {
          addDocument(selectedDispute.id, {
            name: item.name,
            type: 'response',
            notes: 'Auto-generated outcome follow-up',
            content: item.content,
            tags: item.tags,
            source: 'auto-outcome'
          });
        });
      }
    }
    setDisputes(loadDisputes());
    setDisputeStats(getDisputeStats());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const selectAllFiltered = () => {
    setSelectedIds(filteredDisputes.map(dispute => dispute.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const applyBulkStatus = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => {
      const dispute = disputes.find(item => item.id === id);
      const autoNote = dispute ? buildStatusNote(dispute, bulkStatus) : 'Bulk status update';
      updateDisputeStatus(id, bulkStatus, autoNote);
    });
    setDisputes(loadDisputes());
    setDisputeStats(getDisputeStats());
    setSelectedIds([]);
  };

  const exportFilteredCsv = () => {
    const headers = ['id', 'creditor', 'bureau', 'status', 'type', 'createdAt', 'responseDeadline'];
    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = filteredDisputes.map(dispute => [
      dispute.id,
      dispute.account.creditor,
      dispute.bureau || 'unknown',
      dispute.status,
      dispute.type,
      dispute.createdAt,
      dispute.deadlines.responseDeadline
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => escapeCell(String(cell))).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'disputes_filtered.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const buildDisputeSummary = (dispute: Dispute) => {
    const lines: string[] = [];
    lines.push('DISPUTE SUMMARY');
    lines.push('');
    lines.push(`ID: ${dispute.id}`);
    lines.push(`Creditor: ${dispute.account.creditor}`);
    lines.push(`Bureau: ${dispute.bureau || 'unknown'}`);
    lines.push(`Type: ${dispute.type}`);
    lines.push(`Status: ${dispute.status}`);
    lines.push(`Created: ${new Date(dispute.createdAt).toLocaleDateString()}`);
    lines.push(`Response Deadline: ${dispute.deadlines.responseDeadline}`);
    if (dispute.outcome) {
      lines.push(`Outcome: ${dispute.outcome.result}`);
      lines.push(`Outcome Details: ${dispute.outcome.details}`);
    }
    lines.push('');
    lines.push('STATUS HISTORY');
    dispute.statusHistory.forEach(item => {
      lines.push(`- ${new Date(item.date).toLocaleDateString()} ${item.fromStatus} -> ${item.toStatus} ${item.notes ? `(${item.notes})` : ''}`);
    });
    lines.push('');
    lines.push(`Communications: ${dispute.communications.length}`);
    lines.push(`Documents: ${dispute.documents.length}`);
    if (dispute.notes) {
      lines.push('');
      lines.push('NOTES');
      lines.push(dispute.notes);
    }
    return lines.join('\\n');
  };

  const exportSelectedPdfs = () => {
    if (selectedIds.length === 0) return;
    const map = new Map(disputes.map(item => [item.id, item]));
    selectedIds.forEach(id => {
      const dispute = map.get(id);
      if (!dispute) return;
      const summary = buildDisputeSummary(dispute);
      downloadPdf(summary, `dispute_${dispute.id}.pdf`);
    });
  };

  const exportSelectedDocsPdf = () => {
    if (selectedIds.length === 0) return;
    const map = new Map(disputes.map(item => [item.id, item]));
    selectedIds.forEach(id => {
      const dispute = map.get(id);
      if (!dispute) return;
      dispute.documents.forEach(doc => {
        if (doc.content) {
          downloadPdf(doc.content, `${dispute.id}_${doc.name.replace(/\\.[^/.]+$/, '')}.pdf`);
        }
      });
    });
  };

  const exportOutcomeBundle = async () => {
    if (!selectedDispute) return;
    const outcomeDocs = selectedDispute.documents.filter(doc => doc.tags?.includes('auto_followup'));
    if (outcomeDocs.length === 0) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    outcomeDocs.forEach(doc => {
      if (doc.content) {
        zip.file(`${selectedDispute.id}_${doc.name.replace(/\\.[^/.]+$/, '')}.pdf`, generatePDFBlob(doc.content));
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedDispute.id}_outcome_followups.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportQualityReport = () => {
    const overdue = disputes.filter(d => getDaysRemaining(d.deadlines.responseDeadline) < 0).length;
    const critical = disputes.filter(d => {
      const days = getDaysRemaining(d.deadlines.responseDeadline);
      return days >= 0 && days <= 3;
    }).length;
    const warning = disputes.filter(d => {
      const days = getDaysRemaining(d.deadlines.responseDeadline);
      return days >= 4 && days <= 7;
    }).length;

    const lines: string[] = [];
    lines.push('CASE QUALITY DRILLDOWN');
    lines.push('');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Quality Score: ${qualityScore}%`);
    lines.push('');
    lines.push(`Missing Fields: ${missingFields || 0}`);
    lines.push(`Overdue Deadlines: ${overdue}`);
    lines.push(`Critical (<=3 days): ${critical}`);
    lines.push(`Warning (<=7 days): ${warning}`);
    lines.push('');
    lines.push('BUREAU PERFORMANCE');
    analytics.bureauRows.forEach(row => {
      lines.push(`- ${row.bureau}: ${row.success}% success (${row.resolved}/${row.total} resolved)`);
    });
    lines.push('');
    lines.push('SLA AVERAGES (DAYS)');
    analytics.slaTrends.forEach(item => {
      const windowText = item.windows.map(window => `${window.days}d:${window.avgDays}`).join(' | ');
      lines.push(`- ${item.bureau}: ${windowText}`);
    });

    downloadPdf(lines.join('\\n'), 'case_quality_drilldown.pdf');
  };

  const toggleDocSelect = (id: string) => {
    setSelectedDocIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const clearDocSelection = () => {
    setSelectedDocIds([]);
  };

  const applyDocTags = () => {
    if (!selectedDispute || selectedDocIds.length === 0 || !docTagInput.trim()) return;
    const tags = docTagInput.split(',').map(tag => tag.trim()).filter(Boolean);
    selectedDocIds.forEach(docId => updateDocumentTags(selectedDispute.id, docId, tags));
    setDisputes(loadDisputes());
    setSelectedDocIds([]);
    setDocTagInput('');
  };

  const getReasonTemplate = (template: typeof reasonTemplate) => {
    const date = new Date().toLocaleDateString();
    if (template === 'deadline') {
      return `Deadline reached on ${date}. Escalating due to non-response.`;
    }
    if (template === 'response') {
      return `Response received on ${date}. Updating status based on analysis.`;
    }
    if (template === 'escalation') {
      return `Escalated on ${date} due to compliance issues or lack of verification.`;
    }
    if (template === 'resolved') {
      return `Resolved on ${date}. Outcome documented and records updated.`;
    }
    return '';
  };

  const generateBulkZip = async () => {
    if (selectedIds.length === 0) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const map = new Map(disputes.map(item => [item.id, item]));

    selectedIds.forEach(id => {
      const dispute = map.get(id);
      if (!dispute) return;
      const summary = buildDisputeSummary(dispute);
      zip.file(`${dispute.id}_summary.txt`, summary);
      dispute.documents.forEach(doc => {
        if (doc.content) {
          zip.file(`${dispute.id}_${doc.name.replace(/\\s+/g, '_')}.txt`, doc.content);
        }
      });
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'selected_disputes_bundle.zip';
    link.click();
    URL.revokeObjectURL(link.href);
  };


  const exportSlaCalendar = () => {
    if (disputes.length === 0) return;
    const lines: string[] = [];
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Credit Report Analyzer//Dispute SLA//EN');

    disputes.forEach((dispute) => {
      const deadline = new Date(dispute.deadlines.responseDeadline);
      const dateStr = deadline.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:sla-${dispute.id}-${Date.now()}@creditanalyzer`);
      lines.push(`DTSTART:${dateStr}`);
      lines.push(`SUMMARY:SLA Deadline - ${dispute.account.creditor}`);
      lines.push(`DESCRIPTION:Dispute ${dispute.id} response deadline for ${dispute.bureau || 'bureau'}.`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\\r\\n')], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dispute_sla_calendar.ics';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const buildOutcomeFollowups = (outcome: 'deleted' | 'corrected' | 'verified' | 'no_response' | 'partial', dispute: Dispute) => {
    const notices: { name: string; content: string; tags: string[] }[] = [];
    if (outcome === 'verified' || outcome === 'partial') {
      notices.push({
        name: 'followup_mov_request.txt',
        content: buildMOVRequest(editableFields, consumer),
        tags: ['auto_followup', 'outcome', 'mov', 'pdf_ready']
      });
      notices.push({
        name: 'followup_cfpb_outline.txt',
        content: buildCFPBOutline(editableFields, consumer, flags),
        tags: ['auto_followup', 'outcome', 'cfpb', 'pdf_ready']
      });
    }

    if (outcome === 'no_response') {
      notices.push({
        name: 'followup_no_response_notice.txt',
        content: buildNoResponseNotice(editableFields, consumer, dispute.deadlines.submissionDate),
        tags: ['auto_followup', 'outcome', 'no_response', 'pdf_ready']
      });
    }

    if (outcome === 'deleted' || outcome === 'corrected') {
      notices.push({
        name: 'resolution_confirmation.txt',
        content: [
          'RESOLUTION CONFIRMATION',
          '',
          `Date: ${new Date().toLocaleDateString()}`,
          `Creditor: ${dispute.account.creditor}`,
          `Outcome: ${outcome === 'deleted' ? 'Deletion confirmed' : 'Correction confirmed'}`,
          '',
          'Document the updated report and retain all correspondence for your records.',
        ].join('\\n'),
        tags: ['auto_followup', 'outcome', 'confirmation', 'pdf_ready']
      });
    }

    return notices;
  };

  React.useEffect(() => {
    const required = disputes.filter(d => !d.bureau || !d.account.creditor || !d.deadlines.responseDeadline).length;
    const overdue = disputes.filter(d => getDaysRemaining(d.deadlines.responseDeadline) < 0).length;
    const score = Math.max(0, 100 - (required * 5 + overdue * 8));
    setQualityScore(score);
  }, [disputes, getDaysRemaining]);

  const applyOutcome = () => {
    if (!analysis || !selectedDispute || !analysis.items) return;
    const summary = summarizeResponseItems(analysis.items);
    if (!summary) return;
    setDisputeOutcome(selectedDispute.id, {
      result: summary.result,
      details: summary.details,
      followUpRequired: summary.result !== 'deleted' && summary.result !== 'corrected'
    });
    setDisputes(loadDisputes());
    setDisputeStats(getDisputeStats());
  };

  const downloadPdf = (content: string, filename: string) => {
    const blob = generatePDFBlob(content);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  React.useEffect(() => {
    if (disputes.length === 0) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    disputes.forEach((dispute) => {
      if (['resolved_favorable', 'resolved_unfavorable', 'closed'].includes(dispute.status)) {
        return;
      }

      const deadline = new Date(dispute.deadlines.responseDeadline);
      if (deadline >= today) {
        return;
      }

      const alreadyScheduled = dispute.documents.some(doc => doc.tags?.includes('auto_followup') && doc.tags?.includes('deadline_expired'));
      if (alreadyScheduled) {
        return;
      }

      const notice = buildNoResponseNotice(editableFields, consumer, dispute.deadlines.submissionDate);
      const mov = buildMOVRequest(editableFields, consumer);
      const cfpb = buildCFPBOutline(editableFields, consumer, flags);

      addDocument(dispute.id, {
        name: 'auto_followup_notice.txt',
        type: 'response',
        notes: 'Auto-generated follow-up notice after missed deadline.',
        content: notice,
        tags: ['auto_followup', 'deadline_expired', 'notice'],
        source: 'auto-scheduler'
      });
      addDocument(dispute.id, {
        name: 'auto_mov_request.txt',
        type: 'response',
        notes: 'Auto-generated MOV request after missed deadline.',
        content: mov,
        tags: ['auto_followup', 'deadline_expired', 'mov'],
        source: 'auto-scheduler'
      });
      addDocument(dispute.id, {
        name: 'auto_cfpb_outline.txt',
        type: 'response',
        notes: 'Auto-generated CFPB outline after missed deadline.',
        content: cfpb,
        tags: ['auto_followup', 'deadline_expired', 'cfpb'],
        source: 'auto-scheduler'
      });
      addCommunication(dispute.id, {
        date: new Date().toISOString(),
        type: 'sent',
        method: 'mail',
        subject: 'Auto follow-up pack generated',
        summary: 'Auto-generated follow-up notices after missed response deadline.',
      });
      updateDisputeStatus(dispute.id, 'escalated', 'Auto escalation: response deadline expired');
    });

    setDisputes(loadDisputes());
    setDisputeStats(getDisputeStats());
  }, [consumer, disputes, editableFields, flags, getDisputeStats, loadDisputes, setDisputeStats, setDisputes, updateDisputeStatus]);

  return (
    <div className="fade-in max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl mb-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-400 font-mono">Case Management System</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Dispute <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Tracker</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-lg">Track your disputes, deadlines, response times, and outcomes. Monitor bureau compliance with 30/45-day response requirements.</p>
          </div>

          <button
            type="button"
            className="px-6 py-4 rounded-2xl bg-white text-slate-900 font-bold text-sm transition-all flex items-center gap-3 hover:bg-slate-100 shadow-xl"
            onClick={() => {
              createDispute(
                {
                  creditor: editableFields.originalCreditor || 'Unknown',
                  collector: editableFields.furnisherOrCollector || undefined,
                  value: editableFields.currentValue || '0',
                  accountType: editableFields.accountType || 'Unknown'
                },
                'bureau',
                flags.length > 0 ? flags[0].explanation : 'Inaccurate information',
                flags.map(f => f.ruleId)
              );
              setDisputes(loadDisputes());
              setDisputeStats(getDisputeStats());
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Dispute
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="px-4 py-2 rounded-full text-[10px] uppercase tracking-widest bg-white/10 text-white border border-white/10">
            Case Quality: {qualityScore}%
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      {disputeStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="premium-card p-6 bg-slate-950 border-slate-800 text-white shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl -mr-8 -mt-8" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 relative z-10">Total Cases</p>
            <p className="text-4xl font-bold tabular-nums relative z-10">{disputeStats.total}</p>
          </div>
          <div className="premium-card p-6 bg-blue-500/5 border-blue-500/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl -mr-8 -mt-8" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2 relative z-10">Active</p>
            <p className="text-4xl font-bold tabular-nums text-blue-500 relative z-10">{disputeStats.active}</p>
          </div>
          <div className="premium-card p-6 bg-emerald-500/5 border-emerald-500/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl -mr-8 -mt-8" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2 relative z-10">Resolved</p>
            <p className="text-4xl font-bold tabular-nums text-emerald-500 relative z-10">{disputeStats.resolved}</p>
          </div>
          <div className="premium-card p-6 bg-amber-500/5 border-amber-500/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl -mr-8 -mt-8" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2 relative z-10">Success Rate</p>
            <p className="text-4xl font-bold tabular-nums text-amber-500 relative z-10">{disputeStats.successRate}%</p>
          </div>
        </div>
      )}


      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Response Analyzer</p>
            <h3 className="text-lg font-bold dark:text-white">Bureau Letter Intelligence</h3>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
            Create a dispute to enable response analysis.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-[1fr_220px] gap-4">
              <div>
                <label htmlFor="select-dispute" className="field-label">Select Dispute</label>
                <select
                  id="select-dispute"
                  title="Select Dispute to Analyze"
                  className="input rounded-xl"
                  value={selectedDisputeId}
                  onChange={(e) => setSelectedDisputeId(e.target.value)}
                >
                  {disputes.map(dispute => (
                    <option key={dispute.id} value={dispute.id}>
                      {dispute.account.creditor} • {dispute.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <label htmlFor="import-response" className="field-label">Import Response</label>
                <input
                  id="import-response"
                  title="Import Bureau Response"
                  type="file"
                  accept=".txt,.pdf,.png,.jpg,.jpeg,.webp"
                  className="input rounded-xl"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    let text = '';
                    let tags: string[] = [];
                    if (isPDF(file)) {
                      try {
                        text = await extractPDFText(file);
                        tags = ['pdf'];
                      } catch (error) {
                        text = await extractPDFTextViaOCR(file);
                        tags = ['pdf', 'ocr'];
                      }
                    } else if (isImage(file)) {
                      text = await performOCR(file);
                      tags = ['image', 'ocr'];
                    } else {
                      text = await file.text();
                      tags = ['text'];
                    }
                    const index = extractResponseIndex(text);
                    if (index.bureau) {
                      tags.push(`bureau:${index.bureau}`);
                    }
                    if (index.accountRefs.length > 0) {
                      tags.push(...index.accountRefs.map(ref => `account:${ref}`));
                    }
                    if (index.sections.length > 0) {
                      tags.push(...index.sections.map(section => `section:${section.replace(/\\s+/g, '_')}`));
                    }
                    setResponseText(text);
                    setAnalysis(null);
                    if (selectedDispute) {
                      addDocument(selectedDispute.id, {
                        name: file.name,
                        type: 'response',
                        notes: 'Imported bureau response document',
                        content: text,
                        tags: Array.from(new Set(tags)),
                        source: index.bureau ? `bureau:${index.bureau}` : 'upload'
                      });
                      setDisputes(loadDisputes());
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="response-text" className="field-label">Response Text</label>
              <textarea
                id="response-text"
                className="textarea rounded-2xl min-h-[160px]"
                placeholder="Paste bureau response letter text here..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={analyzeResponse}
                className="btn btn-primary !rounded-xl !px-5 !py-3"
              >
                Analyze Response
              </button>
              {analysis && (
                <button
                  type="button"
                  onClick={applyStatus}
                  className="btn btn-secondary !rounded-xl !px-5 !py-3"
                >
                  Apply Status Update
                </button>
              )}
              {analysis?.items && analysis.items.length > 0 && (
                <button
                  type="button"
                  onClick={applyOutcome}
                  className="btn btn-secondary !rounded-xl !px-5 !py-3"
                >
                  Apply Outcome
                </button>
              )}
              <button
                type="button"
                onClick={exportOutcomeBundle}
                className="btn btn-secondary !rounded-xl !px-5 !py-3"
              >
                Export Outcome PDF Bundle
              </button>
            </div>

            {analysis && (
              <div className="mt-4 grid lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Outcome</p>
                  <p className="text-lg font-bold dark:text-white">{analysis.outcome}</p>
                  <p className="text-[11px] text-slate-500">Confidence {analysis.confidence}%</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Signals</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.signals.length === 0 && (
                      <span className="text-xs text-slate-500">No strong signals detected</span>
                    )}
                    {analysis.signals.map(signal => (
                      <span key={signal} className="text-[10px] font-mono px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Next Steps</p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    {analysis.nextSteps.map(step => (
                      <li key={step}>• {step}</li>
                    ))}
                  </ul>
                </div>
                {analysis.index && (
                  <div className="lg:col-span-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Response Index</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Bureau: <strong className="text-slate-700 dark:text-slate-200">{analysis.index.bureau || 'unknown'}</strong></span>
                      <span>Accounts: <strong className="text-slate-700 dark:text-slate-200">{analysis.index.accountRefs.length > 0 ? analysis.index.accountRefs.join(', ') : 'none detected'}</strong></span>
                      <span>Sections: <strong className="text-slate-700 dark:text-slate-200">{analysis.index.sections.length > 0 ? analysis.index.sections.join(', ') : 'none detected'}</strong></span>
                    </div>
                  </div>
                )}
                {analysis.items && analysis.items.length > 0 && (
                  <div className="lg:col-span-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Account Outcomes</p>
                    <div className="mt-3 space-y-2">
                      {analysis.items.map(item => (
                        <div key={item.accountRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div>
                            <p className="text-xs font-bold dark:text-white">Account {item.accountRef}</p>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">Outcome: {item.outcome}</p>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {item.evidence.slice(0, 2).join(' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Case Health</p>
            <h3 className="text-lg font-bold dark:text-white">Quick Fixes</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowHealthPanel(!showHealthPanel)}
            className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            {showHealthPanel ? 'Hide' : 'Show'} Panel
          </button>
        </div>

        {showHealthPanel && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
              <p className="text-[10px] uppercase tracking-widest text-amber-500">Missing Fields</p>
              <p className="text-2xl font-bold text-amber-500">{missingFields || 0}</p>
              <p className="text-xs text-slate-500">Review required dates and jurisdiction.</p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 3 } }))}
                className="mt-3 btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              >
                Fix Fields
              </button>
            </div>
            <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <p className="text-[10px] uppercase tracking-widest text-rose-500">Overdue</p>
              <p className="text-2xl font-bold text-rose-500">{overdueDeadlines || 0}</p>
              <p className="text-xs text-slate-500">Escalate overdue disputes immediately.</p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 4, tab: 'deadlines' } }))}
                className="mt-3 btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              >
                Open Deadlines
              </button>
            </div>
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <p className="text-[10px] uppercase tracking-widest text-emerald-500">Case Quality</p>
              <p className="text-2xl font-bold text-emerald-500">{qualityScore}%</p>
              <p className="text-xs text-slate-500">Aim for 85%+ for attorney handoff.</p>
              <button
                type="button"
                onClick={exportQualityReport}
                className="mt-3 btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              >
                Export Drilldown
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Evidence Vault</p>
            <h3 className="text-lg font-bold dark:text-white">Dispute Documents</h3>
          </div>
          <span className="text-xs font-bold text-slate-500">{selectedDocuments.length} items</span>
        </div>

        {selectedDocuments.length > 0 && (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="batch-tags" className="field-label">Batch Tags</label>
              <input
                id="batch-tags"
                className="input rounded-xl"
                value={docTagInput}
                onChange={(e) => setDocTagInput(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <button
              type="button"
              onClick={applyDocTags}
              className="btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
            >
              Apply Tags
            </button>
            <button
              type="button"
              onClick={clearDocSelection}
              className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
            >
              Clear Doc Selection
            </button>
            <span className="text-[10px] text-slate-500">{selectedDocIds.length} selected</span>
          </div>
        )}

        {selectedDocuments.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
            Upload bureau responses or evidence files to build a dispute dossier.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDocuments.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                <div>
                  <p className="text-sm font-bold dark:text-white">{doc.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    {doc.type.replace('_', ' ')} • {new Date(doc.dateAdded).toLocaleDateString()}
                  </p>
                  {doc.source && (
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
                      Source: {doc.source}
                    </p>
                  )}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {doc.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-mono px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {doc.tags?.includes('pdf_ready') && (
                    <span className="mt-2 inline-flex px-2 py-1 rounded-lg text-[9px] uppercase tracking-widest bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      PDF ready
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="checkbox"
                    title="Select Document for Batch Action"
                    aria-label={`Select ${doc.name}`}
                    checked={selectedDocIds.includes(doc.id)}
                    onChange={() => toggleDocSelect(doc.id)}
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewDocId(doc.id)}
                    className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
                  >
                    Preview
                  </button>
                  {doc.content && (
                    <button
                      type="button"
                      onClick={() => downloadPdf(doc.content || '', `${doc.name.replace(/\\.[^/.]+$/, '')}.pdf`)}
                      className="btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
                    >
                      PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewDocId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Document Preview</p>
                <p className="text-sm font-bold dark:text-white">
                  {selectedDocuments.find(doc => doc.id === previewDocId)?.name || 'Document'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocId(null)}
                title="Close Document Preview"
                aria-label="Close Document Preview"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {selectedDocuments.find(doc => doc.id === previewDocId)?.content || 'No text content available.'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {disputes.length > 0 && (
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 mb-10">
          <div className="premium-card p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Deadline Radar</p>
                <h3 className="text-lg font-bold dark:text-white">Next response windows</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Top {upcomingDeadlines.length}</span>
            </div>
            <div className="space-y-3">
              {upcomingDeadlines.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{item.creditor}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.bureau} • {item.date}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.daysRemaining < 0 ? 'bg-rose-500/10 text-rose-500' : item.daysRemaining <= 7 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)} days overdue` : `${item.daysRemaining} days`}
                  </span>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500 text-center">
                  No active deadlines yet. Create a dispute to start SLA tracking.
                </div>
              )}
            </div>
          </div>

          <div className="premium-card p-6 border-amber-500/20 bg-amber-500/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Ops Signals</p>
            <h3 className="text-lg font-bold text-amber-900 mb-4">Risk flags requiring attention</h3>
            <div className="space-y-3 text-sm text-amber-900/80">
              <div className="flex items-center justify-between gap-2">
                <span>Missing intake fields</span>
                <strong>{missingFields ?? 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Overdue response deadlines</span>
                <strong>{overdueDeadlines ?? 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Active disputes</span>
                <strong>{disputeStats?.active ?? 0}</strong>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportSlaCalendar}
                className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              >
                Export SLA Calendar
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 4, tab: 'deadlines' } }))}
                className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              >
                Open Deadlines
              </button>
            </div>
          </div>
        </div>
      )}

      {disputes.length > 0 && (
        <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SLA Pulse</p>
              <h3 className="text-lg font-bold dark:text-white">Dispute volume + overdue trend</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">Created</span>
              <span className="px-2 py-1 rounded-full bg-rose-500/10 text-rose-500">Overdue</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-28">
            {analytics.weeklyTrends.map(trend => {
              const createdHeight = Math.max(6, Math.round((trend.created / maxWeeklyCreated) * 100));
              const overdueHeight = Math.max(4, Math.round((trend.overdue / maxWeeklyOverdue) * 100));
              return (
                <div key={trend.label} className="flex flex-col items-center gap-2">
                  <div className="flex items-end gap-1 h-24">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${createdHeight}%` }}
                      transition={{ duration: 0.8, ease: "circOut" }}
                      className="w-3 rounded-full bg-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                      title={`${trend.created} created`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${overdueHeight}%` }}
                      transition={{ duration: 0.8, delay: 0.1, ease: "circOut" }}
                      className="w-3 rounded-full bg-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                      title={`${trend.overdue} overdue`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{trend.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bulk Actions</p>
            <h3 className="text-lg font-bold dark:text-white">Manage Selected Cases</h3>
          </div>
          <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={selectAllFiltered}
            className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Select All Filtered
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Clear Selection
          </button>
          <div>
            <label htmlFor="bulk-status" className="field-label">Bulk Status</label>
            <select
              id="bulk-status"
              className="input rounded-xl"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as DisputeStatus)}
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="investigating">Investigating</option>
              <option value="response_received">Response Received</option>
              <option value="escalated">Escalated</option>
              <option value="resolved_favorable">Resolved (Favorable)</option>
              <option value="resolved_unfavorable">Resolved (Unfavorable)</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label htmlFor="reason-template" className="field-label">Reason Template</label>
            <select
              id="reason-template"
              className="input rounded-xl"
              value={reasonTemplate}
              onChange={(e) => setReasonTemplate(e.target.value as typeof reasonTemplate)}
            >
              <option value="custom">Custom</option>
              <option value="deadline">Deadline Missed</option>
              <option value="response">Response Received</option>
              <option value="escalation">Escalation</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              if (reasonTemplate !== 'custom') {
                const templateText = getReasonTemplate(reasonTemplate);
                selectedIds.forEach(id => {
                  updateDisputeStatus(id, bulkStatus, templateText);
                });
                setDisputes(loadDisputes());
                setDisputeStats(getDisputeStats());
                setSelectedIds([]);
                return;
              }
              applyBulkStatus();
            }}
            className="btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Apply Status
          </button>
          <button
            type="button"
            onClick={exportSelectedPdfs}
            className="btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Export Selected PDFs
          </button>
          <button
            type="button"
            onClick={exportSelectedDocsPdf}
            className="btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Export Selected Docs PDFs
          </button>
          <button
            type="button"
            onClick={generateBulkZip}
            className="btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Export ZIP Bundle
          </button>
          <button
            type="button"
            onClick={exportFilteredCsv}
            className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Export Filtered CSV
          </button>
        </div>
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filters</p>
            <h3 className="text-lg font-bold dark:text-white">Bureau & Status</h3>
          </div>
          <span className="text-xs text-slate-500">{filteredDisputes.length} of {disputes.length} cases</span>
        </div>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="filter-bureau" className="field-label">Bureau</label>
            <select
              id="filter-bureau"
              className="input rounded-xl"
              value={filterBureau}
              onChange={(e) => setFilterBureau(e.target.value as typeof filterBureau)}
            >
              <option value="all">All</option>
              <option value="experian">Experian</option>
              <option value="equifax">Equifax</option>
              <option value="transunion">TransUnion</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-status" className="field-label">Status</label>
            <select
              id="filter-status"
              className="input rounded-xl"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="investigating">Investigating</option>
              <option value="response_received">Response Received</option>
              <option value="escalated">Escalated</option>
              <option value="resolved_favorable">Resolved (Favorable)</option>
              <option value="resolved_unfavorable">Resolved (Unfavorable)</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Communications</p>
            <h3 className="text-lg font-bold dark:text-white">Timeline</h3>
          </div>
          <span className="text-xs text-slate-500">{filteredCommunications.length} entries</span>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="comm-type" className="field-label">Type</label>
            <select
              id="comm-type"
              className="input rounded-xl"
              value={commType}
              onChange={(e) => setCommType(e.target.value as typeof commType)}
            >
              <option value="all">All</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
            </select>
          </div>
          <div>
            <label htmlFor="comm-method" className="field-label">Method</label>
            <select
              id="comm-method"
              className="input rounded-xl"
              value={commMethod}
              onChange={(e) => setCommMethod(e.target.value as typeof commMethod)}
            >
              <option value="all">All</option>
              <option value="mail">Mail</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div>
            <label htmlFor="comm-search" className="field-label">Search</label>
            <input
              id="comm-search"
              className="input rounded-xl"
              value={commSearch}
              onChange={(e) => setCommSearch(e.target.value)}
              placeholder="Search subject or summary"
            />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {filteredCommunications.length === 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-sm text-slate-500">
              No communications match your filters.
            </div>
          )}
          {filteredCommunications.map(item => (
            <div key={item.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold dark:text-white">{item.subject}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    {item.type} • {item.method} • {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{item.creditor}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">{item.summary}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Case Analytics</p>
            <h3 className="text-lg font-bold dark:text-white">Resolution Momentum</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Recent success: <strong className="text-slate-900 dark:text-white">{analytics.recentSuccess}%</strong></span>
            <span className={`${analytics.successDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {analytics.successDelta >= 0 ? '+' : ''}{analytics.successDelta}% vs last 90 days
            </span>
          </div>
        </div>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">New Disputes (6 mo)</p>
            <div className="flex items-end gap-3 h-28">
              {analytics.monthCounts.map(item => (
                <div key={item.key} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(12, (item.total / analytics.maxCount) * 100)}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className="bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
            </div>
            <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Avg Resolution Time</p>
              <p className="text-2xl font-bold dark:text-white">{disputeStats?.avgResolutionDays || 0} days</p>
              <p className="text-xs text-slate-500">Based on resolved disputes.</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Active Load</p>
              <p className="text-2xl font-bold dark:text-white">{disputeStats?.active || 0}</p>
              <p className="text-xs text-slate-500">Cases currently in flight.</p>
            </div>
          </div>

            <div className="mt-6 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Bureau Benchmarking</p>
              <div className="space-y-2">
                {analytics.bureauRows.length === 0 && (
                  <p className="text-xs text-slate-500">No bureau-tagged disputes yet.</p>
                )}
                {analytics.bureauRows.map(row => (
                  <div key={row.bureau} className="flex items-center justify-between gap-4 text-xs text-slate-500">
                    <span className="uppercase tracking-widest">{row.bureau}</span>
                    <span>{row.total} cases</span>
                    <span>{row.resolved} resolved</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{row.success}% success</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Average Response Time</p>
              <div className="space-y-2 text-xs text-slate-500">
                {analytics.averageResponse.length === 0 && (
                  <p>No resolved disputes yet.</p>
                )}
                {analytics.averageResponse.map(row => (
                  <div key={row.bureau} className="flex items-center justify-between gap-4">
                    <span className="uppercase tracking-widest">{row.bureau}</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{row.avgDays} days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bureau Performance</p>
            <h3 className="text-lg font-bold dark:text-white">Scoreboard</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              const headers = ['bureau', 'total', 'resolved', 'favorable', 'success'];
              const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
              const rows = analytics.bureauRows.map(row => [
                row.bureau,
                row.total,
                row.resolved,
                row.favorable,
                `${row.success}%`
              ]);
              const csv = [headers, ...rows]
                .map(row => row.map(cell => escapeCell(String(cell))).join(','))
                .join('\\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = 'bureau_performance.csv';
              link.click();
              URL.revokeObjectURL(link.href);
            }}
            className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Export CSV
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {analytics.bureauRows.length === 0 && (
            <div className="md:col-span-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-sm text-slate-500">
              No bureau performance data yet.
            </div>
          )}
          {analytics.bureauRows.map(row => (
            <div key={row.bureau} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{row.bureau}</p>
              <p className="text-2xl font-bold dark:text-white mt-2">{row.success}%</p>
              <p className="text-xs text-slate-500">Success rate</p>
              <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${row.success}%` }}
                  transition={{ duration: 1, ease: "circOut" }}
                  className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>{row.total} total</span>
                <span>{row.resolved} resolved</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SLA Trendlines</p>
            <h3 className="text-lg font-bold dark:text-white">30/60/90 Day Averages</h3>
          </div>
        </div>
        <div className="space-y-3 text-xs text-slate-500">
          {analytics.slaTrends.length === 0 && (
            <p>No bureau SLA data yet.</p>
          )}
          {analytics.slaTrends.map(item => (
            <div key={item.bureau} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">{item.bureau}</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {item.windows.map(window => (
                  <div key={`${item.bureau}-${window.days}`} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-[9px] uppercase tracking-widest text-slate-400">{window.days} days</p>
                    <p className="text-lg font-bold dark:text-white">{window.avgDays} days</p>
                    <p className="text-[10px] text-slate-400">{window.count} cases</p>
                    <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, window.avgDays)}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.3)]" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SLA Alerts</p>
            <h3 className="text-lg font-bold dark:text-white">Compliance Watch</h3>
          </div>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {(() => {
            const overdue = disputes.filter(d => getDaysRemaining(d.deadlines.responseDeadline) < 0).length;
            const critical = disputes.filter(d => {
              const days = getDaysRemaining(d.deadlines.responseDeadline);
              return days >= 0 && days <= 3;
            }).length;
            const warning = disputes.filter(d => {
              const days = getDaysRemaining(d.deadlines.responseDeadline);
              return days >= 4 && days <= 7;
            }).length;
            return (
              <>
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                  <p className="text-[10px] uppercase tracking-widest text-rose-500">Overdue</p>
                  <p className="text-3xl font-bold text-rose-500">{overdue}</p>
                  <p className="text-xs text-slate-500">Missed response deadlines</p>
                </div>
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <p className="text-[10px] uppercase tracking-widest text-amber-500">Critical</p>
                  <p className="text-3xl font-bold text-amber-500">{critical}</p>
                  <p className="text-xs text-slate-500">Due within 3 days</p>
                </div>
                <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                  <p className="text-[10px] uppercase tracking-widest text-blue-500">Warning</p>
                  <p className="text-3xl font-bold text-blue-500">{warning}</p>
                  <p className="text-xs text-slate-500">Due within 7 days</p>
                </div>
                <div className="md:col-span-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={exportSlaCalendar}
                    className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
                  >
                    Export SLA Calendar
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SLA Trends</p>
            <h3 className="text-lg font-bold dark:text-white">{trendRange === 'weekly' ? 'Weekly Load' : 'Monthly Load'}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTrendRange('weekly')}
              className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest border ${trendRange === 'weekly' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setTrendRange('monthly')}
              className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest border ${trendRange === 'monthly' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">New Disputes</p>
            <div className="flex items-end gap-2 h-24">
              {(trendRange === 'weekly' ? analytics.weeklyTrends : analytics.monthCounts.map(item => ({ label: item.label, created: item.total, overdue: 0 }))).map((item) => (
                <div key={`created-${item.label}`} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(10, item.created * 10)}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className="bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                    />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Overdue Items</p>
            <div className="flex items-end gap-2 h-24">
              {(trendRange === 'weekly' ? analytics.weeklyTrends : analytics.monthCounts.map(item => ({ label: item.label, created: 0, overdue: 0 }))).map((item) => (
                <div key={`overdue-${item.label}`} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(6, item.overdue * 12)}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className="bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]" 
                    />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="premium-card !p-0 overflow-hidden bg-white dark:bg-slate-900">
        <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold dark:text-white">Active Case Records</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Chronological dispute log</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">{filteredDisputes.length} CASES</span>
        </div>

        {filteredDisputes.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredDisputes.map((dispute) => (
              <div key={dispute.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      id={`select-${dispute.id}`}
                      title={`Select ${dispute.account.creditor}`}
                      aria-label={`Select ${dispute.account.creditor}`}
                      type="checkbox"
                      className="mt-1"
                      checked={selectedIds.includes(dispute.id)}
                      onChange={() => toggleSelect(dispute.id)}
                    />
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${['draft', 'submitted', 'investigating'].includes(dispute.status) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        dispute.status === 'resolved_favorable' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {dispute.status}
                      </span>
                      <span className="mono text-[10px] text-gray-400">Created {new Date(dispute.createdAt).toLocaleDateString()}</span>
                      {dispute.bureau && (
                        <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {dispute.bureau}
                        </span>
                      )}
                      {(() => {
                        const daysRemaining = getDaysRemaining(dispute.deadlines.responseDeadline);
                        const isOverdue = daysRemaining < 0;
                        const urgency = isOverdue ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          daysRemaining <= 3 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            daysRemaining <= 7 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                        return (
                          <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${urgency}`}>
                            {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                          </span>
                        );
                      })()}
                    </div>
                    <h4 className="heading-md dark:text-white">{dispute.account.creditor}</h4>
                    <p className="body-sm text-gray-500 dark:text-gray-400">{dispute.account.accountType} · {dispute.account.value}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor={`status-${dispute.id}`} className="sr-only">Dispute Status</label>
                    <select
                      id={`status-${dispute.id}`}
                      className="select text-xs py-1 h-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={dispute.status}
                      onChange={(e) => {
                        const note = noteDrafts[dispute.id];
                        const newStatus = e.target.value as DisputeStatus;
                        const autoNote = buildStatusNote(dispute, newStatus);
                        updateDisputeStatus(dispute.id, newStatus, note || autoNote);
                        setNoteDrafts(prev => ({ ...prev, [dispute.id]: '' }));
                        setDisputes(loadDisputes());
                        setDisputeStats(getDisputeStats());
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="investigating">Investigating</option>
                      <option value="response_received">Response Received</option>
                      <option value="escalated">Escalated</option>
                      <option value="resolved_favorable">Resolved (Favorable)</option>
                      <option value="resolved_unfavorable">Resolved (Unfavorable)</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setExpandedDisputeId(expandedDisputeId === dispute.id ? null : dispute.id)}
                      className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                    >
                      {expandedDisputeId === dispute.id ? 'Hide' : 'History'}
                    </button>
                  </div>
                </div>

                {expandedDisputeId === dispute.id && (
                  <div className="mt-4 grid md:grid-cols-3 gap-4 text-xs text-slate-500">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Deadlines</p>
                      <p>Submitted: {dispute.deadlines.submissionDate}</p>
                      <p>Response due: {dispute.deadlines.responseDeadline}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Status History</p>
                      <div className="space-y-1">
                        {dispute.statusHistory.slice(-3).map((entry) => (
                          <div key={entry.date} className="flex items-center justify-between gap-2">
                            <span className="uppercase">{entry.toStatus}</span>
                            <span className="text-[10px] text-slate-400">{new Date(entry.date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Records</p>
                      <p>Communications: {dispute.communications.length}</p>
                      <p>Documents: {dispute.documents.length}</p>
                    </div>
                    <div className="md:col-span-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Quick Notes</p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {(['deadline', 'response', 'escalation', 'resolved'] as const).map(template => (
                          <button
                            key={template}
                            type="button"
                            onClick={() => {
                              const templateText = getReasonTemplate(template);
                              setNoteDrafts(prev => ({ ...prev, [dispute.id]: templateText }));
                            }}
                            className="px-2 py-1 rounded-lg text-[9px] uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                      <label htmlFor={`notes-${dispute.id}`} className="sr-only">Dispute Notes</label>
                      <textarea
                        id={`notes-${dispute.id}`}
                        className="textarea rounded-xl min-h-[80px]"
                        placeholder="Add a note or reason for status change..."
                        value={noteDrafts[dispute.id] ?? dispute.notes ?? '' }
                        onChange={(e) => setNoteDrafts(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const note = noteDrafts[dispute.id] ?? '';
                            updateDisputeNotes(dispute.id, note);
                            setDisputes(loadDisputes());
                          }}
                          className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="heading-md mb-1 dark:text-gray-300">No Disputes Yet</h3>
            <p className="body-sm text-gray-500 dark:text-gray-400">Create your first dispute to start tracking.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          className="btn btn-secondary dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          onClick={() => setStep(5)}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary shadow-lg shadow-blue-500/20"
          onClick={reset}
        >
          Start New Analysis
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Step6Track;
