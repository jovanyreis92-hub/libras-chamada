import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Video,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Clock,
  BookCheck,
  Eye,
} from 'lucide-react';
import { StudyModule, StudyMaterial } from '../../types';

interface StudyModulesViewProps {
  modules: StudyModule[];
}

// Hand shape representations for the visual datilologia tool
const DATILOLOGIA_MAP: Record<string, { letter: string; desc: string; icon: string }> = {
  A: { letter: 'A', desc: 'Punho fechado com polegar encostado na lateral do indicador', icon: '✊' },
  B: { letter: 'B', desc: 'Quatro dedos estendidos para cima, polegar cruzado sobre a palma', icon: '✋' },
  C: { letter: 'C', desc: 'Mão em formato de concha ou arco curvo', icon: '🤏' },
  D: { letter: 'D', desc: 'Indicador apontando para cima, demais dedos formam círculo com o polegar', icon: '☝️' },
  E: { letter: 'E', desc: 'Todos os dedos curvados tocando as pontas no polegar', icon: '🤜' },
  F: { letter: 'F', desc: 'Indicador dobra encostando na ponta do polegar, que fica POR FORA', icon: '👌' },
  G: { letter: 'G', desc: 'Indicador apontando para cima, polegar paralelo ao lado', icon: '👆' },
  H: { letter: 'H', desc: 'Dedos indicador e médio estendidos horizontalmente com giro de punho', icon: '✌️' },
  I: { letter: 'I', desc: 'Apenas o dedo mínimo (mindinho) estendido para cima', icon: '🤙' },
  J: { letter: 'J', desc: 'Dedo mínimo estendido desenhando a letra J no ar', icon: '🤙' },
  K: { letter: 'K', desc: 'Indicador e médio abertos com polegar entre eles, impulso para cima', icon: '✌️' },
  L: { letter: 'L', desc: 'Formato clássico de L com polegar e indicador em 90 graus', icon: '👆' },
  M: { letter: 'M', desc: 'Três dedos apontando verticalmente para baixo', icon: '👇' },
  N: { letter: 'N', desc: 'Dois dedos apontando verticalmente para baixo', icon: '👇' },
  O: { letter: 'O', desc: 'Todos os dedos e polegar formando um círculo oval fechado', icon: '👌' },
  P: { letter: 'P', desc: 'Mão em K com os dedos apontando horizontalmente para a frente', icon: '👉' },
  Q: { letter: 'Q', desc: 'Indicador e polegar apontando para baixo paralelos', icon: '👇' },
  R: { letter: 'R', desc: 'Dedos indicador e médio cruzados (como figa/torcida)', icon: '🤞' },
  S: { letter: 'S', desc: 'Punho fechado com o polegar cruzado POR CIMA dos dedos', icon: '✊' },
  T: { letter: 'T', desc: 'Indicador dobra e o polegar fica POR DENTRO (par mínimo com F)', icon: '👊' },
  U: { letter: 'U', desc: 'Indicador e médio estendidos e bem unidos para cima', icon: '✌️' },
  V: { letter: 'V', desc: 'Indicador e médio estendidos e abertos formando a letra V', icon: '✌️' },
  W: { letter: 'W', desc: 'Três dedos centrais estendidos para cima (indicador, médio, anelar)', icon: '🖐️' },
  X: { letter: 'X', desc: 'Indicador curvado em forma de gancho puxando para trás', icon: '☝️' },
  Y: { letter: 'Y', desc: 'Mão com polegar e mínimo estendidos (sinal do hang-loose)', icon: '🤙' },
  Z: { letter: 'Z', desc: 'Indicador estendido desenhando a letra Z no ar', icon: '👉' },
};

export const StudyModulesView: React.FC<StudyModulesViewProps> = ({ modules }) => {
  const [expandedModuleId, setExpandedModuleId] = useState<string>(modules[0]?.id || '');
  const [activeVideoModalUrl, setActiveVideoModalUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');

  // Interactive Datilologia Speller
  const [spellerText, setSpellerText] = useState<string>('LIBRAS');

  const cleanLetters = spellerText
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '')
    .split('');

  const toggleExpand = (modId: string) => {
    setExpandedModuleId(expandedModuleId === modId ? '' : modId);
  };

  const handleDownloadMaterial = (mat: StudyMaterial) => {
    // Generate simulated official PDF download
    const blob = new Blob(
      [
        `MATERIAL DIDÁTICO OFICIAL DE LIBRAS\n\nTítulo: ${mat.title}\nDescrição: ${mat.description}\nObservações Pedagógicas: ${mat.librasNotes || 'Material para fins de estudo contínuo.'}\n\nEmitido pelo Sistema LibrasFrequência em ${new Date().toLocaleDateString('pt-BR')}`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mat.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Ambiente Virtual de Aprendizagem</span>
          <span aria-hidden="true">·</span>
          <span>Matriz Curricular de Libras</span>
          <span aria-hidden="true">·</span>
          <span>5 Módulos Estruturados</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Materiais de Estudo & Conteúdos por Módulo
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Apostilas didáticas, vídeos demonstrativos de interpretação visual, exercícios e ferramentas de datilologia.
        </p>
      </div>

      {/* Interactive Tool: Datilologia Visual Speller (Alfabeto Manual) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Soletrador Visual em Datilologia (Alfabeto Manual)
              </h2>
              <p className="text-xs text-slate-500">
                Digite qualquer palavra para visualizar a decomposição das configurações de mão em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Palavra:</span>
            <input
              type="text"
              value={spellerText}
              onChange={(e) => setSpellerText(e.target.value.slice(0, 15))}
              placeholder="Digite uma palavra..."
              className="px-3 py-1.5 text-xs font-mono font-bold tracking-wider border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 uppercase"
            />
          </div>
        </div>

        {/* Render letter cards */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {cleanLetters.length === 0 ? (
            <div className="text-xs text-slate-400 italic">Digite letras de A a Z acima.</div>
          ) : (
            cleanLetters.map((char, index) => {
              const info = DATILOLOGIA_MAP[char] || {
                letter: char,
                desc: 'Letra especial',
                icon: '✋',
              };
              return (
                <div
                  key={index}
                  className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2.5 min-w-[70px] shadow-xs group hover:border-teal-500 hover:bg-teal-50/30 transition-colors"
                  title={info.desc}
                >
                  <span className="text-2xl mb-1 filter drop-shadow-xs">{info.icon}</span>
                  <span className="text-base font-bold font-mono text-slate-900 leading-none">
                    {info.letter}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono mt-1">pos. {index + 1}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modules Accordion */}
      <div className="space-y-4">
        {modules.map((mod) => {
          const isExpanded = expandedModuleId === mod.id;

          return (
            <div
              key={mod.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all"
            >
              {/* Module Header Bar */}
              <button
                onClick={() => toggleExpand(mod.id)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-600 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    0{mod.order}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{mod.title}</span>
                      <span className="text-[10px] text-teal-800 bg-teal-50 font-medium px-2 py-0.5 rounded border border-teal-100">
                        {mod.level}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{mod.subtitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {mod.lessonsCount} aulas
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {mod.durationHours}h
                    </span>
                  </div>

                  <div className="p-1 text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </button>

              {/* Module Body Content */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {mod.description}
                  </p>

                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold text-slate-800">
                      Materiais Didáticos Disponíveis ({mod.materials.length}):
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mod.materials.map((mat) => {
                        const isVideo = mat.type === 'video';

                        return (
                          <div
                            key={mat.id}
                            className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                                  {isVideo ? (
                                    <Video className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  )}
                                  <span className="truncate">{mat.title}</span>
                                </span>

                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  {mat.fileSize || `${mat.durationMinutes} min`}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                                {mat.description}
                              </p>

                              {mat.librasNotes && (
                                <div className="text-[11px] text-teal-700 bg-teal-50/60 p-2 rounded border border-teal-100 mb-3">
                                  <span className="font-semibold block mb-0.5">Nota de Libras:</span>
                                  {mat.librasNotes}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                              {isVideo ? (
                                <button
                                  onClick={() => {
                                    setActiveVideoModalUrl(mat.contentUrl);
                                    setActiveVideoTitle(mat.title);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Assistir Vídeo-Aula</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDownloadMaterial(mat)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Baixar Material</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Video Modal Player */}
      {activeVideoModalUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-xl shadow-2xl max-w-3xl w-full border border-slate-800 overflow-hidden text-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200">{activeVideoTitle}</span>
              <button
                onClick={() => setActiveVideoModalUrl(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideoModalUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
