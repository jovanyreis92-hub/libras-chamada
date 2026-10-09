import React, { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  Calendar,
  CheckCircle,
  TrendingUp,
  Award,
  Video,
  ExternalLink,
  Mail,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Student, Turma, AttendanceRecord, VideoSubmission } from '../../types';

interface AnalyticsDashboardProps {
  students: Student[];
  turmas: Turma[];
  attendanceRecords: AttendanceRecord[];
  videoSubmissions: VideoSubmission[];
  onSelectStudent?: (studentId: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  students,
  turmas,
  attendanceRecords,
  videoSubmissions,
}) => {
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('all');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Filter students by selected turma
  const targetStudents = useMemo(() => {
    return selectedTurmaId === 'all'
      ? students
      : students.filter((s) => s.classId === selectedTurmaId);
  }, [students, selectedTurmaId]);

  const targetStudentIds = useMemo(() => new Set(targetStudents.map((s) => s.id)), [targetStudents]);

  // Filter attendance records by target students
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((r) => targetStudentIds.has(r.studentId));
  }, [attendanceRecords, targetStudentIds]);

  // All distinct dates in chronological order
  const distinctDates = useMemo(() => {
    const dates = Array.from(new Set(filteredRecords.map((r) => r.date)));
    return dates.sort();
  }, [filteredRecords]);

  // Daily statistics for the chart
  const dailyStats = useMemo(() => {
    return distinctDates.map((date) => {
      const recordsForDate = filteredRecords.filter((r) => r.date === date);
      const total = recordsForDate.length;
      const presents = recordsForDate.filter((r) => r.status === 'present').length;
      const justified = recordsForDate.filter((r) => r.status === 'justified').length;
      const lates = recordsForDate.filter((r) => r.status === 'late').length;
      const absents = recordsForDate.filter((r) => r.status === 'absent').length;

      const effectivePresent = presents + justified + lates * 0.5;
      const rate = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;

      return {
        date,
        total,
        presents,
        justified,
        lates,
        absents,
        rate,
      };
    });
  }, [distinctDates, filteredRecords]);

  // Overall attendance rate
  const overallRate = useMemo(() => {
    if (filteredRecords.length === 0) return 0;
    const presents = filteredRecords.filter((r) => r.status === 'present').length;
    const justified = filteredRecords.filter((r) => r.status === 'justified').length;
    const lates = filteredRecords.filter((r) => r.status === 'late').length;
    const effective = presents + justified + lates * 0.5;
    return Math.round((effective / filteredRecords.length) * 100);
  }, [filteredRecords]);

  // Student cumulative stats & risk classification
  const studentAnalysis = useMemo(() => {
    return targetStudents.map((student) => {
      const stRecords = filteredRecords.filter((r) => r.studentId === student.id);
      const total = stRecords.length;
      const presents = stRecords.filter((r) => r.status === 'present').length;
      const justified = stRecords.filter((r) => r.status === 'justified').length;
      const lates = stRecords.filter((r) => r.status === 'late').length;
      const absents = stRecords.filter((r) => r.status === 'absent').length;

      const rate = total > 0 ? Math.round(((presents + justified + lates * 0.5) / total) * 100) : 100;

      // Check consecutive absences in recent 3 records
      const sortedStRecords = [...stRecords].sort((a, b) => b.date.localeCompare(a.date));
      let recentAbsenceStreak = 0;
      for (const rec of sortedStRecords) {
        if (rec.status === 'absent') {
          recentAbsenceStreak++;
        } else {
          break;
        }
      }

      return {
        student,
        total,
        presents,
        absents,
        justified,
        lates,
        rate,
        isRisk: rate < 75,
        recentAbsenceStreak,
        turma: turmas.find((t) => t.id === student.classId),
      };
    });
  }, [targetStudents, filteredRecords, turmas]);

  // In-risk students (under 75% or 2+ consecutive absences)
  const alertStudents = useMemo(() => {
    return studentAnalysis
      .filter((s) => s.isRisk || s.recentAbsenceStreak >= 2)
      .sort((a, b) => a.rate - b.rate);
  }, [studentAnalysis]);

  // Class comparison stats
  const turmasComparison = useMemo(() => {
    return turmas.map((turma) => {
      const stInTurma = students.filter((s) => s.classId === turma.id);
      const stIds = new Set(stInTurma.map((s) => s.id));
      const recs = attendanceRecords.filter((r) => stIds.has(r.studentId));

      const total = recs.length;
      const presents = recs.filter((r) => r.status === 'present').length;
      const justified = recs.filter((r) => r.status === 'justified').length;
      const lates = recs.filter((r) => r.status === 'late').length;
      const effective = presents + justified + lates * 0.5;
      const rate = total > 0 ? Math.round((effective / total) * 100) : 0;
      const riskCount = stInTurma.filter((st) => {
        const studentRecs = recs.filter((r) => r.studentId === st.id);
        const stTotal = studentRecs.length;
        const stPres = studentRecs.filter((r) => r.status === 'present').length;
        const stJust = studentRecs.filter((r) => r.status === 'justified').length;
        const stLate = studentRecs.filter((r) => r.status === 'late').length;
        const r = stTotal > 0 ? ((stPres + stJust + stLate * 0.5) / stTotal) * 100 : 100;
        return r < 75;
      }).length;

      return {
        turma,
        studentsCount: stInTurma.length,
        rate,
        riskCount,
      };
    });
  }, [turmas, students, attendanceRecords]);

  // Average Video Rubrics across evaluated submissions
  const rubricAverages = useMemo(() => {
    const graded = videoSubmissions.filter(
      (s) => s.status === 'graded' && s.rubricScores && targetStudentIds.has(s.studentId)
    );
    if (graded.length === 0) {
      return {
        cm: 9.0,
        pa: 9.2,
        m: 8.8,
        o: 9.1,
        efnm: 9.3,
        totalGraded: 0,
      };
    }
    const count = graded.length;
    const cm = graded.reduce((acc, s) => acc + (s.rubricScores?.handConfig || 0), 0) / count;
    const pa = graded.reduce((acc, s) => acc + (s.rubricScores?.articulationPoint || 0), 0) / count;
    const m = graded.reduce((acc, s) => acc + (s.rubricScores?.movement || 0), 0) / count;
    const o = graded.reduce((acc, s) => acc + (s.rubricScores?.orientation || 0), 0) / count;
    const efnm = graded.reduce((acc, s) => acc + (s.rubricScores?.facialExpression || 0), 0) / count;

    return {
      cm: Number(cm.toFixed(1)),
      pa: Number(pa.toFixed(1)),
      m: Number(m.toFixed(1)),
      o: Number(o.toFixed(1)),
      efnm: Number(efnm.toFixed(1)),
      totalGraded: count,
    };
  }, [videoSubmissions, targetStudentIds]);

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Métricas de Aprendizagem</span>
            <span aria-hidden="true">·</span>
            <span>Diário Analítico</span>
            <span aria-hidden="true">·</span>
            <span>Critério MEC 75%</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Painel Analítico de Frequência & Desempenho
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe o engajamento diário, evolução das turmas e identificação preventiva de infrequência.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto border border-slate-200 shrink-0">
          <button
            onClick={() => setSelectedTurmaId('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
              selectedTurmaId === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas as Turmas
          </button>
          {turmas.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTurmaId(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                selectedTurmaId === t.id
                  ? 'bg-white text-teal-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.level}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Média Geral de Frequência</span>
            <span className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {overallRate}%
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {overallRate >= 75 ? '● Meta atingida' : '▲ Abaixo da meta'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Baseado em {filteredRecords.length} registros individuais
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total de Alunos</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {targetStudents.length}
            </span>
            <span className="text-xs text-slate-500">
              {targetStudents.filter((s) => s.active).length} ativos
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {targetStudents.filter((s) => s.librasSignName).length} com sinal pessoal batizado
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Alunos em Alerta</span>
            <span className={`p-2 rounded-lg ${alertStudents.length > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                alertStudents.length > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {alertStudents.length}
            </span>
            <span className="text-xs text-slate-500">
              ({targetStudents.length > 0 ? Math.round((alertStudents.length / targetStudents.length) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Frequência menor que 75% ou faltas consecutivas
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Atividades em Vídeo</span>
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Video className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {videoSubmissions.length}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {videoSubmissions.filter((s) => s.status === 'graded').length} avaliados
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Rubrica de 5 parâmetros fonológicos aplicada
          </div>
        </div>
      </div>

      {/* Daily Performance Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Evolução Diária da Frequência
            </h2>
            <p className="text-xs text-slate-500">
              Taxa de presença apurada em cada dia letivo com linha de referência legal de 75%.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-teal-600 rounded-xs" />
              Presença $\ge 75\%$
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-500 rounded-xs" />
              Presença $&lt; 75\%$
            </span>
          </div>
        </div>

        {/* Interactive SVG Bar Chart */}
        {dailyStats.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Nenhuma data de aula registrada para o filtro atual.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2 border-b border-slate-200 relative">
              {/* Reference line 75% */}
              <div
                className="absolute inset-x-0 border-b border-dashed border-amber-400 pointer-events-none z-10"
                style={{ bottom: '75%' }}
              >
                <span className="absolute -top-3.5 right-0 text-[10px] font-mono text-amber-700 bg-amber-50 px-1 rounded font-semibold">
                  Meta 75%
                </span>
              </div>

              {dailyStats.map((item) => {
                const isHovered = hoveredDate === item.date;
                const isPass = item.rate >= 75;

                return (
                  <div
                    key={item.date}
                    onMouseEnter={() => setHoveredDate(item.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-20 z-20 bg-slate-900 text-white text-[11px] rounded-lg py-1.5 px-2.5 shadow-lg whitespace-nowrap pointer-events-none">
                        <div className="font-mono font-semibold">{item.date}</div>
                        <div>Frequência: {item.rate}%</div>
                        <div className="text-slate-300">
                          {item.presents} pres. / {item.absents} faltas / {item.justified} just.
                        </div>
                      </div>
                    )}

                    {/* Rate text above bar */}
                    <span className="text-[10px] font-mono font-medium text-slate-500 mb-1 tabular-nums group-hover:text-slate-900">
                      {item.rate}%
                    </span>

                    {/* Bar */}
                    <div
                      className={`w-full max-w-[48px] rounded-t-sm transition-all ${
                        isPass
                          ? 'bg-teal-600 group-hover:bg-teal-700'
                          : 'bg-rose-500 group-hover:bg-rose-600'
                      }`}
                      style={{ height: `${Math.max(8, item.rate)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Date labels below bars */}
            <div className="flex items-center gap-2">
              {dailyStats.map((item) => (
                <div
                  key={item.date}
                  className="flex-1 text-center text-[10px] font-mono text-slate-500 truncate"
                  title={item.date}
                >
                  {item.date.slice(5)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Turmas Comparison & Active Pedagogical Intervention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Comparativo por Turma */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Comparativo por Turma
              </h2>
              <p className="text-xs text-slate-500">
                Desempenho comparado entre os diferentes níveis do curso de Libras.
              </p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4">
            {turmasComparison.map(({ turma, studentsCount, rate, riskCount }) => (
              <div key={turma.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-semibold text-slate-900">{turma.name}</span>
                    <div className="text-[11px] text-slate-500">
                      {turma.instructor} · {studentsCount} alunos
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                      {rate}%
                    </span>
                    <div className="text-[11px]">
                      {riskCount > 0 ? (
                        <span className="text-rose-600 font-medium">{riskCount} em alerta</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Turma regular</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${rate >= 75 ? 'bg-teal-600' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Busca Ativa e Alunos em Alerta */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Busca Ativa & Acolhimento
              </h2>
              <p className="text-xs text-slate-500">
                Alunos com infrequência que necessitam de intervenção ou contato pedagógico.
              </p>
            </div>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>

          {alertStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800">
                Nenhum aluno em situação de risco!
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Todos os alunos mantêm presença acima de 75% no período atual.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertStudents.slice(0, 5).map(({ student, rate, recentAbsenceStreak, turma }) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-rose-100 bg-rose-50/40"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{student.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {turma?.level} · {student.enrollmentId}
                      </div>
                      {recentAbsenceStreak >= 2 && (
                        <div className="text-[10px] font-semibold text-rose-700 mt-0.5">
                          ⚠️ {recentAbsenceStreak} faltas consecutivas recentes
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-rose-700 tabular-nums">
                        {rate}%
                      </div>
                      <div className="text-[10px] text-rose-600">Risco MEC</div>
                    </div>
                    <a
                      href={`mailto:${student.email}?subject=Acompanhamento de Frequência - Libras`}
                      title="Enviar email de contato pedagógico"
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-teal-700 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Libras Pedagogical Evaluation: 5 Parameters Rubrics Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Desempenho Médio nos 5 Parâmetros Fonológicos da Libras
            </h2>
            <p className="text-xs text-slate-500">
              Média das avaliações das atividades em vídeo submetidas pelos estudantes.
            </p>
          </div>
          <Award className="w-4 h-4 text-teal-600" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <span className="text-[11px] font-medium text-slate-600 block">
              1. Configuração (CM)
            </span>
            <div className="text-lg font-bold font-mono text-teal-700 mt-1 tabular-nums">
              {rubricAverages.cm} <span className="text-xs text-slate-400 font-normal">/ 10</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Formato dos dedos e mão</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <span className="text-[11px] font-medium text-slate-600 block">
              2. Ponto de Articulação (PA)
            </span>
            <div className="text-lg font-bold font-mono text-teal-700 mt-1 tabular-nums">
              {rubricAverages.pa} <span className="text-xs text-slate-400 font-normal">/ 10</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Localização no corpo/espaço</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <span className="text-[11px] font-medium text-slate-600 block">
              3. Movimento (M)
            </span>
            <div className="text-lg font-bold font-mono text-teal-700 mt-1 tabular-nums">
              {rubricAverages.m} <span className="text-xs text-slate-400 font-normal">/ 10</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Direcionalidade e cadência</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <span className="text-[11px] font-medium text-slate-600 block">
              4. Orientação (O)
            </span>
            <div className="text-lg font-bold font-mono text-teal-700 mt-1 tabular-nums">
              {rubricAverages.o} <span className="text-xs text-slate-400 font-normal">/ 10</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Direção da palma</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <span className="text-[11px] font-medium text-slate-600 block">
              5. Expressão Facial (EFNM)
            </span>
            <div className="text-lg font-bold font-mono text-teal-700 mt-1 tabular-nums">
              {rubricAverages.efnm} <span className="text-xs text-slate-400 font-normal">/ 10</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Gramática visual não-manual</p>
          </div>
        </div>
      </div>
    </div>
  );
};
