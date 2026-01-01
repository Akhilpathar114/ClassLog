import React, { useState, useEffect, useRef } from 'react';
import { useAttendanceStore } from './hooks/useAttendance';
import { Onboarding } from './components/Onboarding';
import { SubjectCard } from './components/SubjectCard';
import { SubjectDetail } from './components/SubjectDetail';
import { Navigation } from './components/Navigation';
import { TodaysSchedule } from './components/TodaysSchedule';
import { TimetableEditor } from './components/TimetableEditor';
import { InstallPrompt } from './components/InstallPrompt'; // Import
import { Subject, AttendanceRecord, ViewState, WeeklyTimetable } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Download, Upload, Save } from 'lucide-react';
import { calculateMetrics } from './utils/math';

const App: React.FC = () => {
  const { state, setOnboarded, updateAttendance, resetData } = useAttendanceStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [confetti, setConfetti] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Timetable Updates via Sidebar
  const [isEditingTimetable, setIsEditingTimetable] = useState(false);
  const handleSaveTimetable = (newTimetable: WeeklyTimetable) => {
     setOnboarded(state.subjects, newTimetable, state.globalMinAttendance);
     setCurrentView('dashboard');
  };

  const selectedSubject = state.subjects.find(s => s.id === selectedSubjectId);

  // Confetti trigger logic
  const handleUpdate = (sid: string, date: string, status: any, slotId: any, type: any) => {
      updateAttendance(sid, date, status, slotId, type);
      if(status === 'present') {
          if (navigator.vibrate) navigator.vibrate(50);
          setConfetti(true);
          setTimeout(() => setConfetti(false), 2000);
      }
  }

  // Backup & Restore
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `classlog_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.subjects && json.attendanceLog) {
          if(window.confirm("This will overwrite your current data. Continue?")) {
              localStorage.setItem('orbit-attendance-v1', JSON.stringify(json));
              window.location.reload();
          }
        } else {
            alert("Invalid backup file.");
        }
      } catch (err) {
        alert("Error parsing backup file.");
      }
    };
    reader.readAsText(file);
  };

  // Aggregate Stats & Ambient Color Calculation
  const allRecords = Object.values(state.attendanceLog || {}).flat() as AttendanceRecord[];
  const totalClasses = allRecords.length;
  const totalAttended = allRecords.filter(r => r.status === 'present').length;
  const overallPct = totalClasses ? Math.round((totalAttended / totalClasses) * 100) : 0;

  // Determine ambient color based on health - supports Light/Dark
  let ambientClasses = 'bg-slate-50 dark:bg-slate-950'; // Default
  if (state.isOnboarded && totalClasses > 0) {
      if (overallPct >= state.globalMinAttendance) {
          // Safe
          ambientClasses = 'bg-emerald-50/50 dark:bg-slate-950 dark:from-emerald-900/20 dark:to-slate-950 dark:bg-gradient-to-b';
      } else if (overallPct >= state.globalMinAttendance - 5) {
          // Warning
          ambientClasses = 'bg-amber-50/50 dark:bg-slate-950 dark:from-amber-900/20 dark:to-slate-950 dark:bg-gradient-to-b';
      } else {
          // Danger
          ambientClasses = 'bg-rose-50/50 dark:bg-slate-950 dark:from-rose-900/20 dark:to-slate-950 dark:bg-gradient-to-b';
      }
  }

  if (!state.isOnboarded) {
    return <Onboarding onComplete={setOnboarded} />;
  }

  return (
    <div className={`min-h-screen text-slate-800 dark:text-slate-200 flex flex-col md:flex-row transition-colors duration-1000 ${ambientClasses}`}>
      
      {/* Confetti (Simple CSS implementation for juice) */}
      {confetti && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
             <div className="absolute top-0 w-full h-full bg-emerald-500/10 mix-blend-overlay animate-pulse"></div>
          </div>
      )}

      <Navigation currentView={currentView} onChange={setCurrentView} />

      <div className="flex-1 md:ml-24 pb-24 md:pb-0 relative z-10">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 py-4 flex justify-between items-center transition-colors duration-300">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">ClassLog<span className="text-accent-purple">.</span></h1>
            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">
               {currentView === 'dashboard' ? 'Overview' : 
                currentView === 'timetable' ? 'Edit Schedule' : 'System Config'}
            </p>
          </div>
          <div className="flex items-center gap-4">
              {currentView === 'dashboard' && (
                  <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Semester Health</div>
                      {totalClasses > 0 ? (
                        <div className={`text-2xl font-black leading-none ${overallPct >= 75 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>{overallPct}%</div>
                      ) : (
                        <div className="text-2xl font-black leading-none text-slate-400 dark:text-slate-600">--%</div>
                      )}
                  </div>
              )}
          </div>
        </header>

        {/* Content Views */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          
          {currentView === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TodaysSchedule 
                    subjects={state.subjects} 
                    timetable={state.timetable} 
                    attendanceLog={state.attendanceLog || {}} 
                    onUpdate={handleUpdate}
                />
                
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 px-1">
                    Subject Status <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono">{state.subjects.length}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.subjects.map(subject => (
                    <SubjectCard 
                    key={subject.id} 
                    subject={subject} 
                    attendanceLog={state.attendanceLog[subject.id] || []} 
                    onClick={() => setSelectedSubjectId(subject.id)}
                    />
                ))}
                </div>
            </motion.div>
          )}

          {currentView === 'timetable' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-150px)]">
                 <TimetableEditor 
                    subjects={state.subjects} 
                    initialTimetable={state.timetable} 
                    onSave={handleSaveTimetable}
                 />
             </motion.div>
          )}

          {currentView === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mt-8 space-y-6">
                  
                  {/* INSTALL PROMPT */}
                  <InstallPrompt />

                  {/* Backup Section */}
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative overflow-hidden group shadow-sm">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Data Control</h3>
                      <p className="text-slate-500 mb-6 text-sm">Export your logs to a file or restore from a backup.</p>
                      
                      <div className="flex gap-4">
                          <button onClick={handleExport} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                              <Download className="w-5 h-5" /> Backup
                          </button>
                          <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                              <Upload className="w-5 h-5" /> Restore
                          </button>
                          <input 
                             type="file" 
                             ref={fileInputRef}
                             onChange={handleImport}
                             accept=".json"
                             className="hidden"
                          />
                      </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden group shadow-sm">
                      <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors"></div>
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Danger Zone</h3>
                        <p className="text-slate-500 mb-6 text-sm">Need to restart the semester from scratch?</p>
                        <button onClick={resetData} className="px-6 py-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/50 rounded-xl font-bold flex items-center gap-2 mx-auto transition-all hover:scale-105 active:scale-95">
                            <RotateCcw className="w-5 h-5" /> Wipe All Data
                        </button>
                      </div>
                  </div>
              </motion.div>
          )}

        </main>
      </div>

      {/* Layer 2 Overlay */}
      <AnimatePresence>
        {selectedSubjectId && selectedSubject && (
          <SubjectDetail 
            subject={selectedSubject}
            attendanceLog={state.attendanceLog[selectedSubjectId] || []}
            timetable={state.timetable}
            onClose={() => setSelectedSubjectId(null)}
            onUpdate={(date, status, slotId, type, prof, note) => handleUpdate(selectedSubjectId, date, status, slotId, type)} // Fixed args
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;