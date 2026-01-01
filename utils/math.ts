import { AttendanceRecord, MathResult, SubMetric } from '../types';

/**
 * Helper to calculate metrics for a specific subset of records
 */
const getSubMetric = (records: AttendanceRecord[], target: number): SubMetric => {
  const conducted = records.filter(r => r.status === 'present' || r.status === 'absent').length;
  const attended = records.filter(r => r.status === 'present').length;
  
  // Percentage
  const percentage = conducted === 0 ? 0 : (attended / conducted) * 100;

  // Status
  let status: SubMetric['status'] = 'safe';
  if (conducted === 0) status = 'insufficient';
  else if (percentage < target) status = 'danger';
  else if (percentage < target + 5) status = 'warning';

  // Math Setup
  const T = target / 100;

  // Buffer Calculation (How many can I skip? Or how many needed?)
  let buffer = 0;
  if (conducted === 0) {
    buffer = 0;
  } else if (percentage >= target) {
    // Safe Case: (Attended) / (Conducted + B) >= T
    // This calculates how many FUTURE ABSENCES we can afford while staying above T
    // Solve: Attended / (Conducted + B) >= T
    // Attended / T >= Conducted + B
    // B <= (Attended / T) - Conducted
    buffer = Math.floor((attended / T) - conducted);
  } else {
    // Danger Case: How many CONSECUTIVE PRESENTS needed to reach T?
    // (Attended + R) / (Conducted + R) >= T
    // Attended + R >= T*Conducted + T*R
    // R(1 - T) >= T*Conducted - Attended
    // R >= (T*Conducted - Attended) / (1 - T)
    const required = Math.ceil((T * conducted - attended) / (1 - T));
    buffer = -required; // Negative denotes classes NEEDED
  }

  // Margin Calculation (Simple Deficit/Surplus based on CURRENT conducted)
  const requiredSoFar = Math.ceil(conducted * T);
  const margin = attended - requiredSoFar;

  return {
    conducted,
    attended,
    percentage,
    buffer,
    margin,
    status
  };
};

/**
 * Core mathematical engine.
 */
export const calculateMetrics = (
  records: AttendanceRecord[],
  targetPercentage: number
): MathResult => {
  const safeRecords = records || [];

  const lectureRecords = safeRecords.filter(r => r.type === 'Lecture' || (!r.type)); // Fallback to lecture
  const labRecords = safeRecords.filter(r => r.type === 'Lab');

  return {
    overall: getSubMetric(safeRecords, targetPercentage),
    lectures: getSubMetric(lectureRecords, targetPercentage),
    labs: getSubMetric(labRecords, targetPercentage),
  };
};