'use client';

import React, { useState, useMemo } from 'react';
import { CreditFields } from '../../../lib/rules';
import {
    BureauName,
    BureauData,
    compareMultipleBureaus,
    generateComparisonReport,
    calculateDisputePriority,
    BureauComparisonResult
} from '../../../lib/multi-bureau';

interface MultiBureauTabProps {
    bureauData?: BureauData[];
    fields?: Partial<CreditFields>;
    rawText?: string;
}

const MultiBureauTab: React.FC<MultiBureauTabProps> = ({ bureauData: initialData = [], fields, rawText }) => {
    const [bureauData, setBureauData] = useState<BureauData[]>(initialData);
    const [activeBureau, setActiveBureau] = useState<BureauName | null>(null);
    const [showComparison, setShowComparison] = useState(false);

    // Assign current data to a bureau
    const assignToBureau = (bureau: BureauName) => {
        const existingIndex = bureauData.findIndex(b => b.bureau === bureau);
        const newData: BureauData = {
            bureau,
            fields: fields as Partial<CreditFields>,
            rawText: rawText || "",
            uploadDate: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            const updated = [...bureauData];
            updated[existingIndex] = newData;
            setBureauData(updated);
        } else {
            setBureauData([...bureauData, newData]);
        }
        setActiveBureau(bureau);
    };

    const comparison = useMemo(() =>
        bureauData.length >= 2 ? compareMultipleBureaus(bureauData) : null,
        [bureauData]
    );

    const disputePriority = useMemo(() =>
        comparison ? calculateDisputePriority(comparison) : null,
        [comparison]
    );

    const bureaus: { name: BureauName; color: string; icon: React.ReactNode }[] = [
        {
            name: 'Equifax',
            color: 'rose',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        },
        {
            name: 'Experian',
            color: 'blue',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        },
        {
            name: 'TransUnion',
            color: 'emerald',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        }
    ];

    const getBureauStatus = (bureau: BureauName) => {
        return bureauData.find(b => b.bureau === bureau);
    };

    return (
        <div className="fade-in space-y-10">
            {/* Hero Header */}
            <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-purple-400 font-mono">Cross-Bureau Analysis</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">
                            Multi-Bureau <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Comparison</span>
                        </h2>
                        <p className="text-slate-400 text-sm max-w-lg">
                            Compare credit data across Equifax, Experian, and TransUnion to detect inconsistencies and maximize dispute leverage.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {bureauData.length >= 2 && (
                            <button
                                onClick={() => setShowComparison(!showComparison)}
                                className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm flex items-center gap-2 hover:bg-white/20 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                {showComparison ? 'Hide' : 'View'} Comparison
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bureau Assignment Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {bureaus.map((bureau) => {
                    const status = getBureauStatus(bureau.name);
                    const isActive = activeBureau === bureau.name;

                    return (
                        <div
                            key={bureau.name}
                            className={`premium-card p-8 transition-all cursor-pointer group ${status
                                ? `bg-${bureau.color}-50/50 dark:bg-${bureau.color}-950/20 border-${bureau.color}-500/30`
                                : 'bg-white dark:bg-slate-900'
                                } ${isActive ? 'ring-2 ring-emerald-500' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-14 h-14 rounded-2xl bg-${bureau.color}-500/10 text-${bureau.color}-500 flex items-center justify-center border border-${bureau.color}-500/20`}>
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {bureau.icon}
                                    </svg>
                                </div>
                                {status && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-500">Loaded</span>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-bold dark:text-white mb-2">{bureau.name}</h3>

                            {status ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-slate-500">
                                        Uploaded: {new Date(status.uploadDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Fields: {Object.keys(status.fields).filter(k => status.fields[k as keyof typeof status.fields]).length}
                                    </p>
                                    <button
                                        onClick={() => assignToBureau(bureau.name)}
                                        className="w-full py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                    >
                                        Update Data
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-500">
                                        No data loaded yet. Assign current report to this bureau.
                                    </p>
                                    <button
                                        onClick={() => assignToBureau(bureau.name)}
                                        disabled={!rawText}
                                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${rawText
                                            ? `bg-${bureau.color}-500 text-white hover:bg-${bureau.color}-600 shadow-lg shadow-${bureau.color}-500/20`
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Assign Current Data
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Comparison Results */}
            {comparison && showComparison && (
                <div className="space-y-8">
                    {/* Summary Stats */}
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="premium-card p-6 bg-white dark:bg-slate-900 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bureaus Compared</p>
                            <p className="text-3xl font-bold dark:text-white tabular-nums">{comparison.bureausCompared.length}</p>
                        </div>
                        <div className="premium-card p-6 bg-white dark:bg-slate-900 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Discrepancies</p>
                            <p className="text-3xl font-bold text-amber-500 tabular-nums">{comparison.totalDiscrepancies}</p>
                        </div>
                        <div className="premium-card p-6 bg-white dark:bg-slate-900 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Critical Issues</p>
                            <p className="text-3xl font-bold text-rose-500 tabular-nums">{comparison.criticalDiscrepancies}</p>
                        </div>
                        <div className="premium-card p-6 bg-white dark:bg-slate-900 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Dispute Priority</p>
                            <p className={`text-xl font-bold uppercase ${disputePriority?.priority === 'immediate' ? 'text-rose-500' :
                                disputePriority?.priority === 'high' ? 'text-amber-500' :
                                    disputePriority?.priority === 'standard' ? 'text-blue-500' : 'text-slate-400'
                                }`}>{disputePriority?.priority}</p>
                        </div>
                    </div>

                    {/* Discrepancy Details */}
                    {comparison.fieldDiscrepancies.length > 0 && (
                        <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold dark:text-white">Detected Discrepancies</h4>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Fields with inconsistent data across bureaus</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {comparison.fieldDiscrepancies.map((discrepancy, i) => (
                                    <div
                                        key={i}
                                        className={`p-6 rounded-2xl border transition-all ${discrepancy.severity === 'critical' ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/30' :
                                            discrepancy.severity === 'high' ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/30' :
                                                'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${discrepancy.severity === 'critical' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                    discrepancy.severity === 'high' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                        discrepancy.severity === 'medium' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                            'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                                    }`}>
                                                    {discrepancy.severity}
                                                </span>
                                                <h5 className="text-lg font-bold dark:text-white">{discrepancy.fieldLabel}</h5>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500`}>
                                                {discrepancy.discrepancyType}
                                            </span>
                                        </div>

                                        {/* Bureau Values */}
                                        <div className="grid md:grid-cols-3 gap-3 mb-4">
                                            {bureaus.map(bureau => (
                                                <div key={bureau.name} className={`p-3 rounded-xl bg-white dark:bg-slate-900 border ${discrepancy.values[bureau.name] ? 'border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-300 dark:border-slate-700'
                                                    }`}>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{bureau.name}</p>
                                                    <p className={`text-sm font-medium ${discrepancy.values[bureau.name] ? 'dark:text-white' : 'text-slate-400 italic'
                                                        }`}>
                                                        {discrepancy.values[bureau.name] || 'Not reported'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Potential Violation */}
                                        {discrepancy.potentialViolation && (
                                            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 mb-3">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1 flex items-center gap-2">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    Potential Violation
                                                </p>
                                                <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{discrepancy.potentialViolation}</p>
                                            </div>
                                        )}

                                        {/* Recommendation */}
                                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1 flex items-center gap-2">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                                Recommendation
                                            </p>
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400">{discrepancy.recommendation}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Matched Fields */}
                    {comparison.matchedFields.length > 0 && (
                        <div className="premium-card p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    {comparison.matchedFields.length} fields match across all bureaus
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {comparison.matchedFields.map((field, i) => (
                                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions when no data */}
            {bureauData.length < 2 && (
                <div className="premium-card p-12 text-center bg-slate-50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800">
                    <svg className="w-16 h-16 mx-auto mb-6 text-slate-200 dark:text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <h3 className="text-xl font-bold dark:text-white mb-2">Add Bureau Data to Compare</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                        {bureauData.length === 0
                            ? 'Upload a credit report and assign it to a bureau above. Then upload reports from other bureaus to compare.'
                            : 'You have 1 bureau loaded. Add at least one more to enable comparison analysis.'}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                        <span>Loaded: {bureauData.length}/3</span>
                        <span>•</span>
                        <span>Minimum for comparison: 2</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiBureauTab;
