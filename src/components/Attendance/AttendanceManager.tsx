import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCheck,
  Search,
  Filter,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  QrCode,
  Scan,
} from 'lucide-react';
import { Student, Turma, AttendanceRecord, AttendanceStatus } from '../../types';
import { StudentQRCodeModal } from './StudentQRCodeModal';
import { QRCodeScannerModal } from './QRCodeScannerModal';

interface AttendanceManagerProps {
  students: Student[];
  turmas: Turma[];
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  onOpenAddStudent: () => void;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  students,
  turmas,
  attendanceRecords,
  onUpdateAttendance,
  onOpenAddStudent,
}) => {
  // Selected Turma
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('all');
  // Selected Date (default: today 2026-10-01 or local ISO date)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  // Search text
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Active justification editor
  const [editingJustificationStudentId, setEditingJustificationStudentId] = useState<string | null>(null);
  const [justificationText, setJustificationText] = useState<string>('');

  // QR Code Modals state
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);

  // Filter students by turma and search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchTurma = selectedTurmaId === 'all' || s.classId === selectedTurmaId;
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.enrollmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.librasSignName && s.librasSignName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchTurma && matchSearch;
    });
  }, [students, selectedTurmaId, searchTerm]);

  // Map of studentId -> AttendanceRecord for the selectedDate
  const dateRecordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords
      .filter((r) => r.date === selectedDate)
      .forEach((r) => map.set(r.studentId, r));
    return map;
  }, [attendanceRecords, selectedDate]);

  // Overall attendance statistics for selected turma on selected date
  const dateStats = useMemo(() => {
    const turmaStudents = selectedTurmaId === 'all'
      ? students
      : students.filter((s) => s.classId === selectedTurmaId);

    const totalStudents = turmaStudents.length;
    let presentCount = 0;
    let absentCount = 0;
    let justifiedCount = 0;
    let lateCount = 0;

    turmaStudents.forEach((student) => {
      const rec = dateRecordsMap.get(student.id);
      if (rec) {
        if (rec.status === 'present') presentCount++;
        else if (rec.status === 'absent') absentCount++;
        else if (rec.status === 'justified') justifiedCount++;
        else if (rec.status === 'late') lateCount++;
      }
    });

    const recordedCount = presentCount + absentCount + justifiedCount + lateCount;
    const effectivePresent = presentCount + justifiedCount + lateCount * 0.5;
    const rate = recordedCount > 0 ? Math.round((effectivePresent / recordedCount) * 100) : 0;

    return {
      totalStudents,
      recordedCount,
      presentCount,
      absentCount,
      justifiedCount,
      lateCount,
      rate,
      isFullyRecorded: totalStudents > 0 && recordedCount === totalStudents,
    };
  }, [students, selectedTurmaId, dateRecordsMap]);

  // Cumulative rates per student
  const studentCumulativeRates = useMemo(() => {
    const map = new Map<string, { rate: number; total: number; presents: number }>();
    students.forEach((student) => {
      const stRecords = attendanceRecords.filter((r) => r.studentId === student.id);
      const total = stRecords.length;
      const presents = stRecords.filter((r) => r.status === 'present').length;
      const justified = stRecords.filter((r) => r.status === 'justified').length;
      const lates = stRecords.filter((r) => r.status === 'late').length;
      const rate = total > 0 ? Math.round(((presents + justified + lates * 0.5) / total) * 100) : 100;
      map.set(student.id, { rate, total, presents });
    });
    return map;
  }, [students, attendanceRecords]);

  // Set status for a single student on selectedDate
  const handleSetStatus = (student: Student, status: AttendanceStatus) => {
    const existingIndex = attendanceRecords.findIndex(
      (r) => r.studentId === student.id && r.date === selectedDate
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated = [...attendanceRecords];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        updatedAt: now,
      };
      onUpdateAttendance(updated);
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${student.id}`,
        studentId: student.id,
        classId: student.classId,
        date: selectedDate,
        status,
        recordedAt: now,
        updatedAt: now,
      };
      onUpdateAttendance([...attendanceRecords, newRecord]);
    }
  };

  // "Registrar presenças automaticamente por data"
  // Marks all currently filtered students as 'present' on selectedDate
  const handleMarkAllPresent = () => {
    const now = new Date().toISOString();
    const studentsToMark = filteredStudents;
    const newRecords = [...attendanceRecords];

    studentsToMark.forEach((student) => {
      const existingIdx = newRecords.findIndex(
        (r) => r.studentId === student.id && r.date === selectedDate
      );
      if (existingIdx >= 0) {
        newRecords[existingIdx] = {
          ...newRecords[existingIdx],
          status: 'present',
          updatedAt: now,
        };
      } else {
        newRecords.push({
          id: `att-${Date.now()}-${student.id}`,
          studentId: student.id,
          classId: student.classId,
          date: selectedDate,
          status: 'present',
          recordedAt: now,
          updatedAt: now,
        });
      }
    });

    onUpdateAttendance(newRecords);
  };

  // Save justification for a student
  const handleSaveJustification = (studentId: string) => {
    const recIndex = attendanceRecords.findIndex(
      (r) => r.studentId === studentId && r.date === selectedDate
    );
    const now = new Date().toISOString();

    if (recIndex >= 0) {
      const updated = [...attendanceRecords];
      updated[recIndex] = {
        ...updated[recIndex],
        justification: justificationText.trim(),
        updatedAt: now,
      };
      onUpdateAttendance(updated);
    } else {
      const student = students.find((s) => s.id === studentId);
      if (student) {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}-${studentId}`,
          studentId,
          classId: student.classId,
          date: selectedDate,
          status: 'justified',
          justification: justificationText.trim(),
          recordedAt: now,
          updatedAt: now,
        };
        onUpdateAttendance([...attendanceRecords, newRecord]);
      }
    }

    setEditingJustificationStudentId(null);
    setJustificationText('');
  };

  // Step dates
  const handleStepDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const currentTurma = turmas.find((t) => t.id === selectedTurmaId);

  return (
    <div className="space-y-6">
      {/* Top Banner / Classroom Information */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Língua Brasileira de Sinais</span>
              <span aria-hidden="true">·</span>
              <span>Diário Oficial de Frequência</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{selectedDate}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Chamada e Controle de Frequência
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {currentTurma
                ? `${currentTurma.name} — ${currentTurma.instructor} (${currentTurma.shift})`
                : 'Exibindo alunos de todas as turmas cadastradas.'}
            </p>
          </div>

          {/* Quick Date and Automatic Attendance action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => handleStepDate(-1)}
                title="Dia anterior"
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-mono font-medium text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
              <button
                onClick={() => handleStepDate(1)}
                title="Próximo dia"
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsQRScannerOpen(true)}
              title="Abrir leitor de QR Code para registrar presença automática dos alunos pela câmera"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Scan className="w-4 h-4 text-teal-600" />
              <span>Escanear QR de Presença</span>
            </button>

            <button
              onClick={handleMarkAllPresent}
              title="Registrar presença para todos os alunos selecionados nesta data"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Marcar Todos Presentes</span>
            </button>
          </div>
        </div>

        {/* Daily Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <span className="text-[11px] font-medium text-slate-500">Alunos na Turma</span>
            <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {dateStats.totalStudents}
            </div>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-2.5">
            <span className="text-[11px] font-medium text-emerald-800">Presentes (P)</span>
            <div className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
              {dateStats.presentCount}
            </div>
          </div>
          <div className="bg-rose-50/70 border border-rose-100 rounded-lg p-2.5">
            <span className="text-[11px] font-medium text-rose-800">Faltas (F)</span>
            <div className="text-lg font-bold font-mono text-rose-700 tabular-nums">
              {dateStats.absentCount}
            </div>
          </div>
          <div className="bg-sky-50/70 border border-sky-100 rounded-lg p-2.5">
            <span className="text-[11px] font-medium text-sky-800">Justificadas (J)</span>
            <div className="text-lg font-bold font-mono text-sky-700 tabular-nums">
              {dateStats.justifiedCount}
            </div>
          </div>
          <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2.5">
            <span className="text-[11px] font-medium text-amber-800">Atrasos (A)</span>
            <div className="text-lg font-bold font-mono text-amber-700 tabular-nums">
              {dateStats.lateCount}
            </div>
          </div>
          <div className="bg-teal-50/70 border border-teal-100 rounded-lg p-2.5">
            <span className="text-[11px] font-medium text-teal-800">Taxa do Dia</span>
            <div className="text-lg font-bold font-mono text-teal-700 tabular-nums">
              {dateStats.rate}%
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
        {/* Turma Segmented / Select */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <button
            onClick={() => setSelectedTurmaId('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              selectedTurmaId === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Todas ({students.length})
          </button>
          {turmas.map((t) => {
            const count = students.filter((s) => s.classId === t.id).length;
            const isSelected = selectedTurmaId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTurmaId(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {t.level} ({count})
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar aluno, RA ou sinal..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Students Attendance Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-3 w-16 text-center">QR</th>
                <th className="py-3 px-4 min-w-[200px]">Aluno & Sinal em Libras</th>
                <th className="py-3 px-4 min-w-[140px]">Turma / RA</th>
                <th className="py-3 px-4 min-w-[240px] text-center">Status no Dia ({selectedDate})</th>
                <th className="py-3 px-4 min-w-[130px] text-center">Freq. Global</th>
                <th className="py-3 px-4 min-w-[160px]">Observação / Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">Nenhum aluno encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajuste o filtro de turma ou cadastre novos alunos no sistema.
                    </p>
                    <button
                      onClick={onOpenAddStudent}
                      className="mt-3 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cadastrar Novo Aluno
                    </button>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const studentTurma = turmas.find((t) => t.id === student.classId);
                  const record = dateRecordsMap.get(student.id);
                  const currentStatus = record?.status;
                  const cumulative = studentCumulativeRates.get(student.id) || { rate: 100, total: 0, presents: 0 };
                  const isRisk = cumulative.rate < 75;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        currentStatus === 'absent' ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Row index */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>

                      {/* QR Code individual button */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForQR(student)}
                          title={`Gerar QR Code individual de ${student.name}`}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs group"
                        >
                          <QrCode className="w-4 h-4 text-slate-500 group-hover:text-teal-600" />
                        </button>
                      </td>

                      {/* Aluno & Sinal em Libras */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {student.name}
                            </div>
                            {student.librasSignName ? (
                              <div
                                title={student.librasSignDescription || 'Sinal pessoal em Libras'}
                                className="text-[11px] text-teal-700 flex items-center gap-1 mt-0.5 cursor-help"
                              >
                                <Sparkles className="w-3 h-3 text-teal-500 shrink-0" />
                                <span className="font-medium">{student.librasSignName}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Sinal não batizado
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Turma / RA */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          {studentTurma?.level || 'Turma'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                          {student.enrollmentId}
                        </div>
                      </td>

                      {/* Status Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button
                            onClick={() => handleSetStatus(student, 'present')}
                            title="Presente"
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                            }`}
                          >
                            P <span className="text-[10px] font-normal hidden md:inline">Presença</span>
                          </button>
                          <button
                            onClick={() => handleSetStatus(student, 'absent')}
                            title="Falta"
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-white'
                            }`}
                          >
                            F <span className="text-[10px] font-normal hidden md:inline">Falta</span>
                          </button>
                          <button
                            onClick={() => handleSetStatus(student, 'justified')}
                            title="Justificada (Atestado / Comunicação)"
                            className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                              currentStatus === 'justified'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-sky-700 hover:bg-white'
                            }`}
                          >
                            J <span className="text-[10px] font-normal hidden md:inline">Justif.</span>
                          </button>
                          <button
                            onClick={() => handleSetStatus(student, 'late')}
                            title="Atraso"
                            className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-amber-700 hover:bg-white'
                            }`}
                          >
                            A <span className="text-[10px] font-normal hidden md:inline">Atraso</span>
                          </button>
                        </div>
                      </td>

                      {/* Cumulative Attendance Rate */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-bold font-mono tabular-nums ${
                                isRisk ? 'text-rose-600' : 'text-slate-800'
                              }`}
                            >
                              {cumulative.rate}%
                            </span>
                            {isRisk && (
                              <span title="Abaixo do limite legal de 75% de frequência (MEC)">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isRisk ? 'bg-rose-500' : 'bg-teal-600'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, cumulative.rate))}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums">
                            {cumulative.presents}/{cumulative.total} aulas
                          </span>
                        </div>
                      </td>

                      {/* Justification / Note Field */}
                      <td className="py-3 px-4">
                        {editingJustificationStudentId === student.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={justificationText}
                              onChange={(e) => setJustificationText(e.target.value)}
                              placeholder="Ex: Atestado médico ou motivo..."
                              className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 w-full"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveJustification(student.id)}
                              className="px-2 py-1 text-[11px] bg-teal-600 text-white font-medium rounded hover:bg-teal-700"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingJustificationStudentId(null)}
                              className="px-1.5 py-1 text-[11px] text-slate-500 hover:text-slate-800"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1 group">
                            <span className="text-xs text-slate-600 truncate max-w-[140px]">
                              {record?.justification || (
                                <span className="text-slate-300 italic">—</span>
                              )}
                            </span>
                            <button
                              onClick={() => {
                                setEditingJustificationStudentId(student.id);
                                setJustificationText(record?.justification || '');
                              }}
                              title="Adicionar ou editar observação"
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition-opacity"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Individual QR Code Modal */}
      <StudentQRCodeModal
        isOpen={Boolean(selectedStudentForQR)}
        onClose={() => setSelectedStudentForQR(null)}
        student={selectedStudentForQR}
        turma={turmas.find((t) => t.id === selectedStudentForQR?.classId)}
        onRegisterPresenceToday={(studentId) => {
          const st = students.find((s) => s.id === studentId);
          if (st) handleSetStatus(st, 'present');
        }}
        isAlreadyPresentToday={
          selectedStudentForQR
            ? dateRecordsMap.get(selectedStudentForQR.id)?.status === 'present'
            : false
        }
      />

      {/* QR Code Presence Scanner Modal */}
      <QRCodeScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        students={students}
        turmas={turmas}
        currentDate={selectedDate}
        onRegisterPresence={(student) => {
          handleSetStatus(student, 'present');
        }}
      />
    </div>
  );
};
