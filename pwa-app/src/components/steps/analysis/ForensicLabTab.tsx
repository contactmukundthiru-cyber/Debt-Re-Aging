'use client';

import React, { useMemo } from 'react';
import { RuleFlag } from '../../../lib/rules';

interface ForensicLabTabProps {
  flags: RuleFlag[];
}

const ForensicLabTab: React.FC<ForensicLabTabProps> = ({ flags }) => {
  const citations = useMemo(() => Array.from(new Set(flags.flatMap(f => f.legalCitations))), [flags]);
  const highSeverityFlags = useMemo(() => flags.filter(f => f.severity === 'high'), [flags]);

  // Comprehensive Statutory Mapping
  const getFullStatuteName = (cite: string) => {
    const mapping: Record<string, { title: string; desc: string }> = {
      'FCRA_605_a': { title: '15 U.S.C. § 1681c(a)', desc: 'Obsolescence - Prohibits reporting information older than 7 years from DOFD.' },
      'FCRA_605_c': { title: '15 U.S.C. § 1681c(c)', desc: 'Commencement of Period - Strictly defines when the 7-year clock begins.' },
      'FCRA_623_a1': { title: '15 U.S.C. § 1681s-2(a)(1)', desc: 'Accuracy - Prohibits reporting data known or suspected to be inaccurate.' },
      'FCRA_623_a2': { title: '15 U.S.C. § 1681s-2(a)(2)', desc: 'Duty to Correct - Requires updates when furnishers determine data is inaccurate.' },
      'FCRA_623_a5': { title: '15 U.S.C. § 1681s-2(a)(5)', desc: 'DOFD Reporting - Mandatory reporting of original delinquency dates.' },
      'FCRA_611': { title: '15 U.S.C. § 1681i', desc: 'Reinvestigation - Mandates reasonable investigation of consumer disputes.' },
      'FCRA_607_b': { title: '15 U.S.C. § 1681e(b)', desc: 'Maximum Accuracy - Agencies must follow procedures for absolute integrity.' },
      'FDCPA_807': { title: '15 U.S.C. § 1692e', desc: 'Deceptive Means - Prohibits false representations in debt collection.' },
      'FDCPA_807_2': { title: '15 U.S.C. § 1692e(2)', desc: 'False Representation - Misstating the character, amount, or legal status of debt.' },
      'FDCPA_809': { title: '15 U.S.C. § 1692g', desc: 'Validation - Mandates verification of debt upon consumer request.' },
      'CFPB_MEDICAL_RULE': { title: '12 CFR § 1022', desc: 'Medical Protections - Special limits on reporting health-related debt.' },
      'METRO2_GUIDE': { title: 'CDIA Metro 2 Standard', desc: 'Standardized formatting protocol for credit data transmission.' },
      '11USC524': { title: '11 U.S.C. § 524', desc: 'Bankruptcy Discharge - Prohibits collection of discharged liabilities.' }
    };

    return mapping[cite] || { title: cite.replace(/_/g, ' '), desc: 'Federal consumer protection statute.' };
  };

  // 3x3 Risk Matrix Logic (Probability vs Impact)
  const matrixCells = useMemo(() => {
    // We map rules to a 3x3 grid based on severity (Impact) and success probability (Likelihood)
    // Rows: Impact (High, Medium, Low)
    // Cols: Likelihood (High >80, Med 50-80, Low <50)
    const grid: RuleFlag[][][] = [
      [[], [], []], // High Impact [H-Likelihood, M-Likelihood, L-Likelihood]
      [[], [], []], // Med Impact
      [[], [], []]  // Low Impact
    ];

    flags.forEach(flag => {
      const row = flag.severity === 'high' ? 0 : flag.severity === 'medium' ? 1 : 2;
      const col = flag.successProbability >= 80 ? 0 : flag.successProbability >= 50 ? 1 : 2;
      grid[row][col].push(flag);
    });

    return grid;
  }, [flags]);

  return (
    <div className="fade-in space-y-10 pb-12">
      {/* Institutional Hero Header */}
      <div className="premium-card p-12 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -mr-48 -mt-48 transition-opacity duration-1000 group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -ml-48 -mb-48" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-400 font-mono">Institutional Forensic Lab // v4.4.0</span>
            </div>
            <h2 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
              Statutory <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">Liability Matrix</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              Real-time synthesis of detected FCRA/FDCPA violations. Our engine maps reporting inconsistencies
              against federal data standards to identify definitive litigation leverage.
            </p>

            <div className="mt-10 flex gap-4">
              <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Violation Count</p>
                <p className="text-3xl font-bold text-white tabular-nums">{flags.length}</p>
              </div>
              <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Statutes Cited</p>
                <p className="text-3xl font-bold text-blue-400 tabular-nums">{citations.length}</p>
              </div>
            </div>
          </div>

          {/* 3x3 Matrix UI */}
          <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl relative group">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
            <div className="grid grid-cols-3 grid-rows-3 gap-3 h-64">
              {matrixCells.flat().map((cellFlags, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;

                // Color mapping: Danger decreases as we move right/down from top-left
                // Top-left (0,0) is High Impact/High Prob -> Critical Red/Emerald
                let colorClass = "bg-white/5";
                if (row === 0 && col === 0) colorClass = "bg-emerald-500/20 border-emerald-500/30";
                else if (row === 0 || col === 0) colorClass = "bg-slate-800/40 border-slate-700";

                return (
                  <div key={i} className={`rounded-xl border flex items-center justify-center transition-all duration-300 group/cell overflow-hidden relative ${colorClass} hover:scale-105 hover:bg-white/10`}>
                    <span className={`text-sm font-bold tabular-nums ${cellFlags.length > 0 ? 'text-white' : 'text-slate-700'}`}>
                      {cellFlags.length}
                    </span>
                    {cellFlags.length > 0 && (
                      <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,1)]" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Matrix Labels */}
            <div className="absolute left-0 top-1/2 -translate-x-12 -translate-y-1/2 -rotate-90 text-[8px] font-bold uppercase tracking-widest text-slate-600">Impact Analysis</div>
            <div className="absolute left-1/2 bottom-0 translate-y-8 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest text-slate-600">Litigation Probability</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Statutory Deep Dive (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div>
              <h4 className="text-xl font-bold dark:text-white">Liability Mapping</h4>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Statutory Defense Strategy</p>
            </div>
          </div>

          <div className="grid gap-4">
            {citations.map((cite, i) => {
              const { title, desc } = getFullStatuteName(cite);
              return (
                <div key={i} className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-500/30 group">
                  <div className="flex items-start gap-5">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:bg-indigo-500/5 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400">#{(i + 1).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">{title}</h5>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Defense Rebuttal & Intelligence (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Probable Defense Section */}
          <div className="premium-card p-10 bg-slate-900 border-none text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />

            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-bold">Defense Synthesis</h4>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Predictive Intelligence</p>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              {highSeverityFlags.length > 0 ? highSeverityFlags.slice(0, 3).map((flag, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{flag.ruleId}</span>
                    <div className="h-px flex-grow bg-white/10" />
                  </div>

                  <div className="grid gap-5">
                    <div className="group/rebuttal">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-600" />
                        Probable Rebuttal
                      </p>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] leading-relaxed text-slate-300 italic">
                        {flag.ruleId === 'B1' || flag.ruleId === 'B2' ? 'CRA will likely claim "Historical Accuracy" without performing a recursive data audit of original Metro 2 submissions.' :
                          flag.ruleId === 'K6' ? 'Furnisher will likely argue that a partial payment "Reset the reporting clock," which is fundamentally illegal under FCRA § 605(c).' :
                            'Likely to provide a boilerplate "Verified" response using an automated e-OSCAR interface without human document review.'}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Statutory Counter-Strike
                      </p>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium pl-3 border-l-2 border-emerald-500/30">
                        {flag.ruleId === 'B1' || flag.ruleId === 'B2' ? 'Demand the "Method of Verification" (MOV) under FCRA § 611(a)(6). Lack of specific audit trail is a secondary violation.' :
                          flag.ruleId === 'K6' ? 'Cite the FTC 431 Opinion Letter. The Date of First Delinquency for credit reporting is absolute and non-resettable.' :
                            'Invoke FCRA § 623(b) mandatory furnisher duties. Failure to notify all CRAs of the consumer-noted dispute is a definitive violation.'}
                      </p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                  <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Secure Environment: No Critical Threats</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Evidence Grid */}
      <div className="space-y-8 pt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <h4 className="text-xl font-bold dark:text-white">Evidence Discovery Grid</h4>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Verifiable Legal Artifacts</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {highSeverityFlags.map((flag, i) => (
            <div key={i} className="premium-card p-8 bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 transition-all hover:border-emerald-500/30 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 m-4 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />

              <div className="mb-6">
                <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-2">#REF {flag.ruleId}</p>
                <h6 className="text-sm font-bold dark:text-white leading-tight pr-8">{flag.ruleName}</h6>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                  "{flag.explanation}"
                </p>

                <div className="pt-4 flex flex-wrap gap-2">
                  {flag.suggestedEvidence.map((ev, j) => (
                    <span key={j} className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2 group-hover:border-emerald-500/20 transition-colors">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {highSeverityFlags.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50/50 dark:bg-slate-950/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <svg className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Zero Critical Synthesis Required</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForensicLabTab;
