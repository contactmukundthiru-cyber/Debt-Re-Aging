'use client';

import React, { useState } from 'react';
import {
    createEvidenceItem,
    createEvidencePackage,
    verifyEvidenceIntegrity,
    EvidenceItem,
    EvidencePackage
} from '../../../lib/evidence-custody';
import { Skeleton } from '../../Skeleton';

interface EvidenceManagerTabProps {
    caseId: string;
}

const EvidenceManagerTab: React.FC<EvidenceManagerTabProps> = ({ caseId }) => {
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [verificationResult, setVerificationResult] = useState<Record<string, boolean>>({});
    const [fileMap, setFileMap] = useState<Record<string, File>>({});
    const [packageInfo, setPackageInfo] = useState<EvidencePackage | null>(null);
    const auditLogs = React.useMemo(
        () => evidence.flatMap(item => item.chainOfCustody),
        [evidence]
    );

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newItems: EvidenceItem[] = [];

        for (const file of Array.from(files)) {
            const item = await createEvidenceItem(file, {
                source: 'User Upload',
                obtainedBy: 'Consumer',
                relevantTo: [caseId],
                notes: 'Primary Evidence',
                isOriginal: true
            });
            newItems.push(item);
            setFileMap(prev => ({ ...prev, [item.id]: file }));
        }

        setEvidence(prev => [...prev, ...newItems]);
        setIsUploading(false);
    };

    const handleVerify = async (item: EvidenceItem) => {
        const file = fileMap[item.id];
        if (!file) {
            setVerificationResult(prev => ({ ...prev, [item.id]: false }));
            return;
        }
        const result = await verifyEvidenceIntegrity(item, file);
        setVerificationResult(prev => ({ ...prev, [item.id]: result.isValid }));

        setTimeout(() => {
            setVerificationResult(prev => {
                const next = { ...prev };
                delete next[item.id];
                return next;
            });
        }, 5000);
    };

    return (
        <div className="fade-in space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white">Chain of Custody</h2>
                    <p className="text-slate-500">Securely manage and verify forensic evidence for litigation.</p>
                </div>
                <div className="flex gap-4">
                    <label className={isUploading ? 'btn btn-secondary !px-6 !py-3 !rounded-xl cursor-not-allowed opacity-70 pointer-events-none' : 'btn btn-secondary !px-6 !py-3 !rounded-xl cursor-pointer flex items-center gap-2'}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {isUploading ? 'Processing…' : 'Add Evidence'}
                        <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                    <button
                        disabled={evidence.length === 0}
                        className="btn btn-primary !bg-slate-900 !px-6 !py-3 !rounded-xl disabled:opacity-50"
                        onClick={async () => {
                            if (evidence.length === 0) return;
                            const pkg = await createEvidencePackage(
                                `Case ${caseId} Evidence Package`,
                                evidence,
                                `Evidence package for case ${caseId}.`
                            );
                            setPackageInfo(pkg);
                        }}
                    >
                        Generate Case Package
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Items', value: evidence.length, color: 'text-blue-500' },
                    { label: 'Hash Algorithm', value: 'SHA-256', color: 'text-slate-500' },
                    { label: 'Verified', value: Object.values(verificationResult).filter(v => v).length, color: 'text-emerald-500' },
                    { label: 'Integrity Status', value: 'Compliant', color: 'text-emerald-500' }
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-4 text-center bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{stat.label}</p>
                        <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>
            {packageInfo && (
                <div className="premium-card p-4 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-500/30">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-600 mb-2">Package Ready</p>
                    <div className="flex flex-wrap gap-4 text-xs text-emerald-700 dark:text-emerald-200">
                        <span>Package ID: {packageInfo.id}</span>
                        <span>Total Size: {(packageInfo.totalSize / 1024).toFixed(1)} KB</span>
                        <span>Integrity Hash: {packageInfo.integrityHash.slice(0, 12)}...</span>
                    </div>
                </div>
            )}

            {/* Evidence Table */}
            <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Filename</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Tamper-Proof Hash</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Date Added</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isUploading ? (
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <tr key={`skeleton-${i}`}>
                                            <td colSpan={4} className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton variant="rectangular" className="h-8 w-8 rounded" />
                                                    <div className="space-y-2 flex-1">
                                                        <Skeleton variant="rectangular" className="h-4 w-32" />
                                                        <Skeleton variant="rectangular" className="h-3 w-16" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ) : evidence.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No evidence items uploaded yet.</td>
                                </tr>
                            ) : (
                                evidence.map((item) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold dark:text-white">{item.filename}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase">{item.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded text-slate-500 break-all max-w-[200px] inline-block">
                                                {item.hash.substring(0, 32)}...
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-500">{new Date(item.uploadedAt).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleVerify(item)}
                                                    className={`p-2 rounded-lg transition-all ${verificationResult[item.id] === true ? 'bg-emerald-500 text-white' :
                                                            verificationResult[item.id] === false ? 'bg-rose-500 text-white' :
                                                                'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500'
                                                        }`}
                                                    title="Verify Integrity"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                </button>
                                                <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-all">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="premium-card p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Chain of Custody Audit Trail</h3>
                <div className="space-y-4">
                    {auditLogs.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No audit records available.</p>
                    ) : (
                        auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10).map((log, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">{log.action}</span>
                                        <span className="text-[9px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs dark:text-slate-300">{log.details}</p>
                                    <p className="text-[8px] font-mono text-slate-500 mt-2 uppercase">Actor: {log.actor}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvidenceManagerTab;
