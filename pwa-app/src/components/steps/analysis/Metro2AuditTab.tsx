'use client';

import React, { useMemo } from 'react';
import { performMetro2Audit, Metro2Audit } from '../../../lib/metro2';
import { CreditFields } from '../../../lib/rules';

interface Metro2AuditTabProps {
    fields: Partial<CreditFields>;
}

const Metro2AuditTab: React.FC<Metro2AuditTabProps> = ({ fields }) => {
    const audit = useMemo(() => performMetro2Audit(fields), [fields]);

    return (
        <div className="fade-in space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white mb-2">Metro 2® Forensic Audit</h2>
                    <p className="text-slate-500">Reconstructing the backend data segments reported to the bureaus.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Integrity Score</p>
                        <p className={`text-2xl font-black ${audit.integrityScore > 80 ? 'text-emerald-500' : audit.integrityScore > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {audit.integrityScore}/100
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    </div>
                </div>
            </div>

            {/* Reconstructed Row */}
            <div className="premium-card p-6 bg-slate-950 border-slate-800 font-mono overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4">
                    <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">Raw Record Reconstruct</span>
                </div>
                <div className="text-[11px] text-emerald-500/80 break-all leading-relaxed whitespace-pre-wrap">
                    {audit.reconstructedRecord}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Segments Breakdown */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-3">
                        <span className="w-1 h-5 bg-blue-500 rounded-full" />
                        Base Segment Mapping
                    </h3>
                    <div className="space-y-3">
                        {audit.segments[0].fields.map((field, i) => (
                            <div key={i} className="group p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Pos: {field.position} &middot; Len: {field.length}</span>
                                    {!field.isValid && (
                                        <span className="text-[8px] font-bold text-rose-500 uppercase px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">Invalid Format</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold dark:text-white">{field.label}</p>
                                    <p className="text-sm font-mono text-blue-500 font-bold">{field.value}</p>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
                                    {field.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Structural Violations */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-3">
                        <span className="w-1 h-5 bg-rose-500 rounded-full" />
                        Integrity Failures
                    </h3>
                    <div className="space-y-4">
                        {audit.structuralViolations.length === 0 ? (
                            <div className="p-12 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 text-center">
                                <svg className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-sm text-slate-500">No structural Metro 2 formatting errors detected.</p>
                            </div>
                        ) : (
                            audit.structuralViolations.map((v, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                                        <span className="text-xs font-black">!</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400 leading-tight mb-2">{v}</p>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium"> This error indicates the bureau's electronic record is structurally unsound and violates Metro 2® credit reporting standards.</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Professional Note */}
                    <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 mt-10">
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Strategic Insight</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Bureau clerks often use "Automated Consumer Dispute Verification" (ACDV) which masks these structural errors. Citing specific Metro 2 mapping failures in your dispute forces a **manual review** by a supervisor, significantly increasing deletion probability.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Metro2AuditTab;
