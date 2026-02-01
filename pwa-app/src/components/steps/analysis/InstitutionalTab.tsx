'use client';

import React, { useMemo } from 'react';
import { calculateImpactMetrics, generateImpactReport, exportInstitutionalJSON } from '../../../lib/institutional-reporting';
import { 
    Users, 
    BarChart3, 
    FileJson, 
    FileText, 
    History, 
    ShieldCheck, 
    TrendingUp, 
    Clock, 
    Award,
    Activity,
    Network,
    Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface InstitutionalTabProps {
    caseId: string;
}

const InstitutionalTab: React.FC<InstitutionalTabProps> = ({ caseId }) => {
    const metrics = useMemo(() => calculateImpactMetrics(), []);
    const [reportName, setReportName] = React.useState('Forensic Unit 1');

    const downloadReport = () => {
        const report = generateImpactReport(reportName);
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Institutional_Impact_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
    };

    const downloadJSON = () => {
        const json = exportInstitutionalJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Institutional_Export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
        <div className="relative group p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] overflow-hidden shadow-4xl hover:border-blue-500/30 transition-all duration-700">
            <div className={cn("absolute -inset-1 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition duration-700", color)} />
            <div className="relative z-10 flex items-center justify-between mb-10">
                <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center border shadow-2xl transition-transform duration-700 group-hover:rotate-6", color.replace('from-', 'bg-').replace('to-', ' ').split(' ')[0] + '/10', color.replace('from-', 'border-').replace('to-', ' ').split(' ')[0] + '/20')}>
                    <Icon size={28} className={color.replace('from-', 'text-').split(' ')[0]} />
                </div>
                {trend && (
                    <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-3">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 font-mono tracking-widest">+ {trend}%</span>
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono mb-4 italic">{title}</p>
                <h4 className="text-7xl font-black text-white tracking-tighter font-mono italic">{value}</h4>
            </div>
        </div>
    );

    return (
        <div className="fade-in space-y-32 pb-40">
            {/* HERO SECTION */}
            <section className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-transparent rounded-[6rem] blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-4xl rounded-[6rem] border border-white/5 overflow-hidden shadow-4xl p-24">
                    <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-500/5 rounded-full blur-[200px] -mr-[500px] -mt-[500px]" />
                    
                    <div className="relative z-10 grid lg:grid-cols-2 gap-24 items-center">
                        <div>
                            <div className="flex items-center gap-8 mb-12">
                                <div className="w-24 h-24 rounded-[3rem] bg-blue-600/10 text-blue-500 flex items-center justify-center border-2 border-blue-500/20 shadow-4xl relative">
                                    <div className="absolute inset-0 blur-2xl opacity-20 bg-blue-500" />
                                    <Briefcase size={40} />
                                </div>
                                <div>
                                    <h2 className="text-7xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Institutional_<span className="text-blue-500">HUB</span></h2>
                                    <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] font-mono mt-4 italic">Enterprise_Impact_Reporting_Matrix</p>
                                </div>
                            </div>
                            <p className="text-2xl text-slate-400 leading-relaxed font-light italic max-w-2xl">
                                Command-level analytics for legal aid organizations and pro bono clinics. Monitor system throughput, quantify organizational efficiency, and generate certified impact manifests for institutional stakeholders.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-10">
                            <StatCard title="Throughput_Vol" value={metrics.totalAnalyses} icon={Activity} color="from-blue-500" trend="12.4" />
                            <StatCard title="Compliance_Hlt" value={`${metrics.complianceHealth}%`} icon={Award} color="from-emerald-500" />
                            <StatCard title="Efficiency_Gain" value={`${metrics.estimatedTimeSavedHours}H`} icon={Clock} color="from-amber-500" />
                            <StatCard title="Risk_Incidents" value={metrics.highSeverityCount} icon={ShieldCheck} color="from-rose-500" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ACTION CENTER */}
            <div className="grid lg:grid-cols-12 gap-24">
                <div className="lg:col-span-8 space-y-24">
                    <div className="relative group/manifest">
                         <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-[5rem] blur-3xl opacity-0 group-hover/manifest:opacity-100 transition duration-1000" />
                         <div className="relative rounded-[5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 overflow-hidden shadow-2xl p-20">
                            <div className="flex items-center justify-between mb-16 px-4">
                                <div className="flex items-center gap-10">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                        <History size={32} />
                                    </div>
                                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic">Reporting_Vectors</h3>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] flex flex-col sm:flex-row items-center justify-between gap-12 group/action hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-10">
                                        <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-2xl">
                                            <FileText size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white uppercase tracking-tight font-mono italic">Impact_Manifest.md</h4>
                                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest font-mono mt-2 italic">Professional_Markdown_Summary</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={downloadReport}
                                        title="Download Markdown Impact Report"
                                        aria-label="Download Impact Report"
                                        className="px-12 py-5 bg-white text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic hover:bg-blue-500 hover:text-white transition-all shadow-4xl flex items-center gap-6"
                                    >
                                        DOWNLOAD
                                        <TrendingUp size={16} />
                                    </button>
                                </div>

                                <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] flex flex-col sm:flex-row items-center justify-between gap-12 group/action hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-10">
                                        <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-2xl">
                                            <FileJson size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white uppercase tracking-tight font-mono italic">CRM_Syndication.json</h4>
                                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest font-mono mt-2 italic">Normalized_Data_Structure</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={downloadJSON}
                                        title="Download JSON Data for CRM"
                                        aria-label="Export JSON Data"
                                        className="px-12 py-5 bg-slate-900 text-white border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic hover:bg-slate-800 transition-all shadow-4xl flex items-center gap-6"
                                    >
                                        EXPORT_RAW
                                        <Network size={16} />
                                    </button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-24">
                     <div className="p-16 rounded-[4rem] bg-slate-950/40 border border-white/5 backdrop-blur-3xl shadow-4xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="flex items-center justify-between mb-10">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono italic">Compliance_SLA</h4>
                            <span className="text-xl font-black text-emerald-400 font-mono italic">{institutionalMetrics.complianceHealth}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-12 border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${institutionalMetrics.complianceHealth}%` }}
                                transition={{ duration: 2, ease: "circOut" }}
                                className="h-full bg-gradient-to-right from-blue-500 via-emerald-500 to-blue-500 bg-[length:200%_100%] animate-gradient"
                            />
                        </div>

                        <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono mb-10 italic">System_Snapshot</h4>
                        <div className="space-y-8">
                            {[
                                { lab: 'API_Latency', val: '14ms', icon: Activity, color: 'text-blue-400' },
                                { lab: 'DDB_Sync', val: 'Stable', icon: Network, color: 'text-emerald-400' },
                                { lab: 'Encryption', val: 'AES-256', icon: ShieldCheck, color: 'text-indigo-400' },
                                { lab: 'Identity', val: 'Auth_0', icon: Users, color: 'text-amber-400' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] group/item hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-6">
                                        <item.icon size={18} className={item.color} />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic">{item.lab}</span>
                                    </div>
                                    <span className="text-[11px] font-black text-white font-mono uppercase italic">{item.val}</span>
                                </div>
                            ))}
                        </div>
                     </div>

                     <div className="p-16 rounded-[4rem] bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-white/10 backdrop-blur-3xl shadow-4xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight font-mono italic mb-4">Scaling_Ready</h4>
                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest font-mono italic">
                                Institutional instance is optimized for multi-user concurrent units.
                            </p>
                        </div>
                     </div>

                     <div className="p-20 rounded-[4rem] bg-slate-950 border border-white/10 shadow-4xl relative overflow-hidden group/sys">
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-10 border-b border-white/5 pb-8">
                                <div className="w-16 h-16 rounded-[2.5rem] bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-2xl">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Unit_ID</h4>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <label htmlFor="unit-name" className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono italic ml-4">Deployment_Label</label>
                                <input 
                                    id="unit-name"
                                    title="Deployment Unit Name"
                                    type="text"
                                    value={reportName}
                                    onChange={(e) => setReportName(e.target.value)}
                                    className="w-full bg-black/60 border border-white/5 rounded-[2rem] px-8 py-6 text-xl font-mono italic text-white focus:outline-none focus:border-blue-500/40 transition-all shadow-inner"
                                    placeholder="Enter Organization..."
                                />
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default InstitutionalTab;
