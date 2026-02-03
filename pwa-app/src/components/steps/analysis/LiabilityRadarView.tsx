'use client';

import React from 'react';
import { LiabilityReport } from '../../../lib/liability';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Gavel,
  ShieldAlert,
  ChevronRight,
  Target,
  Zap,
  Flag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface RadarMetric {
  label: string;
  x: number;
  y: number;
  bgX: number;
  bgY: number;
}

interface LiabilityRadarViewProps {
  liability: LiabilityReport;
  radarMetrics: RadarMetric[];
}

const LiabilityRadarView: React.FC<LiabilityRadarViewProps> = ({ liability, radarMetrics }) => (
  <div className="fade-in space-y-12 pb-32 px-2">
    {/* Summary Header */}
    <section className="relative">
      <div className="relative bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 p-12">
        <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-2">
                <Target size={14} className="text-blue-600" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600">Institutional Exposure Audit</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Systemic Risk Matrix</span>
            </div>

            <h2 className="text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
                Liability <span className="text-blue-600">Assets</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed max-w-xl font-medium">
                Quantifying institutional liability across verified data discrepancies and statutory violations. High-impact findings represent primary recovery vectors.
            </p>
            
            <div className="grid grid-cols-2 gap-8">
                <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] shadow-inner">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2">Institutional Exposure</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-bold text-slate-900 tracking-tighter tabular-nums">{liability.overallSeverityScore}</p>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Points</span>
                    </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
                    <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2">Litigation Readiness</p>
                    <p className="text-3xl font-bold uppercase tracking-tighter leading-none">
                        {liability.litigationReady ? 'Tier 1' : 'Standard'}
                    </p>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-4">Verified Protocol</p>
                </div>
            </div>
          </div>

          <div className="lg:col-span-5">
             <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 relative overflow-hidden aspect-square flex items-center justify-center">
                <svg viewBox="0 0 300 300" className="w-full h-full relative z-10">
                  {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
                    <polygon
                      key={scale}
                      points={radarMetrics.map(m => `${150 + (m.bgX - 150) * scale},${150 + (m.bgY - 150) * scale}`).join(' ')}
                      className="fill-none stroke-slate-100 stroke-[1]"
                    />
                  ))}
                  {radarMetrics.map((m, i) => (
                    <line key={i} x1="150" y1="150" x2={m.bgX} y2={m.bgY} className="stroke-slate-100 stroke-[1] stroke-dasharray-2" />
                  ))}
                  <motion.polygon
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    points={radarMetrics.map(m => `${m.x},${m.y}`).join(' ')}
                    className="fill-blue-600/5 stroke-blue-600 stroke-[3]"
                  />
                  {radarMetrics.map((m, i) => (
                    <motion.circle
                      key={`point-${i}`}
                      cx={m.x}
                      cy={m.y}
                      r="4"
                      className="fill-blue-600 shadow-lg shadow-blue-200"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    />
                  ))}
                  {radarMetrics.map((m, i) => (
                    <text key={i} x={m.bgX} y={m.bgY} dy={m.bgY > 150 ? 25 : -15} textAnchor="middle" className="fill-slate-400 text-[8px] font-bold uppercase tracking-widest">
                      {m.label}
                    </text>
                  ))}
                </svg>
             </div>
          </div>
        </div>
      </div>
    </section>

    <div className="grid lg:grid-cols-12 gap-12">
      {/* Findings List */}
      <div className="lg:col-span-8 space-y-10">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 shadow-sm relative">
                <Gavel size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional <span className="text-blue-600">Discrepancies</span></h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">High-Impact Regulatory Findings</p>
            </div>
          </div>
          <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{liability.assessments.length} Active Points</span>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {liability.assessments.map((assessment, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-8 rounded-[2.5rem] bg-white border border-slate-200 flex items-center justify-between hover:shadow-xl hover:border-slate-300 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                    <Flag size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{assessment.statute}</span>
                      <div className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{assessment.section}</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{assessment.violationType}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Impact</p>
                    <p className="text-sm font-black text-slate-900 uppercase">High</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Forecasting Sidebar */}
      <div className="lg:col-span-4 space-y-12">
        <div className="p-10 rounded-[3.5rem] bg-white border border-slate-200 relative overflow-hidden shadow-xl shadow-slate-200/40 min-h-[500px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
            <Scale size={180} className="text-slate-900" />
          </div>
          <div className="space-y-12 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 border border-blue-500">
                <Scale size={28} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Outlook</p>
                <h4 className="text-2xl font-bold text-slate-900 tracking-tight uppercase leading-tight">Resolution Probability</h4>
              </div>
            </div>
            
            <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Institutional Status</p>
                    <p className="text-lg font-bold text-slate-900 leading-snug">
                        {liability.litigationReady 
                            ? "Documented systemic failures indicate significant leverage for immediate dispute resolution." 
                            : "Standard administrative review required prior to escalated legal validation."}
                    </p>
                </div>

                <div className="space-y-4">
                    {[
                        { label: 'Statutory Alignment', val: 'Verified', icon: CheckCircle2, color: 'text-emerald-500' },
                        { label: 'Evidence Density', val: 'High Resolution', icon: ShieldAlert, color: 'text-blue-500' },
                        { label: 'Process Continuity', val: 'Active', icon: AlertCircle, color: 'text-amber-500' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white">
                            <div className="flex items-center gap-3">
                                <item.icon size={16} className={item.color} />
                                <span className="text-xs font-bold text-slate-600">{item.label}</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{item.val}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] mt-10">
              <div className="flex justify-between items-end mb-4">
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 italic">Target Metric</p>
                 <Zap size={14} className="text-blue-400" />
              </div>
              <p className="text-xl font-bold leading-tight mb-2 uppercase">Compliance Escalation</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Protocol Verified v5.0</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LiabilityRadarView;

export default LiabilityRadarView;
