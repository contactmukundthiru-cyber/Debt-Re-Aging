'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RuleFlag, CreditFields, RiskProfile } from '../../../lib/rules';
import { PatternInsight, TimelineEvent } from '../../../lib/analytics';
import { performAIAnalysis, AIAnalysisResult, AIFinding } from '../../../lib/ai-analysis';
import { loadRemoteAIConfig, saveRemoteAIConfig, clearRemoteAIConfig, runRemoteAnalysis, RemoteAIConfig, RemoteAIResult } from '../../../lib/ai-remote';

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

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            case 'high': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="fade-in space-y-8 pb-12">
            <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Optional Remote AI</p>
                        <h3 className="text-lg font-bold dark:text-white">Bring your own API key (stateless)</h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400">No accounts · No server storage</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <label className="flex flex-col gap-2">
                        <span className="uppercase tracking-widest">API Base URL</span>
                        <input
                            className="input rounded-xl"
                            value={remoteConfig.baseUrl}
                            onChange={(e) => setRemoteConfig({ ...remoteConfig, baseUrl: e.target.value })}
                            placeholder="https://api.openai.com/v1/chat/completions"
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="uppercase tracking-widest">Model</span>
                        <input
                            className="input rounded-xl"
                            value={remoteConfig.model}
                            onChange={(e) => setRemoteConfig({ ...remoteConfig, model: e.target.value })}
                            placeholder="gpt-4o-mini"
                        />
                    </label>
                    <label className="flex flex-col gap-2 md:col-span-2">
                        <span className="uppercase tracking-widest">API Key</span>
                        <input
                            className="input rounded-xl"
                            type="password"
                            value={remoteConfig.apiKey}
                            onChange={(e) => setRemoteConfig({ ...remoteConfig, apiKey: e.target.value })}
                            placeholder="sk-..."
                        />
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={remoteConfig.includeFields}
                            onChange={(e) => setRemoteConfig({ ...remoteConfig, includeFields: e.target.checked })}
                        />
                        <span>Include account fields in payload (optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-3 md:col-span-2">
                        <button
                            type="button"
                            className="btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
                            disabled={remoteLoading}
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
                            {remoteLoading ? 'Running...' : 'Run Remote Analysis'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
                            onClick={() => {
                                clearRemoteAIConfig();
                                setRemoteConfig(loadRemoteAIConfig());
                                setRemoteResult(null);
                                setRemoteError(null);
                            }}
                        >
                            Clear Key
                        </button>
                    </div>
                </div>
                {remoteError && (
                    <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600">
                        {remoteError}
                    </div>
                )}
                {remoteResult && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Remote Summary</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{remoteResult.summary}</p>
                        <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Key Risks</p>
                                <ul className="space-y-1">
                                    {remoteResult.keyRisks.map(item => (
                                        <li key={item}>• {item}</li>
                                    ))}
                                    {remoteResult.keyRisks.length === 0 && <li>No risks returned.</li>}
                                </ul>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Recommended Actions</p>
                                <ul className="space-y-1">
                                    {remoteResult.recommendedActions.map(item => (
                                        <li key={item}>• {item}</li>
                                    ))}
                                    {remoteResult.recommendedActions.length === 0 && <li>No actions returned.</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Assessment Hero */}
            <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-300">AI Forensic Assessment</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Confidence: {analysis.confidenceLevel}</span>
                    </div>

                    <h2 className="text-3xl font-bold mb-4 leading-tight">{analysis.overallAssessment}</h2>

                    <div className="grid md:grid-cols-3 gap-6 mt-10">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Success Probability</p>
                            <p className="text-3xl font-bold text-emerald-400">{analysis.successPrediction.overallProbability}%</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Critical Findings</p>
                            <p className="text-3xl font-bold text-rose-400">{analysis.keyFindings.filter(f => f.severity === 'critical').length}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Strategic Steps</p>
                            <p className="text-3xl font-bold text-blue-400">{analysis.strategicRecommendations.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Key Findings */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-3 px-2">
                        <span className="w-1 h-6 bg-rose-500 rounded-full" />
                        Key Forensic Findings
                    </h3>
                    <div className="space-y-4">
                        {analysis.keyFindings.map((finding) => (
                            <div key={finding.id} className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getSeverityColor(finding.severity)}`}>
                                            {finding.severity}
                                        </span>
                                        <h4 className="font-bold dark:text-white">{finding.title}</h4>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">{finding.id}</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{finding.explanation}</p>

                                {finding.evidence.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Supporting Evidence</p>
                                        <ul className="space-y-1">
                                            {finding.evidence.map((e, i) => (
                                                <li key={i} className="text-xs text-slate-500 dark:text-slate-500 flex items-start gap-2">
                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                                                    {e}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {finding.legalBasis.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {finding.legalBasis.map((lb, i) => (
                                            <span key={i} className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                                {lb}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Strategic Roadmap */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-3 px-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full" />
                        Strategic Roadmap
                    </h3>
                    <div className="space-y-4">
                        {analysis.strategicRecommendations.map((rec) => (
                            <div key={rec.priority} className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 border-l-4 border-l-blue-500">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Step {rec.priority}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${rec.difficulty === 'easy' ? 'text-emerald-500 border-emerald-500/20' :
                                            rec.difficulty === 'moderate' ? 'text-amber-500 border-amber-500/20' : 'text-rose-500 border-rose-500/20'
                                        }`}>
                                        {rec.difficulty}
                                    </span>
                                </div>
                                <h4 className="font-bold dark:text-white mb-2">{rec.action}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{rec.reasoning}</p>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] uppercase font-bold text-slate-400">Expected Result</span>
                                        <span className="text-[10px] font-bold text-emerald-500">{rec.expectedOutcome}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] uppercase font-bold text-slate-400">Timeframe</span>
                                        <span className="text-[10px] font-bold dark:text-slate-300">{rec.timeframe}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Success Predictions */}
            <div className="premium-card p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold mb-6 dark:text-white">Probability of Success by Channel</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {analysis.successPrediction.byDispute.map((pred, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold dark:text-white">{pred.targetEntity}</h4>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-emerald-500 tabular-nums">{pred.successProbability}%</span>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${pred.successProbability}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">{pred.reasoning}</p>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Optimized Approach</p>
                                <p className="text-[10px] font-bold text-blue-500">{pred.bestApproach}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Narrative Preview */}
            <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold dark:text-white">AI-Generated Dispute Narrative</h3>
                    <button className="text-xs font-bold text-blue-500 uppercase tracking-widest hover:underline">Customize All</button>
                </div>
                <div className="space-y-4">
                    {analysis.narrativeBlocks.slice(0, 3).map((block, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">{block.type}</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{block.content.substring(0, 200)}..."</p>
                        </div>
                    ))}
                    <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                        <p className="text-xs text-slate-500">View complete narrative in the <strong>Case Narrative</strong> tab</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAnalysisTab;
