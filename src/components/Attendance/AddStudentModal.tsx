import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Student, Turma } from '../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmas: Turma[];
  onAddStudent: (newStudent: Omit<Student, 'id' | 'enrolledAt'>) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  turmas,
  onAddStudent,
}) => {
  const [name, setName] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [classId, setClassId] = useState(turmas[0]?.id || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [librasSignName, setLibrasSignName] = useState('');
  const [librasSignDescription, setLibrasSignDescription] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedId = enrollmentId.trim() || `LIB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    onAddStudent({
      name: name.trim(),
      enrollmentId: generatedId,
      classId: classId || turmas[0]?.id || '',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@escola.edu.br`,
      phone: phone.trim(),
      librasSignName: librasSignName.trim(),
      librasSignDescription: librasSignDescription.trim(),
      active: true,
      notes: notes.trim(),
    });

    // Reset and close
    setName('');
    setEnrollmentId('');
    setEmail('');
    setPhone('');
    setLibrasSignName('');
    setLibrasSignDescription('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Cadastrar Novo Aluno de Libras
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Insira os dados acadêmicos e as referências do sinal pessoal do aluno.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nome Completo do Aluno *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Beatriz Silva Alcantara"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Matrícula / RA
              </label>
              <input
                type="text"
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                placeholder="Ex: LIB-2026-0501"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[11px] text-slate-400">Deixe em branco para gerar automático</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Turma de Libras *
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shift})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aluno@escola.edu.br"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98888-0000"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Seção Cultural de Libras: Sinal Pessoal */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm font-semibold text-slate-900">Sinal Pessoal em Libras (Batismo)</span>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium">Cultura Surda</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Sinal
                </label>
                <input
                  type="text"
                  value={librasSignName}
                  onChange={(e) => setLibrasSignName(e.target.value)}
                  placeholder="Ex: Mão em 'B' na covinha da bochecha"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Descrição dos Parâmetros (CM, PA, M)
                </label>
                <input
                  type="text"
                  value={librasSignDescription}
                  onChange={(e) => setLibrasSignDescription(e.target.value)}
                  placeholder="Ex: CM: B, PA: Bochecha, M: Pequeno giro"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observações Pedagógicas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Aluno ouvinte em formação de TILS, interesse em área de saúde..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Aluno</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
