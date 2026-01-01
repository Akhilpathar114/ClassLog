import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subject, AttendanceRecord, WeeklyTimetable, SubMetric } from '../types';
import { calculateMetrics } from '../utils/math';
import { X, Check, ArrowUpRight, GraduationCap, ChevronLeft, ChevronRight, BarChart3, Plus, Ban, Trash2, BookOpen, FlaskConical, Target, StickyNote, PenSquare, Info, ShieldCheck, Trophy } from 'lucide-react';

interface SubjectDetailProps {
  subject: Subject;
  attendanceLog: AttendanceRecord[];
  timetable: WeeklyTimetable;
  onClose: () => void;
  onUpdate: (date: string, status: 'present' | 'absent' | 'cancelled' | 'none', slotId: number | string | undefined, type?: 'Lecture' | 'Lab', conductedBy?: string, note?: string) => void;
}

export const SubjectDetail: React.FC<SubjectDetailProps> = ({ subject, attendanceLog, timetable, onClose, onUpdate }) => {
  const safeLog = attendanceLog || [];
  const metrics = calculateMetrics(safeLog, subject.requiredPercentage);
  
  const [activeTab, setActiveTab] = useState<'intel' | 'calendar'>('intel');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Manual Entry State
  const profs = subject.professors || (subject as any).professor ? [(subject as any).professor] : [];
  const [manualType, setManualType] = useState<'Lecture' | 'Lab'>('Lecture');
  const [manualProf, setManualProf] = useState(profs[0] || '');
  const [manualNote, setManualNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Current record for the selected date
  const selectedRecord = selectedDate ? safeLog.find(r => r.date === selectedDate) : null;

  const { days, firstDay } = { 
      days: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate(),
      firstDay: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() 
  };

  const handleDateClick = (dateStr: string) => {
      setSelectedDate(dateStr);
      const existing = safeLog.find(r => r.date === dateStr);
      
      // If record exists, we show details first (Read mode), else we go to Edit mode
      if (existing) {
          setIsEditing(false);
          setManualType(existing.type || 'Lecture');
          setManualProf(existing.conductedBy || profs[0] || '');
          setManualNote(existing.note || '');
      } else {
          setIsEditing(true);
          setManualType('Lecture');
          setManualProf(profs[0] || '');
          setManualNote('');
      }
  };

  const handleDateUpdate = (status: 'present' | 'absent' | 'cancelled' | 'none') => {
      if (selectedDate) {
          if (status === 'none') {
             // 'none' means delete record
             onUpdate(selectedDate, 'none', 'extra-session', undefined);
          } else {
             // All other statuses including 'cancelled' are saved
             onUpdate(selectedDate, status as any, 'extra-session', manualType, manualProf, manualNote);
          }
          setSelectedDate(null);
      }
  }

  // Generate Forecast Text
  const getForecastText = (metric: SubMetric, typeName: string) => {
      if (metric.conducted === 0) return null;
      
      // Negative buffer means we NEED classes
      if (metric.buffer < 0) {
          const needed = Math.abs(metric.buffer);
          return (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex gap-3 items-start">
                  <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400 shrink-0">
                      <Target className="w-5 h-5" />
                  </div>
                  <div>
                      <div className="font-bold text-rose-700 dark:text-rose-400 text-sm uppercase tracking-wider mb-1">Critical Status</div>
                      <p className="text-rose-900 dark:text-rose-200 text-sm leading-relaxed">
                          You must attend the next <span className="font-black text-lg mx-1">{needed}</span> {typeName}s consecutively to reach the safe zone.
                      </p>
                  </div>
              </div>
          );
      } 
      
      // Positive buffer means we can skip (Golden Hour)
      if (metric.buffer > 0) {
          return (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-500/20 flex gap-3 items-start relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-2xl -mr-8 -mt-8"></div>
                  
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 rounded-lg text-amber-600 dark:text-amber-400 shrink-0 shadow-sm border border-amber-200 dark:border-amber-500/20">
                      <Trophy className="w-5 h-5" />
                  </div>
                  <div className="relative z-10">
                      <div className="font-bold text-amber-800 dark:text-amber-400 text-sm uppercase tracking-wider mb-1">Buffer Unlocked</div>
                      <p className="text-amber-900 dark:text-amber-200 text-sm leading-relaxed">
                          You have earned a safety buffer. You can skip the next <span className="font-black text-lg mx-1">{metric.buffer}</span> {typeName}s without falling below target.
                      </p>
                  </div>
              </div>
          );
      }

      // Buffer 0
      return (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex gap-3 items-start">
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                  <div className="font-bold text-slate-700 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">Zone Defense</div>
                  <p className="text-slate-900 dark:text-slate-200 text-sm leading-relaxed">
                      You are holding the line. Do not miss the next {typeName} to maintain your standing.
                  </p>
              </div>
          </div>
      );
  };

  // Sub-component for a Metric Card
  const StatCard = ({ title, metric, icon: Icon, colorClass, typeName }: { title: string, metric: SubMetric, icon: any, colorClass: string, typeName: string }) => {
     if (metric.conducted === 0) return (
         <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-slate-500 h-full min-h-[200px] shadow-sm">
             <Icon className="w-8 h-8 mb-2 opacity-50" />
             <div className="text-sm font-bold uppercase">No {title} Data</div>
             <div className="text-xs">Classes have not started yet.</div>
         </div>
     );

     const isSafe = metric.status === 'safe';
     const isDanger = metric.status === 'danger';
     
     return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-white/5 relative overflow-hidden flex-1 flex flex-col shadow-sm">
                {/* Background Glow */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-10 ${colorClass.replace('text-', 'bg-')}`}></div>
                
                <div className="flex justify-between items-start mb-6">
                    <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${colorClass}`}>
                        <Icon className="w-5 h-5" /> {title}
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                        {metric.attended} / {metric.conducted}
                    </div>
                </div>

                <div className="mb-6">
                    <div className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {Math.round(metric.percentage)}<span className="text-3xl text-slate-400 dark:text-slate-600">%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.percentage}%` }}
                            className={`h-full ${isSafe ? 'bg-emerald-500' : isDanger ? 'bg-rose-500' : 'bg-amber-500'}`}
                        />
                    </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50">
                        <div className="text-[10px] font-bold uppercase opacity-60 text-slate-500 dark:text-slate-400 mb-1">Margin</div>
                        <div className={`text-xl font-bold ${metric.margin >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-rose-500'}`}>
                            {metric.margin > 0 ? `+${metric.margin}` : metric.margin}
                        </div>
                    </div>
                    {/* Compact Buffer - Detailed version is below */}
                    <div className={`p-3 rounded-2xl border ${metric.buffer >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20'}`}>
                        <div className="text-[10px] font-bold uppercase opacity-60 mb-1 text-slate-600 dark:text-slate-400">Streak Req.</div>
                        <div className={`text-xl font-bold ${metric.buffer >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {metric.buffer >= 0 ? 'None' : `${Math.abs(metric.buffer)}`}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Forecast Banner */}
            {getForecastText(metric, typeName)}
        </div>
     )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 md:p-8"
    >
      <motion.div
        layoutId={`card-${subject.id}`}
        className="w-full max-w-6xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] shadow-2xl overflow-hidden h-[90vh] flex flex-col relative"
      >
        {/* Dynamic Header */}
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
                 {subject.code && <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs border border-slate-200 dark:border-slate-700">{subject.code}</span>}
                 {profs.length > 0 && <span className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider"><GraduationCap className="w-4 h-4" /> {profs.join(', ')}</span>}
            </div>
            <motion.h2 layoutId={`title-${subject.id}`} className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{subject.name}</motion.h2>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur shrink-0">
            {['intel', 'calendar'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-6 text-sm font-bold uppercase tracking-wider transition-all border-b-2 relative overflow-hidden group ${activeTab === tab ? 'border-accent-purple text-accent-purple dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                    <span className="relative z-10">{tab === 'intel' ? 'Performance Analytics' : 'Attendance Log'}</span>
                    {activeTab === tab && <motion.div layoutId="activeTab" className="absolute inset-0 bg-accent-purple/5 dark:bg-white/5" />}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950/30 no-scrollbar relative">
            
            {activeTab === 'intel' && (
                <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                        {/* Lecture Track */}
                        <StatCard 
                            title="Theory Lectures" 
                            metric={metrics.lectures} 
                            icon={BookOpen} 
                            colorClass="text-blue-500 dark:text-blue-400" 
                            typeName="lecture"
                        />
                        
                        {/* Lab Track */}
                        <StatCard 
                            title="Practical Labs" 
                            metric={metrics.labs} 
                            icon={FlaskConical} 
                            colorClass="text-accent-cyan" 
                            typeName="lab"
                        />
                    </div>
                    
                    <div className="mt-8 text-center text-slate-500 text-xs font-mono">
                        Target Requirement: {subject.requiredPercentage}% • Overall Calculated Separately
                    </div>
                </div>
            )}

            {activeTab === 'calendar' && (
                <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
                     <div className="flex justify-between items-center mb-8 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><ChevronLeft className="w-5 h-5" /></button>
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-lg">{currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h4>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><ChevronRight className="w-5 h-5" /></button>
                     </div>
                     
                     <div className="grid grid-cols-7 gap-3 mb-3">
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-xs font-bold text-slate-500 dark:text-slate-600 uppercase">{d}</div>)}
                     </div>
                     <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: days }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12).toISOString().split('T')[0];
                            const records = safeLog.filter(r => r.date === dateStr);
                            
                            const hasLecture = records.some(r => r.type === 'Lecture');
                            const hasLab = records.some(r => r.type === 'Lab');
                            const allPresent = records.every(r => r.status === 'present');
                            const anyAbsent = records.some(r => r.status === 'absent');
                            const isCancelled = records.some(r => r.status === 'cancelled');
                            
                            let colorClass = 'bg-white dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5';
                            
                            if (records.length > 0) {
                                if (isCancelled) colorClass = 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-dashed border-slate-400';
                                else if (anyAbsent) colorClass = 'bg-rose-500 text-white shadow-md shadow-rose-500/20';
                                else if (allPresent) colorClass = 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20';
                            }

                            return (
                                <button 
                                    key={day}
                                    onClick={() => handleDateClick(dateStr)}
                                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-bold transition-all relative overflow-hidden group ${colorClass}`}
                                >
                                    <span className="relative z-10">{day}</span>
                                    {/* Tiny Dots for multiple classes */}
                                    <div className="flex gap-1 mt-1">
                                        {hasLecture && <div className="w-1 h-1 rounded-full bg-blue-300" />}
                                        {hasLab && <div className="w-1 h-1 rounded-full bg-cyan-300" />}
                                    </div>
                                </button>
                            )
                        })}
                     </div>
                     
                     <button 
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            handleDateClick(today);
                        }}
                        className="w-full py-5 mt-8 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-300 font-bold transition-all shadow-sm"
                     >
                        <Plus className="w-5 h-5" /> Add Manual Entry
                     </button>
                </div>
            )}
        </div>

        {/* Improved Manual Entry Modal */}
        <AnimatePresence>
            {selectedDate && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="absolute inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-6"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 30 }}
                        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {isEditing ? 'Log Class' : 'Class Details'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">{new Date(selectedDate).toLocaleDateString(undefined, {month:'long', day:'numeric'})}</p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        
                        {!isEditing && selectedRecord ? (
                            <div className="space-y-6">
                                <div className={`p-6 rounded-2xl flex items-center gap-4 ${
                                    selectedRecord.status === 'present' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                                    selectedRecord.status === 'absent' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                    'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                    {selectedRecord.status === 'present' ? <Check className="w-8 h-8" /> : 
                                     selectedRecord.status === 'absent' ? <X className="w-8 h-8" /> :
                                     <Ban className="w-8 h-8" />}
                                    <div>
                                        <div className="text-xl font-black uppercase tracking-wider">{selectedRecord.status}</div>
                                        <div className="text-sm opacity-80">{selectedRecord.type}</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    {selectedRecord.conductedBy && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                            <GraduationCap className="w-5 h-5 text-slate-400" />
                                            <div className="text-slate-700 dark:text-slate-300 font-medium">{selectedRecord.conductedBy}</div>
                                        </div>
                                    )}
                                    {selectedRecord.note && (
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                            <StickyNote className="w-5 h-5 text-slate-400 mt-0.5" />
                                            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{selectedRecord.note}</div>
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => setIsEditing(true)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700">
                                    <PenSquare className="w-5 h-5" /> Edit Entry
                                </button>
                            </div>
                        ) : (
                            <>
                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setManualType('Lecture')}
                                        className={`p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${manualType === 'Lecture' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}
                                    >
                                        <BookOpen className="w-4 h-4" /> Lecture
                                    </button>
                                    <button 
                                        onClick={() => setManualType('Lab')}
                                        className={`p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${manualType === 'Lab' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-500' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}
                                    >
                                        <FlaskConical className="w-4 h-4" /> Lab
                                    </button>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 mb-1 block">Conducted By</label>
                                    {profs.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {profs.map(p => (
                                                <button 
                                                    key={p} 
                                                    onClick={() => setManualProf(p)}
                                                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${manualProf === p ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            value={manualProf}
                                            onChange={(e) => setManualProf(e.target.value)}
                                            placeholder="Professor Name"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-slate-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 mb-1 block">Note</label>
                                    <div className="relative">
                                        <StickyNote className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <textarea 
                                            value={manualNote}
                                            onChange={(e) => setManualNote(e.target.value)}
                                            placeholder="Optional details..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-slate-500 transition-colors resize-none h-20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button onClick={() => handleDateUpdate('present')} className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 font-bold flex flex-col items-center gap-2 transition-all hover:scale-[1.02]">
                                    <Check className="w-6 h-6" /> Present
                                </button>
                                <button onClick={() => handleDateUpdate('absent')} className="p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 border border-rose-500/20 font-bold flex flex-col items-center gap-2 transition-all hover:scale-[1.02]">
                                    <X className="w-6 h-6" /> Absent
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Clear Button (Trash) -> 'none' (Delete) */}
                                <button onClick={() => handleDateUpdate('none')} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold flex flex-col items-center gap-2 transition-all">
                                    <Trash2 className="w-6 h-6" /> Clear
                                </button>
                                {/* Cancel Class (Ban) -> 'cancelled' (Status) */}
                                <button onClick={() => handleDateUpdate('cancelled')} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold flex flex-col items-center gap-2 transition-all">
                                    <Ban className="w-6 h-6" /> Cancel Class
                                </button>
                            </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
};