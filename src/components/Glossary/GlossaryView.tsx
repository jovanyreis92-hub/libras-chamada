import React, { useState, useMemo } from 'react';
import {
  BookMarked,
  Search,
  Plus,
  Sparkles,
  Layers,
  HelpCircle,
  X,
  Check,
  Tag,
} from 'lucide-react';
import { GlossaryItem } from '../../types';

interface GlossaryViewProps {
  glossaryItems: GlossaryItem[];
  onAddGlossaryItem: (item: Omit<GlossaryItem, 'id'>) => void;
}

const CATEGORIES: GlossaryItem['category'][] = [
  'Gramática & Parâmetros',
  'Cotidiano',
  'Saúde',
  'Educação',
  'Jurídico',
  'Família & Pessoas',
  'Classificadores',
];

export const GlossaryView: React.FC<GlossaryViewProps> = ({
  glossaryItems,
  onAddGlossaryItem,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Term Form state
  const [newTerm, setNewTerm] = useState('');
  const [newGlosa, setNewGlosa] = useState('');
  const [newCategory, setNewCategory] = useState<GlossaryItem['category']>('Cotidiano');
  const [newHandConfig, setNewHandConfig] = useState('');
  const [newArticulationPoint, setNewArticulationPoint] = useState('');
  const [newMovement, setNewMovement] = useState('');
  const [newOrientation, setNewOrientation] = useState('');
  const [newFacialExpression, setNewFacialExpression] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newUsageExample, setNewUsageExample] = useState('');
  const [newGlosaExample, setNewGlosaExample] = useState('');

  // Alphabet letters present in glossary
  const alphabetLetters = useMemo(() => {
    const letters = new Set<string>();
    glossaryItems.forEach((item) => {
      const first = item.term.charAt(0).toUpperCase();
      letters.add(first);
    });
    return Array.from(letters).sort();
  }, [glossaryItems]);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    return glossaryItems.filter((item) => {
      const matchSearch =
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.glosa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meaning.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchLetter =
        selectedLetter === 'all' ||
        item.term.charAt(0).toUpperCase() === selectedLetter;

      return matchSearch && matchCategory && matchLetter;
    });
  }, [glossaryItems, searchTerm, selectedCategory, selectedLetter]);

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newGlosa.trim()) return;

    onAddGlossaryItem({
      term: newTerm.trim(),
      glosa: newGlosa.trim().toUpperCase(),
      category: newCategory,
      handConfig: newHandConfig.trim() || 'Mão aberta em "B"',
      articulationPoint: newArticulationPoint.trim() || 'Espaço neutro',
      movement: newMovement.trim() || 'Retilíneo',
      orientation: newOrientation.trim() || 'Palma voltada para frente',
      facialExpression: newFacialExpression.trim() || 'Neutra',
      meaning: newMeaning.trim(),
      usageExample: newUsageExample.trim(),
      glosaExample: newGlosaExample.trim().toUpperCase(),
      firstLetter: newTerm.trim().charAt(0).toUpperCase(),
    });

    // Reset & close
    setNewTerm('');
    setNewGlosa('');
    setNewHandConfig('');
    setNewArticulationPoint('');
    setNewMovement('');
    setNewOrientation('');
    setNewFacialExpression('');
    setNewMeaning('');
    setNewUsageExample('');
    setNewGlosaExample('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Lexicografia e Terminologia</span>
              <span aria-hidden="true">·</span>
              <span>Glossário Bilíngue Libras / Português</span>
              <span aria-hidden="true">·</span>
              <span>Decomposição Fonológica</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Glossário Terminológico de Libras
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulte e adicione termos técnicos com transcrição em Glosa, notação dos 5 parâmetros e exemplos práticos.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Termo</span>
          </button>
        </div>

        {/* Search Bar & Alphabet Filter */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar termo em Português ou Glosa (ex: APRENDER, HOSPITAL)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          {/* Alphabet bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedLetter('all')}
              className={`px-2 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                selectedLetter === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => {
              const hasItems = alphabetLetters.includes(char);
              const isSelected = selectedLetter === char;
              return (
                <button
                  key={char}
                  disabled={!hasItems}
                  onClick={() => setSelectedLetter(char)}
                  className={`w-6 h-6 text-xs font-mono rounded flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-teal-600 text-white font-bold'
                      : hasItems
                      ? 'text-slate-700 hover:bg-slate-200 cursor-pointer'
                      : 'text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {char}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-slate-100 pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-teal-700 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Todas as Áreas ({glossaryItems.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = glossaryItems.filter((i) => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.length === 0 ? (
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
            <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">Nenhum termo encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">
              Tente buscar por outra palavra-chave ou cadastre este termo no glossário.
            </p>
          </div>
        ) : (
          filteredTerms.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Term title and Glosa badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {item.term}
                    </h2>
                    <div className="text-xs font-mono font-semibold text-teal-700 tracking-wider mt-0.5">
                      Glosa: {item.glosa}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {item.meaning}
                </p>

                {/* 5 Parameters Phonological Decomposition Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 mb-3">
                  <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Os 5 Parâmetros do Sinal:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-700">CM:</span>{' '}
                      <span className="text-slate-600">{item.handConfig}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">PA:</span>{' '}
                      <span className="text-slate-600">{item.articulationPoint}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Movimento:</span>{' '}
                      <span className="text-slate-600">{item.movement}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Orientação:</span>{' '}
                      <span className="text-slate-600">{item.orientation}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-semibold text-slate-700">Exp. Facial (EFNM):</span>{' '}
                      <span className="text-slate-600">{item.facialExpression}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Usage Example */}
              <div className="pt-2 border-t border-slate-100 text-xs">
                <div className="text-[11px] text-slate-500 font-medium">Exemplo de Uso:</div>
                <div className="text-slate-800 italic mt-0.5">&ldquo;{item.usageExample}&rdquo;</div>
                <div className="text-[11px] font-mono text-teal-800 bg-teal-50/70 px-2 py-1 rounded mt-1.5 border border-teal-100/60">
                  {item.glosaExample}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add New Term */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">
                Cadastrar Termo no Glossário de Libras
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="p-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Termo em Português *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="Ex: Farmácia"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Glosa em Libras *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGlosa}
                    onChange={(e) => setNewGlosa(e.target.value.toUpperCase())}
                    placeholder="Ex: REMÉDIO-LUGAR"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Área Temática
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Configuração de Mão (CM)
                  </label>
                  <input
                    type="text"
                    value={newHandConfig}
                    onChange={(e) => setNewHandConfig(e.target.value)}
                    placeholder="Ex: Mão em 'F' ou 'B'"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ponto de Articulação (PA)
                  </label>
                  <input
                    type="text"
                    value={newArticulationPoint}
                    onChange={(e) => setNewArticulationPoint(e.target.value)}
                    placeholder="Ex: Queixo, Espaço Neutro..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Movimento (M)
                  </label>
                  <input
                    type="text"
                    value={newMovement}
                    onChange={(e) => setNewMovement(e.target.value)}
                    placeholder="Ex: Circular para fora..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Orientação da Palma (O)
                  </label>
                  <input
                    type="text"
                    value={newOrientation}
                    onChange={(e) => setNewOrientation(e.target.value)}
                    placeholder="Ex: Palma voltada para si..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Expressão Não-Manual (EFNM)
                  </label>
                  <input
                    type="text"
                    value={newFacialExpression}
                    onChange={(e) => setNewFacialExpression(e.target.value)}
                    placeholder="Ex: Neutra, ou sobrancelhas erguidas"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Significado / Conceito
                </label>
                <textarea
                  rows={2}
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  placeholder="Definição do sinal..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Exemplo em Português
                  </label>
                  <input
                    type="text"
                    value={newUsageExample}
                    onChange={(e) => setNewUsageExample(e.target.value)}
                    placeholder="Frase em português..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Exemplo em Glosa de Libras
                  </label>
                  <input
                    type="text"
                    value={newGlosaExample}
                    onChange={(e) => setNewGlosaExample(e.target.value.toUpperCase())}
                    placeholder="GLOSA DA FRASE..."
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Termo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
