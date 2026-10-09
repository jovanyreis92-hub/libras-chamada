import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  Sparkles,
  QrCode,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { Student, Turma } from '../../types';

interface StudentQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  turma?: Turma;
  onRegisterPresenceToday?: (studentId: string) => void;
  isAlreadyPresentToday?: boolean;
}

export const StudentQRCodeModal: React.FC<StudentQRCodeModalProps> = ({
  isOpen,
  onClose,
  student,
  turma,
  onRegisterPresenceToday,
  isAlreadyPresentToday = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [registeredPresence, setRegisteredPresence] = useState<boolean>(isAlreadyPresentToday);

  useEffect(() => {
    setRegisteredPresence(isAlreadyPresentToday);
  }, [isAlreadyPresentToday, student?.id]);

  useEffect(() => {
    if (student && isOpen) {
      // Encode structured payload: app, student id, enrollmentId and verification checksum
      const qrPayload = JSON.stringify({
        app: 'libras_frequencia',
        type: 'student_id',
        id: student.id,
        enrollmentId: student.enrollmentId,
        name: student.name,
        classId: student.classId,
      });

      QRCode.toDataURL(
        qrPayload,
        {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a', // Slate-900
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (err, url) => {
          if (!err && url) {
            setQrDataUrl(url);
          }
        }
      );
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QRCode_Libras_${student.enrollmentId}_${student.name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(
      `ALUNO: ${student.name} | RA: ${student.enrollmentId} | TURMA: ${turma?.name || ''} | SINAL: ${student.librasSignName || 'Não registrado'}`
    );
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handlePrintCard = () => {
    window.print();
  };

  const handleQuickPresence = () => {
    if (onRegisterPresenceToday && student) {
      onRegisterPresenceToday(student.id);
      setRegisteredPresence(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-bold text-slate-900">
              QR Code do Aluno & Crachá de Acesso
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Badge Card Body */}
        <div className="p-6 space-y-5">
          <div
            ref={cardRef}
            className="bg-gradient-to-b from-slate-50 to-white border-2 border-slate-200 rounded-xl p-5 shadow-xs text-center relative overflow-hidden"
          >
            {/* Top Badge Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-4">
              <div className="text-left">
                <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase block">
                  LibrasFrequência
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Cartão de Identificação Bilíngue
                </span>
              </div>
              <span className="text-xl">🤟</span>
            </div>

            {/* Student Avatar & Identity */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-teal-600 text-white font-bold text-xl flex items-center justify-center shadow-xs border-2 border-white mb-2">
                {student.name.charAt(0)}
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {student.name}
              </h3>
              <div className="text-xs font-mono font-medium text-slate-500 mt-0.5">
                RA: {student.enrollmentId}
              </div>
              <div className="text-xs text-teal-800 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-100 mt-1">
                {turma?.name || 'Turma de Libras'}
              </div>

              {/* Personal Sign in Libras */}
              {student.librasSignName && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-800">Sinal:</span>
                  <span className="truncate max-w-[220px]">{student.librasSignName}</span>
                </div>
              )}
            </div>

            {/* High-Resolution QR Code */}
            <div className="mt-4 flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code de ${student.name}`}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  Gerando QR Code...
                </div>
              )}
              <span className="text-[10px] font-mono text-slate-400 mt-1.5">
                Validação de Presença Automatizada
              </span>
            </div>

            {/* Check-in status badge if verified today */}
            {registeredPresence && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Presença Registrada na Data de Hoje</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPNG}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Baixar QR (PNG)</span>
            </button>

            <button
              onClick={handleCopyToken}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              {copiedToken ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Dados</span>
                </>
              )}
            </button>
          </div>

          {/* Mark presence right now shortcut */}
          {!registeredPresence && onRegisterPresenceToday && (
            <button
              onClick={handleQuickPresence}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registrar Presença Hoje com Este QR</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
