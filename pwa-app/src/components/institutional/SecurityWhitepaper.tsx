'use client';

import React from 'react';

const SecurityWhitepaper: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="premium-card p-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between mb-12 border-b border-slate-100 dark:border-slate-900 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white mb-2">Security & Privacy Architecture</h1>
                        <p className="text-slate-500 uppercase tracking-widest text-xs font-bold">Institutional Compliance Whitepaper v4.4</p>
                    </div>
                    <div className="text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Verified Local-Only
                        </div>
                    </div>
                </div>

                <section className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">01</span>
                            Zero-Cloud Data Policy
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                            Unlike traditional credit repair SaaS platforms, this application implements a <strong>Strict-Local Architecture</strong>. No credit report data, personally identifiable information (PII), or extracted text is ever transmitted to a remote server.
                        </p>
                        <ul className="grid md:grid-cols-2 gap-4">
                            {[
                                { label: 'Client-Side Parsing', desc: 'PDF and Image OCR occur entirely in the browser thread.' },
                                { label: 'No Database', desc: 'Personal data is stored in the local IndexDB/LocalStorage only.' },
                                { label: 'Air-Gap Capability', desc: 'The PWA can function entirely without an internet connection once loaded.' },
                                { label: 'Telemetry Free', desc: 'We do not collect usage analytics that include sensitive data strings.' }
                            ].map((item, i) => (
                                <li key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <p className="font-bold text-sm dark:text-white mb-1">{item.label}</p>
                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center text-sm">02</span>
                            Cryptographic Integrity
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                            To support legal proceedings and institutional partnerships, every forensic report includes a cryptographic hash (SHA-256) of the source data.
                        </p>
                        <div className="p-6 rounded-2xl bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800">
                            <p className="mb-2 text-slate-500">{'// Example Forensic Verification Log'}</p>
                            <p>HASH_ALGORITHM: SHA-256</p>
                            <p>SOURCE_DOCUMENT: Credit_Report_Jan.pdf</p>
                            <p>INTEGRITY_SIGNATURE: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                            <p>VERIFICATION_STATUS: [PASSED]</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm">03</span>
                            Institutional Compliance
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                            Our architecture is designed to satisfy the requirements of major security frameworks used by law firms and financial institutions:
                        </p>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { name: 'HIPAA/GLBA', status: 'Compliant', reason: 'Non-transmission of data' },
                                { name: 'SOC 2 Type II', status: 'Inherited', reason: 'Zero-trust environment' },
                                { name: 'CCPA/GDPR', status: 'Native', reason: 'Full user data control' }
                            ].map((reg, i) => (
                                <div key={i} className="text-center p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{reg.name}</p>
                                    <p className="text-emerald-500 font-bold mb-1">{reg.status}</p>
                                    <p className="text-[10px] text-slate-500">{reg.reason}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="mt-16 p-8 rounded-3xl bg-blue-600 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-bold mb-2">Request Partnership</h3>
                        <p className="text-blue-100 text-sm">Are you a Legal Aid or Professional Organization? We offer white-label deployment and custom rule sets.</p>
                    </div>
                    <button className="px-8 py-4 rounded-2xl bg-white text-blue-600 font-bold hover:shadow-xl transition-all whitespace-nowrap">
                        Contact Enterprise Team
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecurityWhitepaper;
