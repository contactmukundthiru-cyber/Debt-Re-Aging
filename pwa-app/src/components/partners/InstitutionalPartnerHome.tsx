'use client';

import React from 'react';

const InstitutionalPartnerHome: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
            {/* Navigation */}
            <nav className="p-8 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="text-xl font-black tracking-tighter">CRA <span className="text-indigo-600">ENTERPRISE</span></span>
                </div>
                <div className="flex items-center gap-8">
                    <a href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Platform</a>
                    <a href="#compliance" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Compliance</a>
                    <button className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-sm shadow-xl hover:scale-105 transition-all">
                        Get Started
                    </button>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="py-24 px-8 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Available for Legal Aid & Law Firms
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]">
                        Enterprise Forensic <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600">Investigation.</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12">
                        Automate high-fidelity credit report analysis for your entire organization. Client-side processing satisfies strict institutional data privacy requirements.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <button className="w-full md:w-auto px-10 py-5 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
                            Launch Partner Portal
                        </button>
                        <button className="w-full md:w-auto px-10 py-5 rounded-2xl bg-white dark:bg-slate-900 dark:text-white text-slate-900 font-bold text-lg shadow-xl hover:bg-slate-50 transition-all border border-slate-200 dark:border-slate-800">
                            Download Compliance Guide
                        </button>
                    </div>
                </section>

                {/* Feature Grid */}
                <section id="features" className="py-24 px-8 max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="premium-card p-10 bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-8">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Case Management</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Organize hundreds of client cases locally. No PII ever leaves your secure terminal.</p>
                        </div>

                        <div className="premium-card p-10 bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-8">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Letter Editor</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Standardized professional dispute templates generated in seconds from raw data finds.</p>
                        </div>

                        <div className="premium-card p-10 bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-8">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Court Proof</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Forensic PDF reports including case law citations and cryptographic signatures.</p>
                        </div>
                    </div>
                </section>

                {/* Global Organizations Section */}
                <section className="py-24 bg-slate-100 dark:bg-slate-900 flex flex-col items-center">
                    <h2 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-12">Trusted by Forensics Teams Worldwide</h2>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                        {/* Simulated Partner Logos */}
                        <div className="flex items-center gap-2 font-bold text-2xl"><div className="w-6 h-6 rounded bg-slate-400" /> LEGAL AID</div>
                        <div className="flex items-center gap-2 font-bold text-2xl"><div className="w-6 h-6 rounded-full bg-slate-400" /> CONSUMER DEFENSE</div>
                        <div className="flex items-center gap-2 font-bold text-2xl"><div className="w-6 h-6 rotate-45 bg-slate-400" /> JURIS CORP</div>
                        <div className="flex items-center gap-2 font-bold text-2xl"><div className="w-6 h-6 bg-slate-400" /> CREDIT ALLIANCE</div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-24 px-8 border-t border-slate-200 dark:border-slate-900">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 text-center md:text-left">
                    <div className="col-span-2">
                        <h4 className="text-2xl font-black mb-6 tracking-tighter">CRA ENTERPRISE</h4>
                        <p className="text-slate-500 max-w-sm">The world's first air-gapped forensic credit investigation platform designed for high-volume institutional use.</p>
                    </div>
                    <div>
                        <h5 className="font-bold mb-6 uppercase tracking-widest text-[10px] text-slate-400">Institutional</h5>
                        <div className="space-y-4 text-sm font-medium text-slate-500">
                            <p><a href="#" className="hover:text-indigo-600 transition-colors">Legal Aid Program</a></p>
                            <p><a href="#" className="hover:text-indigo-600 transition-colors">White Label</a></p>
                            <p><a href="#" className="hover:text-indigo-600 transition-colors">API Docs (Local)</a></p>
                        </div>
                    </div>
                    <div>
                        <h5 className="font-bold mb-6 uppercase tracking-widest text-[10px] text-slate-400">Compliance</h5>
                        <div className="space-y-4 text-sm font-medium text-slate-500">
                            <p><a href="#" className="hover:text-indigo-600 transition-colors">Security Whitepaper</a></p>
                            <p><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Charter</a></p>
                            <p><a href="#" className="hover:text-indigo-600 transition-colors">Verification Logs</a></p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default InstitutionalPartnerHome;
