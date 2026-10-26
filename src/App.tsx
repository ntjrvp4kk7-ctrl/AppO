import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Paintbrush,
  Camera,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  Smartphone,
  Maximize2,
  CheckCircle2,
  Plus,
  User,
  LogIn,
  Check,
} from 'lucide-react';

import { DailyWorkLog, UserAccount, WorkPhoto, UnitRepair, TimeSection } from './types/worklog';
import {
  getStoredLogs,
  saveStoredLogs,
  getLogForDate,
  saveOrUpdateLog,
  getStoredAuth,
  saveStoredAuth,
  clearStoredAuth,
  fetchLogsFromServer,
  generateSeedPaintDrywallLogs,
} from './utils/storage';
import { formatDisplayDate, getTodayISODate } from './utils/dateUtils';

import { TimeSectionEditor } from './components/TimeSectionEditor';
import { PaintDrywallSectionView } from './components/PaintDrywallSectionView';
import { PhotoSnapSection } from './components/PhotoSnapSection';
import { WeeklyReportTab } from './components/WeeklyReportTab';
import { UnitsListTab } from './components/UnitsListTab';
import { PaintDrywallRepairModal } from './components/PaintDrywallRepairModal';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

type ActiveTab = 'daily' | 'weekly' | 'units';

export default function App() {
  // Auth state
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Persistence state
  const [logs, setLogs] = useState<DailyWorkLog[]>(() => getStoredLogs());

  // Navigation state
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayISODate());
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [isMobileFrameView, setIsMobileFrameView] = useState<boolean>(true);

  // Active daily log
  const [activeLog, setActiveLog] = useState<DailyWorkLog>(() =>
    getLogForDate(getTodayISODate(), getStoredLogs())
  );

  // Modals state
  const [editingRepair, setEditingRepair] = useState<UnitRepair | null>(null);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [preselectedRepairIdForPhoto, setPreselectedRepairIdForPhoto] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<WorkPhoto | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with server on initial load if token exists
  useEffect(() => {
    async function initServerSync() {
      if (auth.token) {
        const remoteLogs = await fetchLogsFromServer();
        if (remoteLogs) {
          setLogs(remoteLogs);
        }
      }
    }
    initServerSync();
  }, [auth.token]);

  // Keep activeLog synced with currentDate and logs
  useEffect(() => {
    setActiveLog(getLogForDate(currentDate, logs));
  }, [currentDate, logs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShiftDay = (deltaDays: number) => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + deltaDays);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    setCurrentDate(`${yStr}-${mStr}-${dStr}`);
  };

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

  // Repair handlers
  const handleSaveRepair = (repair: UnitRepair) => {
    const exists = activeLog.repairs.some((r) => r.id === repair.id);
    let updatedRepairs: UnitRepair[];
    if (exists) {
      updatedRepairs = activeLog.repairs.map((r) => (r.id === repair.id ? repair : r));
    } else {
      updatedRepairs = [...activeLog.repairs, repair];
    }
    updateActiveLog({
      ...activeLog,
      repairs: updatedRepairs,
    });
    showToast(`${repair.unitNumber} (${repair.damageType}) saved`);
  };

  const handleDeleteRepair = (repairId: string) => {
    updateActiveLog({
      ...activeLog,
      repairs: activeLog.repairs.filter((r) => r.id !== repairId),
      photos: activeLog.photos.map((p) => (p.repairId === repairId ? { ...p, repairId: undefined } : p)),
    });
    showToast('Unit repair deleted');
  };

  const handleQuickSnapForRepair = (repairId: string) => {
    setPreselectedRepairIdForPhoto(repairId);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.click();
  };

  // Photo handlers
  const handleAddPhoto = (photo: WorkPhoto) => {
    updateActiveLog({
      ...activeLog,
      photos: [photo, ...activeLog.photos],
    });
    setPreselectedRepairIdForPhoto(null);
    showToast('Photo evidence attached');
  };

  const handleDeletePhoto = (photoId: string) => {
    updateActiveLog({
      ...activeLog,
      photos: activeLog.photos.filter((p) => p.id !== photoId),
    });
    showToast('Photo removed');
  };

  const handleSubmitDay = () => {
    updateActiveLog({
      ...activeLog,
      status: 'Submitted',
    });
    showToast(`Shift log for ${formatDisplayDate(currentDate)} submitted to boss!`);
  };

  // Auth handlers
  const handleAuthSuccess = (token: string, user: UserAccount) => {
    setAuth({ token, user });
    showToast(`Signed in as ${user.workerName}`);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setAuth({ token: null, user: auth.user });
    showToast('Signed out');
  };

  const handleResetDemoData = () => {
    const seeds = generateSeedPaintDrywallLogs();
    saveStoredLogs(seeds);
    setLogs(seeds);
    setCurrentDate(getTodayISODate());
    showToast('Loaded demo Paint & Drywall week');
  };

  const handleClearAllData = () => {
    saveStoredLogs([]);
    setLogs([]);
    showToast('All logs cleared');
  };

  const renderAppContent = () => {
    return (
      <div className="flex flex-col min-h-full bg-neutral-950 text-neutral-100">
        {/* App Bar */}
        <header className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black text-sm shadow-sm">
                <Paintbrush className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-extrabold text-white tracking-tight">Paint & Drywall Log</h1>
                  <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-800 px-1.5 py-0.2 rounded">
                    Render App
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-none mt-0.5 truncate max-w-[170px] sm:max-w-xs">
                  {auth.user.workerName} • Boss: {auth.user.bossName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Account status or sign in button */}
              {auth.token ? (
                <div
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold cursor-pointer"
                  title="Account active on Render"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="hidden sm:inline">Saved</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Desktop toggle for frame */}
              <button
                type="button"
                onClick={() => setIsMobileFrameView(!isMobileFrameView)}
                title={isMobileFrameView ? 'Switch to Wide layout' : 'Switch to Phone layout'}
                className="hidden lg:flex items-center gap-1 p-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-750 rounded-xl border border-neutral-700/80 transition-colors"
              >
                {isMobileFrameView ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
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

          {/* Date Selector Strip in Daily Tab */}
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

        {/* Tab Navigation Bar */}
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
            <span>Today's Work</span>
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
            <span>Weekly Report</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'units'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>All Units</span>
          </button>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 pb-20 space-y-4">
          {activeTab === 'daily' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    {formatDisplayDate(currentDate)}
                  </h2>
                  <span className="text-xs text-neutral-400">
                    {activeLog.time.totalHours.toFixed(1)} hrs • {activeLog.repairs.length} unit repair{activeLog.repairs.length === 1 ? '' : 's'} • {activeLog.photos.length} photo{activeLog.photos.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
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
              </div>

              {/* 1. Time Tracking Section */}
              <TimeSectionEditor
                time={activeLog.time}
                onTimeChange={handleTimeChange}
              />

              {/* 2. Paint & Drywall Unit Repairs Section */}
              <PaintDrywallSectionView
                repairs={activeLog.repairs}
                photos={activeLog.photos}
                onAddRepairClick={() => {
                  setEditingRepair(null);
                  setIsRepairModalOpen(true);
                }}
                onEditRepairClick={(repair) => {
                  setEditingRepair(repair);
                  setIsRepairModalOpen(true);
                }}
                onDeleteRepair={handleDeleteRepair}
                onQuickSnapForRepair={handleQuickSnapForRepair}
                onOpenPhotoViewer={(photo) => setViewingPhoto(photo)}
              />

              {/* 3. Before & After Photo Snapping Area */}
              <PhotoSnapSection
                photos={activeLog.photos}
                repairs={activeLog.repairs}
                preselectedRepairId={preselectedRepairIdForPhoto}
                onAddPhoto={handleAddPhoto}
                onDeletePhoto={handleDeletePhoto}
                onOpenViewer={(photo) => setViewingPhoto(photo)}
              />

              {/* Shift Completed Submit Button for Boss */}
              <div className="bg-neutral-900 border border-neutral-800/90 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Finished Shift for {formatDisplayDate(currentDate)}?</h4>
                  <p className="text-[11px] text-neutral-400">Locks hours and marks day submitted for boss review</p>
                </div>
                <button
                  type="button"
                  onClick={handleSubmitDay}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{activeLog.status === 'Submitted' ? 'Update Day' : 'Submit Day to Boss'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="animate-in fade-in duration-150">
              <WeeklyReportTab
                currentDate={currentDate}
                logs={logs}
                profile={auth.user}
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

        {/* Bottom Quick Action Dock on Mobile */}
        {activeTab === 'daily' && (
          <div className="fixed bottom-0 inset-x-0 p-3 bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800 z-20 flex items-center justify-between gap-2 max-w-lg mx-auto">
            <button
              onClick={() => {
                setEditingRepair(null);
                setIsRepairModalOpen(true);
              }}
              className="flex-1 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Add Unit</span>
            </button>

            <button
              onClick={() => {
                const photoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (photoInput) photoInput.click();
              }}
              className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
            >
              <Camera className="w-4 h-4" />
              <span>Snap Before/After</span>
            </button>
          </div>
        )}

        {/* Toast Alert */}
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
      {isMobileFrameView ? (
        <div className="w-full max-w-md h-[100dvh] sm:h-[860px] sm:max-h-[92vh] sm:border-[10px] sm:border-neutral-800 sm:rounded-[44px] overflow-hidden shadow-2xl relative flex flex-col bg-neutral-950 sm:ring-1 sm:ring-neutral-700/60">
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
        <div className="w-full max-w-4xl min-h-screen mx-auto flex flex-col border-x border-neutral-800 bg-neutral-950">
          {renderAppContent()}
        </div>
      )}

      {/* Paint & Drywall Repair Editor Modal */}
      <PaintDrywallRepairModal
        repair={editingRepair}
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
        onSave={handleSaveRepair}
      />

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photo={viewingPhoto}
        repairs={activeLog.repairs}
        onClose={() => setViewingPhoto(null)}
        onDelete={(photoId) => {
          handleDeletePhoto(photoId);
          setViewingPhoto(null);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        profile={auth.user}
        isLoggedIn={Boolean(auth.token)}
        onClose={() => setIsSettingsOpen(false)}
        onSaveProfile={(newProf) => {
          setAuth({ ...auth, user: newProf });
          saveStoredAuth(auth.token, newProf);
          showToast('Settings updated');
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onResetDemoData={handleResetDemoData}
        onClearAllData={handleClearAllData}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={auth.user}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
