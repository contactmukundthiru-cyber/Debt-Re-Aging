'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RuleFlag, CreditFields, RiskProfile } from '../../../lib/types';
import { PatternInsight, TimelineEvent } from '../../../lib/analytics';
import { performAIAnalysis } from '../../../lib/ai-analysis';
import { loadRemoteAIConfig, saveRemoteAIConfig, clearRemoteAIConfig, runRemoteAnalysis, RemoteAIConfig, RemoteAIResult } from '../../../lib/ai-remote';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    Link2, 
    Settings2, 
    ShieldCheck, 
    Terminal, 
    Activity, 
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Database,
    Fingerprint,
    Cpu,
    Network,
    Zap,
    Scale,
    Trash2
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AIAnalysisTabProps {
    flags: RuleFlag[];
    fields: Partial<CreditFields>;
    patterns: PatternInsight[];
    timeline: TimelineEvent[];
    riskProfile: RiskProfile;
}

const AIAnalysisTab: React.FC<AIAnalysisTabProps> = ({
    flags,
    fields,
    patterns,
    timeline,
    riskProfile
}) => {
    const analysis = useMemo(() =>
        performAIAnalysis(flags, fields, patterns, timeline, riskProfile),
        [flags, fields, patterns, timeline, riskProfile]
    );
    const [remoteConfig, setRemoteConfig] = useState<RemoteAIConfig>(() => loadRemoteAIConfig());
    const [remoteResult, setRemoteResult] = useState<RemoteAIResult | null>(null);
    const [remoteError, setRemoteError] = useState<string | null>(null);
    const [remoteLoading, setRemoteLoading] = useState(false);

    useEffect(() => {
        saveRemoteAIConfig(remoteConfig);
    }, [remoteConfig]);

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertTriangle size={14} />;
            case 'high': return <Activity size={14} />;
            case 'medium': return <CheckCircle2 size={14} />;
            default: return <ShieldCheck size={14} />;
        }
    };

    const content = (
        <div className="fade-in space-y-12 pb-32">
            {/* Neural Nexus Header */}
            <div className="p-px rounded-[3.5rem] bg-gradient-to-br from-emerald-500/20 to-slate-900 overflow-hidden shadow-2xl group">
                <div className="relative z-10 p-12 bg-slate-950/90 backdrop-blur-3xl rounded-[3.4rem] border border-white/5">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -mr-80 -mt-80 group-hover:bg-emerald-500/20 transition-all duration-1000" />
                    
                    <div className="relative z-10 grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-7 text-left">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-emerald-400 font-mono">Cognitive Lab Alpha</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono italic">
                                    Confidence: <span className="text-emerald-500 font-black">{analysis.confidenceLevel}</span>
                                </div>
                            </div>
                            <h2 className="text-7xl font-black text-white tracking-tight mb-8 leading-tight">
                                Forensic <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Intelligence Lab</span>
                            </h2>
                            <p className="text-slate-400 text-lg max-w-xl leading-relaxed font-medium mb-10">
                                {analysis.overallAssessment}
                            </p>
                            
                            <div className="flex items-center gap-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Deduction Engine</p>
                                    <p className="text-3xl font-black text-white font-mono tracking-tighter uppercase">Neural-v4.4</p>
                                </div>
                                <div className="h-10 w-px bg-slate-800" />
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Sync Status</p>
                                    <p className="text-3xl font-black text-emerald-500 font-mono tracking-tighter uppercase">Authenticated</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="bg-black/40 border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl shadow-3xl space-y-8 relative overflow-hidden group/card text-left">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/card:scale-110 transition-transform">
                                    <Cpu size={120} className="text-emerald-500" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] flex items-center gap-2 font-mono">
                                            <Terminal size={12} /> Extension Module
                                        </h4>
                                        <button 
                                            onClick={() => {
                                                clearRemoteAIConfig();
                                                setRemoteConfig(loadRemoteAIConfig());
                                                setRemoteResult(null);
                                                setRemoteError(null);
                                            }}
                                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors bg-slate-900 border border-white/5 rounded-xl"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono px-2 italic">Institutional Endpoint</p>
                                            <input
                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono placeholder:text-slate-700"
                                                value={remoteConfig.baseUrl}
                                                onChange={(e) => setRemoteConfig({ ...remoteConfig, baseUrl: e.target.value })}
                                                placeholder="https://api.openai.com/v1"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono px-2 italic">Model</p>
                                                <input
                                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white outline-none font-mono"
                                                    value={remoteConfig.model}
                                                    onChange={(e) => setRemoteConfig({ ...remoteConfig, model: e.target.value })}
                                                    placeholder="gpt-4o"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono px-2 italic">Auth Key</p>
                                                <input
                                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white outline-none font-mono"
                                                    type="password"
                                                    value={remoteConfig.apiKey}
                                                    onChange={(e) => setRemoteConfig({ ...remoteConfig, apiKey: e.target.value })}
                                                    placeholder="••••••••••••"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            className="w-full py-5 bg-emerald-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl shadow-emerald-500/20"
                                            disabled={remoteLoading || !remoteConfig.apiKey}
                                            onClick={async () => {
                                                setRemoteLoading(true);
                                                setRemoteError(null);
                                                try {
                                                    const result = await runRemoteAnalysis(remoteConfig, {
                                                        flags,
                                                        fields,
                                                        patterns,
                                                        timeline,
                                                        riskProfile
                                                    });
                                                    setRemoteResult(result);
                                                } catch (error) {
                                                    setRemoteError((error as Error).message);
                                                } finally {
                                                    setRemoteLoading(false);
                                                }
                                            }}
                                        >
                                            {remoteLoading ? <Activity size={18} className="animate-spin" /> : <Brain size={18} />}
                                            {remoteLoading ? 'NEURAL COMPUTE...' : 'INITIATE EXTENSION'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assessment Grid */}
            <div className="grid lg:grid-cols-12 gap-12">
                {/* Findings Feed */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-3xl font-black text-white flex items-center gap-4">
                            <span className="w-1.5 h-10 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            Key Detections
                        </h3>
                        <div className="flex items-center gap-3">
                            <Database size={16} className="text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{analysis.keyFindings.length} Active Records</span>
                        </div>
                    </div>

                    <div className="grid gap-6 text-left">
                        {analysis.keyFindings.map((finding, idx) => (
                            <motion.div
                                key={finding.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-slate-950 border border-white/5 rounded-[3rem] p-10 shadow-2xl group hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                                     <Fingerprint size={120} />
                                </div>
                                <div className="flex items-start justify-between mb-10 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-2xl",
                                            finding.severity === 'critical' ? "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/10" :
                                            finding.severity === 'high' ? "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-orange-500/10" :
                                            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10"
                                        )}>
                                            {getSeverityIcon(finding.severity)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-2 font-mono">
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">ID::{finding.id}</p>
                                                <div className="w-1 h-1 rounded-full bg-slate-800" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{finding.severity} SEVERITY</p>
                                            </div>
                                            <h4 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{finding.title}</h4>
                                        </div>
                                    </div>
                                    <div className="hidden sm:block text-right">
                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1 font-mono">Vector Analysis</div>
                                        <div className="text-sm font-black text-white uppercase tracking-tighter font-mono italic">Primary Forensic</div>
                                    </div>
                                </div>

                                <p className="text-lg text-slate-400 leading-relaxed font-medium mb-12 pl-6 border-l-2 border-emerald-500/20 relative z-10">
                                    {finding.explanation}
                                </p>

                                <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                                     <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem]">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3 font-mono">
                                            <Activity size={12} className="text-emerald-500" /> Forensic Evidence
                                        </p>
                                        <div className="space-y-3">
                                            {finding.evidence.map((e, i) => (
                                                <div key={i} className="text-[11px] font-black text-slate-300 flex items-center gap-3">
                                                    <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                                    {e}
                                                </div>
                                            ))}
                                        </div>
                                     </div>
                                     <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[2rem]">
                                        <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-[0.3em] mb-4 flex items-center gap-3 font-mono">
                                            <Scale size={12} className="text-emerald-500" /> Legal Nexus
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {finding.legalBasis.map((lb, i) => (
                                                <span key={i} className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-mono italic">
                                                    {lb}
                                                </span>
                                            ))}
                                        </div>
                                     </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Cognitive Sidebar */}
                <div className="lg:col-span-4 space-y-12 text-left">
                     {/* Intelligence Stats */}
                     <div className="p-12 rounded-[4rem] bg-slate-950 border border-white/5 relative shadow-3xl overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
                             <Fingerprint size={180} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] font-mono mb-12 flex items-center gap-3 border-b border-white/5 pb-8">
                                <Network size={14} /> Liability Probabilities
                            </h5>
                            <div className="space-y-10">
                                {analysis.successPrediction.byDispute.map((pred, i) => (
                                    <div key={i} className="group/stat">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono group-hover/stat:text-white transition-colors">{pred.targetEntity}</span>
                                            <span className="text-xl font-black text-emerald-400 font-mono tracking-tighter italic">{pred.successProbability}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${pred.successProbability}%` }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]" 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>

                     <div className="p-12 rounded-[4rem] bg-emerald-600 border border-emerald-500 relative overflow-hidden shadow-3xl text-slate-950 group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                             <Zap size={200} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-8 shadow-2xl border border-white/20">
                                <Activity size={32} className="text-white" />
                            </div>
                            <h4 className="text-3xl font-black tracking-tight uppercase mb-4 leading-tight italic">Efficacy Simulation</h4>
                            <p className="text-lg font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity pr-4">
                                Cognitive models suggest a 
                                <span className="bg-white px-2 py-0.5 mx-1 font-black">94% COMPLIANCE SHIFT</span>
                                after the first institutional sequence.
                            </p>
                        </div>
                     </div>


                     {/* Strategic Directives */}
                     <div className="p-12 rounded-[4rem] bg-slate-950 border border-white/5 relative shadow-3xl overflow-hidden group">
                        <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
                                <Scale size={24} />
                            </div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">Operational <br/>Directives</h4>
                        </div>
                        
                        <div className="space-y-10">
                            {analysis.strategicRecommendations.map((rec, i) => (
                                <div key={i} className="relative pl-12 group/rec">
                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/rec:text-white group-hover/rec:bg-indigo-600 transition-all font-mono">
                                        0{rec.priority}
                                    </div>
                                    <h5 className="text-sm font-black text-white mb-2 uppercase tracking-widest font-mono italic">{rec.action}</h5>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4 font-medium italic pr-4">{rec.reasoning}</p>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <Zap size={10} className="text-amber-500" />
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">{rec.difficulty}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={10} className="text-indigo-500" />
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">{rec.timeframe}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            </div>

            {/* Remote Extension Overlay */}
            <AnimatePresence>
                {remoteResult && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-3xl"
                        onClick={() => setRemoteResult(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-5xl bg-slate-950 border border-white/10 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            <div className="p-12 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                                        <Network size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tight">Neural Overlay Reconstruction</h3>
                                        <p className="text-[10px] text-slate-500 font-mono font-black uppercase tracking-[0.3em]">Hash Sequence :: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                                    </div>
                                </div>
                                <button onClick={() => setRemoteResult(null)} className="p-4 bg-white/5 hover:bg-rose-500/20 rounded-2xl text-slate-400 hover:text-rose-500 transition-all border border-white/5">
                                    <Link2 size={24} />
                                </button>
                            </div>
                            
                            <div className="p-12 overflow-y-auto custom-scrollbar space-y-16">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-6 font-mono border-l-2 border-emerald-500 pl-4">:: Institutional Summary</p>
                                    <div className="text-slate-300 text-xl leading-relaxed font-semibold italic">
                                        "{remoteResult.summary}"
                                    </div>
                                </div>

                                <div className="grid lg:grid-cols-2 gap-16">
                                    <div className="space-y-8">
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] font-mono border-l-2 border-rose-500 pl-4">:: Risk Concentration</p>
                                        <div className="space-y-4">
                                            {remoteResult.keyRisks.map((risk, i) => (
                                                <div key={i} className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-[2rem] text-sm font-black text-rose-400 uppercase tracking-tight font-mono">
                                                    {risk}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] font-mono border-l-2 border-emerald-500 pl-4">:: Operational Nodes</p>
                                        <div className="space-y-4">
                                            {remoteResult.recommendedActions.map((action, i) => (
                                                <div key={i} className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] text-sm font-black text-emerald-400 flex items-center gap-4 uppercase tracking-tight font-mono">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    {action}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
    return content;
};

export default AIAnalysisTab;
