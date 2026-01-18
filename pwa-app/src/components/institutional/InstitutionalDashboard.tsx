'use client';

import React, { useState, useEffect } from 'react';
import {
    getClients,
    createClient,
    getOrgSession,
    saveOrgSession,
    ClientProfile,
    InstitutionalSession
} from '../../lib/institutional';

const InstitutionalDashboard: React.FC = () => {
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [session, setSession] = useState<InstitutionalSession | null>(null);
    const [showAddClient, setShowAddClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newCaseNumber, setNewCaseNumber] = useState('');

    useEffect(() => {
        setClients(getClients());
        setSession(getOrgSession());
    }, []);

    const handleAddClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientName) return;

        const client = createClient(newClientName, newCaseNumber);
        setClients([...clients, client]);
        setNewClientName('');
        setNewCaseNumber('');
        setShowAddClient(false);
    };

    const updateExportFormat = (format: InstitutionalSession['exportFormat']) => {
        if (!session) return;
        const newSession = { ...session, exportFormat: format };
        setSession(newSession);
        saveOrgSession(newSession);
    };

    if (!session) return null;

    return (
        <div className="fade-in space-y-10">
            {/* Org Header */}
            <div className="premium-card p-10 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white border-indigo-500/20 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-300 font-mono">Institutional Portal</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">{session.orgName}</span>
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Organization ID: <span className="font-mono text-xs">{session.orgId}</span>
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowAddClient(true)}
                            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Investigation
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Client List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold dark:text-white">Active Case Files</h3>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{clients.length} Total Records</span>
                    </div>

                    <div className="grid gap-4">
                        {clients.length === 0 ? (
                            <div className="premium-card p-12 text-center border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20">
                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <p className="text-slate-500 font-medium">No active cases. Start by adding a new investigation.</p>
                            </div>
                        ) : (
                            clients.map(client => (
                                <div key={client.id} className="premium-card p-6 bg-white dark:bg-slate-900 hover:shadow-xl transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold dark:text-white group-hover:text-blue-500 transition-colors">{client.name}</h4>
                                                <p className="text-xs text-slate-500">Case No: {client.caseNumber || 'N/A'} • ID: {client.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${client.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {client.status}
                                            </span>
                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar Settings & Stats */}
                <div className="space-y-8">
                    {/* Org Config */}
                    <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Institutional Settings</h4>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Primary Export Format</label>
                                <div className="grid gap-2">
                                    {[
                                        { id: 'standard', label: 'Standard Analysis' },
                                        { id: 'forensic_legal', label: 'Forensic (Legal Ready)' },
                                        { id: 'expert_witness', label: 'Expert Witness' }
                                    ].map(format => (
                                        <button
                                            key={format.id}
                                            onClick={() => updateExportFormat(format.id as InstitutionalSession['exportFormat'])}
                                            className={`w-full p-4 rounded-xl text-left border transition-all ${session.exportFormat === format.id
                                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600'
                                                : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold">{format.label}</span>
                                                {session.exportFormat === format.id && (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <span className="text-xs font-bold text-amber-600">Audit Logs Enabled</span>
                                    </div>
                                    <button className="text-[10px] font-bold uppercase text-amber-700 underline">View</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Support & Audit */}
                    <div className="space-y-4">
                        <div className="premium-card p-8 bg-slate-900 border-indigo-900 text-white shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] -mr-16 -mt-16" />
                            <div className="relative z-10">
                                <h4 className="font-bold mb-2 text-sm">Forensic Audit Log</h4>
                                <p className="text-[10px] text-indigo-300 mb-6 leading-relaxed">Cryptographically signed records of all system state changes.</p>
                                <div className="space-y-2 mb-6">
                                    {[
                                        { event: 'Analysis_Start', time: '2m ago' },
                                        { event: 'OCR_Verified', time: '15m ago' },
                                        { event: 'PDF_Export', time: '1h ago' }
                                    ].map((log, i) => (
                                        <div key={i} className="flex items-center justify-between text-[9px] font-mono text-indigo-400 bg-black/20 p-2 rounded border border-indigo-500/10">
                                            <span>{log.event}</span>
                                            <span>{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px] transition-all">
                                    Export Compliance Log (.csv)
                                </button>
                            </div>
                        </div>

                        <div className="premium-card p-6 bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Trust verified</p>
                                    <p className="text-[9px] opacity-70">No outbound traffic detected</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Client Modal */}
            {showAddClient && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
                    <div className="premium-card w-full max-w-md p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-pop">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold dark:text-white">New Case File</h3>
                            <button onClick={() => setShowAddClient(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddClient} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Client Full Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    placeholder="e.g. Johnathan Doe"
                                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Internal Case Number (Optional)</label>
                                <input
                                    type="text"
                                    value={newCaseNumber}
                                    onChange={(e) => setNewCaseNumber(e.target.value)}
                                    placeholder="e.g. LA-2026-0045"
                                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                            >
                                Create Case File
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstitutionalDashboard;
