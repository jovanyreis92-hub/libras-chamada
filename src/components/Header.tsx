import React from 'react';
import { CalendarCheck, BarChart3, Video, BookOpen, BookMarked, Download, UserPlus } from 'lucide-react';

export type ActiveTab = 'frequencia' | 'analitico' | 'atividades' | 'modulos' | 'glossario';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenExportModal: () => void;
  onOpenAddStudent: () => void;
  unreadSubmissionsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExportModal,
  onOpenAddStudent,
  unreadSubmissionsCount = 0,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'frequencia', label: 'Frequência', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'analitico', label: 'Painel Analítico', icon: <BarChart3 className="w-4 h-4" /> },
    {
      id: 'atividades',
      label: 'Atividades em Vídeo',
      icon: <Video className="w-4 h-4" />,
      badge: unreadSubmissionsCount > 0 ? unreadSubmissionsCount : undefined,
    },
    { id: 'modulos', label: 'Módulos de Estudo', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'glossario', label: 'Glossário de Libras', icon: <BookMarked className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('frequencia')}
              className="text-left group cursor-pointer focus-visible:outline-none"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  🤟
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                    LibrasFrequência
                  </span>
                  <div className="text-[11px] text-slate-500 font-normal leading-tight hidden sm:block">
                    Gestão & Ensino Bilíngue
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Zone 2: 5 clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-100 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 text-[11px] font-mono font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExportModal}
              title="Exportar dados para PDF, Excel (.xlsx) e Planilhas"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="text-[10px] text-slate-400 font-mono">PDF/XLSX</span>
            </button>

            <button
              onClick={onOpenAddStudent}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-xs whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Novo Aluno</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
