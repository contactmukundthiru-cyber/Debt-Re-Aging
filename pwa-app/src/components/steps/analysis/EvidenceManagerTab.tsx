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
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, 
    Activity, 
    HardDrive, 
    PlusSquare, 
    Box, 
    Zap, 
    FileText, 
    Hash, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Trash2,
    Lock,
    Cpu
} from 'lucide-react';
import { cn } from '../../../lib/utils';

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
        <div className="fade-in space-y-20 pb-40">
            {/* ELITE_AUDIT_HERO::FORENSIC_EVIDENCE_VAULT */}
            <section className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-600/20 via-blue-600/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-8">
                             <div className="flex items-center gap-6 mb-8">
                                <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-3">
                                    <Lock size={14} className="text-indigo-400 animate-pulse" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-indigo-400 font-mono">Vault Status: SEALED</span>
                                </div>
                                <div className="h-px w-10 bg-slate-800" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Case_Ref::{caseId}</span>
                            </div>

                            <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                                Evidence <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500 tracking-[-0.05em]">VAULT</span>
                            </h2>

                            <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight max-w-2xl border-l-2 border-indigo-500/30 pl-12 mb-12">
                                Managing cryptographic <span className="text-white">Chain of Custody</span> for high-stakes litigation. All assets are hashed via SHA-256 to ensure absolute data integrity.
                            </p>
                        </div>

                        <div className="lg:col-span-4 flex flex-col items-end gap-6">
                            <label className={cn(
                                "group/upload px-12 py-8 bg-white text-slate-950 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.5em] font-mono italic transition-all shadow-3xl flex items-center gap-6 cursor-pointer hover:bg-indigo-500 hover:text-white",
                                isUploading && "opacity-50 pointer-events-none"
                            )}>
                                <PlusSquare size={24} className="group-hover/upload:rotate-90 transition-transform" />
                                {isUploading ? 'Ingestion_Active' : 'Ingest_Evidence'}
                                <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                            </label>

                            <button
                                disabled={evidence.length === 0}
                                onClick={async () => {
                                    if (evidence.length === 0) return;
                                    const pkg = await createEvidencePackage(
                                        `Case ${caseId} Evidence Package`,
                                        evidence,
                                        `Evidence package for case ${caseId}.`
                                    );
                                    setPackageInfo(pkg);
                                }}
                                className="group/pkg px-12 py-8 bg-slate-900 border border-white/10 text-white rounded-[3rem] text-[11px] font-black uppercase tracking-[0.5em] font-mono italic transition-all hover:border-indigo-500/50 flex items-center gap-6"
                            >
                                <Box size={24} className="group-hover/pkg:scale-110 transition-transform" />
                                Generate_Package
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-16 pt-16 border-t border-white/5">
                        {[
                            { label: 'Total Items', value: evidence.length, icon: <FileText size={18} />, color: 'text-indigo-400' },
                            { label: 'Hash Logic', value: 'SHA-256', icon: <Hash size={18} />, color: 'text-slate-500' },
                            { label: 'Verified Integrity', value: `${Object.values(verificationResult).filter(v => v).length} Nodes`, icon: <CheckCircle2 size={18} />, color: 'text-emerald-500' },
                            { label: 'Custody Status', value: 'SECURE', icon: <ShieldCheck size={18} />, color: 'text-blue-500' }
                        ].map((stat, i) => (
                            <div key={i} className="group/stat">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className={cn("transition-colors", stat.color)}>{stat.icon}</span>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono italic group-hover/stat:text-white transition-colors">
                                        {stat.label}
                                    </span>
                                </div>
                                <div className="text-3xl font-black text-white font-mono italic tracking-tighter">
                                    {stat.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {packageInfo && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 rounded-[3rem] bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-3xl flex items-center justify-between"
                >
                    <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-500 flex items-center justify-center text-white shadow-2xl">
                             <Box size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.5em] text-indigo-400 font-black font-mono italic mb-2">Package_State::READY</p>
                            <div className="flex gap-12 text-[11px] font-mono text-slate-300">
                                <span className="flex items-center gap-3 italic"><Hash size={12} className="text-indigo-500" /> ID: {packageInfo.id}</span>
                                <span className="flex items-center gap-3 italic"><Cpu size={12} className="text-indigo-500" /> { (packageInfo.totalSize / 1024).toFixed(1) } KB</span>
                                <span className="flex items-center gap-3 border-l border-white/10 pl-12 font-black text-indigo-100">SIG: {packageInfo.integrityHash.slice(0, 24)}...</span>
                            </div>
                        </div>
                    </div>
                    <button className="px-10 py-5 bg-white text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic hover:bg-indigo-500 hover:text-white transition-all shadow-3xl">
                        Export_Secure_ISO
                    </button>
                </motion.div>
            )}

            <div className="grid lg:grid-cols-12 gap-20">
                {/* Evidence Artifacts */}
                <div className="lg:col-span-8 space-y-8">
                     <div className="flex items-center justify-between mb-8 px-8">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] font-mono italic flex items-center gap-4">
                            <Activity size={16} className="text-indigo-500" /> Artifact_Nodes
                        </h4>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] font-mono italic">Filter_ModeStack: ALL</span>
                    </div>

                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {isUploading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="p-8 rounded-[3rem] bg-slate-900 animate-pulse border border-white/5 h-28" />
                                ))
                            ) : evidence.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-32 rounded-[4rem] bg-slate-950/20 border border-dashed border-white/5 flex flex-col items-center justify-center gap-8 text-center"
                                >
                                    <div className="w-24 h-24 rounded-[3rem] bg-slate-900 flex items-center justify-center text-slate-800 border border-white/5">
                                        <HardDrive size={40} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-600 uppercase tracking-tighter italic font-mono mb-2">Vault_Empty</p>
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono italic">No cryptographic artifacts detected in session.</p>
                                    </div>
                                </motion.div>
                            ) : (
                                evidence.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="group/item p-10 rounded-[3.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 hover:border-indigo-500/30 transition-all shadow-2xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                        
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="flex items-center gap-10">
                                                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-900 flex items-center justify-center border border-white/10 group-hover/item:border-indigo-500/50 transition-all text-slate-500 group-hover/item:text-indigo-400">
                                                    <FileText size={32} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <h5 className="text-2xl font-black text-white uppercase tracking-tighter italic font-mono">{item.filename}</h5>
                                                        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] font-black text-indigo-400 font-mono italic">{item.type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 italic">
                                                            <Hash size={12} className="text-indigo-500" />
                                                            {item.hash.substring(0, 32)}...
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 italic">
                                                            <Clock size={12} className="text-indigo-500" />
                                                            {new Date(item.uploadedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <button
                                                    onClick={() => handleVerify(item)}
                                                    title="Verify Evidence Authenticity"
                                                    aria-label="Verify Evidence"
                                                    className={cn(
                                                        "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-xl",
                                                        verificationResult[item.id] === true ? 'bg-emerald-500 text-white' :
                                                        verificationResult[item.id] === false ? 'bg-rose-500 text-white' :
                                                        'bg-slate-900 text-slate-500 hover:text-white hover:bg-indigo-600'
                                                    )}
                                                >
                                                    <ShieldCheck size={24} />
                                                </button>
                                                <button 
                                                    title="Remove Evidence"
                                                    aria-label="Remove Evidence"
                                                    className="w-16 h-16 rounded-[2rem] bg-slate-900/50 flex items-center justify-center text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                                >
                                                    <Trash2 size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Audit Signal Log */}
                <div className="lg:col-span-4">
                     <div className="p-12 rounded-[4.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">
                        <div className="flex items-center gap-8 mb-16">
                            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-2xl relative">
                                <Activity size={28} className="animate-pulse" />
                            </div>
                            <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic font-mono">Signal_Log</h4>
                        </div>

                        <div className="relative flex-grow">
                             <div className="absolute left-[31px] top-0 bottom-0 w-px bg-slate-800" />
                             
                             <div className="space-y-12 relative z-10">
                                {auditLogs.length === 0 ? (
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] font-mono ml-20 mt-10 italic italic">No active telemetry.</p>
                                ) : (
                                    auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8).map((log, i) => (
                                        <div key={i} className="flex gap-10 group/log">
                                            <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center shrink-0 group-hover/log:border-indigo-500/50 transition-colors bg-black">
                                                <div className="w-3 h-3 rounded-full bg-indigo-500 group-hover/log:scale-150 transition-transform" />
                                            </div>
                                            <div className="flex-grow pt-2">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] font-mono italic">{log.action}</span>
                                                    <span className="text-[9px] font-mono text-slate-600 italic">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-300 italic tracking-tight mb-4 group-hover/log:text-white transition-colors">{log.details}</p>
                                                <div className="flex items-center gap-4">
                                                     <p className="px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-[8px] font-black text-slate-500 font-mono uppercase tracking-widest italic group-hover/log:text-indigo-400 group-hover/log:border-indigo-500/20">Actor: {log.actor}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                             </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default EvidenceManagerTab;
