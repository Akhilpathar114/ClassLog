import React, { useState } from 'react';
import { Subject, WeeklyTimetable } from '../types';
import { PRESET_COLORS, DEFAULT_MIN_ATTENDANCE } from '../constants';
import { Check, Plus, Trash2, ArrowRight, Zap, GripHorizontal, GraduationCap, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimetableEditor } from './TimetableEditor';

interface OnboardingProps {
  onComplete: (subjects: Subject[], timetable: WeeklyTimetable, minAttendance: number) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [minAttendance, setMinAttendance] = useState(DEFAULT_MIN_ATTENDANCE);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<WeeklyTimetable>({});

  // Form State
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubProf, setNewSubProf] = useState('');
  const [professorsList, setProfessorsList] = useState<string[]>([]);
  const [newSubType, setNewSubType] = useState<'Lecture' | 'Lab'>('Lecture');
  
  const addProfessor = () => {
    if (newSubProf.trim() && !professorsList.includes(newSubProf.trim())) {
      setProfessorsList([...professorsList, newSubProf.trim()]);
      setNewSubProf('');
    }
  };

  const removeProfessor = (prof: string) => {
    setProfessorsList(professorsList.filter(p => p !== prof));
  };

  const addSubject = () => {
    if (!newSubName.trim()) return;
    
    // Auto-add the typed professor if the user forgot to click the plus button
    let finalProfessors = [...professorsList];
    if (newSubProf.trim() && !professorsList.includes(newSubProf.trim())) {
        finalProfessors.push(newSubProf.trim());
    }

    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: newSubName,
      code: newSubCode,
      professors: finalProfessors,
      type: newSubType,
      requiredPercentage: minAttendance,
      color: PRESET_COLORS[subjects.length % PRESET_COLORS.length]
    };
    setSubjects([...subjects, newSubject]);
    
    // Reset form
    setNewSubName('');
    setNewSubCode('');
    setNewSubProf('');
    setProfessorsList([]);
  };

  const nextStep = () => setStep(p => p + 1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent-purple/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-cyan/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

      <div className="max-w-4xl w-full glass-panel rounded-[2rem] p-8 shadow-2xl relative z-10 flex flex-col min-h-[600px] border border-white/10">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-12">
            {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-12 bg-gradient-to-r from-accent-purple to-accent-pink shadow-[0_0_10px_#ec4899]' : 'w-2 bg-slate-800'}`} />
            ))}
        </div>

        <div className="flex-1 flex flex-col">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 text-center my-auto px-4">
            <div>
                <div className="inline-block p-3 rounded-2xl bg-slate-800 mb-4 shadow-lg border border-white/5">
                    <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>
                <h1 className="text-4xl font-black text-white mb-3">Set The Bar</h1>
                <p className="text-slate-400 text-lg max-w-md mx-auto">What's the absolute minimum attendance you need to survive?</p>
            </div>
            
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                  <span className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 tracking-tighter">
                    {minAttendance}<span className="text-5xl text-slate-600">%</span>
                  </span>
              </div>
              
              {/* Custom Heavy Slider */}
              <div className="w-full max-w-md relative h-16 bg-slate-900 rounded-2xl p-2 border border-white/10 shadow-inner">
                 <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    step="5"
                    value={minAttendance} 
                    onChange={(e) => setMinAttendance(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                 />
                 <div className="absolute top-2 bottom-2 left-2 rounded-xl bg-accent-purple pointer-events-none transition-all duration-100 z-10 shadow-[0_0_20px_rgba(168,85,247,0.4)]" style={{ width: `${((minAttendance - 50) / 50) * 96}%` }}>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50">
                        <GripHorizontal className="w-6 h-6" />
                    </div>
                 </div>
                 {/* Ticks */}
                 <div className="absolute inset-0 flex justify-between px-4 items-center pointer-events-none z-0">
                     {[50, 60, 70, 80, 90, 100].map(n => (
                         <div key={n} className="w-px h-3 bg-white/10"></div>
                     ))}
                 </div>
              </div>
              
              <div className="flex justify-between w-full max-w-md text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Living Dangerously</span>
                  <span>Safety Zone</span>
              </div>
            </div>

            <button onClick={nextStep} className="w-full max-w-xs mx-auto py-4 bg-white text-black hover:scale-105 active:scale-95 transition-all rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Confirm {minAttendance}%
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 flex-1 flex flex-col">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Your Arsenal</h1>
                <p className="text-slate-400">Add your courses. Details matter.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] p-2">
              <AnimatePresence>
              {subjects.map(sub => (
                <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    key={sub.id} 
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full shadow-[0_0_15px_currentColor] ${sub.color.replace('bg-', 'bg-')} flex items-center justify-center text-white font-bold text-xs`}>
                        {sub.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-lg text-slate-100 flex items-center gap-2">
                            {sub.name} 
                            {sub.code && <span className="text-xs font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{sub.code}</span>}
                        </div>
                        <div className="text-xs text-slate-400">
                             {sub.professors?.length ? sub.professors.join(', ') : 'No Professor'} • {sub.type}
                        </div>
                    </div>
                  </div>
                  <button onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="p-3 bg-slate-900 rounded-xl text-slate-500 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
              </AnimatePresence>
              {subjects.length === 0 && (
                  <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 font-bold">
                      No subjects added yet
                  </div>
              )}
            </div>

            <div className="bg-slate-950/50 p-6 rounded-3xl space-y-4 border border-white/5 shadow-inner">
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 block">Subject Name</label>
                        <input 
                            value={newSubName}
                            onChange={e => setNewSubName(e.target.value)}
                            placeholder="e.g. Data Structures"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-purple transition-colors placeholder:text-slate-600 font-bold"
                        />
                    </div>
                     <div className="col-span-2 md:col-span-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 block">Subject Code</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input 
                                value={newSubCode}
                                onChange={e => setNewSubCode(e.target.value)}
                                placeholder="CS101"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accent-purple transition-colors placeholder:text-slate-600 font-mono text-sm"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 md:col-span-1">
                         <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 block">Professor Names</label>
                         <div className="relative flex gap-2">
                            <div className="relative flex-1">
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input 
                                    value={newSubProf}
                                    onChange={e => setNewSubProf(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addProfessor()}
                                    placeholder="Add Prof & Enter"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accent-purple transition-colors placeholder:text-slate-600 text-sm"
                                />
                            </div>
                            <button onClick={addProfessor} disabled={!newSubProf} className="px-4 bg-slate-800 rounded-xl border border-slate-700 text-slate-300 hover:text-white disabled:opacity-50">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        {professorsList.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {professorsList.map(prof => (
                                    <span key={prof} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                                        {prof}
                                        <button onClick={() => removeProfessor(prof)} className="hover:text-rose-400"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                     <div className="col-span-2 md:col-span-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 block">Primary Type</label>
                        <select 
                            value={newSubType}
                            onChange={e => setNewSubType(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-purple font-bold"
                        >
                            <option value="Lecture">Lecture</option>
                            <option value="Lab">Lab</option>
                        </select>
                    </div>
                </div>

                <button onClick={addSubject} disabled={!newSubName} className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-accent-purple font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all border border-slate-700 mt-2">
                    <Plus className="w-5 h-5" /> Add to Arsenal
                </button>
            </div>

            <button onClick={nextStep} disabled={subjects.length === 0} className="w-full py-4 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold rounded-2xl shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale">
              Build Timetable
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full overflow-hidden">
            <TimetableEditor 
                subjects={subjects} 
                initialTimetable={{}} 
                onSave={(tt) => {
                    setTimetable(tt);
                    nextStep();
                }}
            />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 text-center my-auto">
            <div className="relative inline-block">
                <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse"></div>
                <Zap className="w-24 h-24 text-emerald-400 relative z-10 mx-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
            </div>
            
            <div>
              <h1 className="text-5xl font-black text-white mb-4">System Online</h1>
              <p className="text-slate-400 text-lg max-w-md mx-auto">
                Your orbital dashboard is ready. <br/> 
                <span className="text-emerald-400 font-bold">Green</span> means chill. <span className="text-rose-400 font-bold">Red</span> means run.
              </p>
            </div>
            
            <button onClick={() => onComplete(subjects, timetable, minAttendance)} className="w-full max-w-xs mx-auto py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-105">
              Launch Orbit <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
};