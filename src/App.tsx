import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Wrench,
  Camera,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  Smartphone,
  Maximize2,
  CheckCircle2,
  Plus,
  Share2,
  Layers,
  Sparkles,
} from 'lucide-react';

import { DailyWorkLog, WorkerProfile, WorkPhoto, UnitDetail, TimeSection } from './types/worklog';
import {
  getStoredLogs,
  saveStoredLogs,
  getLogForDate,
  saveOrUpdateLog,
  getStoredProfile,
  saveStoredProfile,
  generateSeedLogs,
} from './utils/storage';
import { formatDisplayDate, getTodayISODate } from './utils/dateUtils';

import { TimeSectionEditor } from './components/TimeSectionEditor';
import { UnitSectionView } from './components/UnitSectionView';
import { PhotoSnapSection } from './components/PhotoSnapSection';
import { DailyNotesSection } from './components/DailyNotesSection';
import { WeeklyReportTab } from './components/WeeklyReportTab';
import { UnitsListTab } from './components/UnitsListTab';
import { UnitEditorModal } from './components/UnitEditorModal';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { SettingsModal } from './components/SettingsModal';

type ActiveTab = 'daily' | 'weekly' | 'units';

export default function App() {
  // Persistence state
  const [logs, setLogs] = useState<DailyWorkLog[]>(() => getStoredLogs());
  const [profile, setProfile] = useState<WorkerProfile>(() => getStoredProfile());

  // Navigation state
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayISODate());
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [isMobileFrameView, setIsMobileFrameView] = useState<boolean>(true);

  // Active daily log being edited
  const [activeLog, setActiveLog] = useState<DailyWorkLog>(() =>
    getLogForDate(getTodayISODate(), getStoredLogs())
  );

  // Modals state
  const [editingUnit, setEditingUnit] = useState<UnitDetail | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<WorkPhoto | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Whenever currentDate or logs change, sync activeLog
  useEffect(() => {
    setActiveLog(getLogForDate(currentDate, logs));
  }, [currentDate, logs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Date shifting
  const handleShiftDay = (deltaDays: number) => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + deltaDays);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    setCurrentDate(`${yStr}-${mStr}-${dStr}`);
  };

  // Daily log mutations
  const updateActiveLog = (updated: DailyWorkLog) => {
    setActiveLog(updated);
    const updatedList = saveOrUpdateLog(updated, logs);
    setLogs(updatedList);
  };

  const handleTimeChange = (updatedTime: TimeSection) => {
    updateActiveLog({
      ...activeLog,
      time: updatedTime,
    });
  };

  const handleSafetyCheckChange = (completed: boolean) => {
    updateActiveLog({
      ...activeLog,
      safetyCheckCompleted: completed,
    });
  };

  // Units handlers
  const handleSaveUnit = (unit: UnitDetail) => {
    const exists = activeLog.units.some((u) => u.id === unit.id);
    let updatedUnits: UnitDetail[];
    if (exists) {
      updatedUnits = activeLog.units.map((u) => (u.id === unit.id ? unit : u));
    } else {
      updatedUnits = [...activeLog.units, unit];
    }
    updateActiveLog({
      ...activeLog,
      units: updatedUnits,
    });
    showToast(`Unit ${unit.unitNumber} saved`);
  };

  const handleDeleteUnit = (unitId: string) => {
    updateActiveLog({
      ...activeLog,
      units: activeLog.units.filter((u) => u.id !== unitId),
      // Also unbind any photos linked to this unit
      photos: activeLog.photos.map((p) => (p.unitId === unitId ? { ...p, unitId: undefined } : p)),
    });
    showToast('Unit removed');
  };

  // Photos handlers
  const handleAddPhoto = (photo: WorkPhoto) => {
    updateActiveLog({
      ...activeLog,
      photos: [photo, ...activeLog.photos],
    });
    showToast('Photo attached to log');
  };

  const handleDeletePhoto = (photoId: string) => {
    updateActiveLog({
      ...activeLog,
      photos: activeLog.photos.filter((p) => p.id !== photoId),
    });
    showToast('Photo deleted');
  };

  const handleSubmitDay = () => {
    updateActiveLog({
      ...activeLog,
      status: 'Submitted',
    });
    showToast(`Shift log for ${formatDisplayDate(currentDate)} submitted!`);
  };

  // Settings handlers
  const handleSaveProfile = (newProfile: WorkerProfile) => {
    setProfile(newProfile);
    saveStoredProfile(newProfile);
    showToast('Profile & boss settings updated');
  };

  const handleResetDemoData = () => {
    const seeds = generateSeedLogs();
    saveStoredLogs(seeds);
    setLogs(seeds);
    setCurrentDate(getTodayISODate());
    showToast('Loaded demo work week with units & photos');
  };

  const handleClearAllData = () => {
    saveStoredLogs([]);
    setLogs([]);
    showToast('All logs cleared');
  };

  // App Content Component (Used in both mobile frame and full width)
  const renderAppContent = () => {
    return (
      <div className="flex flex-col min-h-full bg-neutral-950 text-neutral-100">
        {/* App Bar */}
        <header className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black text-base shadow-sm">
                FL
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-extrabold text-white tracking-tight">FieldLog</h1>
                  <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-800 px-1.5 py-0.2 rounded">
                    Mobile
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-none mt-0.5 truncate max-w-[170px] sm:max-w-xs">
                  {profile.workerName} • {profile.companyName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Desktop toggle for frame */}
              <button
                type="button"
                onClick={() => setIsMobileFrameView(!isMobileFrameView)}
                title={isMobileFrameView ? 'Switch to Full Screen layout' : 'Switch to Mobile Phone view'}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-750 rounded-lg border border-neutral-700/80 transition-colors"
              >
                {isMobileFrameView ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                <span>{isMobileFrameView ? 'Wide View' : 'Phone View'}</span>
              </button>

              {/* Settings button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
                title="Settings & Boss info"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Selector Strip (Shown primarily in Daily Tab) */}
          {activeTab === 'daily' && (
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-800/80 text-xs">
              <button
                onClick={() => handleShiftDay(-1)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-medium hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                />
                {currentDate === getTodayISODate() && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                    Today
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {currentDate !== getTodayISODate() && (
                  <button
                    onClick={() => setCurrentDate(getTodayISODate())}
                    className="text-[11px] font-semibold text-amber-400 hover:underline px-1.5 py-1"
                  >
                    Today
                  </button>
                )}
                <button
                  onClick={() => handleShiftDay(1)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
                  title="Next Day"
                >
                  <span className="text-[11px] font-medium hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Tab Navigation Pill Bar */}
        <nav className="bg-neutral-900 border-b border-neutral-800 px-3 py-2 flex items-center justify-between gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Log</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'weekly'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Weekly Export</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'units'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Unit Directory</span>
          </button>
        </nav>

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 pb-20 space-y-4">
          {activeTab === 'daily' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Daily Shift Status Banner */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    {formatDisplayDate(currentDate)}
                  </h2>
                  <span className="text-xs text-neutral-400">
                    {activeLog.time.totalHours.toFixed(1)} hrs total • {activeLog.units.length} unit{activeLog.units.length === 1 ? '' : 's'} • {activeLog.photos.length} photo{activeLog.photos.length === 1 ? '' : 's'}
                  </span>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    activeLog.status === 'Submitted'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {activeLog.status}
                </span>
              </div>

              {/* 1. Time Tracking Section */}
              <TimeSectionEditor
                time={activeLog.time}
                safetyCheckCompleted={activeLog.safetyCheckCompleted}
                onTimeChange={handleTimeChange}
                onSafetyCheckChange={handleSafetyCheckChange}
              />

              {/* 2. Unit Details & Equipment Section */}
              <UnitSectionView
                units={activeLog.units}
                photos={activeLog.photos}
                onAddUnitClick={() => {
                  setEditingUnit(null);
                  setIsUnitModalOpen(true);
                }}
                onEditUnitClick={(unit) => {
                  setEditingUnit(unit);
                  setIsUnitModalOpen(true);
                }}
                onDeleteUnit={handleDeleteUnit}
              />

              {/* 3. Photos Camera & Attachment Section */}
              <PhotoSnapSection
                photos={activeLog.photos}
                units={activeLog.units}
                onAddPhoto={handleAddPhoto}
                onDeletePhoto={handleDeletePhoto}
                onOpenViewer={(photo) => setViewingPhoto(photo)}
              />

              {/* 4. Daily Recap, Weather & Submit */}
              <DailyNotesSection
                log={activeLog}
                onChangeNotes={(notes) => updateActiveLog({ ...activeLog, generalNotes: notes })}
                onChangeWeather={(weather) => updateActiveLog({ ...activeLog, weatherConditions: weather })}
                onSubmitLog={handleSubmitDay}
              />
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="animate-in fade-in duration-150">
              <WeeklyReportTab
                currentDate={currentDate}
                logs={logs}
                profile={profile}
                onSelectDate={(dateStr) => {
                  setCurrentDate(dateStr);
                  setActiveTab('daily');
                }}
                onOpenPhotoViewer={(photo) => setViewingPhoto(photo)}
                onSaveLogs={(updatedList) => {
                  setLogs(updatedList);
                  saveStoredLogs(updatedList);
                  showToast('Weekly approvals updated');
                }}
              />
            </div>
          )}

          {activeTab === 'units' && (
            <div className="animate-in fade-in duration-150">
              <UnitsListTab
                logs={logs}
                onSelectDate={(dateStr) => {
                  setCurrentDate(dateStr);
                  setActiveTab('daily');
                }}
                onOpenPhotoViewer={(photo) => setViewingPhoto(photo)}
              />
            </div>
          )}
        </main>

        {/* Bottom Quick-Action Dock (Mobile ergonomics) */}
        {activeTab === 'daily' && (
          <div className="fixed bottom-0 inset-x-0 p-3 bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800 z-20 flex items-center justify-between gap-2 max-w-lg mx-auto">
            <button
              onClick={() => {
                setEditingUnit(null);
                setIsUnitModalOpen(true);
              }}
              className="flex-1 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Add Unit</span>
            </button>

            <button
              onClick={() => {
                // Focus / jump to photos section or simulate snap
                const photoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (photoInput) photoInput.click();
              }}
              className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
            >
              <Camera className="w-4 h-4" />
              <span>Snap Photo</span>
            </button>
          </div>
        )}

        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-800 text-white border border-neutral-700 shadow-xl px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans antialiased">
      {/* If isMobileFrameView is true on large screens, render simulated phone shell */}
      {isMobileFrameView ? (
        <div className="w-full max-w-md h-[100dvh] sm:h-[860px] sm:max-h-[92vh] sm:border-[10px] sm:border-neutral-800 sm:rounded-[44px] overflow-hidden shadow-2xl relative flex flex-col bg-neutral-950 sm:ring-1 sm:ring-neutral-700/60">
          {/* Simulated Speaker / Camera Notch on Desktop Shell */}
          <div className="hidden sm:block absolute top-0 inset-x-0 h-5 z-40 pointer-events-none">
            <div className="w-28 h-4 bg-neutral-800 mx-auto rounded-b-xl flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-neutral-950"></div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {renderAppContent()}
          </div>
        </div>
      ) : (
        /* Full width responsive layout */
        <div className="w-full max-w-4xl min-h-screen mx-auto flex flex-col border-x border-neutral-800 bg-neutral-950">
          {renderAppContent()}
        </div>
      )}

      {/* Unit Editor Modal */}
      <UnitEditorModal
        unit={editingUnit}
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onSave={handleSaveUnit}
      />

      {/* Full-Screen Photo Viewer Modal */}
      <PhotoViewerModal
        photo={viewingPhoto}
        units={activeLog.units}
        onClose={() => setViewingPhoto(null)}
        onDelete={(photoId) => {
          handleDeletePhoto(photoId);
          setViewingPhoto(null);
        }}
      />

      {/* Worker & Boss Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        profile={profile}
        onClose={() => setIsSettingsOpen(false)}
        onSaveProfile={handleSaveProfile}
        onResetDemoData={handleResetDemoData}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}
