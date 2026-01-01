import { Subject } from './types';

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PRESET_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-indigo-500',
  'bg-lime-500',
  'bg-pink-500',
];

export const MOCK_SUBJECT_TEMPLATES: Partial<Subject>[] = [
  { name: 'Data Structures', type: 'Lecture' },
  { name: 'Digital Logic', type: 'Lecture' },
  { name: 'Algorithms Lab', type: 'Lab' },
  { name: 'Linear Algebra', type: 'Lecture' },
];

export const DEFAULT_MIN_ATTENDANCE = 75;

export const STORAGE_KEY = 'orbit-attendance-v1';