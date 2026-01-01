import React, { useState, useMemo } from 'react';
import { Subject, WeeklyTimetable, AttendanceRecord, TIME_SLOTS } from '../types';
import { Check, X, Clock, CalendarDays, FlaskConical, GraduationCap, StickyNote, ChevronRight, Ban, ArrowRight, Umbrella, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TodaysScheduleProps {
  subjects: Subject[];
  timetable: WeeklyTimetable;
  attendanceLog: Record<string, AttendanceRecord[]>;
  onUpdate: (subjectId: string, date: string, status: 'present' | 'absent' | 'cancelled' | 'none', slotId?: number | string, type?: 'Lecture' | 'Lab', conductedBy?: string, note?: string) => void;
}

interface ModalState {
  subjectId: string;
  subjectName: string;
  professors: string[];
  slotIds: number[];
  type: 'Lecture' | 'Lab';
  action: 'present' | 'absent' | 'cancelled';
  currentProf: string;
  currentNote: string;
}

export const TodaysSchedule: React.FC<TodaysScheduleProps> = ({ subjects, timetable, attendanceLog, onUpdate }) => {
  const [modalState, setModalState] = useState<ModalState | null>(null);
  
  const [profOverride, setProfOverride] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const today = new Date();
  const todayIndex = today.getDay(); // 0 = Sun
  const dateStr = today.toISOString().split('T')[0];
  const dateDisplay = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const groupedClasses = useMemo(() => {
    const todaySlots = timetable[todayIndex] || {};
    
    // Map raw slots
    const rawClasses = Object.entries(todaySlots)
      .map(([slotIdStr, subjectId]) => {
        const slotId = parseInt(slotIdStr);
        const slot = TIME_SLOTS.find(s => s.id === slotId); 
        const subject = subjects.find(s => s.id === subjectId);
        if (!slot || !subject) return null;
        
        const log = attendanceLog[subject.id]?.find(r => r.date === dateStr && r.slotId === slotId); 
        
        return { slot, subject, status: log?.status, slotId, log };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => (a.slot.id as number) - (b.slot.id as number));

    // Group Consecutive Same-Subjects
    const groups: any[] = [];
    
    for (let i = 0; i < rawClasses.length; i++) {
      const current = rawClasses[i];
      const next = rawClasses[i + 1];

      if (next && current.subject.id === next.subject.id && (next.slotId === (current.slotId as number) + 1)) {
          groups.push({
              type: 'Lab',
              slots: [current, next],
              subject: current.subject,
              startTime: current.slot.label,
              endTime: next.slot.end,
              status: current.status, 
              logs: [current.log, next.log].filter(Boolean)
          });
          i++; 
      } else {
          groups.push({
              type: 'Lecture',
              slots: [current],
              subject: current.subject,
              startTime: current.slot.label,
              endTime: current.slot.end,
              status: current.status,
              logs: [current.log].filter(Boolean)
          });
      }
    }
    return groups;
  }, [subjects, timetable, attendanceLog, todayIndex, dateStr]);

  const handleOpenModal = (group: any, action: 'present' | 'absent' | 'cancelled') => {
      const subjectProfs = group.subject.professors || 
                           ((group.subject as any).professor ? [(group.subject as any).professor] : []);
      
      const existingLog = group.logs?.[0];

      setProfOverride(existingLog?.conductedBy || subjectProfs[0] || '');
      setNote(existingLog?.note || '');

      setModalState({
          subjectId: group.subject.id,
          subjectName: group.subject.name,
          professors: subjectProfs,
          slotIds: group.slots.map((s: any) => s.slotId),
          type: group.type,
          action: action,
          currentProf: existingLog?.conductedBy || '',
          currentNote: existingLog?.note || ''
      });
  };

  const handleConfirm = () => {
      if (!modalState) return;

      modalState.slotIds.forEach(slotId => {
          onUpdate(
              modalState.subjectId, 
              dateStr, 
              modalState.action, 
              slotId, 
              modalState.type, 
              profOverride, 
              note
          );
      });
      setModalState(null);
  };

  const handleQuickCancel = (group: any) => {
    group.slots.forEach((item: any) => {
        onUpdate(item.subject.id, dateStr, 'none', item.slotId, group.type);
    });
  };

  const handleHolidayMode = () => {
    if(groupedClasses.length === 0) return;
    if(window.confirm("Mark all classes today as 'Cancelled' due to Holiday?")) {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Haptic pattern
        groupedClasses.forEach(group => {
            group.slots.forEach((item: any) => {
                onUpdate(item.subject.id, dateStr, 'cancelled', item.slotId, group.type, undefined, "Holiday");
            });
        });
    }
  };

  return (
    <div className="mb-10 relative z-10">
      <div className="flex items-end justify-between mb-6 px-1">
          <div>
            <div className="text-xs font-bold text-accent-purple tracking-widest uppercase mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-purple animate-pulse"></span>
                Today's Mission
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                {dateDisplay}
            </h2>
          </div>
          
          {/* Holiday Button */}
          {groupedClasses.length > 0 && (
              <button 
                onClick={handleHolidayMode}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors border border-transparent hover:border-accent-cyan/20"
                title="Mark as Holiday"
              >
                  <Umbrella className="w-6 h-6" />
              </button>
          )}
      </div>

      {groupedClasses.length === 0 ? (
        <div className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 text-center relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
            {/* Ambient Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 opacity-50 animate-pulse-slow" />
            
            <div className="relative z-10 flex flex-col items-center py-4">
                <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800/80 mb-6 flex items-center justify-center shadow-inner border border-slate-100 dark:border-white/5 relative">
                     <div className="absolute inset-0 rounded-full border border-dashed border-slate-300 dark:border-slate-600 animate-spin-slow" style={{ animationDuration: '10s' }}></div>
                    <Coffee className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Orbit Stabilized</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
                    Thrusters offline. No classes detected on sensors. <br/> 
                    <span className="text-accent-purple font-bold">Enjoy the void.</span>
                </p>
            </div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-8 pt-2 no-scrollbar snap-x px-1">
            {groupedClasses.map((group, idx) => (
            <motion.div 
                key={`${group.subject.id}-${idx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="snap-center shrink-0 w-[85vw] sm:w-96 p-6 rounded-[2rem] bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:border-accent-purple/30 dark:hover:border-white/20 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none"
            >
                {/* Subject Color Bar */}
                <div className={`absolute top-0 left-0 w-2 h-full ${group.subject.color}`}></div>
                
                {/* Status Overlay */}
                {group.status && group.status !== 'none' && (
                <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/90 z-20 flex flex-col items-center justify-center backdrop-blur-[2px]">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-4xl font-black mb-3 uppercase tracking-tighter ${
                        group.status === 'present' ? 'text-emerald-500 dark:text-emerald-400' : 
                        group.status === 'absent' ? 'text-rose-500 dark:text-rose-400' : 
                        group.status === 'cancelled' ? 'text-slate-500 dark:text-slate-400' : 
                        'text-slate-400'
                        }`}
                    >
                        {group.status === 'cancelled' ? 'Cancelled' : group.status}
                    </motion.div>
                    
                    {/* Log Details Preview */}
                    <div className="flex flex-col items-center gap-2 mb-6">
                        {group.status === 'present' && group.logs?.[0]?.conductedBy && (
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                            <GraduationCap className="w-3.5 h-3.5" /> {group.logs[0].conductedBy}
                            </div>
                        )}
                         {group.logs?.[0]?.note && (
                            <div className="text-xs text-slate-500 italic max-w-[200px] text-center line-clamp-2">
                                "{group.logs[0].note}"
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => handleQuickCancel(group)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-800 dark:hover:text-white border-b border-slate-300 dark:border-slate-700 hover:border-slate-800 dark:hover:border-white transition-colors pb-0.5"
                    >
                        Undo Entry
                    </button>
                </div>
                )}

                {/* Card Content */}
                <div className="flex justify-between items-start mb-6 pl-2">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-white/5 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> {group.startTime}
                            </span>
                            {group.type === 'Lab' && (
                                <span className="text-[10px] font-bold text-accent-cyan bg-accent-cyan/10 px-2 py-1 rounded border border-accent-cyan/20 flex items-center gap-1">
                                    <FlaskConical className="w-3 h-3" /> LAB
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mb-1 truncate max-w-[240px]">{group.subject.name}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{group.type === 'Lab' ? 'Practical Session' : 'Theory Lecture'}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pl-2">
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleOpenModal(group, 'present')}
                            className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                        >
                            <Check className="w-5 h-5" strokeWidth={3} /> In
                        </button>
                        <button 
                            onClick={() => handleOpenModal(group, 'absent')}
                            className="flex-1 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <X className="w-5 h-5" strokeWidth={3} /> Skip
                        </button>
                    </div>
                    
                    {/* Cancel Class Button */}
                    <button 
                        onClick={() => handleOpenModal(group, 'cancelled')}
                        className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                        <Ban className="w-3.5 h-3.5" /> Cancel Class
                    </button>
                </div>
            </motion.div>
            ))}
        </div>
      )}

      {/* FIXED MODAL IMPLEMENTATION */}
      <AnimatePresence>
        {modalState && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
                    onClick={() => setModalState(null)}
                />
                
                {/* Modal Content */}
                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative z-10 flex flex-col pointer-events-auto max-h-[85vh] sm:mb-8"
                >
                    {/* Header Pinned */}
                    <div className="pt-6 px-6 sm:px-8 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-white/5 shrink-0">
                         <div>
                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                                modalState.action === 'present' ? 'text-emerald-500' : 
                                modalState.action === 'absent' ? 'text-rose-500' : 'text-slate-500'
                            }`}>
                                {modalState.action === 'present' && <Check className="w-4 h-4" />}
                                {modalState.action === 'absent' && <X className="w-4 h-4" />}
                                {modalState.action === 'cancelled' && <Ban className="w-4 h-4" />}
                                Marking {modalState.action}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight truncate max-w-[250px]">{modalState.subjectName}</h3>
                        </div>
                        <button 
                            onClick={() => setModalState(null)} 
                            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                        {/* Prof Selection - ONLY FOR PRESENT */}
                        {modalState.action === 'present' && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-3 block flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" /> Conducted By
                                </label>
                                
                                {modalState.professors.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {modalState.professors.map((prof: string) => (
                                            <button
                                                key={prof}
                                                onClick={() => setProfOverride(prof)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${profOverride === prof ? 'bg-accent-purple text-white border-accent-purple shadow-lg shadow-purple-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-accent-purple/50'}`}
                                            >
                                                {prof}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                <input 
                                    placeholder="Or type professor name..."
                                    value={profOverride}
                                    onChange={(e) => setProfOverride(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple outline-none text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                                />
                            </div>
                        )}

                        {/* Note - ALWAYS VISIBLE */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-white/5">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-3 block flex items-center gap-1">
                                <StickyNote className="w-3 h-3" /> Session Note
                            </label>
                            <textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={
                                    modalState.action === 'cancelled' ? "Reason for cancellation..." :
                                    modalState.action === 'absent' ? "Reason for missing class..." :
                                    "Topics covered, assignments due..."
                                }
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white focus:border-accent-purple focus:ring-1 focus:ring-accent-purple outline-none resize-none h-24 placeholder:text-slate-400 transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer Pinned - ensures button is always visible */}
                    <div className="p-6 sm:p-8 pt-4 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0 pb-10">
                        <button 
                            onClick={handleConfirm}
                            className={`w-full py-5 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 shadow-xl transition-transform active:scale-[0.98] ${
                                modalState.action === 'present' 
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-emerald-500/30' 
                                : modalState.action === 'absent'
                                ? 'bg-gradient-to-r from-rose-500 to-rose-400 shadow-rose-500/30'
                                : 'bg-gradient-to-r from-slate-500 to-slate-400 shadow-slate-500/30'
                            }`}
                        >
                            Confirm {modalState.action === 'present' ? 'Attendance' : modalState.action === 'absent' ? 'Absence' : 'Cancellation'} 
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};