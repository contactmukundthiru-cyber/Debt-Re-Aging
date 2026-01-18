'use client';

import React, { useState, useMemo } from 'react';
import { getStateLaws, STATE_LAWS, StateLawProfile } from '../../../lib/state-laws';
import { CreditFields } from '../../../lib/rules';

interface StatuteTrackerTabProps {
    fields: Partial<CreditFields>;
}

const StatuteTrackerTab: React.FC<StatuteTrackerTabProps> = ({ fields }) => {
    const [selectedState, setSelectedState] = useState(fields.stateCode || 'CA');

    const law = useMemo(() => getStateLaws(selectedState), [selectedState]);

    const calculateExpiry = (dateStr: string | undefined, years: number) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        date.setFullYear(date.getFullYear() + years);
        return date;
    };

    const solTypes = [
        { label: 'Written Contracts', key: 'writtenContracts' as keyof typeof law.sol },
        { label: 'Oral Contracts', key: 'oralContracts' as keyof typeof law.sol },
        { label: 'Promissory Notes', key: 'promissoryNotes' as keyof typeof law.sol },
        { label: 'Open Accounts', key: 'openAccounts' as keyof typeof law.sol }
    ];

    return (
        <div className="fade-in space-y-10 pb-12">
            {/* State Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white mb-2">Statutory Framework</h2>
                    <p className="text-slate-500">State-specific legal constraints and consumer protections for {law.name}.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Jurisdiction</span>
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    >
                        {Object.keys(STATE_LAWS).sort().map(code => (
                            <option key={code} value={code}>{code} - {STATE_LAWS[code].name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* SOL Breakdown */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-3 px-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full" />
                        Statute of Limitations (SOL)
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {solTypes.map((type) => {
                            const years = law.sol[type.key];
                            const expiry = calculateExpiry(fields.dateLastPayment, years);
                            const isExpired = expiry ? expiry < new Date() : false;

                            return (
                                <div key={type.key} className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">{type.label}</p>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-3xl font-black dark:text-white">{years}</span>
                                        <span className="text-xs font-bold text-slate-500 uppercase">Years</span>
                                    </div>
                                    {expiry && (
                                        <div className={`p-3 rounded-xl text-center border ${isExpired ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                            }`}>
                                            <p className="text-[9px] font-bold uppercase tracking-widest mb-1">{isExpired ? 'Expired' : 'Expires'}</p>
                                            <p className="text-xs font-black">{expiry.toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex gap-4">
                            <svg className="w-6 h-6 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <div>
                                <h4 className="text-sm font-bold text-amber-600 dark:text-amber-500 mb-1">Critical Warning</h4>
                                <p className="text-xs text-amber-700/70 dark:text-amber-500/70 leading-relaxed font-medium">
                                    Making even a partial payment or acknowledging the debt in writing can <strong>restart</strong> the statute of limitations in many jurisdictions. Consult legal counsel before communicating with collectors.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consumer Protections */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-3 px-2">
                        <span className="w-1 h-6 bg-emerald-500 rounded-full" />
                        Jurisdictional Protections
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Mini-CFPA / State FDCPA', active: law.consumerProtections.hasMiniCFPA, desc: 'Enhanced state-level collection restrictions and oversight.' },
                            { label: 'Debt Buyer Transcript Law', active: law.consumerProtections.hasDebtBuyerLaw, desc: 'Requires debt buyers to provide original account transcripts before suing.' },
                            { label: 'Medical Debt Shield', active: law.consumerProtections.hasMedicalDebtProtections, desc: 'Strict interest caps and reporting restrictions on medical expenses.' },
                            { label: 'Private Right of Action', active: law.consumerProtections.hasPrivateRightOfAction, desc: 'Allows consumers to sue directly for state law violations.' }
                        ].map((p, i) => (
                            <div key={i} className={`p-6 rounded-2xl border transition-all ${p.active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={`text-sm font-bold ${p.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{p.label}</h4>
                                    {p.active ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[8px] font-bold uppercase tracking-widest border border-emerald-500/30">Active Protection</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] font-bold uppercase tracking-widest">Base Federal Only</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Interest Caps & Regulatory */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="premium-card p-8 bg-slate-950 text-white border-slate-800 lg:col-span-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8 font-mono">Interest Rate Ceiling (Usury)</h3>
                    <div className="grid sm:grid-cols-3 gap-8">
                        {[
                            { label: 'Judgments', value: law.interestCaps.judgments },
                            { label: 'Medical', value: law.interestCaps.medical },
                            { label: 'Consumer', value: law.interestCaps.consumer }
                        ].map((cap, i) => (
                            <div key={i} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">{cap.label}</p>
                                <p className="text-4xl font-black text-emerald-400">{cap.value}%</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-8 text-[10px] text-slate-500 italic">These rates represent the maximum legal interest allowed in {law.name} for these debt categories.</p>
                </div>

                <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Enforcement Body</h3>
                        <p className="text-lg font-bold dark:text-white mb-2">{law.regulatoryBody.name}</p>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">The primary state agency responsible for consumer protection and debt collection oversight.</p>
                    </div>
                    <a
                        href={law.regulatoryBody.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary !w-full !rounded-xl text-center flex items-center justify-center gap-2"
                    >
                        Visit Official Agency
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default StatuteTrackerTab;
