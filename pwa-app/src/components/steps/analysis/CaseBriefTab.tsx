'use client';

import React from 'react';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { STATES } from '../../../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    Target, 
    Shield, 
    Clock, 
    CheckCircle2, 
    Plus, 
    Trash2, 
    Copy, 
    ChevronRight,
    Search,
    Lock,
    Zap,
    Scale,
    Activity,
    Save
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface BriefTask {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  done: boolean;
}

interface BriefMilestone {
  id: string;
  label: string;
  date: string;
}

interface CaseBrief {
  title: string;
  objective: string;
  focusArea: 'bureau' | 'furnisher' | 'collector' | 'multi';
  urgency: 'critical' | 'standard' | 'monitor';
  jurisdiction: string;
  notes: string;
  tasks: BriefTask[];
  milestones: BriefMilestone[];
}

const EMPTY_BRIEF: CaseBrief = {
  title: '',
  objective: '',
  focusArea: 'multi',
  urgency: 'standard',
  jurisdiction: 'CA',
  notes: '',
  tasks: [],
  milestones: []
};

const CaseBriefTab: React.FC = () => {
    const [brief, setBrief, clearBrief] = useLocalStorage<CaseBrief>('cra_case_brief_v1', EMPTY_BRIEF, {
      encrypt: false,
      syncTabs: true
    });
  const [taskText, setTaskText] = React.useState('');
  const [taskPriority, setTaskPriority] = React.useState<BriefTask['priority']>('medium');
  const [taskDueDate, setTaskDueDate] = React.useState('');
  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const completedTasks = brief.tasks.filter(task => task.done).length;
  const totalTasks = brief.tasks.length;

  const addTask = () => {
    const trimmed = taskText.trim();
    if (!trimmed) return;

    const nextTask: BriefTask = {
      id: `task-${Date.now()}`,
      text: trimmed,
      priority: taskPriority,
      dueDate: taskDueDate,
      done: false
    };

    setBrief(prev => ({
      ...prev,
      tasks: [nextTask, ...prev.tasks]
    }));

    setTaskText('');
    setTaskDueDate('');
    setTaskPriority('medium');
  };

  const toggleTask = (id: string) => {
    setBrief(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => task.id === id ? { ...task, done: !task.done } : task)
    }));
  };

  const removeTask = (id: string) => {
    setBrief(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id)
    }));
  };

  const generateBriefSummary = () => {
    return `CASE BRIEF: ${brief.title || 'Untitled Case'}
OBJ: ${brief.objective || 'N/A'}
AREA: ${brief.focusArea.toUpperCase()}
PRIORITY: ${brief.urgency.toUpperCase()}
STATE: ${brief.jurisdiction}

TASKS:
${brief.tasks.map(t => `[${t.done ? 'X' : ' '}] ${t.priority.toUpperCase()}: ${t.text} (${t.dueDate || 'No date'})`).join('\n')}

NOTES:
${brief.notes}`;
  };

  const copyBrief = () => {
    navigator.clipboard.writeText(generateBriefSummary())
      .then(() => {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
      })
      .catch(() => setCopyStatus('error'));
  };

  return (
    <div className="fade-in space-y-12 pb-32">
        {/* Elite Command Header */}
        <div className="relative p-1 rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-950 overflow-hidden shadow-3xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] -mr-64 -mt-64" />
            <div className="relative z-10 p-12 bg-slate-950/90 rounded-[2.8rem] backdrop-blur-xl border border-white/5">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                                <Search size={12} className="text-blue-400" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-blue-400 font-mono">Forensic Dossier Node</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Strategic Manifest</span>
                        </div>
                        <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-tight">
                            Mission <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Tactical Brief</span>
                        </h2>
                        <div className="flex items-center gap-12">
                             <div className="space-y-1">
                                 <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Tasks Active</p>
                                 <p className="text-4xl font-black text-white font-mono tracking-tighter">{totalTasks}</p>
                             </div>
                             <div className="h-12 w-px bg-slate-800" />
                             <div className="space-y-1">
                                 <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Execution Rate</p>
                                 <p className="text-4xl font-black text-blue-400 font-mono tracking-tighter">{totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%</p>
                             </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-2xl space-y-8 shadow-2xl">
                         <div className="space-y-4">
                            <div className="relative group">
                                <Lock className="absolute left-6 top-6 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={16} />
                                <input
                                    placeholder="Dossier Reference ID (e.g., CASE_X92_EQUIFAX)"
                                    className="w-full bg-slate-900/50 border border-white/10 pl-16 pr-8 py-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold tracking-tight text-lg"
                                    value={brief.title}
                                    onChange={(e) => setBrief({ ...brief, title: e.target.value })}
                                />
                            </div>
                            <div className="relative group">
                                <Target className="absolute left-6 top-6 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={16} />
                                <textarea
                                    placeholder="Primary Forensic Objective Protocol..."
                                    rows={3}
                                    className="w-full bg-slate-900/50 border border-white/10 pl-16 pr-8 py-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-sm leading-relaxed"
                                    value={brief.objective}
                                    onChange={(e) => setBrief({ ...brief, objective: e.target.value })}
                                />
                            </div>
                         </div>
                         <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={copyBrief}
                                className="flex-grow py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-400 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 transform"
                            >
                                <Copy size={16} />
                                {copyStatus === 'success' ? 'Dossier Exported' : 'Export Mission Manifest'}
                            </button>
                            <button
                                onClick={() => { if(confirm('Purge Dossier Metadata?')) clearBrief(); }}
                                className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95 transform"
                            >
                                <Trash2 size={20} />
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
            {/* Meta Controllers */}
            <div className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-10 space-y-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 font-mono mb-6">Mission Parameters</h3>
                    
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Scale size={14} className="text-blue-400" />
                                Jurisdiction Protocol
                            </label>
                            <select
                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none"
                                value={brief.jurisdiction}
                                onChange={(e) => setBrief({ ...brief, jurisdiction: e.target.value })}
                            >
                                {STATES.map(s => <option key={s} value={s}>{s} Statutes</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-rose-400" />
                                Threat Assessment
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {['critical', 'standard'].map((u) => (
                                    <button
                                        key={u}
                                        onClick={() => setBrief({ ...brief, urgency: u as any })}
                                        className={cn(
                                            "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                            brief.urgency === u 
                                                ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                                                : "bg-slate-950 border-white/5 text-slate-500 hover:border-white/20"
                                        )}
                                    >
                                        {u}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-white/5">
                             <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Execution Readiness</span>
                                <span className="text-xl font-mono text-emerald-400 font-black">{totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%</span>
                             </div>
                             <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${totalTasks > 0 ? (completedTasks/totalTasks)*100 : 0}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                             </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[2.5rem] p-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                        <Zap size={32} className="text-white" />
                    </div>
                    <div>
                        <p className="text-white font-black text-lg">Active Protocol</p>
                        <p className="text-blue-400/60 text-[10px] font-mono font-bold uppercase tracking-widest">Real-time Logic Syncing</p>
                    </div>
                </div>
            </div>

            {/* Task Matrix */}
            <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-8 px-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-4">
                        <span className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        Tactical Execution Nodes
                    </h3>
                    <div className="flex items-center gap-6">
                         <select
                            className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none hover:border-blue-500/50 transition-all cursor-pointer"
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value as any)}
                         >
                            <option value="high">Lvl 3: Critical</option>
                            <option value="medium">Lvl 2: Standard</option>
                            <option value="low">Lvl 1: Observation</option>
                         </select>
                         <input
                            type="date"
                            className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-slate-300 outline-none hover:border-blue-500/50 transition-all cursor-pointer"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                         />
                    </div>
                </div>

                <div className="relative group mb-10">
                    <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                        <Plus size={24} className="text-blue-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Define next execution directive..."
                        className="w-full bg-slate-900/40 border-2 border-slate-800 focus:border-blue-500/50 rounded-[2.5rem] pl-20 pr-40 py-8 text-xl font-bold text-white outline-none transition-all shadow-2xl backdrop-blur-sm"
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button
                        onClick={addTask}
                        className="absolute right-4 top-4 bottom-4 px-10 bg-blue-500 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-400 transition-all flex items-center gap-3 active:scale-95 shadow-lg"
                    >
                        Initialize
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {brief.tasks.map((task, idx) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    "p-8 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden backdrop-blur-md",
                                    task.done 
                                        ? "bg-slate-900/20 border-slate-800/50 opacity-40 grayscale" 
                                        : "bg-gradient-to-br from-slate-900/80 to-slate-950 border-white/5 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5"
                                )}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => removeTask(task.id)}
                                        className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest font-mono border shadow-sm",
                                        task.priority === 'high' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                        task.priority === 'medium' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                        "bg-slate-500/10 text-slate-500 border-slate-800"
                                    )}>
                                        {task.priority === 'high' ? 'PROTOCOL_ALPHA' : 'PROTOCOL_BETA'}
                                    </div>
                                    <div className="h-px flex-grow bg-white/5" />
                                </div>

                                <h4 className={cn(
                                    "text-lg font-bold leading-relaxed mb-10 pr-8",
                                    task.done ? "line-through text-slate-600" : "text-white"
                                )}>
                                    {task.text}
                                </h4>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] font-bold uppercase tracking-[0.1em] px-4 py-2 bg-slate-950/50 rounded-xl border border-white/5">
                                        <Clock size={12} className="text-blue-500/50" /> 
                                        {task.dueDate ? task.dueDate : 'ETA PENDING'}
                                    </div>
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl border-t border-white/10 active:scale-90 transform",
                                            task.done 
                                                ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                                                : "bg-slate-800 text-slate-400 hover:bg-blue-500 hover:text-white hover:shadow-blue-500/20"
                                        )}
                                    >
                                        <CheckCircle2 size={28} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {brief.tasks.length === 0 && (
                        <div className="col-span-2 border-2 border-dashed border-white/5 rounded-[3rem] p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                                <Activity className="text-slate-700" size={32} />
                            </div>
                            <h5 className="text-xl font-black text-slate-600 uppercase tracking-widest font-mono">No Active Nodes</h5>
                            <p className="text-slate-500 text-sm font-medium">Initialize a directive above to begin forensic tracking.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default CaseBriefTab;
