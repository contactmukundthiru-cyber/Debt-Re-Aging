import React from 'react';
import { generateStateGuidance, getStateLaws } from '../../../lib/state-laws';
import { CreditFields } from '../../../lib/rules';
import { 
  Shield, 
  Gavel, 
  Scale, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Link2, 
  CheckCircle2, 
  Activity,
  Zap,
  Boxes,
  MapPin,
  FileSearch,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface LegalShieldTabProps {
  editableFields: Partial<CreditFields>;
}

const LegalShieldTab: React.FC<LegalShieldTabProps> = ({ editableFields }) => {
  if (!editableFields.stateCode) {
    return (
        <div className="fade-in">
            <div className="relative p-1 rounded-[4rem] bg-gradient-to-br from-violet-600/20 to-slate-900 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xl" />
                <div className="relative z-10 p-32 flex flex-col items-center justify-center text-center gap-10">
                    <div className="w-32 h-32 rounded-[3.5rem] bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 shadow-2xl animate-pulse">
                        <MapPin size={56} />
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic font-mono mb-4">Jurisdiction::MISSING</h3>
                        <p className="text-lg text-slate-500 max-w-lg mx-auto font-bold italic border-l-2 border-violet-500/30 pl-8">State residence is <span className="text-violet-400 font-black">REQUIRED</span> to initialize local jurisdictional defense protocols.</p>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  const guidance = generateStateGuidance(
    editableFields.stateCode,
    editableFields.dateLastPayment,
    editableFields.accountType,
    editableFields.currentValue
  );
  const stateInfo = getStateLaws(editableFields.stateCode);

  return (
    <div className="fade-in space-y-20 pb-40">
        {/* ELITE_AUDIT_HERO::JURISDICTIONAL_SHIELD */}
        <section className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                
                <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                    <div className="lg:col-span-8">
                         <div className="flex items-center gap-6 mb-8">
                            <div className="px-5 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center gap-3">
                                <Shield size={14} className="text-violet-400 animate-pulse" />
                                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-violet-400 font-mono">Jurisdiction Core v5.0</span>
                            </div>
                            <div className="h-px w-10 bg-slate-800" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Shield_Status::ACTIVE</span>
                        </div>

                        <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                            Jurisdictional <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-500 to-fuchsia-500 tracking-[-0.05em]">SHIELDS</span>
                        </h2>

                        <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight max-w-2xl border-l-2 border-violet-500/30 pl-12 mb-12">
                            Deploying <span className="text-white font-black">{stateInfo.name}</span> consumer defenses. Local statutes frequently override federal minimums, providing advanced liability protection protocols.
                        </p>

                        <div className="flex flex-wrap items-center gap-12 sm:gap-20 pt-10 border-t border-white/5">
                             <div className="space-y-2">
                                 <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono italic">Local_SOL_Limit</p>
                                 <p className="text-5xl font-black text-white font-mono tracking-tighter italic">{stateInfo.sol.writtenContracts}Y</p>
                             </div>
                             <div className="space-y-2">
                                 <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono italic">Interest_Cap</p>
                                 <p className="text-5xl font-black text-violet-500 font-mono tracking-tighter italic">{stateInfo.interestCaps.consumer}%</p>
                             </div>
                             <div className="px-10 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic text-white flex items-center gap-4">
                                <Scale size={18} className="text-violet-400" />
                                Jurisdiction_Code::[ {editableFields.stateCode} ]
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 self-stretch flex items-center justify-center">
                         <div className="aspect-square w-full max-w-[320px] rounded-[5rem] bg-gradient-to-br from-violet-600 to-indigo-700 p-1 shadow-4xl relative group/state overflow-hidden">
                            <div className="absolute inset-0 bg-black/20 group-hover/state:scale-110 transition-transform duration-1000" />
                            <div className="relative h-full w-full bg-slate-950 rounded-[4.8rem] flex flex-col items-center justify-center border border-white/10">
                                <span className="text-[160px] font-black text-white font-mono tracking-tighter leading-none group-hover/state:scale-110 transition-transform duration-700">
                                    {editableFields.stateCode}
                                </span>
                                <div className="absolute bottom-12 left-0 w-full text-center">
                                     <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.6em] font-mono italic">{stateInfo.name}_Node</span>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </section>

        <div className="grid lg:grid-cols-12 gap-20">
            {/* Primary Defense Matrix */}
            <div className="lg:col-span-8 space-y-12">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* SOL Stack */}
                    <div className="group/sol p-12 rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 hover:border-violet-500/30 transition-all shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-[2.5] text-white rotate-12 group-hover/sol:rotate-0 transition-transform duration-1000">
                             <Clock size={100} />
                         </div>
                         <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[2rem] bg-violet-600/10 flex items-center justify-center text-violet-500 border border-violet-500/20 shadow-2xl">
                                    <Clock size={28} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest font-mono italic">Time_Protocol</span>
                                    <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter font-mono">Statute_Limits</h4>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-white/5 flex items-center justify-between group/val">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic mb-1">Status_Vector</p>
                                        <p className={cn(
                                            "text-2xl font-black uppercase font-mono tracking-tighter italic",
                                            guidance.solStatus === 'expired' ? "text-emerald-500" :
                                            guidance.solStatus === 'expiring' ? "text-amber-500 animate-pulse" : "text-rose-500"
                                        )}>
                                            {guidance.solStatus}
                                        </p>
                                    </div>
                                    {guidance.solStatus === 'expired' && <CheckCircle2 size={24} className="text-emerald-500" />}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-white/5 text-center">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic mb-2">Expiry_Node</p>
                                        <p className="text-xl font-black text-white font-mono italic">{guidance.solExpiry || 'N/A'}</p>
                                    </div>
                                    <div className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-white/5 text-center">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic mb-2">Cycle_Duration</p>
                                        <p className="text-xl font-black text-white font-mono italic">{stateInfo.sol.writtenContracts}Y</p>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>

                    {/* Interest Stack */}
                    <div className="group/interest p-12 rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 hover:border-fuchsia-500/30 transition-all shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-[2.5] text-white -rotate-12 group-hover/interest:rotate-0 transition-transform duration-1000">
                             <TrendingUp size={100} />
                         </div>
                         <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[2rem] bg-fuchsia-600/10 flex items-center justify-center text-fuchsia-500 border border-fuchsia-500/20 shadow-2xl">
                                    <TrendingUp size={28} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest font-mono italic">Rate_Control</span>
                                    <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter font-mono">Interest_Caps</h4>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                {[
                                    { label: 'Judgment_Max', value: stateInfo.interestCaps.judgments },
                                    { label: 'Medical_Max', value: stateInfo.interestCaps.medical },
                                    { label: 'Consumer_Max', value: stateInfo.interestCaps.consumer }
                                ].map((cap, i) => (
                                    <div key={i} className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-white/5 flex items-center justify-between group/rate transition-colors hover:bg-slate-900/80">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">{cap.label}</p>
                                            <p className="text-3xl font-black text-white font-mono tracking-tighter italic leading-none mt-2">{cap.value}%</p>
                                        </div>
                                        <TrendingUp size={20} className="text-slate-800 group-hover/rate:text-fuchsia-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>
                </div>

                {/* Local Protection Matrix List */}
                <div className="p-16 rounded-[4.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl relative overflow-hidden group/protections">
                     <div className="absolute top-0 right-0 p-16 opacity-[0.02] scale-[2.5] rotate-12 group-hover/protections:rotate-0 transition-transform duration-1000 grayscale pointer-events-none select-none">
                         <Boxes size={200} className="text-white" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-8 mb-16">
                            <div className="w-16 h-16 rounded-[2rem] bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl">
                                <Shield size={28} />
                            </div>
                            <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic font-mono">Defense_Protocols</h4>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                            {guidance.protections.map((p, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-10 rounded-[3rem] bg-white/2 border border-white/5 flex items-start gap-8 group/p transition-colors hover:bg-white/5"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0 group-hover/p:bg-emerald-500 group-hover/p:text-white transition-all">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <p className="text-xl text-slate-400 font-bold italic leading-relaxed group-hover:text-white transition-colors">
                                        {p}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Intel */}
            <div className="lg:col-span-4 space-y-12">
                 {/* STRATEGIC_RECOMMENDATIONS */}
                 <div className="p-12 rounded-[4.5rem] bg-gradient-to-br from-violet-600/10 to-transparent border border-white/10 shadow-3xl relative overflow-hidden group/intel">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover/intel:scale-110 transition-transform duration-700">
                         <Zap size={100} className="text-violet-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-14 h-14 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-500 border border-violet-500/20 shadow-2xl">
                                <Activity size={24} className="animate-pulse" />
                            </div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic font-mono">Strategy_Lock</h4>
                        </div>

                        <div className="space-y-6">
                            {guidance.recommendations.map((r, i) => (
                                <div key={i} className="p-8 rounded-[2.5rem] bg-slate-950/80 border border-white/5 relative group/rec transition-all hover:translate-x-2">
                                    <div className="absolute left-0 top-0 w-1.5 h-full bg-violet-600 rounded-full" />
                                    <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest font-mono mb-2 italic">Protocol_0{i+1}</p>
                                    <p className="text-lg text-slate-300 font-bold italic leading-tight group-hover/rec:text-white transition-colors">{r}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>

                 {/* LEGAL_RESOURCES */}
                 <div className="p-12 rounded-[4.5rem] bg-slate-950/40 border border-white/5 shadow-2xl relative overflow-hidden group/resources">
                    <div className="relative z-10 flex flex-col h-full">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono mb-12 italic">Jurisdictional_Reference</h4>
                        <div className="space-y-6 flex-grow">
                            {guidance.legalResources.map((r, i) => (
                                <button key={i} className="w-full flex items-center justify-between p-8 rounded-[2rem] bg-slate-950/80 border border-white/5 hover:border-violet-500/50 transition-all group/res text-left">
                                    <span className="text-lg text-slate-400 font-black italic uppercase tracking-tighter group-hover/res:text-white transition-colors">{r}</span>
                                    <ChevronRight size={18} className="text-slate-800 group-hover/res:translate-x-2 transition-transform" />
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-20 pt-10 border-t border-white/5 space-y-8">
                             <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic mb-6">Key_Statutes</h5>
                             <div className="flex flex-wrap gap-4">
                                {stateInfo.keyStatutes.map((s, i) => (
                                    <span key={i} className="px-5 py-2 rounded-xl bg-slate-900 border border-white/5 text-[9px] font-black font-mono text-slate-500 uppercase tracking-widest group-hover:border-violet-500/30 transition-all">
                                        {s}
                                    </span>
                                ))}
                             </div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default LegalShieldTab;
