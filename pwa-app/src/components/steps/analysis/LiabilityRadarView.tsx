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
  Radiation
} from 'lucide-react';

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
  <div className="contents">
    <div className="fade-in space-y-20 pb-40">
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-br from-slate-600/20 via-slate-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
          <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-12 mb-12 border-b border-white/5 pb-12">
              <div className="flex items-center gap-6">
                <div className="px-5 py-2 bg-slate-500/10 border border-slate-500/20 rounded-full flex items-center gap-3">
                  <Radiation size={14} className="text-slate-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400 font-mono">Liability Matrix v5.0</span>
                </div>
                <div className="h-px w-10 bg-slate-800" />
                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Risk_Concentration::ACTIVE</span>
              </div>
            </div>
            <div className="lg:col-span-5 relative group/radar">
              <div className="absolute inset-0 bg-slate-500/10 blur-[120px] rounded-full group-hover/radar:bg-slate-500/20 transition-all duration-1000" />
              <div className="relative bg-slate-900/40 border border-white/10 p-16 rounded-[4rem] backdrop-blur-3xl shadow-2xl overflow-hidden aspect-square flex items-center justify-center group-hover/radar:border-slate-500/30 transition-colors">
                <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none group-hover/radar:scale-110 transition-transform duration-1000">
                  <Target size={400} />
                </div>
                <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-[0_0_40px_rgba(100,116,139,0.3)] relative z-10">
                  {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
                    <polygon
                      key={scale}
                      points={radarMetrics.map(m => `${150 + (m.bgX - 150) * scale},${150 + (m.bgY - 150) * scale}`).join(' ')}
                      className="fill-none stroke-white/5 stroke-[0.5]"
                    />
                  ))}
                  {radarMetrics.map((m, i) => (
                    <line key={i} x1="150" y1="150" x2={m.bgX} y2={m.bgY} className="stroke-white/5 stroke-[0.5] stroke-dasharray-2" />
                  ))}
                  <motion.polygon
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    points={radarMetrics.map(m => `${m.x},${m.y}`).join(' ')}
                    className="fill-slate-500/10 stroke-slate-500 stroke-[2.5]"
                  />
                  {radarMetrics.map((m, i) => (
                    <motion.circle
                      key={`point-${i}`}
                      cx={m.x}
                      cy={m.y}
                      r="4"
                      className="fill-slate-400 shadow-xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    />
                  ))}
                  {radarMetrics.map((m, i) => (
                    <text key={i} x={m.bgX} y={m.bgY} dy={m.bgY > 150 ? 35 : -25} textAnchor="middle" className="fill-slate-500 text-[8px] font-black uppercase tracking-[0.4em] font-mono group-hover/radar:fill-white transition-colors">
                      {m.label}
                    </text>
                  ))}
                </svg>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-16">
              <div>
                <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                  Exposure <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-white to-slate-400 tracking-[-0.05em]">HEATMAP</span>
                </h2>
                <p className="text-slate-400 text-2xl leading-relaxed mb-12 max-w-2xl font-bold italic border-l-2 border-slate-500/30 pl-10">
                  Quantifying systemic liability across the <span className="text-slate-400">Institutional Protocol Matrix</span>. High-density vectors indicate critical failures suitable for kinetic escalation.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <motion.div whileHover={{ y: -5 }} className="p-12 bg-slate-900/30 border border-white/5 rounded-[3.5rem] relative overflow-hidden group/stat shadow-inner">
                  <div className="absolute top-0 right-0 p-8 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse shadow-[0_0_10px_rgba(100,116,139,0.5)]" />
                    <div className="w-2 h-2 rounded-full bg-slate-800" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.4em] font-mono mb-4 group-hover/stat:text-slate-400 transition-colors">Severity_Manifest</p>
                  <div className="flex items-baseline gap-4">
                    <p className="text-7xl font-black text-white font-mono tracking-tighter italic">{liability.overallSeverityScore}</p>
                    <span className="text-2xl font-black text-slate-800 font-mono italic">SCORE</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mt-8 flex items-center gap-3 italic">
                    <ShieldAlert size={14} /> {liability.overallSeverityScore > 200 ? 'STATUS::CRITICAL_RED' : 'STATUS::ELEVATED'}
                  </p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="p-12 bg-slate-600 rounded-[3.5rem] border border-slate-500 relative overflow-hidden group/vector shadow-2xl shadow-slate-900/30">
                  <div className="absolute top-0 right-0 p-12 opacity-20 scale-[2.5] -rotate-12 group-hover/vector:rotate-0 transition-transform duration-1000 grayscale select-none pointer-events-none">
                    <Zap size={100} className="text-white" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-[0.4em] font-mono mb-4">Command_Readiness</p>
                  <p className="text-5xl font-black text-white uppercase tracking-tighter italic font-mono leading-tight">
                    {liability.litigationReady ? 'TIER_1_KINETIC' : 'ADMIN_DIRECT'}
                  </p>
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] font-mono mt-8 flex items-center gap-3 italic opacity-80">Vector_Auth::VERIFIED</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="grid lg:grid-cols-12 gap-20">
        <div className="lg:col-span-8 space-y-12">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-[2rem] bg-slate-500/10 flex items-center justify-center text-slate-400 border border-slate-500/20 shadow-2xl relative">
                <Gavel size={28} />
                <div className="absolute inset-0 blur-xl opacity-20 bg-slate-500" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic">Liability_<span className="text-slate-400">MANIFEST</span></h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mt-1">High-Concentration_Risk_Ledger</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic">{liability.assessments.length}_NODES_ACTIVE</span>
              </div>
            </div>
          </div>
          <div className="grid gap-6">
            <AnimatePresence>
              {liability.assessments.map((assessment, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ x: 10 }}
                  className="p-12 rounded-[3.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 flex items-center justify-between group/line transition-all duration-700 shadow-2xl overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover/line:bg-slate-500/10 transition-all duration-1000" />
                  <div className="flex items-center gap-10 relative z-10">
                    <div className="w-20 h-20 rounded-[2.2rem] bg-slate-900 flex items-center justify-center border border-white/10 shadow-inner group-hover/line:bg-slate-500/10 group-hover/line:border-slate-500/30 transition-all duration-500">
                      <Target size={32} className="text-slate-600 group-hover/line:text-slate-400 transition-colors" />
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono italic">{assessment.statute}</span>
                        <div className="w-1 h-1 bg-slate-800 rounded-full" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] font-mono italic group-hover/line:text-slate-500 transition-colors">{assessment.section}</span>
                      </div>
                      <h4 className="text-3xl font-black text-white group-hover/line:text-slate-400 transition-colors tracking-tighter uppercase font-mono italic leading-none">{assessment.violationType}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-10 relative z-10">
                    <div className="text-right hidden sm:block group-hover/line:translate-x-[-10px] transition-transform duration-500">
                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] font-mono mb-2 group-hover/line:text-slate-400 transition-colors">IMPACT_VECTOR</p>
                      <p className="text-xl font-black text-white font-mono italic tracking-widest group-hover/line:text-slate-400">HIGH</p>
                    </div>
                    <button type="button" className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 group-hover/line:text-white group-hover/line:bg-slate-600 group-hover/line:border-slate-500 transition-all shadow-xl active:scale-90">
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-16 rounded-[4.5rem] bg-slate-900/40 backdrop-blur-3xl border border-white/5 relative overflow-hidden group/forecasting shadow-2xl min-h-[600px] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-16 opacity-[0.02] scale-[2.5] rotate-12 group-hover/forecasting:rotate-0 transition-transform duration-1000 grayscale pointer-events-none select-none">
              <Scale size={200} className="text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-16">
                <div className="w-16 h-16 rounded-[2rem] bg-slate-500 flex items-center justify-center shadow-[0_0_30px_rgba(100,116,139,0.4)] border border-slate-400/30">
                  <Scale size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">Judicial_Forecasting</p>
                  <h4 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic mt-1 leading-tight">PREDICTION_CORE</h4>
                </div>
              </div>
              <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight mb-16 border-l-2 border-slate-500/30 pl-12 relative group-hover/forecasting:text-slate-200 transition-colors">
                {liability.litigationReady
                  ? 'Forensic markers indicate systemic \'Willful Non-Compliance\' patterns exceeding legal thresholds for kinetic escalation. Litigation probability: 98.2%.'
                  : 'Administrative markers warrant immediate audit protocols. Institutional pressure is currently optimized for bureau-level deletion via regulatory friction.'}
              </p>
              <div className="space-y-6">
                <div className="p-10 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner group/progress">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono group-hover/progress:text-slate-400 transition-colors italic">Burden_of_Proof</p>
                    <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest italic animate-pulse">85%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden p-[2px]">
                    <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1.5, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full" />
                  </div>
                </div>
                <div className="p-10 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner group/progress">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono group-hover/progress:text-slate-400 transition-colors italic">Causation_Integrity</p>
                    <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest italic animate-pulse">92%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden p-[2px]">
                    <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ duration: 1.5, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
);

export default LiabilityRadarView;
