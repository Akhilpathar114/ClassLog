import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Subject, MathResult } from '../types';
import { calculateMetrics } from '../utils/math';
import { Activity, Skull, PartyPopper, Flame, ShieldCheck } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  attendanceLog: any[];
  onClick: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, attendanceLog, onClick }) => {
  const metrics: MathResult = calculateMetrics(attendanceLog || [], subject.requiredPercentage);
  const overall = metrics.overall; 
  
  // Golden Hour logic: Safe (buffer > 0) but efficient (less than 5% above target) or just simply SAFE
  const isGolden = overall.status === 'safe' && overall.buffer > 0;

  // Streak Logic: consecutive DAYS with at least one present class
  const streak = useMemo(() => {
    const logs = (attendanceLog || [])
        .filter(l => l.status === 'present' || l.status === 'absent')
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Group by date
    const dayMap = new Map<string, string[]>();
    logs.forEach(l => {
        const statuses = dayMap.get(l.date) || [];
        statuses.push(l.status);
        dayMap.set(l.date, statuses);
    });

    const uniqueDates = Array.from(dayMap.keys()).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());

    let count = 0;
    for (const date of uniqueDates) {
        const statuses = dayMap.get(date) || [];
        const hasPresent = statuses.includes('present');
        
        if (hasPresent) {
            count++;
        } else {
            // If strictly absent on this day, break streak
            break;
        }
    }
    return count;
  }, [attendanceLog]);

  // Theme logic based on status - Adjusted for Light Mode Contrast
  const statusStyles = {
    safe: {
        border: 'border-emerald-200 dark:border-emerald-500/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/5',
        shadow: 'shadow-emerald-100 dark:shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]',
        badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
    },
    warning: {
        border: 'border-amber-200 dark:border-amber-500/30',
        text: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/5',
        shadow: 'shadow-amber-100 dark:shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]',
        badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
    },
    danger: {
        border: 'border-rose-200 dark:border-rose-500/30',
        text: 'text-rose-700 dark:text-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        shadow: 'shadow-rose-100 dark:shadow-[0_0_30px_-10px_rgba(244,63,94,0.4)]',
        badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
    },
    insufficient: {
        border: 'border-slate-200 dark:border-slate-700',
        text: 'text-slate-400',
        bg: 'bg-white dark:bg-slate-800/40',
        shadow: '',
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500'
    }
  };

  const currentStyle = statusStyles[overall.status];

  return (
    <motion.div
      layoutId={`card-${subject.id}`}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-6 rounded-3xl backdrop-blur-md border ${currentStyle.border} ${currentStyle.bg} ${currentStyle.shadow} cursor-pointer overflow-hidden group transition-all duration-300 shadow-sm`}
    >
      {/* Decorative colored orb */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-10 dark:opacity-20 ${subject.color}`} />

      {/* Gold Glow for Safe Zone (Golden Hour) */}
      {isGolden && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/5 to-transparent pointer-events-none" />
      )}

      {overall.status === 'danger' && (
        <div className="absolute inset-0 bg-rose-500/5 animate-pulse-slow pointer-events-none" />
      )}

      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
           <div className="flex gap-2 items-center mb-3">
             <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-2 py-1 rounded bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">{subject.code || subject.type}</span>
             {streak > 1 && (
                 <span className="text-[10px] font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase px-2 py-1 rounded bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center gap-1">
                     <Flame className="w-3 h-3 fill-orange-500/50" /> Streak: {streak}
                 </span>
             )}
           </div>
           <motion.h3 layoutId={`title-${subject.id}`} className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none tracking-tight">
             {subject.name}
           </motion.h3>
        </div>
        
        {/* Animated Icon based on status */}
        <div className={`p-3 rounded-2xl bg-white/50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 ${currentStyle.text}`}>
            {overall.status === 'danger' ? <Skull className="w-5 h-5 animate-pulse" /> : 
             overall.buffer > 0 ? <ShieldCheck className="w-5 h-5" /> :
             overall.status === 'safe' ? <PartyPopper className="w-5 h-5" /> : 
             <Activity className="w-5 h-5" />}
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between mt-auto">
        <div>
            {overall.status === 'insufficient' ? (
                <div className="text-4xl font-bold tracking-tight text-slate-300 dark:text-slate-600 font-mono">--%</div>
            ) : (
                <motion.div layoutId={`pct-${subject.id}`} className={`text-5xl font-black tracking-tighter ${currentStyle.text} drop-shadow-sm`}>
                    {Math.round(overall.percentage)}<span className="text-2xl opacity-50">%</span>
                </motion.div>
            )}
            <div className="text-xs text-slate-500 mt-1 font-medium pl-1">Target: {subject.requiredPercentage}%</div>
        </div>

        <div className="text-right">
             <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-bold">Margin</div>
             {overall.status === 'insufficient' ? (
                 <div className={`inline-flex items-center px-3 py-1.5 rounded-xl border border-transparent ${currentStyle.badge} text-xs font-bold`}>
                     Start
                 </div>
             ) : (
                 <div className={`inline-flex items-center px-3 py-1.5 rounded-xl border border-transparent ${currentStyle.badge} text-sm font-bold shadow-sm`}>
                     {overall.margin > 0 ? `+${overall.margin} Lead` : overall.margin === 0 ? 'On Track' : `${overall.margin} Lag`}
                 </div>
             )}
        </div>
      </div>
      
      {/* Sleek Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-900/80">
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overall.percentage}%` }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
            className={`h-full ${subject.color.replace('bg-', 'bg-')} shadow-[0_0_10px_currentColor]`} 
        />
      </div>
    </motion.div>
  );
};