import React from 'react';
import { motion } from 'framer-motion';
import { TimelineEvent } from '../../../lib/analytics';
import {
  Calendar,
  AlertCircle,
  History,
  ArrowRight,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

interface ForensicTimelineProps {
  events: TimelineEvent[];
}

const ForensicTimeline: React.FC<ForensicTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <History className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Insufficient Data for Timeline</h3>
        <p className="text-sm text-slate-500 max-w-xs mt-1">
          Upload more report snapshots to reconstruct the complete forensic history of this account.
        </p>
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="relative py-4 px-2">
      {/* Central Line */}
      <div className="absolute left-[31px] top-6 bottom-6 w-[2px] bg-gradient-to-bottom from-emerald-500/20 via-blue-500/20 to-slate-200 dark:to-slate-800" />

      <div className="space-y-8 relative">
        {sortedEvents.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-6 group"
          >
            {/* Icon Column */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300",
                event.flagged 
                  ? "bg-rose-500 text-white shadow-rose-500/20" 
                  : event.type === 'violation'
                  ? "bg-amber-500 text-white shadow-amber-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 shadow-slate-200/50"
              )}>
                {event.flagged ? <ShieldAlert className="w-6 h-6" /> : 
                 event.type === 'violation' ? <AlertCircle className="w-6 h-6" /> :
                 <Clock className="w-6 h-6" />}
              </div>
            </div>

            {/* Content Column */}
            <div className="flex-1 pt-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                    {format(event.date, 'MMM dd, yyyy')}
                  </span>
                  {event.tag && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      event.flagged ? "bg-rose-500/10 text-rose-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}>
                      {event.tag}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  <Calendar className="w-3 h-3" />
                  Point {index + 1}
                </div>
              </div>

              <div className={cn(
                "premium-card p-5 transition-all duration-300",
                event.flagged ? "border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/10" : "hover:border-slate-300 dark:hover:border-slate-600"
              )}>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight flex items-center gap-2">
                  {event.label}
                  {event.flagged && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {event.description}
                </p>

                {event.evidenceSnippets && event.evidenceSnippets.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evidence Lock</p>
                    <div className="grid gap-2">
                      {event.evidenceSnippets.map((snippet, sIndex) => (
                        <div key={sIndex} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span className="font-mono leading-tight">{snippet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ForensicTimeline;
