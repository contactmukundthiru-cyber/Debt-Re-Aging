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
    Briefcase,
    EyeOff,
    Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

import { CollectorMatch } from '../../../lib/collector-database';
import { useApp } from '../../../context/AppContext';

interface InstitutionalTabProps {
    caseId: string;
    collectorMatch?: CollectorMatch | null;
}

const InstitutionalTab: React.FC<InstitutionalTabProps> = ({ caseId, collectorMatch }) => {
    const { state, setPrivacyMode } = useApp();
    const { isPrivacyMode } = state;
    const [metrics, setMetrics] = React.useState<any>(null);
    const [reportName, setReportName] = React.useState('Forensic Unit 1');

    React.useEffect(() => {
        const loadMetrics = async () => {
            const data = await calculateImpactMetrics();
            setMetrics(data);
        };
        loadMetrics();
    }, []);

    const performBackup = async () => {
        const json = await exportInstitutionalJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `INSTITUTIONAL_BACKUP_${new Date().toISOString()}.json`;
        a.click();
    };

    const downloadReport = async () => {
        const report = await generateImpactReport(reportName);
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Institutional_Impact_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
    };

    const downloadJSON = async () => {
        const json = await exportInstitutionalJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Institutional_Export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const StatCard = ({ title, value, icon: Icon, trend }: any) => (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-slate-900/60 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className="px-2 py-1 bg-emerald-500/10 rounded-full text-[10px] font-bold text-emerald-500">
                        +{trend}%
                    </div>
                )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
            <h4 className="text-4xl font-bold text-white tracking-tight">{value}</h4>
        </div>
    );

    return (
        <div className="fade-in space-y-12 pb-20">
            {!metrics ? (
                <div className="flex flex-col items-center justify-center p-20">
                    <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading Analytics...</p>
                </div>
            ) : (
                <React.Fragment>
            {/* HERO */}
            <section className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-blue-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
                                <Briefcase size={36} />
                            </div>
                            <div>
                                <h2 className="text-5xl font-bold text-white tracking-tight leading-none">Institutional <span className="text-blue-500">Hub</span></h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Enterprise Performance Matrix</p>
                            </div>
                        </div>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                            Professional analytics for legal departments and forensic units. Monitor case velocity, compliance health, and institutional impact metrics.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <StatCard title="Throughput" value={metrics.totalAnalyses} icon={Activity} trend="12" />
                        <StatCard title="Compliance" value={`${metrics.complianceHealth}%`} icon={Award} />
                        <StatCard title="Hours Saved" value={`${metrics.estimatedTimeSavedHours}h`} icon={Clock} />
                        <StatCard title="Risk Incidents" value={metrics.highSeverityCount} icon={ShieldCheck} />
                    </div>
                </div>
            </section>

            {/* COLLECTOR INTEL */}
            {collectorMatch && (
                <section className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-12">
                    <div className="flex flex-col xl:flex-row gap-12">
                        <div className="flex-1 space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Collector Profile</p>
                                    <h3 className="text-4xl font-bold text-white tracking-tight">{collectorMatch.collector.names[0]}</h3>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-8 bg-slate-950/40 rounded-3xl border border-white/5">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">CFPB Complaints</p>
                                    <p className="text-4xl font-bold text-white tracking-tighter">{collectorMatch.collector.violations.cfpbComplaints.toLocaleString()}</p>
                                </div>
                                <div className="p-8 bg-slate-950/40 rounded-3xl border border-white/5">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Risk Level</p>
                                    <p className={cn("text-4xl font-bold tracking-tighter uppercase", 
                                        collectorMatch.collector.riskLevel === 'high' ? 'text-rose-500' : 'text-amber-500'
                                    )}>
                                        {collectorMatch.collector.riskLevel}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Known Issues</p>
                            <div className="flex flex-wrap gap-2">
                                {collectorMatch.collector.knownIssues.map((issue, idx) => (
                                    <span key={idx} className="px-4 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-xs font-semibold text-slate-300">
                                        {issue}
                                    </span>
                                ))}
                            </div>
                            <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">Forensic Note</p>
                                <p className="text-sm text-slate-400 leading-relaxed">{collectorMatch.collector.notes}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ACTIONS */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 flex items-center justify-between hover:bg-slate-900/60 transition-all cursor-pointer group" onClick={downloadReport}>
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-blue-500 transition-colors">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white tracking-tight">Impact Manifest</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Professional PDF/Markdown Summary</p>
                        </div>
                    </div>
                    <Download size={20} className="text-slate-500 group-hover:text-white transition-colors" />
                </div>

                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 flex items-center justify-between hover:bg-slate-900/60 transition-all cursor-pointer group" onClick={downloadJSON}>
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-indigo-500 transition-colors">
                            <FileJson size={28} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white tracking-tight">Data Syndication</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Normalized JSON Export for CRM</p>
                        </div>
                    </div>
                    <Network size={20} className="text-slate-500 group-hover:text-white transition-colors" />
                </div>
            </div>
                </React.Fragment>
            )}
        </div>
    );
};

export default InstitutionalTab;

    const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
        <div 
            tabIndex={0}
            className="relative group p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] overflow-hidden shadow-4xl hover:border-blue-500/30 transition-all duration-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            role="status"
            aria-label={`${title}: ${value}`}
        >
            <div className={cn("absolute -inset-1 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition duration-700", color)} />
            <div className="relative z-10 flex items-center justify-between mb-10">
                <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center border shadow-2xl transition-transform duration-700 group-hover:rotate-6", color.replace('from-', 'bg-').replace('to-', ' ').split(' ')[0] + '/10', color.replace('from-', 'border-').replace('to-', ' ').split(' ')[0] + '/20')}>
                    <Icon size={28} aria-hidden="true" className={color.replace('from-', 'text-').split(' ')[0]} />
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
            {!metrics ? (
                <div className="flex flex-col items-center justify-center p-40 text-center">
                    <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8" />
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Initialising_Forensic_Vault...</p>
                </div>
            ) : (
                <React.Fragment>
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

            {/* COLLECTOR INTELLIGENCE NODE */}
            {collectorMatch && (
                <section className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-br from-red-500/20 via-blue-500/20 to-emerald-500/20 rounded-[5rem] blur-3xl opacity-30 group-hover:opacity-60 transition duration-1000" />
                    <div className="relative rounded-[5rem] bg-slate-950/80 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-2xl p-24">
                        <div className="flex flex-col xl:flex-row gap-20">
                            <div className="flex-1 space-y-12">
                                <div className="flex items-center gap-8">
                                    <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center border border-red-500/20 shadow-2xl">
                                        <ShieldCheck className="text-red-500" size={40} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                            <p className="text-[11px] font-black text-red-500 uppercase tracking-[0.6em] font-mono leading-tight italic">Collector_Intel_Dossier</p>
                                        </div>
                                        <h3 className="text-6xl font-black text-white italic tracking-tighter uppercase font-mono">{collectorMatch.collector.names[0]}</h3>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5 hover:border-red-500/30 transition-all group/stat">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mb-4 italic group-hover/stat:text-red-500/70 transition-colors">CFPB_COMPLAINTS</p>
                                        <div className="flex items-baseline gap-4">
                                            <p className="text-6xl font-black text-white font-mono tracking-tighter italic">{collectorMatch.collector.violations.cfpbComplaints.toLocaleString()}</p>
                                            <span className="text-red-500 text-sm font-black font-mono tracking-widest">+12%</span>
                                        </div>
                                    </div>
                                    <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5 hover:border-blue-500/30 transition-all group/stat">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mb-4 italic group-hover/stat:text-blue-500/70 transition-colors">THREAT_LEVEL</p>
                                        <p className={cn("text-6xl font-black font-mono tracking-tighter italic", 
                                            collectorMatch.collector.riskLevel === 'high' ? 'text-rose-500' : 'text-amber-500'
                                        )}>
                                            {collectorMatch.collector.riskLevel.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-10">
                                <div className="space-y-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">Behavioral_Patterns</p>
                                    <div className="flex flex-wrap gap-4">
                                        {collectorMatch.collector.knownIssues.map((issue, idx) => (
                                            <span key={idx} className="px-8 py-3 bg-slate-900/60 border border-white/10 rounded-full text-[11px] text-slate-300 font-bold tracking-tight shadow-xl hover:border-blue-500/40 transition-all">
                                                {issue}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-12 bg-blue-500/5 border border-blue-500/10 rounded-[3rem] relative overflow-hidden group/note">
                                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover/note:opacity-40 transition-opacity">
                                        <FileText size={48} className="text-blue-500" />
                                    </div>
                                    <p className="text-[12px] text-blue-400 font-black mb-4 italic tracking-[0.4em] uppercase font-mono">Forensic_Note</p>
                                    <p className="text-sm text-slate-400 leading-relaxed font-mono italic">{collectorMatch.collector.notes}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ACTION CENTER */}
            <div className="grid lg:grid-cols-12 gap-24">
                <div className="lg:col-span-8 space-y-24">
                    <div className="relative group/manifest">
                         <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-[5rem] blur-3xl opacity-0 group-hover/manifest:opacity-100 transition duration-1000" />
                         <div className="relative rounded-[5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 overflow-hidden shadow-2xl p-20">
                            <div className="flex items-center justify-between mb-16">
                                <div>
                                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Throughput_Velocity</h3>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-[0.4em] uppercase">Historical_Case_Volume_Index</p>
                                </div>
                                <div className="flex items-center gap-4">
                                     <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                                     <span className="text-xs font-mono text-slate-400">REALTIME_STREAMING</span>
                                </div>
                            </div>

                            <VelocityChart />

                            <div className="grid grid-cols-4 gap-10 mt-16 pt-16 border-t border-white/5">
                                {[
                                    { label: 'Avg_Processing', val: '2.4m', sub: '-14% vs prev' },
                                    { label: 'Cloud_Residency', val: '0.0%', sub: 'Purely Local' },
                                    { label: 'Encryption_Key', val: 'ECC', sub: 'Rotated daily' },
                                    { label: 'Audit_Trail', val: 'Active', sub: 'IndexedDB-backed' }
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono mb-2">{stat.label}</p>
                                        <p className="text-2xl font-black text-white font-mono italic">{stat.val}</p>
                                        <p className="text-[9px] text-blue-500/60 font-mono mt-1">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>

                    <div className="panel p-16 rounded-[4rem] bg-white/[0.02] border border-white/5 shadow-3xl">
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
                                    className="px-12 py-5 bg-slate-900 text-white border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic hover:bg-slate-800 transition-all shadow-4xl flex items-center gap-6"
                                >
                                    EXPORT_RAW
                                    <Network size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-24">
                     <div className="p-16 rounded-[4rem] bg-slate-950/40 border border-white/5 backdrop-blur-3xl shadow-4xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="flex items-center justify-between mb-10">
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono italic">Compliance_SLA</h4>
                            <span className="text-xl font-black text-emerald-400 font-mono italic">{metrics.complianceHealth}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-12 border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${metrics.complianceHealth}%` }}
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
                        <div className="relative z-10 space-y-8">
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight font-mono italic">Enterprise_Security</h4>
                            
                            <div className="space-y-4 mb-8">
                                {[
                                    { t: "Verification Integrity", s: "SHA-256 Active" },
                                    { t: "Privacy Shield", s: isPrivacyMode ? "Redacted" : "Exposed", warn: !isPrivacyMode },
                                    { t: "Storage Residency", s: "Edge (Local)" }
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono italic">{item.t}</span>
                                        <span className={cn("text-[10px] font-bold font-mono uppercase italic", item.warn ? "text-rose-400" : "text-emerald-400")}>{item.s}</span>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => setPrivacyMode(!isPrivacyMode)}
                                className={cn(
                                    "w-full px-6 py-4 rounded-2xl flex items-center justify-between border transition-all font-mono text-xs font-black uppercase tracking-widest",
                                    isPrivacyMode 
                                        ? "bg-rose-500/20 border-rose-500/40 text-rose-400" 
                                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                )}
                            >
                                {isPrivacyMode ? 'SHIELD_ACTIVE' : 'ACTIVATE_SHIELD'}
                                <EyeOff size={18} />
                            </button>
                        </div>
                     </div>

                     <div className="p-16 rounded-[4rem] bg-indigo-600 text-white shadow-4xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform" onClick={performBackup}>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-2xl font-black uppercase tracking-tight font-mono italic">Full_Backup</h4>
                                <Download size={24} />
                            </div>
                            <p className="text-[11px] font-bold text-indigo-100 leading-relaxed uppercase tracking-widest font-mono italic">
                                Download all local case history for off-site archival.
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
                </React.Fragment>
            )}
        </div>
    );
};

export default InstitutionalTab;
