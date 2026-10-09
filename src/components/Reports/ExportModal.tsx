import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Copy,
  Download,
  X,
  Check,
  Filter,
  CheckCircle2,
  Table,
} from 'lucide-react';
import { Student, Turma, AttendanceRecord } from '../../types';
import {
  computeAttendanceSummary,
  exportToExcel,
  exportToPDF,
  exportToCSV,
  copyForGoogleSheets,
} from '../../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  turmas: Turma[];
  attendanceRecords: AttendanceRecord[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  students,
  turmas,
  attendanceRecords,
}) => {
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('all');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const summaryList = useMemo(() => {
    return computeAttendanceSummary(students, turmas, attendanceRecords, selectedTurmaId);
  }, [students, turmas, attendanceRecords, selectedTurmaId]);

  if (!isOpen) return null;

  const currentTurma = turmas.find((t) => t.id === selectedTurmaId);
  const turmaTitle = currentTurma ? currentTurma.name : 'Todas as Turmas de Libras';
  const instructor = currentTurma ? currentTurma.instructor : 'Coordenação Pedagógica de Libras';

  const handleDownloadPDF = () => {
    exportToPDF(summaryList, turmaTitle, instructor);
  };

  const handleDownloadExcel = () => {
    exportToExcel(summaryList, attendanceRecords, currentTurma ? currentTurma.name : 'Geral');
  };

  const handleDownloadCSV = () => {
    const csvData = exportToCSV(summaryList);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Frequencia_Libras_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySheets = async () => {
    const success = await copyForGoogleSheets(summaryList);
    if (success) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Exportação Oficial de Relatórios e Planilhas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gere documentos em PDF, planilhas Excel (.xlsx) e dados tabulares para o Google Planilhas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Turma Filter & Export Format Cards */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Filtrar por Turma:</span>
              <select
                value={selectedTurmaId}
                onChange={(e) => setSelectedTurmaId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Todas as Turmas ({students.length} alunos)</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              {summaryList.length} alunos selecionados
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* PDF Button */}
            <button
              onClick={handleDownloadPDF}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer group text-center"
            >
              <FileText className="w-6 h-6 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900">Relatório em PDF</span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Layout oficial timbrado pronto para impressão
              </span>
              <span className="mt-2 text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Baixar .PDF
              </span>
            </button>

            {/* Excel Button */}
            <button
              onClick={handleDownloadExcel}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer group text-center"
            >
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900">Planilha Excel (.xlsx)</span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Pastas de trabalho com resumo e matriz diária
              </span>
              <span className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Baixar .XLSX
              </span>
            </button>

            {/* Google Sheets / CSV Button */}
            <div className="flex flex-col justify-between p-4 rounded-xl border border-teal-200 bg-teal-50/50 hover:border-teal-300 transition-all text-center">
              <div>
                <Table className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-900">Planilhas & CSV</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Copie direto para o Google Planilhas ou baixe CSV
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 justify-center">
                <button
                  onClick={handleCopySheets}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded transition-colors cursor-pointer"
                  title="Copiar dados para colar (Ctrl+V) no Google Sheets"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar p/ Planilhas</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  .CSV
                </button>
              </div>
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Pré-visualização dos Dados para Exportação:
              </span>
              <span className="text-[11px] text-slate-400">
                Mostrando {summaryList.length} registros
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-[11px] text-slate-600">
                  <tr>
                    <th className="py-2 px-3">RA</th>
                    <th className="py-2 px-3">Aluno</th>
                    <th className="py-2 px-3">Turma</th>
                    <th className="py-2 px-3 text-center">Aulas</th>
                    <th className="py-2 px-3 text-center">Presenças</th>
                    <th className="py-2 px-3 text-center">Faltas</th>
                    <th className="py-2 px-3 text-center">% Freq.</th>
                    <th className="py-2 px-3 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryList.map((item) => (
                    <tr key={item.student.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-slate-500 tabular-nums">
                        {item.student.enrollmentId}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {item.student.name}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {item.turma?.level || '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-mono tabular-nums">
                        {item.totalClasses}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-emerald-700 font-semibold tabular-nums">
                        {item.presents}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-rose-700 font-semibold tabular-nums">
                        {item.absents}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold tabular-nums">
                        {item.rate}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            item.status === 'Apto (Regular)'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
