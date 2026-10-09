/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { AttendanceManager } from './components/Attendance/AttendanceManager';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { VideoActivitiesManager } from './components/VideoActivities/VideoActivitiesManager';
import { StudyModulesView } from './components/StudyMaterials/StudyModulesView';
import { GlossaryView } from './components/Glossary/GlossaryView';
import { ExportModal } from './components/Reports/ExportModal';
import { AddStudentModal } from './components/Attendance/AddStudentModal';
import {
  Student,
  Turma,
  AttendanceRecord,
  VideoActivity,
  VideoSubmission,
  StudyModule,
  GlossaryItem,
} from './types';
import {
  getStoredStudents,
  saveStudents,
  getStoredTurmas,
  saveTurmas,
  getStoredAttendance,
  saveAttendance,
  getStoredActivities,
  saveActivities,
  getStoredSubmissions,
  saveSubmissions,
  getStoredModules,
  getStoredGlossary,
  saveGlossary,
  resetAllData,
} from './utils/storage';
import { RotateCcw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('frequencia');

  // Core Application State
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [turmas, setTurmas] = useState<Turma[]>(() => getStoredTurmas());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    getStoredAttendance()
  );
  const [videoActivities, setVideoActivities] = useState<VideoActivity[]>(() =>
    getStoredActivities()
  );
  const [videoSubmissions, setVideoSubmissions] = useState<VideoSubmission[]>(() =>
    getStoredSubmissions()
  );
  const [studyModules, setStudyModules] = useState<StudyModule[]>(() => getStoredModules());
  const [glossaryItems, setGlossaryItems] = useState<GlossaryItem[]>(() => getStoredGlossary());

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveTurmas(turmas);
  }, [turmas]);

  useEffect(() => {
    saveAttendance(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    saveActivities(videoActivities);
  }, [videoActivities]);

  useEffect(() => {
    saveSubmissions(videoSubmissions);
  }, [videoSubmissions]);

  useEffect(() => {
    saveGlossary(glossaryItems);
  }, [glossaryItems]);

  // Handlers
  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'enrolledAt'>) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `std-${Date.now()}`,
      enrolledAt: new Date().toISOString().slice(0, 10),
    };
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleUpdateAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendanceRecords(newRecords);
  };

  const handleUpdateSubmissions = (newSubmissions: VideoSubmission[]) => {
    setVideoSubmissions(newSubmissions);
  };

  const handleAddGlossaryItem = (newItemData: Omit<GlossaryItem, 'id'>) => {
    const newItem: GlossaryItem = {
      ...newItemData,
      id: `glo-${Date.now()}`,
    };
    setGlossaryItems((prev) => [newItem, ...prev]);
  };

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar todos os dados e histórico de frequência para o padrão inicial?')) {
      resetAllData();
      window.location.reload();
    }
  };

  const pendingSubmissionsCount = videoSubmissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Bar Contract (Wordmark, Nav links, Action buttons) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
        unreadSubmissionsCount={pendingSubmissionsCount}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'frequencia' && (
          <AttendanceManager
            students={students}
            turmas={turmas}
            attendanceRecords={attendanceRecords}
            onUpdateAttendance={handleUpdateAttendance}
            onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
          />
        )}

        {activeTab === 'analitico' && (
          <AnalyticsDashboard
            students={students}
            turmas={turmas}
            attendanceRecords={attendanceRecords}
            videoSubmissions={videoSubmissions}
          />
        )}

        {activeTab === 'atividades' && (
          <VideoActivitiesManager
            activities={videoActivities}
            submissions={videoSubmissions}
            students={students}
            turmas={turmas}
            onUpdateSubmissions={handleUpdateSubmissions}
          />
        )}

        {activeTab === 'modulos' && <StudyModulesView modules={studyModules} />}

        {activeTab === 'glossario' && (
          <GlossaryView
            glossaryItems={glossaryItems}
            onAddGlossaryItem={handleAddGlossaryItem}
          />
        )}
      </main>

      {/* Quiet Accessible Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>LibrasFrequência</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Sistema Bilíngue de Gestão de Presença & Estudo de Libras</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Lei nº 10.436/2002</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              title="Restaurar dados de demonstração de Libras"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Demonstração</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono">v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* Export Modal (PDF, Excel, Google Sheets) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        students={students}
        turmas={turmas}
        attendanceRecords={attendanceRecords}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        turmas={turmas}
        onAddStudent={handleAddStudent}
      />
    </div>
  );
}
