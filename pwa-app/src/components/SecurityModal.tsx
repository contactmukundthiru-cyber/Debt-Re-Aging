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

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-bounce">
                <div className="p-8 md:p-12">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold dark:text-white">Institutional Governance</h2>
                                <p className="text-sm text-slate-500">Security & Privacy Protocol V4.4</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <svg className="w-6 h-6 text-slate-400 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid gap-6 mb-10">
                        {features.map((f, i) => (
                            <div key={i} className="flex gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/30 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                                    <svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">{f.icon}</svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold dark:text-white">{f.title}</h3>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 px-2 py-0.5 bg-emerald-500/5 rounded">{f.tag}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
                        <div className="text-center sm:text-left">
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">Audit Ready</p>
                            <p className="text-sm text-slate-400">SOC2 Type II & HIPAA Compliance Documentation available upon institutional request.</p>
                        </div>
                        <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-bold whitespace-nowrap transition-colors shadow-lg shadow-emerald-500/20">
                            Request Info Package
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
