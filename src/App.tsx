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
  LogIn,
  Check,
} from 'lucide-react';

import { DailyWorkLog, UserAccount, UnitPhoto, UnitWork, TimeSection } from './types/worklog';
import {
  getStoredLogs,
  saveStoredLogs,
  getLogForDate,
  saveOrUpdateLog,
  getStoredAuth,
  saveStoredAuth,
  clearStoredAuth,
  fetchLogsFromServer,
  generateSampleLogs,
} from './utils/storage';
import { formatDisplayDate, getTodayISODate } from './utils/dateUtils';

import { TimeSectionEditor } from './components/TimeSectionEditor';
import { UnitWorkCard } from './components/UnitWorkCard';
import { WeeklyReportTab } from './components/WeeklyReportTab';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

type ActiveTab = 'today' | 'weekly';

export default function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [logs, setLogs] = useState<DailyWorkLog[]>(() => getStoredLogs());
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayISODate());
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isMobileFrameView, setIsMobileFrameView] = useState<boolean>(true);

  const [activeLog, setActiveLog] = useState<DailyWorkLog>(() =>
    getLogForDate(getTodayISODate(), getStoredLogs())
  );

  const [viewingPhoto, setViewingPhoto] = useState<{ photo: UnitPhoto; unitLabel?: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function syncRemote() {
      if (auth.token) {
        const remoteLogs = await fetchLogsFromServer();
        if (remoteLogs) setLogs(remoteLogs);
      }
    }
    syncRemote();
  }, [auth.token]);

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

  const handleAddUnit = () => {
    const newUnit: UnitWork = {
      id: `unit-${Date.now().toString(36)}`,
      unitNumber: '',
      paintColor: '',
      notes: '',
      photos: [],
      isCompleted: false,
    };
    updateActiveLog({
      ...activeLog,
      units: [newUnit, ...activeLog.units],
    });
  };

  const handleUpdateUnit = (updatedUnit: UnitWork) => {
    const updatedUnits = activeLog.units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
    updateActiveLog({
      ...activeLog,
      units: updatedUnits,
    });
  };

  const handleDeleteUnit = (unitId: string) => {
    updateActiveLog({
      ...activeLog,
      units: activeLog.units.filter((u) => u.id !== unitId),
    });
    showToast('Unit removed');
  };

  const handleDeletePhoto = (photoId: string) => {
    const updatedUnits = activeLog.units.map((u) => ({
      ...u,
      photos: u.photos.filter((p) => p.id !== photoId),
    }));
    updateActiveLog({
      ...activeLog,
      units: updatedUnits,
    });
    showToast('Photo deleted');
  };

  const handleSubmitDay = () => {
    updateActiveLog({
      ...activeLog,
      status: 'Submitted',
    });
    showToast(`Work for ${formatDisplayDate(currentDate)} marked complete!`);
  };

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
    const seeds = generateSampleLogs();
    saveStoredLogs(seeds);
    setLogs(seeds);
    setCurrentDate(getTodayISODate());
    showToast('Loaded demo week');
  };

  const handleClearAllData = () => {
    saveStoredLogs([]);
    setLogs([]);
    showToast('All logs cleared');
  };

  const renderAppContent = () => {
    return (
      <div className="flex flex-col min-h-full bg-zinc-950 text-zinc-100 font-sans">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-black shadow-sm">
                <Paintbrush className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white tracking-tight leading-none">
                  Paint & Patch Log
                </h1>
                <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[180px]">
                  {auth.user.workerName} • Boss: {auth.user.bossName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {auth.token ? (
                <div
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold cursor-pointer"
                  title="Render Account Active"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px]">Saved</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg shadow-sm transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMobileFrameView(!isMobileFrameView)}
                title={isMobileFrameView ? 'Switch to Wide layout' : 'Switch to Phone layout'}
                className="hidden lg:flex items-center gap-1 p-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 rounded-xl border border-zinc-800 transition-colors"
              >
                {isMobileFrameView ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
                title="Settings & Boss info"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Selector Strip in Today's Tab */}
          {activeTab === 'today' && (
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/60 text-xs">
              <button
                onClick={() => handleShiftDay(-1)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors flex items-center gap-1"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-medium hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                />
                {currentDate === getTodayISODate() && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    Today
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {currentDate !== getTodayISODate() && (
                  <button
                    onClick={() => setCurrentDate(getTodayISODate())}
                    className="text-[11px] font-semibold text-emerald-400 hover:underline px-1.5 py-1"
                  >
                    Today
                  </button>
                )}
                <button
                  onClick={() => handleShiftDay(1)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors flex items-center gap-1"
                  title="Next Day"
                >
                  <span className="text-[11px] font-medium hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* 2-Tab Navigation Bar: Exactly Today's Work & Weekly Report */}
        <nav className="bg-zinc-950 border-b border-zinc-800/80 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'today'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today's Work</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'weekly'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Weekly Report</span>
          </button>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 pb-24 space-y-4">
          {activeTab === 'today' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Day Header */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    {formatDisplayDate(currentDate)}
                  </h2>
                  <span className="text-xs text-zinc-400">
                    {activeLog.units.length} unit{activeLog.units.length === 1 ? '' : 's'} worked today
                  </span>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    activeLog.status === 'Submitted'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {activeLog.status === 'Submitted' ? 'Submitted' : 'In Progress'}
                </span>
              </div>

              {/* Shift Hours Tracker (No primary task dropdown) */}
              <TimeSectionEditor
                time={activeLog.time}
                onTimeChange={handleTimeChange}
              />

              {/* Units Work Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Units Worked ({activeLog.units.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs active:scale-95 transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Unit</span>
                  </button>
                </div>

                {activeLog.units.length > 0 ? (
                  <div className="space-y-3.5">
                    {activeLog.units.map((unit) => (
                      <UnitWorkCard
                        key={unit.id}
                        unit={unit}
                        onUpdateUnit={handleUpdateUnit}
                        onDeleteUnit={handleDeleteUnit}
                        onOpenPhotoViewer={(photo, unitLabel) => setViewingPhoto({ photo, unitLabel })}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/40 space-y-2">
                    <Paintbrush className="w-7 h-7 mx-auto text-zinc-600" />
                    <p className="text-xs text-zinc-300 font-semibold">No units added yet for today</p>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                      Go into the unit, snap damage photos, patch and paint, snap the finished wall, clean floors and leave.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddUnit}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 rounded-xl shadow transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Unit
                    </button>
                  </div>
                )}
              </div>

              {/* Finish Day Button */}
              {activeLog.units.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitDay}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{activeLog.status === 'Submitted' ? 'Update & Submit Day' : 'Mark Day Finished'}</span>
                  </button>
                </div>
              )}
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
                  setActiveTab('today');
                }}
                onOpenPhotoViewer={(photo, unitLabel) => setViewingPhoto({ photo, unitLabel })}
                onSaveLogs={(updatedList) => {
                  setLogs(updatedList);
                  saveStoredLogs(updatedList);
                  showToast('Week updated');
                }}
              />
            </div>
          )}
        </main>

        {/* Bottom Quick-Action Bar */}
        {activeTab === 'today' && (
          <div className="fixed bottom-0 inset-x-0 p-3 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/80 z-20 flex items-center justify-between gap-2 max-w-lg mx-auto">
            <button
              onClick={handleAddUnit}
              className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Add Unit</span>
            </button>

            <button
              onClick={() => {
                if (activeLog.units.length === 0) {
                  handleAddUnit();
                } else {
                  // Trigger first unit's before camera
                  const cam = document.querySelector('input[type="file"]') as HTMLInputElement;
                  if (cam) cam.click();
                }
              }}
              className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
            >
              <Camera className="w-4 h-4" />
              <span>Snap Photo</span>
            </button>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 text-white border border-zinc-700 shadow-xl px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans antialiased">
      {isMobileFrameView ? (
        <div className="w-full max-w-md h-[100dvh] sm:h-[860px] sm:max-h-[92vh] sm:border-[10px] sm:border-zinc-850 sm:rounded-[44px] overflow-hidden shadow-2xl relative flex flex-col bg-zinc-950 sm:ring-1 sm:ring-zinc-800">
          <div className="hidden sm:block absolute top-0 inset-x-0 h-5 z-40 pointer-events-none">
            <div className="w-28 h-4 bg-zinc-850 mx-auto rounded-b-xl flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-zinc-950"></div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {renderAppContent()}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl min-h-screen mx-auto flex flex-col border-x border-zinc-800 bg-zinc-950">
          {renderAppContent()}
        </div>
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photo={viewingPhoto?.photo || null}
        unitLabel={viewingPhoto?.unitLabel}
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
          showToast('Settings saved');
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onResetDemoData={handleResetDemoData}
        onClearAllData={handleClearAllData}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={auth.user}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
