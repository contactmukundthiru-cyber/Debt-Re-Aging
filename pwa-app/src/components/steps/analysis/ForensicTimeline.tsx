import React from 'react';
import { motion } from 'framer-motion';
import { TimelineEvent } from '../../../lib/analytics';
import {
  Calendar,
  AlertCircle,
  History,
  ArrowRight,
  ShieldAlert,
  Clock,
  Radiation,
  Terminal,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

interface ForensicTimelineProps {
  events: TimelineEvent[];
}

const ForensicTimeline: React.FC<ForensicTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center bg-slate-950 rounded-[4rem] border-2 border-dashed border-slate-800 shadow-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5" />
        <div className="relative z-10">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center mb-8 text-slate-500 shadow-2xl mx-auto">
            <History className="w-10 h-10 animate-pulse" />
          </div>
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Chronology Deficit</h3>
          <p className="text-slate-400 max-w-sm mx-auto font-medium leading-relaxed italic">
            Insufficient metadata detected for sequence reconstruction. Upload additional historical snapshots to initialize the forensic timeline.
          </p>
        </div>
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="relative pt-8 pb-32">
      {/* Central Line - Specialized Forensic Aesthetic */}
      <div className="absolute left-[39px] top-0 bottom-0 w-[4px] bg-slate-900 rounded-full" />
      <div className="absolute left-[40px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 via-emerald-500 to-rose-500/20" />

      <div className="space-y-24 relative">
        {sortedEvents.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, duration: 0.6 }}
            className="flex gap-12 group"
          >
            {/* Icon Column - High-End Verification Node */}
            <div className="relative z-10 flex flex-col items-center pt-2">
              <div className={cn(
                "w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-3xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-[15deg] border-2 backdrop-blur-3xl",
                event.flagged 
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-500" 
                  : event.type === 'violation'
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-500"
                  : "bg-slate-950 border-white/10 text-slate-500 group-hover:border-blue-500/50 group-hover:text-blue-400"
              )}>
                {event.flagged ? <ShieldAlert size={32} /> : 
                 event.type === 'violation' ? <Radiation size={32} /> :
                 <Clock size={32} className="group-hover:animate-spin-slow" />}
                 
                 {/* Visual pulse for tagged items */}
                 {event.flagged && (
                   <span className="absolute inset-0 rounded-[1.8rem] bg-rose-500/20 animate-ping pointer-events-none" />
                 )}
              </div>
              
              {/* Event Index Indicator */}
              <div className="mt-6 px-4 py-1.5 bg-slate-900 border border-white/5 rounded-full shadow-xl">
                 <span className="text-[10px] font-black font-mono text-slate-500 tabular-nums uppercase tracking-widest leading-none">NODE::{index + 1}</span>
              </div>
            </div>

            {/* Content Column - Forensic Report Style */}
            <div className="flex-1 text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-blue-500 uppercase tracking-[0.3em] font-mono leading-none">
                      {format(event.date, 'MMM dd, yyyy')}
                    </span>
                    <span className="text-[10px] text-slate-700 font-mono font-black mt-2 tracking-widest uppercase italic leading-none">FORENSIC_TIMESTAMP::01</span>
                  </div>
                  {event.tag && (
                    <span className={cn(
                      "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border shadow-2xl font-mono italic",
                      event.flagged ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "bg-slate-950 text-slate-500 border-white/5"
                    )}>
                      {event.tag}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 px-6 py-3 bg-slate-950/80 rounded-full border border-white/5 shadow-inner">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                   <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] font-mono">Sequence Validated</span>
                </div>
              </div>

              <div className={cn(
                "p-14 rounded-[4rem] transition-all duration-700 shadow-3xl overflow-hidden relative group/card border",
                event.flagged 
                  ? "border-rose-500/30 bg-rose-500/5 backdrop-blur-3xl ring-1 ring-rose-500/10" 
                  : "bg-slate-950 border-white/5 hover:border-blue-500/30 backdrop-blur-3xl ring-1 ring-transparent hover:ring-blue-500/10"
              )}>
                {/* Decorative background icon */}
                <div className="absolute -bottom-12 -right-12 p-12 opacity-[0.02] group-hover/card:scale-125 transition-transform duration-1000 rotate-12 pointer-events-none">
                   <Fingerprint size={320} className="text-white" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-1.5 h-12 bg-blue-500 rounded-full" />
                    <h4 className="text-5xl font-black text-white tracking-tighter leading-none uppercase font-mono italic">
                      {event.label}
                    </h4>
                  </div>
                  
                  <p className="text-2xl text-slate-400 leading-relaxed font-bold mb-14 max-w-5xl italic border-l border-white/10 pl-10 tracking-tight">
                    {event.description}
                  </p>

                  {event.evidenceSnippets && event.evidenceSnippets.length > 0 && (
                    <div className="space-y-8 pt-12 border-t border-white/10">
                      <div className="flex items-center gap-4">
                         <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                         <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono italic">Institutional Evidence Matrix</p>
                      </div>
                      <div className="grid gap-4">
                        {event.evidenceSnippets.map((snippet, sIndex) => (
                          <div key={sIndex} className="flex items-start gap-8 text-sm text-slate-400 bg-black/40 p-10 rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all group/snippet shadow-2xl">
                            <div className="mt-1 w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 shrink-0 border border-blue-500/20 shadow-lg">
                               <Terminal size={22} className="group-hover/snippet:scale-110 transition-transform" />
                            </div>
                            <span className="font-mono leading-relaxed select-all italic opacity-80 group-hover/snippet:opacity-100 transition-opacity text-base py-2">
                                <span className="text-blue-500/50 mr-4 font-black">LOG_NODE_{sIndex + 1}::</span>
                                {snippet}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ForensicTimeline;
