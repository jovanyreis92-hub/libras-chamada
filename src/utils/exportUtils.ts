import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Turma, AttendanceRecord, VideoSubmission, VideoActivity } from '../types';

export interface AttendanceSummary {
  student: Student;
  turma: Turma | undefined;
  totalClasses: number;
  presents: number;
  absents: number;
  justified: number;
  lates: number;
  rate: number;
  status: 'Apto (Regular)' | 'Em Risco (< 75%)';
}

export const computeAttendanceSummary = (
  students: Student[],
  turmas: Turma[],
  records: AttendanceRecord[],
  selectedTurmaId?: string
): AttendanceSummary[] => {
  const filteredStudents = selectedTurmaId && selectedTurmaId !== 'all'
    ? students.filter(s => s.classId === selectedTurmaId)
    : students;

  const turmaMap = new Map(turmas.map(t => [t.id, t]));

  return filteredStudents.map(student => {
    const studentRecords = records.filter(r => r.studentId === student.id);
    const totalClasses = studentRecords.length;
    const presents = studentRecords.filter(r => r.status === 'present').length;
    const absents = studentRecords.filter(r => r.status === 'absent').length;
    const justified = studentRecords.filter(r => r.status === 'justified').length;
    const lates = studentRecords.filter(r => r.status === 'late').length;

    // Presença legal (presente ou justificado conta como frequência válida)
    const effectivePresent = presents + justified + (lates * 0.5);
    const rate = totalClasses > 0 ? Math.round((effectivePresent / totalClasses) * 100) : 100;

    return {
      student,
      turma: turmaMap.get(student.classId),
      totalClasses,
      presents,
      absents,
      justified,
      lates,
      rate,
      status: rate >= 75 ? 'Apto (Regular)' : 'Em Risco (< 75%)',
    };
  });
};

/**
 * Exporta para arquivo Excel (.xlsx) completo com planilhas de Frequência e Atividades
 */
export const exportToExcel = (
  summaryList: AttendanceSummary[],
  records: AttendanceRecord[],
  turmaName: string = 'Geral'
) => {
  const wb = XLSX.utils.book_new();

  // 1. Planilha Resumo de Frequência
  const summaryRows = summaryList.map((item, index) => ({
    'Nº': index + 1,
    'Matrícula/RA': item.student.enrollmentId,
    'Nome do Aluno': item.student.name,
    'Turma': item.turma?.name || 'Não informada',
    'Sinal em Libras': item.student.librasSignName || 'Não registrado',
    'Total de Aulas': item.totalClasses,
    'Presenças': item.presents,
    'Faltas': item.absents,
    'Justificadas': item.justified,
    'Atrasos': item.lates,
    'Frequência (%)': `${item.rate}%`,
    'Situação': item.status,
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Frequência Geral');

  // 2. Planilha Matriz Diária
  // Obter todas as datas únicas ordenadas
  const uniqueDates = Array.from(new Set(records.map(r => r.date))).sort();
  const matrixRows = summaryList.map(item => {
    const row: Record<string, string | number> = {
      'Matrícula': item.student.enrollmentId,
      'Nome': item.student.name,
      'Turma': item.turma?.name || '',
    };

    uniqueDates.forEach(date => {
      const rec = records.find(r => r.studentId === item.student.id && r.date === date);
      if (!rec) {
        row[date] = '-';
      } else {
        const symbol = rec.status === 'present' ? 'P' : rec.status === 'absent' ? 'F' : rec.status === 'justified' ? 'J' : 'A';
        row[date] = symbol;
      }
    });

    row['Taxa (%)'] = `${item.rate}%`;
    return row;
  });

  const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Diário por Data');

  const todayStr = new Date().toISOString().slice(0, 10);
  const cleanTurma = turmaName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Libras_Frequencia_${cleanTurma}_${todayStr}.xlsx`);
};

/**
 * Exporta para PDF oficial e elegante para impressão ou arquivo
 */
export const exportToPDF = (
  summaryList: AttendanceSummary[],
  turmaTitle: string = 'Todas as Turmas',
  instructorName: string = 'Coordenação Pedagógica de Libras'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const todayStr = new Date().toLocaleDateString('pt-BR');

  // Cabeçalho Oficial
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LIBRAS FREQUÊNCIA — DIÁRIO OFICIAL DE CLASSE', 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema Integrado de Gestão de Frequência, Atividades em Vídeo e Glossário Terminológico', 14, 18);

  // Metadados do Relatório
  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Turma: ${turmaTitle}`, 14, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(`Instrutor(a): ${instructorName}`, 14, 37);
  doc.text(`Data de Emissão: ${todayStr}`, 140, 32);

  // Resumo de Indicadores
  const totalStudents = summaryList.length;
  const avgRate = totalStudents > 0
    ? Math.round(summaryList.reduce((acc, curr) => acc + curr.rate, 0) / totalStudents)
    : 0;
  const inRiskCount = summaryList.filter(s => s.rate < 75).length;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 42, 182, 14, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total de Alunos: ${totalStudents}`, 20, 50);
  doc.text(`Média de Frequência: ${avgRate}%`, 80, 50);
  doc.setTextColor(inRiskCount > 0 ? 220 : 15, inRiskCount > 0 ? 38 : 23, inRiskCount > 0 ? 38 : 42);
  doc.text(`Alunos em Alerta (<75%): ${inRiskCount}`, 140, 50);

  // Tabela com autoTable
  const tableData = summaryList.map((item, idx) => [
    (idx + 1).toString(),
    item.student.enrollmentId,
    item.student.name,
    item.turma ? item.turma.name.split('-')[0].trim() : '-',
    item.totalClasses.toString(),
    item.presents.toString(),
    item.absents.toString(),
    `${item.justified}/${item.lates}`,
    `${item.rate}%`,
    item.status === 'Apto (Regular)' ? 'APTO' : 'EM RISCO',
  ]);

  autoTable(doc, {
    startY: 61,
    head: [['#', 'Matrícula', 'Nome do Aluno', 'Turma', 'Aulas', 'P', 'F', 'J/A', 'Freq.', 'Situação']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [13, 148, 136], // Teal-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 26 },
      2: { halign: 'left', cellWidth: 54 },
      3: { halign: 'left', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 10 },
      6: { halign: 'center', cellWidth: 10 },
      7: { halign: 'center', cellWidth: 12 },
      8: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
      9: { halign: 'center', cellWidth: 18 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        if (data.cell.raw === 'EM RISCO') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 101, 52];
        }
      }
    },
  });

  // Rodapé e Assinaturas
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 240;

  if (finalY < 265) {
    doc.setDrawColor(203, 213, 225);
    doc.line(25, finalY + 15, 85, finalY + 15);
    doc.line(125, finalY + 15, 185, finalY + 15);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Assinatura do(a) Docente / TILS', 30, finalY + 20);
    doc.text('Coordenação do Curso de Libras', 130, finalY + 20);
  }

  // Número de páginas
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} — Documento emitido pelo Sistema LibrasFrequência`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`Relatorio_Frequencia_Libras_${todayStr.replace(/\//g, '-')}.pdf`);
};

/**
 * Gera string CSV com UTF-8 BOM para download direto compatível com Excel e Planilhas
 */
export const exportToCSV = (summaryList: AttendanceSummary[]): string => {
  const headers = ['Matrícula', 'Nome Completo', 'Turma', 'Sinal Pessoal', 'Total Aulas', 'Presenças', 'Faltas', 'Justificadas', 'Atrasos', 'Percentual Frequência', 'Situação'];
  const rows = summaryList.map(item => [
    `"${item.student.enrollmentId}"`,
    `"${item.student.name}"`,
    `"${item.turma?.name || ''}"`,
    `"${item.student.librasSignName || ''}"`,
    item.totalClasses,
    item.presents,
    item.absents,
    item.justified,
    item.lates,
    `"${item.rate}%"`,
    `"${item.status}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  return csvContent;
};

/**
 * Copia dados tabulares no formato TSV para colar diretamente no Google Planilhas
 */
export const copyForGoogleSheets = async (summaryList: AttendanceSummary[]): Promise<boolean> => {
  try {
    const headers = ['Matrícula', 'Nome', 'Turma', 'Aulas', 'Presenças', 'Faltas', 'Justificadas', 'Atrasos', '% Frequência', 'Situação'];
    const lines = [
      headers.join('\t'),
      ...summaryList.map(item =>
        [
          item.student.enrollmentId,
          item.student.name,
          item.turma?.name || '',
          item.totalClasses,
          item.presents,
          item.absents,
          item.justified,
          item.lates,
          `${item.rate}%`,
          item.status,
        ].join('\t')
      ),
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    return true;
  } catch (err) {
    console.error('Falha ao copiar para clipboard', err);
    return false;
  }
};
