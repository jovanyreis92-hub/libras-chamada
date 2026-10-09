import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Camera,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  Upload,
  User,
  Sliders,
  Maximize2,
  FileCheck,
  StopCircle,
} from 'lucide-react';
import { VideoActivity, VideoSubmission, Student, Turma, VideoRubricScores } from '../../types';

interface VideoActivitiesManagerProps {
  activities: VideoActivity[];
  submissions: VideoSubmission[];
  students: Student[];
  turmas: Turma[];
  onUpdateSubmissions: (submissions: VideoSubmission[]) => void;
}

export const VideoActivitiesManager: React.FC<VideoActivitiesManagerProps> = ({
  activities,
  submissions,
  students,
  turmas,
  onUpdateSubmissions,
}) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // New submission mode ('upload', 'record', 'view')
  const [isRecordingOrUploading, setIsRecordingOrUploading] = useState<boolean>(false);
  const [submissionType, setSubmissionType] = useState<'upload' | 'record'>('record');

  // Video player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Live recording state with MediaRecorder
  const liveVideoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [recordTimerSeconds, setRecordTimerSeconds] = useState<number>(0);
  const recordIntervalRef = useRef<any>(null);

  // New submission form fields
  const [submittingStudentId, setSubmittingStudentId] = useState<string>(students[0]?.id || '');
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [externalVideoUrl, setExternalVideoUrl] = useState<string>('');

  // Teacher Rubric scoring state
  const [rubricScores, setRubricScores] = useState<VideoRubricScores>({
    handConfig: 9.0,
    articulationPoint: 9.0,
    movement: 8.5,
    orientation: 9.0,
    facialExpression: 9.5,
  });
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');

  const currentActivity = activities.find((a) => a.id === selectedActivityId);

  // Submissions for this activity
  const activitySubmissions = submissions.filter((s) => s.activityId === selectedActivityId);

  // Current active submission for playback and grading
  const activeSubmission = selectedSubmissionId
    ? submissions.find((s) => s.id === selectedSubmissionId)
    : activitySubmissions[0] || null;

  // Sync rubric state when active submission changes
  useEffect(() => {
    if (activeSubmission) {
      if (activeSubmission.rubricScores) {
        setRubricScores(activeSubmission.rubricScores);
      } else {
        setRubricScores({
          handConfig: 8.5,
          articulationPoint: 8.5,
          movement: 8.5,
          orientation: 8.5,
          facialExpression: 8.5,
        });
      }
      setTeacherFeedback(activeSubmission.teacherFeedback || '');
    }
  }, [activeSubmission?.id]);

  // Adjust video playback rate whenever playbackSpeed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeSubmission]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Start webcam for recording
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (liveVideoPreviewRef.current) {
        liveVideoPreviewRef.current.srcObject = stream;
        liveVideoPreviewRef.current.play();
      }
    } catch (err) {
      console.warn('Câmera indisponível ou permissão negada:', err);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }
  };

  // Start recording video in browser
  const handleStartRecording = () => {
    if (!mediaStreamRef.current) return;
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setRecordTimerSeconds(0);

    const recorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };

    recorder.onstop = () => {
      // Recorded chunks will be converted to blob
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    recordIntervalRef.current = setInterval(() => {
      setRecordTimerSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Stop recording video
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }

      setTimeout(() => {
        setRecordedChunks((chunks) => {
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedVideoUrl(url);
          }
          return chunks;
        });
      }, 500);
    }
  };

  // Submit student video activity
  const handleSubmitVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl =
      recordedVideoUrl ||
      externalVideoUrl.trim() ||
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

    const newSub: VideoSubmission = {
      id: `sub-${Date.now()}`,
      activityId: selectedActivityId,
      studentId: submittingStudentId,
      submittedAt: new Date().toISOString(),
      videoUrl: finalUrl,
      durationSeconds: recordTimerSeconds || 60,
      studentNotes: studentNotes.trim(),
      status: 'pending',
    };

    onUpdateSubmissions([newSub, ...submissions]);
    setSelectedSubmissionId(newSub.id);
    setIsRecordingOrUploading(false);
    stopCamera();
    setRecordedVideoUrl(null);
    setExternalVideoUrl('');
    setStudentNotes('');
  };

  // Save Teacher Evaluation (Rubric & Feedback)
  const handleSaveEvaluation = () => {
    if (!activeSubmission) return;

    // Calculate weighted average (all parameters 20% each)
    const avgGrade = Number(
      (
        (rubricScores.handConfig +
          rubricScores.articulationPoint +
          rubricScores.movement +
          rubricScores.orientation +
          rubricScores.facialExpression) /
        5
      ).toFixed(1)
    );

    const updated = submissions.map((s) => {
      if (s.id === activeSubmission.id) {
        return {
          ...s,
          status: 'graded' as const,
          rubricScores,
          grade: avgGrade,
          teacherFeedback: teacherFeedback.trim(),
          reviewedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    onUpdateSubmissions(updated);
  };

  const activeStudent = activeSubmission
    ? students.find((s) => s.id === activeSubmission.studentId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header and Activity Selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Produção & Interpretação Visual</span>
              <span aria-hidden="true">·</span>
              <span>Laboratório de Vídeos em Libras</span>
              <span aria-hidden="true">·</span>
              <span>Rubrica dos 5 Parâmetros</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Envio e Avaliação de Atividades em Vídeo
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Prática sinalizada com gravação pela webcam, análise em câmera lenta e modo espelho.
            </p>
          </div>

          {/* Action button: Nova Gravação / Submissão */}
          <button
            onClick={() => {
              setIsRecordingOrUploading(true);
              startCamera();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer self-start lg:self-auto"
          >
            <Camera className="w-4 h-4" />
            <span>Gravar / Enviar Novo Vídeo</span>
          </button>
        </div>

        {/* Activity Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto mt-4 pt-4 border-t border-slate-100 pb-1">
          {activities.map((act) => {
            const isSelected = act.id === selectedActivityId;
            const subCount = submissions.filter((s) => s.activityId === act.id).length;
            return (
              <button
                key={act.id}
                onClick={() => {
                  setSelectedActivityId(act.id);
                  setSelectedSubmissionId(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {act.title.split(':')[0]} ({subCount})
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal / Panel for Submitting New Video */}
      {isRecordingOrUploading && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Submissão de Atividade em Vídeo
                </h3>
                <p className="text-xs text-slate-500">{currentActivity?.title}</p>
              </div>
              <button
                onClick={() => {
                  setIsRecordingOrUploading(false);
                  stopCamera();
                }}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmitVideo} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Selecione o Aluno
                  </label>
                  <select
                    value={submittingStudentId}
                    onChange={(e) => setSubmittingStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.enrollmentId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Método de Envio
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmissionType('record');
                        startCamera();
                      }}
                      className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        submissionType === 'record'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Gravar Webcam
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmissionType('upload');
                        stopCamera();
                      }}
                      className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        submissionType === 'upload'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Arquivo / Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Webcam recording viewport */}
              {submissionType === 'record' && (
                <div className="bg-slate-950 rounded-lg p-3 text-center">
                  <div className="relative aspect-video max-h-64 mx-auto bg-slate-900 rounded overflow-hidden flex items-center justify-center">
                    {recordedVideoUrl ? (
                      <video
                        src={recordedVideoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        ref={liveVideoPreviewRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-contain -scale-x-100"
                      />
                    )}

                    {isRecording && (
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-rose-600 text-white text-[11px] font-mono px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full" />
                        <span>GRAVANDO ({recordTimerSeconds}s)</span>
                      </div>
                    )}
                  </div>

                  {/* Record buttons */}
                  <div className="flex items-center justify-center gap-3 mt-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Iniciar Gravação</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        <StopCircle className="w-4 h-4" />
                        <span>Finalizar Gravação</span>
                      </button>
                    )}

                    {recordedVideoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setRecordedVideoUrl(null);
                          startCamera();
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                      >
                        Gravar Novamente
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Upload or external video link */}
              {submissionType === 'upload' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Link do Vídeo (YouTube, Google Drive, Loom ou MP4)
                    </label>
                    <input
                      type="url"
                      value={externalVideoUrl}
                      onChange={(e) => setExternalVideoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                    <span className="text-[11px] text-slate-400">
                      Caso deixe vazio, um vídeo demonstrativo de Libras será atribuído.
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notas do Aluno sobre a Gravação
                </label>
                <textarea
                  rows={2}
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="Ex: Foco no sinal pessoal, atenção às configurações de mão..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordingOrUploading(false);
                    stopCamera();
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submeter Vídeo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Two-Zone Studio Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Submissions Queue for this Activity (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-900">
                Envios dos Alunos ({activitySubmissions.length})
              </h2>
              <span className="text-[11px] text-slate-500">
                {activitySubmissions.filter((s) => s.status === 'graded').length} avaliados
              </span>
            </div>

            {activitySubmissions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Nenhum vídeo enviado ainda para esta atividade.
              </div>
            ) : (
              <div className="space-y-2">
                {activitySubmissions.map((sub) => {
                  const student = students.find((s) => s.id === sub.studentId);
                  const isSelected = activeSubmission?.id === sub.id;

                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubmissionId(sub.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0">
                            {student?.name.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 leading-tight">
                              {student?.name || 'Aluno'}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {student?.enrollmentId}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {sub.status === 'graded' ? (
                            <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded font-mono">
                              Nota {sub.grade}
                            </span>
                          ) : sub.status === 'reviewing' ? (
                            <span className="text-[10px] font-medium text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              Em Análise
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded">
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>

                      {student?.librasSignName && (
                        <div className="text-[11px] text-teal-700 mt-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-teal-500" />
                          <span>{student.librasSignName}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Guidelines Card */}
          {currentActivity && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <span className="font-semibold text-slate-900 block">
                Diretrizes da Atividade:
              </span>
              <p className="text-slate-600 leading-relaxed">{currentActivity.description}</p>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">
                  Sinais em Foco:
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentActivity.targetSigns.map((sign, i) => (
                    <span
                      key={i}
                      className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono"
                    >
                      {sign}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Visual Player & Libras Rubric Evaluator (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeSubmission ? (
            <>
              {/* Visual Player with Libras-Specific Controls */}
              <div className="bg-slate-950 rounded-xl p-4 text-white shadow-sm border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      Vídeo de {activeStudent?.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({activeStudent?.enrollmentId})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-teal-400 font-mono">
                      Velocidade: {playbackSpeed}x
                    </span>
                  </div>
                </div>

                {/* Video Stage */}
                <div className="relative aspect-video max-h-[420px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={activeSubmission.videoUrl}
                    loop={isLooping}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className={`w-full h-full object-contain transition-transform duration-200 ${
                      isMirrored ? '-scale-x-100' : 'scale-x-100'
                    }`}
                  />
                </div>

                {/* Libras Pedagogical Player Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800">
                  {/* Left: Playback & Loop */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="p-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-white transition-colors cursor-pointer"
                      title={isPlaying ? 'Pausar' : 'Reproduzir'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => setIsLooping(!isLooping)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        isLooping
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title="Repetição contínua para estudo do movimento"
                    >
                      Loop {isLooping ? 'Ativo' : 'Desativado'}
                    </button>

                    {/* Mirror Mode button (Fundamental for Libras signers!) */}
                    <button
                      onClick={() => setIsMirrored(!isMirrored)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        isMirrored
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title="Espelhar o sinal horizontalmente (Modo Espelho)"
                    >
                      🪞 Modo Espelho {isMirrored ? 'Ligado' : 'Desligado'}
                    </button>
                  </div>

                  {/* Right: Slow Motion / Playback speed selectors */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 px-1 font-medium">Velocidade:</span>
                    {[0.25, 0.5, 0.75, 1.0, 1.25].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer transition-colors ${
                          playbackSpeed === speed
                            ? 'bg-teal-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {activeSubmission.studentNotes && (
                  <div className="mt-3 text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-300 font-semibold block mb-0.5">
                      Comentário do Aluno:
                    </span>
                    {activeSubmission.studentNotes}
                  </div>
                )}
              </div>

              {/* Rubric Evaluation Deck for the Teacher */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Rubrica de Avaliação dos 5 Parâmetros Fonológicos
                    </h3>
                    <p className="text-xs text-slate-500">
                      Atribua nota de 0 a 10 para cada parâmetro linguístico da Libras.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Média Ponderada:</span>
                    <div className="text-xl font-bold font-mono text-teal-700 tabular-nums">
                      {(
                        (rubricScores.handConfig +
                          rubricScores.articulationPoint +
                          rubricScores.movement +
                          rubricScores.orientation +
                          rubricScores.facialExpression) /
                        5
                      ).toFixed(1)}
                      <span className="text-xs text-slate-400 font-normal"> / 10</span>
                    </div>
                  </div>
                </div>

                {/* 5 Parameters Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CM */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">1. Configuração de Mão (CM)</span>
                      <span className="font-mono font-bold text-teal-700">{rubricScores.handConfig}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={rubricScores.handConfig}
                      onChange={(e) =>
                        setRubricScores({ ...rubricScores, handConfig: parseFloat(e.target.value) })
                      }
                      className="w-full accent-teal-600"
                    />
                    <span className="text-[10px] text-slate-400 block">Exatidão do desenho dos dedos</span>
                  </div>

                  {/* PA */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">2. Ponto de Articulação (PA)</span>
                      <span className="font-mono font-bold text-teal-700">{rubricScores.articulationPoint}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={rubricScores.articulationPoint}
                      onChange={(e) =>
                        setRubricScores({ ...rubricScores, articulationPoint: parseFloat(e.target.value) })
                      }
                      className="w-full accent-teal-600"
                    />
                    <span className="text-[10px] text-slate-400 block">Localização precisa no corpo ou espaço</span>
                  </div>

                  {/* M */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">3. Movimento (M)</span>
                      <span className="font-mono font-bold text-teal-700">{rubricScores.movement}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={rubricScores.movement}
                      onChange={(e) =>
                        setRubricScores({ ...rubricScores, movement: parseFloat(e.target.value) })
                      }
                      className="w-full accent-teal-600"
                    />
                    <span className="text-[10px] text-slate-400 block">Direcionalidade e dinamismo</span>
                  </div>

                  {/* O */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">4. Orientação da Palma (O)</span>
                      <span className="font-mono font-bold text-teal-700">{rubricScores.orientation}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={rubricScores.orientation}
                      onChange={(e) =>
                        setRubricScores({ ...rubricScores, orientation: parseFloat(e.target.value) })
                      }
                      className="w-full accent-teal-600"
                    />
                    <span className="text-[10px] text-slate-400 block">Direção para onde aponta a palma</span>
                  </div>

                  {/* EFNM */}
                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        5. Expressão Facial & Corporal (EFNM)
                      </span>
                      <span className="font-mono font-bold text-teal-700">
                        {rubricScores.facialExpression}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={rubricScores.facialExpression}
                      onChange={(e) =>
                        setRubricScores({
                          ...rubricScores,
                          facialExpression: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-teal-600"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Expressividade não-manual gramatical e entonação visual
                    </span>
                  </div>
                </div>

                {/* Feedback text area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Feedback Descritivo do Docente / Instrutor
                  </label>
                  <textarea
                    rows={3}
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    placeholder="Escreva comentários construtivos para o estudante, orientações sobre soltura do punho, nitidez do sinal..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Save evaluation button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveEvaluation}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Salvar Avaliação & Devolver ao Aluno</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
              <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">Nenhum vídeo selecionado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Selecione uma submissão na lista à esquerda ou clique em &ldquo;Gravar / Enviar Novo Vídeo&rdquo;
                para praticar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
