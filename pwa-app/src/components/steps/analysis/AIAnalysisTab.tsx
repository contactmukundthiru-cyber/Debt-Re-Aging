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
    Trash2,
    ChevronRight,
    Lock,
    Globe,
    Clock
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
            case 'critical': return <AlertTriangle size={32} />;
            case 'high': return <Activity size={32} />;
            case 'medium': return <CheckCircle2 size={32} />;
            default: return <ShieldCheck size={32} />;
        }
    };

    return (
        <div className="pb-32 font-sans selection:bg-emerald-500/30 space-y-16">
            {/* ELITE_INTELLIGENCE_HERO::PROTOCOL_ZENITH */}
            <header className="relative rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-4xl group">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[160px] -mr-96 -mt-96 group-hover:bg-emerald-400/20 transition-colors duration-1000" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] -ml-40 -mb-40" />
                
                <div className="relative z-10 p-12 xl:p-20">
                    <div className="flex flex-col xl:flex-row items-center gap-20">
                        <div className="flex-1 space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="flex -space-x-3">
                                    {[Brain, Activity, Network].map((Icon, i) => (
                                        <div key={i} className={cn("w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-950 flex items-center justify-center text-emerald-400 shadow-2xl relative", i === 0 ? "z-[3]" : i === 1 ? "z-[2]" : "z-[1]")}>
                                            <Icon size={24} />
                                        </div>
                                    ))}
                                </div>
                                <div className="h-4 w-px bg-white/10" />
                                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-emerald-500 font-mono italic animate-pulse">
                                    System_Status::COGNITIVE_OVERRIDE_ACTIVE
                                </span>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-7xl xl:text-8xl font-black text-white tracking-tighter leading-none font-mono italic uppercase">
                                    NEURAL_<span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400">CORE</span>
                                </h1>
                                <p className="text-2xl text-slate-500 font-medium italic max-w-3xl leading-relaxed border-l-4 border-emerald-500/20 pl-10 ml-2">
                                    {analysis.overallAssessment}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-8 pt-4">
                                <div className="px-10 py-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] backdrop-blur-2xl">
                                    <div className="flex items-center gap-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest font-mono italic">Confidence_Rating</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-black text-white font-mono tracking-tighter">
                                                    {analysis.confidenceLevel === 'high' ? '92' : analysis.confidenceLevel === 'medium' ? '74' : '48'}
                                                </span>
                                                <span className="text-xl font-black text-emerald-500 font-mono">%</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-12 bg-white/10" />
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">Assurance_Tier</span>
                                            <p className="text-xl font-black text-white font-mono uppercase italic tracking-tighter">{analysis.confidenceLevel}_VALIDATED</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-10 py-6 bg-blue-600/10 border border-blue-500/20 rounded-[2.5rem] backdrop-blur-2xl">
                                    <div className="flex items-center gap-4">
                                        <Cpu className="text-blue-400 animate-spin-slow" size={24} />
                                        <div>
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest font-mono italic">Compute_State</p>
                                            <p className="text-xl font-black text-white font-mono uppercase italic tracking-tighter">OPTIMIZED_LOAD</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PERFORMANCE_TELEMETRY */}
                        <div className="w-full xl:w-[450px] relative">
                             <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] scale-75 animate-pulse" />
                             <div className="relative p-12 bg-black/60 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-4xl space-y-10">
                                 <div className="flex items-baseline justify-between">
                                     <span className="text-sm font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">Network_Nodes</span>
                                     <span className="text-4xl font-black text-white font-mono tracking-tighter">4,096_S</span>
                                 </div>
                                 <div className="space-y-6">
                                     <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest font-mono italic">Synaptic_Flux</span>
                                        <span className="text-xs font-bold text-slate-400 font-mono">ACTIVE</span>
                                     </div>
                                     <div className="h-4 w-full bg-slate-900 rounded-full border border-white/5 overflow-hidden p-1 shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '88%' }}
                                            transition={{ duration: 2, ease: "circOut" }}
                                            className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                        />
                                     </div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-6">
                                     <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-2">
                                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Latency</span>
                                         <p className="text-2xl font-black text-emerald-400 font-mono italic tracking-tighter">12ms</p>
                                     </div>
                                     <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-2">
                                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Uptime</span>
                                         <p className="text-2xl font-black text-blue-400 font-mono italic tracking-tighter">99.9%</p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-16">
                {/* Main Content: Key Detections */}
                <div className="lg:col-span-8 space-y-12">
                    <div className="flex items-center justify-between px-8">
                        <div className="space-y-4">
                            <h3 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none flex items-center gap-6">
                                <Fingerprint className="text-emerald-500" size={48} />
                                Core_Detections
                            </h3>
                            <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Weaponized_Intelligence_Vectors</p>
                        </div>
                        <div className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] backdrop-blur-xl">
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest font-mono italic">
                                {analysis.keyFindings.length}_ACTIVE_VECTORS
                            </span>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {analysis.keyFindings.map((finding, idx) => (
                            <motion.div
                                key={finding.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-slate-950/40 border border-white/10 rounded-[3.5rem] p-12 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-700 shadow-4xl backdrop-blur-2xl"
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[2] pointer-events-none group-hover:scale-[2.5] group-hover:opacity-[0.05] transition-all duration-1000">
                                    <Brain size={120} />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
                                        <div className="flex items-center gap-8">
                                            <div className={cn(
                                                "w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-700 group-hover:scale-110 shadow-2xl relative",
                                                finding.severity === 'critical' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                finding.severity === 'high' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            )}>
                                                <div className="absolute inset-0 blur-xl opacity-20 bg-current" />
                                                {getSeverityIcon(finding.severity)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">VECTOR_IDENT_0{idx+1}</span>
                                                    <div className={cn(
                                                        "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono border",
                                                        finding.severity === 'critical' ? "text-rose-500 border-rose-500/20 bg-rose-500/5 shadow-[0_0_10px_rgba(244,63,94,0.2)]" :
                                                        finding.severity === 'high' ? "text-orange-500 border-orange-500/20 bg-orange-500/5 shadow-[0_0_10px_rgba(249,115,22,0.2)]" : 
                                                        "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                    )}>
                                                        EXTREME_{finding.severity.toUpperCase()}
                                                    </div>
                                                </div>
                                                <h4 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic group-hover:text-emerald-400 transition-colors">
                                                    {finding.title}
                                                </h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-24 space-y-10">
                                        <p className="text-2xl text-slate-400 leading-relaxed font-medium italic border-l-2 border-white/5 pl-8 max-w-4xl">
                                            {finding.explanation}
                                        </p>

                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="bg-black/40 border border-white/5 p-10 rounded-[3rem] space-y-6 shadow-inner relative overflow-hidden group/box">
                                                <div className="absolute top-0 right-0 p-6 opacity-[0.02] -rotate-12 group-hover/box:rotate-0 transition-transform duration-700">
                                                    <Database size={60} />
                                                </div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono italic">Evidence_Matrix</p>
                                                </div>
                                                <div className="space-y-4">
                                                    {finding.evidence.map((e, i) => (
                                                        <div key={i} className="flex items-center gap-4 group/item">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 group-hover/item:bg-emerald-500 transition-colors" />
                                                            <span className="text-sm font-black text-slate-400 font-mono tracking-tight group-hover/item:text-white transition-colors">{e}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-emerald-600/5 border border-emerald-500/10 p-10 rounded-[3rem] space-y-6 shadow-inner group/rec">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] font-mono italic">Strategic_Directive</p>
                                                </div>
                                                <p className="text-lg text-emerald-100 font-medium italic leading-relaxed">
                                                    {finding.explanation}
                                                </p>
                                                <div className="pt-4 border-t border-emerald-500/10">
                                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest font-mono">Impact_Delta::MAXIMUM</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Remote Intel Configuration */}
                <div className="lg:col-span-4 space-y-12">
                    <div className="space-y-4 px-4">
                        <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none flex items-center gap-4">
                            <Settings2 className="text-blue-500" size={40} />
                            Intel_Link
                        </h4>
                        <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">External_API_Synchronization</p>
                    </div>

                    <div className="sticky top-12 space-y-10">
                        <div className="p-12 rounded-[4rem] bg-slate-950 border border-white/10 shadow-4xl space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] scale-[2] pointer-events-none">
                                <Link2 size={120} />
                            </div>

                            <div className="space-y-10 relative z-10">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic ml-6">External_Node_URI</label>
                                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                    </div>
                                    <div className="relative group">
                                        <Globe className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input 
                                            value={remoteConfig.baseUrl}
                                            onChange={(e) => setRemoteConfig({ ...remoteConfig, baseUrl: e.target.value })}
                                            placeholder="https://api.openai.com/v1/chat/completions"
                                            className="w-full bg-black/60 border border-white/5 rounded-[2rem] pl-20 pr-10 py-6 text-white text-lg font-mono italic focus:outline-none focus:border-slate-500/40 transition-all shadow-inner placeholder:text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic ml-6">Model_Ident</label>
                                        <input 
                                            value={remoteConfig.model}
                                            onChange={(e) => setRemoteConfig({ ...remoteConfig, model: e.target.value })}
                                            className="w-full bg-black/60 border border-white/5 rounded-[1.5rem] px-6 py-4 text-white text-sm font-mono focus:outline-none focus:border-slate-500/40 shadow-inner"
                                            placeholder="gpt-4o-mini"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label htmlFor="purge-remote-intel" className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic ml-6">Purge_Intel</label>
                                        <button 
                                            id="purge-remote-intel"
                                            title="Purge Remote AI Intelligence Configuration"
                                            aria-label="Purge Remote AI Configuration"
                                            onClick={() => {
                                                clearRemoteAIConfig();
                                                setRemoteConfig(loadRemoteAIConfig());
                                                setRemoteResult(null);
                                                setRemoteError(null);
                                            }}
                                            className="w-full h-[52px] bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] text-rose-500 flex items-center justify-center hover:bg-rose-500/20 transition-all shadow-inner"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic ml-6">Authentication_Token</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input 
                                            type="password"
                                            value={remoteConfig.apiKey}
                                            onChange={(e) => setRemoteConfig({ ...remoteConfig, apiKey: e.target.value })}
                                            placeholder="sk-... (your API key)"
                                            className="w-full bg-black/60 border border-white/5 rounded-[2rem] pl-20 pr-10 py-6 text-white text-lg font-mono italic focus:outline-none focus:border-slate-500/40 transition-all shadow-inner placeholder:text-slate-800"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={async () => {
                                        setRemoteLoading(true);
                                        try {
                                            const result = await runRemoteAnalysis(remoteConfig, { flags, fields, patterns, timeline, riskProfile });
                                            setRemoteResult(result);
                                            setRemoteError(null);
                                        } catch (e: any) {
                                            setRemoteError(e.message);
                                        } finally {
                                            setRemoteLoading(false);
                                        }
                                    }}
                                    disabled={remoteLoading || !remoteConfig.apiKey}
                                    className={cn(
                                        "w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-6 transition-all shadow-4xl relative overflow-hidden group/run",
                                        remoteLoading ? "bg-slate-900 text-slate-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"
                                    )}
                                >
                                    {remoteLoading && <Activity className="animate-spin" size={20} />}
                                    <span>{remoteLoading ? 'SYNCHRONIZING...' : 'INVOKE_REMOTE_INTEL'}</span>
                                    <Zap size={20} className="group-hover/run:scale-125 transition-transform" />
                                </button>

                                {remoteError && (
                                    <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-4">
                                        <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                                        <p className="text-xs text-rose-200 font-mono italic leading-relaxed">{remoteError}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-white/5 border border-white/5 rounded-[3rem] space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">Privacy_Shield</span>
                                    <ShieldCheck className="text-emerald-500/50" size={16} />
                                </div>
                                <p className="text-xs text-slate-600 font-mono italic leading-tight uppercase font-black">
                                    Zero-knowledge proof encryption active. Metadata stripped before transmission.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategic Directives Overlay */}
            <div className="p-16 rounded-[4rem] bg-slate-950 border border-white/10 shadow-4xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-24 opacity-[0.02] scale-[3] pointer-events-none group-hover:scale-[3.5] transition-transform duration-1000">
                    <Scale size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-8 mb-16 pb-10 border-b border-white/5">
                        <div className="w-20 h-20 rounded-[2rem] bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-2xl">
                            <Scale size={40} />
                        </div>
                        <div>
                            <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Strategic_Directives</h4>
                            <p className="text-sm font-black text-blue-500 uppercase tracking-[0.4em] font-mono mt-2">Institutional_Sequence_Mapping</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {analysis.strategicRecommendations.map((rec, i) => (
                            <div key={i} className="relative p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] group/rec hover:border-blue-500/30 transition-all shadow-inner">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-lg font-black font-mono text-slate-500 group-hover/rec:bg-blue-600 group-hover/rec:border-blue-400 group-hover/rec:text-white transition-all shadow-2xl">
                                        0{rec.priority}
                                    </div>
                                    <h5 className="text-xl font-black text-white uppercase tracking-tight group-hover/rec:text-blue-400 transition-colors font-mono italic">
                                        {rec.action}
                                    </h5>
                                </div>
                                <p className="text-lg text-slate-500 leading-relaxed italic mb-10 font-medium font-sans">
                                    {rec.reasoning}
                                </p>
                                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Zap size={16} className="text-amber-500/60" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">{rec.difficulty}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-blue-500/60" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">{rec.timeframe}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Remote Result Overlay */}
            <AnimatePresence>
                {remoteResult && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl"
                        onClick={() => setRemoteResult(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-6xl bg-slate-950 border border-white/10 rounded-[4rem] shadow-4xl overflow-hidden max-h-[90vh] flex flex-col relative"
                        >
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -mr-48 -mt-48" />

                            <div className="p-12 border-b border-white/5 flex items-center justify-between bg-black/40 relative z-10">
                                <div className="flex items-center gap-8">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center border-2 border-emerald-500/20 shadow-2xl relative">
                                        <div className="absolute inset-0 blur-xl opacity-20 bg-current animate-pulse" />
                                        <Network size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic">Neural_Overlay_Reconstruction</h3>
                                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-4 font-mono">
                                            SIMULATION_HASH_{Math.random().toString(36).substring(7).toUpperCase()}
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setRemoteResult(null)} 
                                    title="Close Neural Overlay Reconstruction"
                                    aria-label="Close Analysis"
                                    className="p-6 bg-white/5 hover:bg-rose-500/10 rounded-[2rem] text-slate-500 hover:text-rose-500 transition-all border border-white/5 group shadow-inner"
                                >
                                    <Trash2 size={24} className="group-hover:rotate-12 transition-transform" />
                                </button>
                            </div>
                            
                            <div className="p-16 overflow-y-auto space-y-16 relative z-10">
                                <div className="space-y-8">
                                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono italic ml-2">Institutional_Summary</p>
                                    <div className="text-white/90 text-4xl leading-snug font-black italic border-l-8 border-emerald-500/30 pl-12 font-mono tracking-tight">
                                        "{remoteResult.summary}"
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-16">
                                    <div className="space-y-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-8 bg-rose-500 rounded-full" />
                                            <p className="text-[12px] font-black text-rose-500 uppercase tracking-[0.4em] font-mono italic">Risk_Concentration</p>
                                        </div>
                                        <div className="space-y-6">
                                            {remoteResult.keyRisks.map((risk, i) => (
                                                <div key={i} className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] text-xl font-bold text-rose-100 flex items-center gap-6 shadow-inner group/risk hover:bg-rose-500/10 transition-all">
                                                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)] group-hover:scale-125 transition-transform" />
                                                    <span className="font-mono italic">{risk}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                                            <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono italic">Operational_Nodes</p>
                                        </div>
                                        <div className="space-y-6">
                                            {remoteResult.recommendedActions.map((action, i) => (
                                                <div key={i} className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] text-xl font-bold text-emerald-100 flex items-center gap-6 shadow-inner group/act hover:bg-emerald-500/10 transition-all">
                                                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)] group-hover:scale-125 transition-transform" />
                                                    <span className="font-mono italic">{action}</span>
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
};

export default AIAnalysisTab;
