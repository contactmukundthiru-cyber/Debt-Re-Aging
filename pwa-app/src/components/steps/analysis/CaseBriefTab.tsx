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
    <div className="space-y-16 pb-32">
      {/* ELITE_BRIEF_HERO::PROTOCOL_ZENITH */}
      <section className="relative rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-4xl group">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[160px] -mr-96 -mt-96 group-hover:bg-indigo-400/20 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] -ml-40 -mb-40" />

        <div className="relative z-10 p-12 xl:p-20">
          <div className="flex flex-col xl:flex-row items-center gap-20">
            <div className="flex-1 space-y-10">
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[FileText, Target, Shield].map((Icon, i) => (
                    <div key={i} className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-950 flex items-center justify-center text-blue-400 shadow-2xl relative" style={{ zIndex: 3 - i }}>
                      <Icon size={24} />
                    </div>
                  ))}
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-blue-500 font-mono italic animate-pulse">
                  System_Status::STRATEGIC_BRIEFING_ACTIVE
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="text-7xl xl:text-8xl font-black text-white tracking-tighter leading-none font-mono italic">
                  STRATEGIC_<span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-cyan-400">BRIEF</span>
                </h1>
                <p className="text-3xl text-slate-500 font-medium italic max-w-3xl leading-relaxed">
                  Consolidating mission-critical intelligence into a weaponized dossier. Execute final mandate protocols.
                </p>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <button 
                  onClick={copyBrief}
                  className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-6 transition-all shadow-4xl hover:scale-105 group/btn"
                >
                  <span>{copyStatus === 'success' ? 'DOSSIER_COPIED' : 'COPY_CASE_MANIFEST'}</span>
                  <Copy size={20} className="group-hover/btn:rotate-12 transition-transform" />
                </button>
                <div 
                   onClick={() => { if(confirm('Purge Dossier Metadata?')) clearBrief(); }}
                   className="p-5 bg-white/5 border border-white/10 rounded-[2rem] text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                   <Trash2 size={24} />
                </div>
              </div>
            </div>

            {/* PERFORMANCE_TELEMETRY */}
            <div className="w-full xl:w-[500px] grid grid-cols-2 gap-8 ring-1 ring-white/5 p-8 rounded-[3.5rem] bg-black/40 backdrop-blur-2xl shadow-inner">
               <div className="col-span-2 p-10 bg-slate-900/50 rounded-[3rem] border border-white/5 relative overflow-hidden group/readiness">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/readiness:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] font-mono italic">Execution_Velocity</span>
                    <Zap className="text-blue-400 animate-bounce" size={20} />
                  </div>
                  <div className="flex items-baseline gap-4 mb-4 relative z-10">
                    <span className="text-8xl font-black text-white tracking-tighter font-mono">{totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%</span>
                  </div>
                  <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${totalTasks > 0 ? (completedTasks/totalTasks)*100 : 0}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    />
                  </div>
               </div>

               <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Directive_Nodes</span>
                  <div className="flex items-center gap-4">
                     <span className="text-4xl font-black text-white font-mono tracking-tighter leading-none">{completedTasks}/{totalTasks}</span>
                     <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-2xl">
                        <Activity size={16} />
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Mission_Status</span>
                  <div className="flex items-center gap-4">
                     <span className="text-4xl font-black text-emerald-500 font-mono tracking-tighter leading-none uppercase">{completedTasks === totalTasks && totalTasks > 0 ? 'READY' : 'ACTIVE'}</span>
                     <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-2xl">
                        <CheckCircle2 size={16} />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid xl:grid-cols-12 gap-16">
        {/* SECTION::INTELLIGENCE_INPUT */}
        <div className="xl:col-span-4 space-y-12">
          <div className="space-y-4 px-4">
            <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Mission_Core</h4>
            <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Parameters_And_Objectives</p>
          </div>

          <div className="sticky top-12 space-y-10">
            <div className="p-12 rounded-[4rem] bg-slate-950 border border-white/10 shadow-4xl space-y-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] scale-[2] pointer-events-none">
                 <Shield size={120} />
              </div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic ml-6">Archive_Identity</label>
                   <div className="relative group">
                      <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input 
                        value={brief.title}
                        onChange={(e) => setBrief({ ...brief, title: e.target.value })}
                        placeholder="ENTER_AUTO_ID..."
                        className="w-full bg-black/60 border border-white/5 rounded-[2rem] pl-20 pr-10 py-6 text-white text-lg font-mono italic focus:outline-none focus:border-blue-500/30 transition-all shadow-inner placeholder:text-slate-800"
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic ml-6">Strategic_Mandate</label>
                   <textarea 
                    value={brief.objective}
                    onChange={(e) => setBrief({ ...brief, objective: e.target.value })}
                    placeholder="DEFINE_MISSION_OBJECTIVES..."
                    rows={3}
                    className="w-full bg-black/60 border border-white/5 rounded-[2.5rem] p-10 text-white text-lg font-mono italic focus:outline-none focus:border-blue-500/30 transition-all shadow-inner placeholder:text-slate-800 resize-none"
                   />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic ml-6">Jurisdiction</label>
                      <select 
                        value={brief.jurisdiction}
                        onChange={(e) => setBrief({ ...brief, jurisdiction: e.target.value })}
                        className="w-full bg-black/60 border border-white/5 rounded-[2rem] px-8 py-5 text-white font-mono text-sm focus:outline-none focus:border-blue-500/30 appearance-none shadow-inner"
                      >
                         {STATES.map(s => <option key={s} value={s}>{s}_STATUTORY</option>)}
                      </select>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic ml-6">Priority_Tier</label>
                      <div className="flex gap-2 p-1 bg-black/60 rounded-[2rem] border border-white/5">
                         {['critical', 'standard'].map((u) => (
                           <button
                            key={u}
                            onClick={() => setBrief({ ...brief, urgency: u as any })}
                            className={cn(
                              "flex-1 py-4 px-2 rounded-[1.5rem] font-mono text-[10px] uppercase font-black tracking-widest transition-all",
                              brief.urgency === u ? "bg-blue-600 text-white shadow-2xl" : "text-slate-600 hover:text-slate-400"
                            )}
                           >
                            {u}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[3rem] space-y-4">
                 <div className="flex items-center gap-4">
                    <Zap className="text-blue-500" size={20} />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest font-mono italic">Tactical_Advantage</span>
                 </div>
                 <p className="text-xs text-slate-400 font-mono italic leading-relaxed">
                    Detected high-variance reporting nodes. Focus on furnishers with temporal drift &gt; 30 days for maximum removal delta.
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION::EXECUTION_MATRIX */}
        <div className="xl:col-span-8 space-y-12">
          <div className="flex items-center justify-between px-8">
            <div className="space-y-4">
              <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Execution_Matrix</h4>
              <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Directive_Queue_Management</p>
            </div>
          </div>

          <div className="space-y-12">
            <div className="relative group">
              <Plus className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-blue-500 transition-colors" size={24} />
              <input 
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="EXECUTE_NEW_DIRECTIVE..."
                className="w-full bg-slate-950/40 border border-white/5 rounded-[2.5rem] pl-20 pr-48 py-8 text-2xl font-mono italic text-white focus:outline-none focus:border-blue-500/30 transition-all shadow-4xl placeholder:text-slate-800"
              />
              <button 
                onClick={addTask}
                className="absolute right-4 top-4 bottom-4 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all shadow-2xl group/add"
              >
                <span>EXECUTE</span>
                <ChevronRight size={18} className="group-hover/add:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {brief.tasks.length > 0 ? (
                  brief.tasks.map((task, i) => (
                    <motion.div 
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }}
                      className={cn(
                        "rounded-[3.5rem] p-10 border overflow-hidden shadow-4xl group/task relative flex flex-col min-h-[240px]",
                        task.done 
                          ? "bg-slate-900/20 border-white/5 opacity-50 grayscale" 
                          : "bg-slate-950/60 border-white/10 hover:border-blue-500/30 transition-all duration-500"
                      )}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className={cn(
                          "px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest font-mono italic",
                          task.priority === 'high' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                          task.priority === 'medium' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-slate-800/10 text-slate-500 border-white/5"
                        )}>
                           Priority::{task.priority === 'high' ? 'ALPHA' : task.priority === 'medium' ? 'BETA' : 'GAMMA'}
                        </div>
                        <button 
                          onClick={() => removeTask(task.id)}
                          className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-slate-700 hover:text-rose-500 hover:border-rose-500/30 transition-all opacity-0 group-hover/task:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <p className={cn(
                        "text-2xl font-black italic tracking-tighter leading-relaxed mb-8 font-mono",
                        task.done ? "line-through text-slate-700" : "text-white"
                      )}>
                        {task.text}
                      </p>

                      <div className="mt-auto flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Clock size={18} className="text-slate-700" />
                            <span className="text-xs font-black font-mono text-slate-500 tracking-widest uppercase">Target_ETA::{task.dueDate || 'NODE_NULL'}</span>
                         </div>
                         <button 
                           onClick={() => toggleTask(task.id)}
                           className={cn(
                             "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all shadow-2xl",
                             task.done 
                               ? "bg-emerald-500 border-emerald-400 text-white" 
                               : "bg-slate-900 border-white/10 text-slate-700 hover:text-white hover:border-blue-500/50 hover:bg-blue-600/10"
                           )}
                         >
                            <CheckCircle2 size={24} strokeWidth={3} />
                         </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="md:col-span-2 rounded-[4rem] p-32 text-center bg-slate-950/40 border-2 border-dashed border-white/5">
                    <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-slate-700 shadow-inner">
                      <Target size={40} />
                    </div>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter font-mono uppercase mb-4">No_Active_Directives</h3>
                    <p className="text-xl text-slate-500 font-medium italic max-w-sm mx-auto">Execution queue is currently offline. Define new vectors to begin stratigraphic mapping.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseBriefTab;
