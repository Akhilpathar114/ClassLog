export type AttendanceStatus = 'present' | 'absent' | 'cancelled' | 'none';

export interface Subject {
  id: string;
  name: string;
  code?: string; // New: Subject Code (e.g., CS101)
  professors: string[]; // Updated: List of professors
  type: 'Lecture' | 'Lab' | 'Tutorial'; // Default type
  requiredPercentage: number; 
  color: string;
  icon?: string; 
}

export interface AttendanceRecord {
  date: string; // ISO String YYYY-MM-DD
  slotId?: number | string; 
  type?: 'Lecture' | 'Lab'; // Critical: Distinguishes the record type
  status: AttendanceStatus;
  conductedBy?: string; // New: Override for who took the class
  note?: string; // New: Context note
}

// Timetable structure: DayIndex (0=Sun) -> { SlotIndex: SubjectID }
export interface WeeklyTimetable {
  [dayIndex: number]: {
    [slotIndex: number]: string; 
  };
}

export interface AppState {
  theme: 'light' | 'dark'; // New: Theme preference
  isOnboarded: boolean;
  globalMinAttendance: number;
  subjects: Subject[];
  timetable: WeeklyTimetable;
  attendanceLog: Record<string, AttendanceRecord[]>; 
  startDate: string;
}

export interface SubMetric {
  conducted: number;
  attended: number;
  percentage: number;
  buffer: number; // Split buffer
  margin: number; // Split margin
  status: 'safe' | 'warning' | 'danger' | 'insufficient';
}

export interface MathResult {
  overall: SubMetric; // Combined (for backward compatibility/summary)
  lectures: SubMetric; // Pure Lecture Stats
  labs: SubMetric; // Pure Lab Stats
}

export type ViewState = 'dashboard' | 'timetable' | 'calendar' | 'settings';

export const TIME_SLOTS = [
  { id: 0, label: '10:30', end: '11:30', type: 'class' },
  { id: 1, label: '11:30', end: '12:30', type: 'class' },
  { id: 'b1', label: '12:30', end: '01:10', type: 'break', name: 'Lunch' },
  { id: 2, label: '01:10', end: '02:10', type: 'class' },
  { id: 3, label: '02:10', end: '03:10', type: 'class' },
  { id: 'b2', label: '03:10', end: '03:30', type: 'break', name: 'Tea' },
  { id: 4, label: '03:30', end: '04:30', type: 'class' },
  { id: 5, label: '04:30', end: '05:30', type: 'class' },
];