import { useState, useEffect, useCallback } from 'react';
import { AppState, Subject, WeeklyTimetable, AttendanceStatus } from '../types';
import { DEFAULT_MIN_ATTENDANCE, STORAGE_KEY } from '../constants';

const initialState: AppState = {
  theme: 'dark',
  isOnboarded: false,
  globalMinAttendance: DEFAULT_MIN_ATTENDANCE,
  subjects: [],
  timetable: {},
  attendanceLog: {},
  startDate: new Date().toISOString(),
};

export const useAttendanceStore = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed: AppState = JSON.parse(item);
        
        // MIGRATION: Ensure all subjects have professors array
        const migratedSubjects = parsed.subjects.map(sub => {
           if (!sub.professors) {
               const legacyProf = (sub as any).professor;
               return { ...sub, professors: legacyProf ? [legacyProf] : [] };
           }
           return sub;
        });

        return { ...parsed, subjects: migratedSubjects };
      }
      return initialState;
    } catch (error) {
      console.error('Error loading state:', error);
      return initialState;
    }
  });

  // Theme Side Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(state.theme || 'dark');
  }, [state.theme]);

  // Persistence
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const toggleTheme = useCallback(() => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  }, []);

  const setOnboarded = useCallback((
    subjects: Subject[],
    timetable: WeeklyTimetable,
    minAttendance: number
  ) => {
    setState(prev => ({
      ...prev,
      isOnboarded: true,
      subjects,
      timetable,
      globalMinAttendance: minAttendance,
      // Initialize logs for subjects if not exist
      attendanceLog: prev.attendanceLog || subjects.reduce((acc, sub) => ({ ...acc, [sub.id]: [] }), {})
    }));
  }, []);

  const updateAttendance = useCallback((
    subjectId: string, 
    date: string, 
    status: AttendanceStatus, 
    slotId?: number | string, // Optional slot ID
    type: 'Lecture' | 'Lab' = 'Lecture',
    conductedBy?: string,
    note?: string
  ) => {
    setState(prev => {
      const currentLog = prev.attendanceLog[subjectId] || [];
      
      // Find index based on date AND slotId (if slotId exists)
      // FIX: Use loose equality (==) for slotId to handle potential string/number mismatch from storage
      const existingIndex = currentLog.findIndex(r => 
        r.date === date && (slotId !== undefined ? r.slotId == slotId : true)
      );
      
      let newLog = [...currentLog];
      
      if (status === 'none') {
        // Remove record
        if (existingIndex >= 0) {
            newLog.splice(existingIndex, 1);
        }
      } else {
        const record = { date, status, slotId, type, conductedBy, note };
        // Add or Update
        if (existingIndex >= 0) {
            newLog[existingIndex] = { ...newLog[existingIndex], ...record };
        } else {
            newLog.push(record);
        }
      }

      // Sort by date descending
      newLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        ...prev,
        attendanceLog: {
          ...prev.attendanceLog,
          [subjectId]: newLog
        }
      };
    });
  }, []);

  const resetData = useCallback(() => {
    if(confirm("Are you sure? This will wipe all data.")) {
        setState(initialState);
    }
  }, []);

  return {
    state,
    toggleTheme,
    setOnboarded,
    updateAttendance,
    resetData
  };
};