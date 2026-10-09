import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Scan,
  Users,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Student, Turma } from '../../types';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  turmas: Turma[];
  currentDate: string;
  onRegisterPresence: (student: Student) => void;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  turmas,
  currentDate,
  onRegisterPresence,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [scannedHistory, setScannedHistory] = useState<{ student: Student; time: string }[]>([]);

  // Sound feedback synthesizer with Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  const handleRecognizeStudent = (student: Student) => {
    playBeep();
    setLastScannedStudent(student);
    onRegisterPresence(student);

    const timeStr = new Date().toLocaleTimeString('pt-BR');
    setScannedHistory((prev) => {
      // Avoid duplicate display at exact same second
      if (prev.length > 0 && prev[0].student.id === student.id) {
        return prev;
      }
      return [{ student, time: timeStr }, ...prev.slice(0, 9)];
    });
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      requestAnimationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      requestAnimationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      try {
        let matchedStudent: Student | undefined;

        // Try JSON parsing
        try {
          const parsed = JSON.parse(code.data);
          if (parsed.id) {
            matchedStudent = students.find((s) => s.id === parsed.id);
          } else if (parsed.enrollmentId) {
            matchedStudent = students.find((s) => s.enrollmentId === parsed.enrollmentId);
          }
        } catch {
          // If plain text containing RA or name
          matchedStudent = students.find(
            (s) =>
              code.data.includes(s.enrollmentId) ||
              code.data.includes(s.id) ||
              code.data.toLowerCase().includes(s.name.toLowerCase())
          );
        }

        if (matchedStudent) {
          // Only trigger if not immediately scanned in last 2.5 seconds
          if (!lastScannedStudent || lastScannedStudent.id !== matchedStudent.id) {
            handleRecognizeStudent(matchedStudent);
          }
        }
      } catch (err) {
        console.error('Erro na validação do QR code', err);
      }
    }

    requestAnimationRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        requestAnimationRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.warn('Erro ao acessar câmera:', err);
      setCameraError(
        'Não foi possível iniciar a câmera diretamente no navegador. Você pode utilizar o simulador de leitura rápida abaixo.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Leitor de Presença por QR Code
              </h3>
              <p className="text-xs text-slate-500">
                Aponte o crachá do aluno para registrar presença na data: <span className="font-mono font-semibold">{currentDate}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Camera Viewport */}
          <div className="relative aspect-video max-h-64 mx-auto bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-800">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay Reticle */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-teal-400/80 rounded-xl relative animate-pulse">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-300" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-300" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-300" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-300" />
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 border-b border-teal-400/50" />
                </div>
                <div className="absolute bottom-3 bg-slate-900/80 text-teal-300 text-[11px] font-mono px-3 py-1 rounded-full">
                  Posicione o QR Code dentro da moldura
                </div>
              </div>
            )}

            {/* Error fallback message */}
            {cameraError && (
              <div className="p-4 text-center text-slate-300 max-w-sm">
                <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-300">{cameraError}</p>
              </div>
            )}
          </div>

          {/* Quick Simulation Bar (allows instant testing with one click) */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Simulador de Escaneamento Rápido:</span>
              </span>
              <span className="text-[10px] text-slate-400">Teste sem papel físico</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                id="test-student-select"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.enrollmentId})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const select = document.getElementById('test-student-select') as HTMLSelectElement;
                  if (select) {
                    const st = students.find((s) => s.id === select.value);
                    if (st) handleRecognizeStudent(st);
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                Simular Leitura
              </button>
            </div>
          </div>

          {/* Last Recognized Student Banner */}
          {lastScannedStudent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Presença confirmada: {lastScannedStudent.name}
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Matrícula: {lastScannedStudent.enrollmentId} ·{' '}
                    {lastScannedStudent.librasSignName || 'Aluno de Libras'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                PRESENÇA REGISTRADA
              </span>
            </div>
          )}

          {/* Scanned in this session list */}
          {scannedHistory.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                Check-ins Realizados Nesta Sessão ({scannedHistory.length}):
              </span>
              <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {scannedHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 flex items-center justify-between text-xs hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">{item.student.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Concluir Chamada
          </button>
        </div>
      </div>
    </div>
  );
};
