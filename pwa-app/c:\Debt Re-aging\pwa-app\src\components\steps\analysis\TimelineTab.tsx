'use client';

import React, { useMemo } from 'react';
import { TimelineEvent } from '../../../lib/analytics';
import { exportTimelinePdf } from '../../../lib/timeline-pdf';
import { formatDate } from '../../../lib/i18n';
import ForensicTimeline from './ForensicTimeline';
import { FileText, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimelineTabProps {
  timeline: TimelineEvent[];
  bureau?: string;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ timeline, bureau }) => {
  const sortedEvents = useMemo(() => [...timeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [timeline]);
  const violationCount = useMemo(() => timeline.filter(e => e.type === 'violation' || e.flagged).length, [timeline]);
  
  const integrityScore = React.useMemo(() => {
    const flagged = violationCount;
    const total = Math.max(sortedEvents.length, 1);
    return Math.max(30, Math.round(100 - (flagged / total) * 60));
  }, [sortedEvents.length, violationCount]);

  const violationClusters = React.useMemo(() => {
    const clusters: { start: number; end: number; size: number }[] = [];
    let start = -1;
    sortedEvents.forEach((event, idx) => {
      const isViolation = event.type === 'violation' || event.flagged;
      if (isViolation && start === -1) {
        start = idx;
      }
      if (!isViolation && start !== -1) {
        const end = idx - 1;
        if (end - start + 1 >= 2) {
          clusters.push({ start, end, size: end - start + 1 });
        }
        start = -1;
      }
    });
    if (start !== -1) {
      const end = sortedEvents.length - 1;
      if (end - start + 1 >= 2) {
        clusters.push({ start, end, size: end - start + 1 });
      }
    }
    return clusters;
  }, [sortedEvents]);

  const clusterSummaries = React.useMemo(() => {
    return violationClusters.map(cluster => {
      const startEvent = sortedEvents[cluster.start];
      const endEvent = sortedEvents[cluster.end];
      const months = Math.round((new Date(endEvent.date).getTime() - new Date(startEvent.date).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      const score = Math.min(100, cluster.size * 12 + Math.max(0, months) * 2);
      return {
        ...cluster,
        startLabel: startEvent.label,
        endLabel: endEvent.label,
        spanMonths: months,
        score
      };
    }).sort((a, b) => b.score - a.score);
  }, [sortedEvents, violationClusters]);

  const keyDates = React.useMemo(() => {
    const findByType = (type: TimelineEvent['type']) => sortedEvents.find(event => event.type === type)?.date;
    const opened = findByType('account');
    const delinquency = findByType('delinquency');
    const chargeoff = findByType('chargeoff');
    const removal = findByType('removal');
    const payment = findByType('payment');
    const expectedRemoval = delinquency ? new Date(new Date(delinquency).getTime() + (365 * 7 + 180) * 24 * 60 * 60 * 1000) : null;
    const removalDeltaDays = expectedRemoval && removal
      ? Math.round((new Date(removal).getTime() - expectedRemoval.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    const monthsBetween = (start?: string | Date, end?: string | Date) => {
      if (!start || !end) return null;
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.abs(e.getTime() - s.getTime());
      return Math.round(diff / (1000 * 60 * 60 * 24 * 30.44));
    };

    return {
      opened,
      delinquency,
      chargeoff,
      removal,
      payment,
      openToDofd: monthsBetween(opened, delinquency),
      dofdToChargeoff: monthsBetween(delinquency, chargeoff),
      chargeoffToRemoval: monthsBetween(chargeoff, removal),
      paymentToRemoval: monthsBetween(payment, removal),
      expectedRemoval,
      removalDeltaDays
    };
  }, [sortedEvents]);

  if (timeline.length === 0) {
    return (
      <div className="p-16 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <Clock className="w-16 h-16 mx-auto mb-6 text-slate-300 dark:text-slate-700" />
        <h3 className="text-xl font-bold dark:text-white mb-2">Chronology Deficit</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">Insufficient date data points to generate a comprehensive investigative timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 relative overflow-hidden md:col-span-2 shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock size={80} />
          </div>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 mb-2">Investigation Scope</p>
          <h2 className="text-2xl font-bold mb-1">Temporal Forensics</h2>
          <p className="text-slate-400 text-xs">Mapping account evolution and re-aging markers.</p>
          
          <div className="mt-6 flex items-center gap-6">
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Integrity</p>
              <p className="text-2xl font-bold text-emerald-400">{integrityScore}%</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Flagged</p>
              <p className="text-2xl font-bold text-rose-400">{violationCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg"
        >
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-4">Removal Window</p>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] text-slate-500 uppercase mb-1">Expected</p>
              <p className="text-sm font-bold dark:text-white">{keyDates.expectedRemoval ? formatDate(keyDates.expectedRemoval.toISOString()).split(',')[0] : 'N/A'}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase mb-1">Reported</p>
              <p className="text-sm font-bold dark:text-white">{keyDates.removal ? formatDate(keyDates.removal).split(',')[0] : 'N/A'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-lg"
        >
          <div>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-2">Actions</p>
            <button
              onClick={() => exportTimelinePdf(sortedEvents, integrityScore, bureau, clusterSummaries)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              <FileText size={14} />
              Export Brief
            </button>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Bureau Context</p>
            <p className="text-xs font-medium dark:text-white uppercase tracking-wider">{bureau || 'Unspecified'}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open → DOFD', value: keyDates.openToDofd },
          { label: 'DOFD → C/O', value: keyDates.dofdToChargeoff },
          { label: 'C/O → Removal', value: keyDates.chargeoffToRemoval },
          { label: 'Payment → Removal', value: keyDates.paymentToRemoval }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-lg font-bold dark:text-white">{stat.value !== null ? `${stat.value} mo` : '—'}</p>
          </div>
        ))}
      </div>

      {/* Main Timeline */}
      <ForensicTimeline events={sortedEvents} bureau={bureau} />
    </div>
  );
};

export default TimelineTab;
