export type AttendanceStatus = 'present' | 'absent' | 'justified' | 'late';

export interface Student {
  id: string;
  name: string;
  enrollmentId: string; // Matrícula / RA
  accessCode: string; // Código Único Individual do Aluno (ex: LIB-8921-A)
  pinCode: string; // PIN de 4 a 6 dígitos para check-in rápido
  classId: string;
  email: string;
  phone?: string;
  librasSignName?: string; // Nome do sinal pessoal do aluno
  librasSignDescription?: string; // Como é feito o sinal (CM, PA, M)
  avatarUrl?: string;
  active: boolean;
  notes?: string;
  enrolledAt: string;
}

export interface Turma {
  id: string;
  name: string;
  level: 'Básico I' | 'Básico II' | 'Intermediário' | 'Avançado' | 'Tradução e Interpretação (TILS)';
  shift: 'Matutino' | 'Vespertino' | 'Noturno' | 'Sábado Integral';
  room: string;
  instructor: string;
  color: string;
  description: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  justification?: string;
  recordedAt: string;
  updatedAt: string;
}

export interface VideoRubricScores {
  handConfig: number; // Configuração de Mão (CM) - 0 a 10
  articulationPoint: number; // Ponto de Articulação (PA) - 0 a 10
  movement: number; // Movimento (M) - 0 a 10
  orientation: number; // Orientação da Palma (O) - 0 a 10
  facialExpression: number; // Expressão Facial e Corporal (EFNM) - 0 a 10
}

export interface VideoActivity {
  id: string;
  title: string;
  classId: string;
  moduleId: string;
  deadline: string;
  description: string;
  targetSigns: string[];
  parametersToEvaluate: string[];
  maxPoints: number;
}

export interface VideoSubmission {
  id: string;
  activityId: string;
  studentId: string;
  submittedAt: string;
  videoUrl: string;
  durationSeconds: number;
  studentNotes?: string;
  status: 'pending' | 'reviewing' | 'graded' | 'redo';
  rubricScores?: VideoRubricScores;
  grade?: number; // 0-10
  teacherFeedback?: string;
  reviewedAt?: string;
}

export interface StudyMaterial {
  id: string;
  moduleId: string;
  title: string;
  type: 'video' | 'pdf' | 'exercise' | 'guide';
  description: string;
  contentUrl: string;
  durationMinutes?: number;
  fileSize?: string;
  downloadable: boolean;
  librasNotes?: string;
}

export interface StudyModule {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  lessonsCount: number;
  durationHours: number;
  materials: StudyMaterial[];
}

export interface GlossaryItem {
  id: string;
  term: string; // Português
  glosa: string; // Notação em Glosa de Libras
  category: 'Gramática & Parâmetros' | 'Cotidiano' | 'Saúde' | 'Educação' | 'Jurídico' | 'Família & Pessoas' | 'Classificadores';
  handConfig: string; // CM
  articulationPoint: string; // PA
  movement: string; // M
  orientation: string; // O
  facialExpression: string; // EFNM
  meaning: string;
  usageExample: string;
  glosaExample: string;
  firstLetter: string;
  symbolDiagram?: string;
}
