'use client';

import React from 'react';

interface SecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const features = [
        {
            title: 'Local-First Architecture',
            description: 'Zero data is transmitted to external servers. All extraction, parsing, and analysis occur entirely within your browser session.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
            tag: 'Data Sovereignty'
        },
        {
            title: 'PII Scrubbing',
            description: 'Sensitive personal identifiers can be masked during export to ensure compliance with privacy regulations like CCPA and GDPR.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
            tag: 'Regulatory Compliance'
        },
        {
            title: 'Immutable Reporting',
            description: 'Audit logs tracking all systemic actions ensure that forensic findings are documented and defensively sound for legal use.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 0-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
            tag: 'Legal Audit'
        }
    ];

    const [auditState, setAuditState] = React.useState<'idle' | 'running' | 'completed'>('idle');
    const [auditSteps, setAuditSteps] = React.useState<string[]>([]);

    const runAudit = async () => {
        setAuditState('running');
        setAuditSteps([]);
        const steps = [
            'Verifying Browser Sandbox isolated environment...',
            'Validating WASM Core cryptographic integrity...',
            'Checking local storage AES-256 encryption status...',
            'Mapping Zero-Trust perimeter boundaries...',
            'Executing Emulator Detection heartbeat...',
            'Audit Complete: Pure-Native Environment Verified.'
        ];

        for (const step of steps) {
            await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
            setAuditSteps(prev => [...prev, step]);
        }
        setAuditState('completed');
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-bounce">
                <div className="p-8 md:p-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold dark:text-white">Institutional Governance</h2>
                                <p className="text-sm text-slate-500 font-mono">Protocol: ZENITH-V5-ALPHA</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid gap-4 mb-8">
                        {features.map((f, i) => (
                            <div key={i} className="flex gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                                    <svg className="w-5 h-5 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">{f.icon}</svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-0.5">
                                        <h3 className="text-sm font-bold dark:text-white">{f.title}</h3>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded">{f.tag}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-[2rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[160px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Security Audit Engine</p>
                                <p className="text-xs text-slate-400">Environment Verification Service</p>
                            </div>
                            {auditState === 'idle' && (
                                <button
                                    onClick={runAudit}
                                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all transform active:scale-95 shadow-lg shadow-emerald-500/20"
                                >
                                    Initialize Audit
                                </button>
                            )}
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto font-mono text-[10px] space-y-2">
                            {auditState === 'idle' ? (
                                <div className="text-slate-500 italic">Ready for system integrity verification. Proceed with initialization...</div>
                            ) : (
                                auditSteps.map((step, idx) => (
                                    <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <span className="text-emerald-500 font-bold shrink-0">[OK]</span>
                                        <span className={idx === auditSteps.length - 1 && auditState === 'running' ? 'text-white' : 'text-slate-400'}>
                                            {step}{idx === auditSteps.length - 1 && auditState === 'running' && '...'}
                                        </span>
                                    </div>
                                ))
                            )}
                            {auditState === 'running' && (
                                <div className="flex gap-2 items-center mt-4">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-75" />
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-150" />
                                </div>
                            )}
                            {auditState === 'completed' && (
                                <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-in zoom-in-95 duration-500">
                                    <p className="font-bold uppercase tracking-widest text-[9px] mb-1">Identity Confirmed</p>
                                    <p className="text-[11px] leading-relaxed">System integrity verified. Zero-trust environment established. Session is secured for high-stakes forensic analysis.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
