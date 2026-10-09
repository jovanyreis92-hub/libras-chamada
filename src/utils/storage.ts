import {
  Student,
  Turma,
  AttendanceRecord,
  VideoActivity,
  VideoSubmission,
  StudyModule,
  GlossaryItem,
} from '../types';
import {
  initialStudents,
  initialTurmas,
  initialAttendanceRecords,
  initialVideoActivities,
  initialVideoSubmissions,
  initialStudyModules,
  initialGlossaryItems,
} from '../data/mockData';

const KEYS = {
  STUDENTS: 'libras_students_v1',
  TURMAS: 'libras_turmas_v1',
  ATTENDANCE: 'libras_attendance_v1',
  ACTIVITIES: 'libras_activities_v1',
  SUBMISSIONS: 'libras_submissions_v1',
  MODULES: 'libras_modules_v1',
  GLOSSARY: 'libras_glossary_v1',
};

export const getStoredStudents = (): Student[] => {
  try {
    const raw = localStorage.getItem(KEYS.STUDENTS);
    return raw ? JSON.parse(raw) : initialStudents;
  } catch {
    return initialStudents;
  }
};

export const saveStudents = (students: Student[]) => {
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
};

export const getStoredTurmas = (): Turma[] => {
  try {
    const raw = localStorage.getItem(KEYS.TURMAS);
    return raw ? JSON.parse(raw) : initialTurmas;
  } catch {
    return initialTurmas;
  }
};

export const saveTurmas = (turmas: Turma[]) => {
  localStorage.setItem(KEYS.TURMAS, JSON.stringify(turmas));
};

export const getStoredAttendance = (): AttendanceRecord[] => {
  try {
    const raw = localStorage.getItem(KEYS.ATTENDANCE);
    return raw ? JSON.parse(raw) : initialAttendanceRecords;
  } catch {
    return initialAttendanceRecords;
  }
};

export const saveAttendance = (records: AttendanceRecord[]) => {
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
};

export const getStoredActivities = (): VideoActivity[] => {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVITIES);
    return raw ? JSON.parse(raw) : initialVideoActivities;
  } catch {
    return initialVideoActivities;
  }
};

export const saveActivities = (activities: VideoActivity[]) => {
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(activities));
};

export const getStoredSubmissions = (): VideoSubmission[] => {
  try {
    const raw = localStorage.getItem(KEYS.SUBMISSIONS);
    return raw ? JSON.parse(raw) : initialVideoSubmissions;
  } catch {
    return initialVideoSubmissions;
  }
};

export const saveSubmissions = (submissions: VideoSubmission[]) => {
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(submissions));
};

export const getStoredModules = (): StudyModule[] => {
  try {
    const raw = localStorage.getItem(KEYS.MODULES);
    return raw ? JSON.parse(raw) : initialStudyModules;
  } catch {
    return initialStudyModules;
  }
};

export const getStoredGlossary = (): GlossaryItem[] => {
  try {
    const raw = localStorage.getItem(KEYS.GLOSSARY);
    return raw ? JSON.parse(raw) : initialGlossaryItems;
  } catch {
    return initialGlossaryItems;
  }
};

export const saveGlossary = (glossary: GlossaryItem[]) => {
  localStorage.setItem(KEYS.GLOSSARY, JSON.stringify(glossary));
};

export const resetAllData = () => {
  localStorage.removeItem(KEYS.STUDENTS);
  localStorage.removeItem(KEYS.TURMAS);
  localStorage.removeItem(KEYS.ATTENDANCE);
  localStorage.removeItem(KEYS.ACTIVITIES);
  localStorage.removeItem(KEYS.SUBMISSIONS);
  localStorage.removeItem(KEYS.MODULES);
  localStorage.removeItem(KEYS.GLOSSARY);
};
