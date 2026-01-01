import React, { useState } from 'react';
import { Subject, WeeklyTimetable, TIME_SLOTS } from '../types';
import { DAYS } from '../constants';
import { Check, Eraser, Trash2, ArrowRight, FlaskConical, BookOpen } from 'lucide-react';

interface TimetableEditorProps {
  subjects: Subject[];
  initialTimetable: WeeklyTimetable;
  onSave: (timetable: WeeklyTimetable) => void;
}

export const TimetableEditor: React.FC<TimetableEditorProps> = ({ subjects, initialTimetable, onSave }) => {
  const [timetable, setTimetable] = useState<WeeklyTimetable>(initialTimetable);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'eraser'>('eraser');

  const activeSubject = subjects.find(s => s.id === selectedSubjectId);

  const toggleSlot = (dayIndex: number, slotId: number | string) => {
    // Only numeric IDs are valid slots for assignment
    if (typeof slotId !== 'number') return;

    const currentSubjectId = timetable[dayIndex]?.[slotId];

    // Case 1: Eraser is active - Simple delete without extra confirmation (standard paint behavior)
    if (selectedSubjectId === 'eraser') {
      if (currentSubjectId) {
        setTimetable(prev => {
          const daySchedule = { ...(prev[dayIndex] || {}) };
          delete daySchedule[slotId];
          return { ...prev, [dayIndex]: daySchedule };
        });
      }
      return;
    }

    // Case 2: Clicking the same subject that is currently selected
    if (currentSubjectId === selectedSubjectId) {
      // Requirement: Pre-select the 'eraser' tool
      setSelectedSubjectId('eraser');

      // Requirement: Show confirmation before clearing
      if (window.confirm(`Remove ${activeSubject?.name} from this slot?`)) {
        setTimetable(prev => {
          const daySchedule = { ...(prev[dayIndex] || {}) };
          delete daySchedule[slotId];
          return { ...prev, [dayIndex]: daySchedule };
        });
      }
      return;
    }

    // Case 3: Painting a new subject or overwriting a different one
    setTimetable(prev => {
      const daySchedule = { ...(prev[dayIndex] || {}) };
      daySchedule[slotId] = selectedSubjectId;
      return { ...prev, [dayIndex]: daySchedule };
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Timetable Editor</h2>
        <p className="text-slate-400 text-sm">Select a subject and paint the grid. Labs will be striped.</p>
      </div>

      {/* Palette */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-4 snap-x">
        <button
          onClick={() => setSelectedSubjectId('eraser')}
          className={`flex-shrink-0 snap-start flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${selectedSubjectId === 'eraser' ? 'bg-slate-700 border-white text-white shadow-lg shadow-white/10' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
        >
          <Eraser className="w-5 h-5" /> 
          <span className="font-bold">Eraser</span>
        </button>
        {subjects.map(sub => (
           <button
             key={sub.id}
             onClick={() => setSelectedSubjectId(sub.id)}
             className={`flex-shrink-0 snap-start flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${selectedSubjectId === sub.id ? `bg-slate-800 border-white ring-1 ring-${sub.color.split('-')[1]}-400 shadow-lg` : 'bg-slate-900 border-slate-700 opacity-60 hover:opacity-100'}`}
           >
             <div className={`w-10 h-10 rounded-xl ${sub.color} flex items-center justify-center text-white shadow-inner`}>
                {sub.type === 'Lab' ? <FlaskConical className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
             </div>
             <div className="text-left">
                <div className="font-bold text-slate-200 text-sm">{sub.name}</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{sub.type}</div>
             </div>
           </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-slate-900/50 rounded-2xl border border-white/5 p-4 relative shadow-inner">
        <div className="min-w-[600px]">
           {/* Header */}
           <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2 sticky top-0 z-20 bg-slate-900/95 backdrop-blur py-2 border-b border-white/5">
             <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider text-right pr-3 self-end pb-2">Time</div>
             {DAYS.map((d, i) => (
               <div key={d} className={`text-center py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${i === new Date().getDay() ? 'bg-accent-purple text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-slate-800 text-slate-400'}`}>
                 {d.slice(0,3)}
               </div>
             ))}
           </div>

           {/* Body */}
           <div className="space-y-2">
             {TIME_SLOTS.map(slot => {
               if (slot.type === 'break') {
                 return (
                   <div key={slot.id} className="flex items-center gap-2 opacity-50 my-6">
                      <div className="w-[80px] text-right text-[10px] text-slate-500 pr-3 font-mono">{slot.label}</div>
                      <div className="h-px bg-slate-700 flex-1"></div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold px-2 border border-slate-700 rounded-full">{slot.name}</div>
                      <div className="h-px bg-slate-700 flex-1"></div>
                   </div>
                 );
               }

               return (
                 <div key={slot.id} className="grid grid-cols-[80px_repeat(7,1fr)] gap-2">
                   <div className="text-right text-[10px] text-slate-500 pr-3 py-3 font-mono leading-none flex flex-col justify-center">
                     <span>{slot.label}</span>
                     <span className="opacity-50 mt-1">{slot.end}</span>
                   </div>
                   {DAYS.map((_, dayIndex) => {
                     const cellSubId = timetable[dayIndex]?.[slot.id as number];
                     const cellSub = subjects.find(s => s.id === cellSubId);
                     const isLab = cellSub?.type === 'Lab';
                     
                     return (
                       <button
                         key={`${dayIndex}-${slot.id}`}
                         onClick={() => toggleSlot(dayIndex, slot.id)}
                         className={`h-14 rounded-xl border transition-all relative overflow-hidden group flex flex-col items-center justify-center gap-0.5
                           ${cellSub 
                             ? `${cellSub.color} border-white/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]` 
                             : 'bg-slate-800/20 border-slate-800 hover:bg-slate-800/50'}
                         `}
                       >
                         {cellSub && (
                           <>
                             {/* Lab Texture */}
                             {isLab && (
                                <div 
                                    className="absolute inset-0 opacity-20 bg-black mix-blend-overlay pointer-events-none" 
                                    style={{backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '4px 4px'}}
                                />
                             )}
                             
                             <div className="relative z-10 text-white drop-shadow-md">
                               {isLab ? <FlaskConical className="w-4 h-4" strokeWidth={2.5} /> : <BookOpen className="w-4 h-4" strokeWidth={2.5} />}
                             </div>
                             <span className="relative z-10 text-[9px] font-black text-white/90 uppercase tracking-tighter leading-none px-1 text-center truncate w-full">
                               {cellSub.name.slice(0, 4)}
                             </span>
                           </>
                         )}
                       </button>
                     );
                   })}
                 </div>
               );
             })}
           </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end pt-4 border-t border-white/5">
        <button 
            onClick={() => onSave(timetable)}
            className="px-8 py-4 bg-emerald-500 text-slate-950 font-bold rounded-2xl hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
            <Check className="w-5 h-5" /> Save Timetable
        </button>
      </div>
    </div>
  );
};