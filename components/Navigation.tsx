import React from 'react';
import { Home, Calendar, BookOpen, Settings, Sun, Moon } from 'lucide-react';
import { ViewState } from '../types';
import { useAttendanceStore } from '../hooks/useAttendance';

interface NavigationProps {
  currentView: ViewState;
  onChange: (view: ViewState) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChange }) => {
  const { state, toggleTheme } = useAttendanceStore();
  const items = [
    { id: 'dashboard', icon: Home, label: 'ClassLog' },
    { id: 'timetable', icon: BookOpen, label: 'Timetable' },
    { id: 'settings', icon: Settings, label: 'Config' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-24 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 items-center py-8 z-40 transition-colors duration-300">
        <div className="mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-purple to-accent-cyan animate-pulse-slow shadow-lg"></div>
        </div>
        <div className="flex flex-col gap-8 flex-1">
          {items.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id as ViewState)}
                className={`p-3 rounded-2xl transition-all duration-300 group relative ${isActive ? 'text-white bg-slate-900 dark:bg-white/10 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                {isActive && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Theme Toggle Desktop */}
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all bg-slate-200/50 dark:bg-white/5"
        >
           {state.theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 py-4 z-40 flex justify-between pb-6 safe-area-pb transition-colors duration-300">
        {items.map((item) => {
           const isActive = currentView === item.id;
           return (
             <button
                key={item.id}
                onClick={() => onChange(item.id as ViewState)}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-accent-purple' : 'text-slate-400 dark:text-slate-600'}`}
             >
               <div className={`p-2 rounded-xl ${isActive ? 'bg-accent-purple/10 dark:bg-accent-purple/20' : ''}`}>
                 <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
               </div>
               <span className="text-[10px] font-medium">{item.label}</span>
             </button>
           );
        })}
        <button 
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
           <div className="p-2">
             {state.theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
           </div>
           <span className="text-[10px] font-medium">Theme</span>
        </button>
      </div>
    </>
  );
};