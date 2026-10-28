import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Paintbrush,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon,
  Smartphone,
  Maximize2,
  Plus,
  LogIn,
  Check,
  Wifi,
  Battery,
  Sparkles,
  History,
  ShieldCheck,
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
  restoreUserUnit1324,
  isDemoData,
} from './utils/storage';
import { formatDisplayDate, getTodayISODate, getWeekRange } from './utils/dateUtils';

import { TimeSectionEditor } from './components/TimeSectionEditor';
import { UnitWorkCard } from './components/UnitWorkCard';
import { WeeklyReportTab } from './components/WeeklyReportTab';
import { WeeklyPrintView } from './components/WeeklyPrintView';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

type ActiveTab = 'today' | 'weekly' | 'settings';

export default function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [logs, setLogs] = useState<DailyWorkLog[]>(() => getStoredLogs());
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayISODate());
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    return getWeekRange(getTodayISODate()).start;
  });
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
    if (isDemoData(logs)) {
      const restored = restoreUserUnit1324([]);
      setLogs(restored);
      setCurrentDate('2026-10-26');
      setActiveLog(getLogForDate('2026-10-26', restored));
      showToast('Restored Unit 1324 work & photos! Demo presets removed.');
    }
  }, []);

  useEffect(() => {
    setActiveLog(getLogForDate(currentDate, logs));
  }, [currentDate, logs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
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
    showToast('New unit added');
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

  const handleSubmitDay = () => {
    updateActiveLog({
      ...activeLog,
      status: 'Submitted',
    });
    showToast(`Shift submitted for approval`);
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

  const handleRestoreUnit1324 = () => {
    const updated = restoreUserUnit1324(logs);
    setLogs(updated);
    setCurrentDate('2026-10-26');
    setActiveLog(getLogForDate('2026-10-26', updated));
    setActiveTab('today');
    showToast('Restored Unit 1324 work & photos!');
  };

  const handleRestoreSnapshotLogs = (restoredLogs: DailyWorkLog[]) => {
    setLogs(restoredLogs);
    setActiveLog(getLogForDate(currentDate, restoredLogs));
    showToast('Restored from backup snapshot');
  };

  const handleClearAllData = () => {
    saveStoredLogs([]);
    setLogs([]);
    showToast('All logs cleared');
  };

  // Helper to generate the 7 days of the active week for the Apple Calendar-style day scrubber
  const currentWeekDays = React.useMemo(() => {
    const range = getWeekRange(currentDate);
    const [y, m, d] = range.start.split('-').map(Number);
    const days: { dateStr: string; dayAbbr: string; dayNum: number; isToday: boolean; hasData: boolean }[] = [];
    const todayIso = getTodayISODate();

    for (let i = 0; i < 7; i++) {
      const dt = new Date(y, m - 1, d + i);
      const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const log = logs.find((l) => l.date === iso);
      const hasUnits = !!(log && (log.units.length > 0 || log.time.totalHours > 0));

      days.push({
        dateStr: iso,
        dayAbbr: dayNames[dt.getDay()],
        dayNum: dt.getDate(),
        isToday: iso === todayIso,
        hasData: hasUnits,
      });
    }
    return days;
  }, [currentDate, logs]);

  const renderAppContent = () => {
    return (
      <div className="flex flex-col h-full bg-black text-[#F2F2F7] font-sans overflow-hidden select-none">
        {/* iOS Status Bar Simulation (Inside device frame or top of mobile) */}
        <div className="h-11 px-6 pt-2 flex items-center justify-between text-[14px] font-semibold tracking-tight text-white select-none shrink-0">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium tracking-tight">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* iOS Top Navigation Bar */}
        <header className="px-4 py-2 border-b border-[#2C2C2E]/60 bg-black/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center justify-between">
            {/* Left: App Title / Technician Info */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 border border-[#0A84FF]/30 flex items-center justify-center text-[#0A84FF] font-semibold text-xs shadow-sm">
                <Paintbrush className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-semibold text-white tracking-tight leading-none">
                    FieldLog
                  </span>
                  {auth.token ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] inline-block" title="Cloud Synced" />
                  ) : null}
                </div>
                <p className="text-[11px] text-[#8E8E93] truncate max-w-[170px] mt-0.5">
                  {auth.user.workerName} • Boss: {auth.user.bossName}
                </p>
              </div>
            </div>

            {/* Right: Quick Settings & View Mode Toggle */}
            <div className="flex items-center gap-1">
              {auth.token ? (
                <div
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-2 py-0.5 bg-[#30D158]/15 border border-[#30D158]/30 text-[#30D158] rounded-full text-[11px] font-medium cursor-pointer"
                >
                  Cloud
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-2.5 py-1 text-[12px] font-semibold text-[#0A84FF] hover:bg-[#1C1C1E] rounded-full transition-colors flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMobileFrameView(!isMobileFrameView)}
                title={isMobileFrameView ? 'Expand to Wide Mode' : 'Switch to iPhone Frame'}
                className="hidden lg:flex p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#1C1C1E] rounded-full transition-colors"
              >
                {isMobileFrameView ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#1C1C1E] rounded-full transition-colors"
                title="Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Apple Calendar Day Scrubber (Only visible in Today view) */}
          {activeTab === 'today' && (
            <div className="mt-2.5 pt-2 border-t border-[#2C2C2E]/60">
              <div className="flex items-center justify-between mb-2 px-1">
                <button
                  onClick={() => handleShiftDay(-7)}
                  className="text-[12px] font-medium text-[#0A84FF] flex items-center gap-0.5 active:opacity-60 transition-opacity"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev Week</span>
                </button>

                <div className="text-[13px] font-semibold text-white tracking-tight">
                  {formatDisplayDate(currentDate)}
                </div>

                <button
                  onClick={() => handleShiftDay(7)}
                  className="text-[12px] font-medium text-[#0A84FF] flex items-center gap-0.5 active:opacity-60 transition-opacity"
                >
                  <span>Next Week</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontal 7-Day Pill Row */}
              <div className="grid grid-cols-7 gap-1 bg-[#1C1C1E] p-1.5 rounded-[14px] border border-[#2C2C2E]">
                {currentWeekDays.map((d) => {
                  const isSelected = d.dateStr === currentDate;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setCurrentDate(d.dateStr)}
                      className={`flex flex-col items-center justify-center py-1.5 rounded-[10px] transition-all relative ${
                        isSelected
                          ? 'bg-[#0A84FF] text-white shadow-sm'
                          : 'text-[#8E8E93] hover:text-white hover:bg-[#2C2C2E]/40'
                      }`}
                    >
                      <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-[#8E8E93]'}`}>
                        {d.dayAbbr}
                      </span>
                      <span className={`text-[15px] font-bold leading-tight ${isSelected ? 'text-white' : 'text-[#F2F2F7]'}`}>
                        {d.dayNum}
                      </span>
                      {d.hasData && (
                        <span
                          className={`w-1 h-1 rounded-full mt-0.5 ${
                            isSelected ? 'bg-white' : 'bg-[#30D158]'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-4">
          {activeTab === 'today' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* iOS Large Title Bar */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-white leading-none">
                    Today
                  </h1>
                  <p className="text-[13px] text-[#8E8E93] mt-1">
                    {activeLog.units.length} unit{activeLog.units.length === 1 ? '' : 's'} logged • {activeLog.time.totalHours} hrs
                  </p>
                </div>

                <span
                  className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border ${
                    activeLog.status === 'Submitted'
                      ? 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30'
                      : 'bg-[#2C2C2E] text-[#8E8E93] border-[#38383A]'
                  }`}
                >
                  {activeLog.status === 'Submitted' ? 'Submitted' : 'In Progress'}
                </span>
              </div>

              {/* iOS Shift Hours Tracker */}
              <TimeSectionEditor
                time={activeLog.time}
                onTimeChange={handleTimeChange}
              />

              {/* iOS Units List Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[13px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                    Units Serviced ({activeLog.units.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    className="inline-flex items-center gap-1 py-1 px-3 bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold rounded-full text-[13px] active:scale-95 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Unit</span>
                  </button>
                </div>

                {activeLog.units.length > 0 ? (
                  <div className="space-y-3">
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
                  <div className="text-center py-10 px-4 rounded-[20px] bg-[#1C1C1E] border border-[#2C2C2E] space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93]">
                      <Paintbrush className="w-6 h-6" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-white">No Units Logged Today</h3>
                    <p className="text-[13px] text-[#8E8E93] max-w-xs mx-auto">
                      Snap damage photos before you start, patch and roll paint, snap finished photos, clean floors, and log completion.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddUnit}
                      className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-white bg-[#0A84FF] hover:bg-[#0071E3] px-4 py-2 rounded-full shadow transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Unit
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Day Button */}
              {activeLog.units.length > 0 && activeLog.status !== 'Submitted' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitDay}
                    className="w-full py-3.5 bg-[#30D158] hover:bg-[#28B84D] text-black font-bold rounded-[14px] text-[15px] active:scale-[0.98] transition-all shadow flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Complete & Submit Today's Shift</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="animate-in fade-in duration-200">
              <WeeklyReportTab
                currentDate={currentDate}
                logs={logs}
                selectedWeekStart={selectedWeekStart}
                onSelectWeekStart={setSelectedWeekStart}
                onWeekChange={setSelectedWeekStart}
                profile={auth.user}
                onSelectDate={(d) => {
                  setCurrentDate(d);
                  setActiveTab('today');
                }}
                onOpenPhotoViewer={(p, l) => setViewingPhoto({ photo: p, unitLabel: l })}
                onSaveLogs={(newLogs) => setLogs(newLogs)}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="pt-1">
                <h1 className="text-[28px] font-extrabold tracking-tight text-white leading-none">
                  Settings
                </h1>
                <p className="text-[13px] text-[#8E8E93] mt-1">
                  Technician profile, supervisor destination & local data
                </p>
              </div>

              {/* Open full Settings sheet */}
              <div className="bg-[#1C1C1E] rounded-[16px] border border-[#2C2C2E] p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0A84FF]/20 border border-[#0A84FF]/30 flex items-center justify-center text-[#0A84FF] font-bold text-lg">
                    {auth.user.workerName ? auth.user.workerName.charAt(0) : 'C'}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-white">
                      {auth.user.workerName || 'Coleby Braddy'}
                    </h3>
                    <p className="text-[13px] text-[#8E8E93]">
                      Supervisor: {auth.user.bossName || 'Jermaine'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full py-3 bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold rounded-[12px] text-[15px] active:scale-95 transition-all text-center"
                >
                  Edit Technician & Boss Settings
                </button>
              </div>

              {/* Data Recovery & Backups Card */}
              <div>
                <span className="text-[13px] font-semibold uppercase tracking-wider text-[#30D158] px-3 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Data Recovery & Safety
                </span>
                <div className="bg-[#1C1C1E] rounded-[16px] border border-[#2C2C2E] overflow-hidden divide-y divide-[#2C2C2E]">
                  <button
                    type="button"
                    onClick={handleRestoreUnit1324}
                    className="w-full p-4 text-left flex items-center justify-between text-[15px] text-[#30D158] hover:bg-[#30D158]/10"
                  >
                    <div className="flex items-center gap-3">
                      <History className="w-5 h-5 text-[#30D158]" />
                      <div>
                        <span className="font-semibold block">Restore Unit 1324 (Monday Oct 26)</span>
                        <span className="text-[12px] text-[#8E8E93]">Recovers your 7.5 hrs, Unit 1324 & 4 real photos</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full p-4 text-left flex items-center justify-between text-[15px] text-white hover:bg-[#2C2C2E]/40"
                  >
                    <span>View Safety Snapshots & Rollbacks</span>
                    <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllData}
                    className="w-full p-4 text-left flex items-center justify-between text-[15px] text-[#FF453A] hover:bg-[#FF453A]/10"
                  >
                    <span>Clear All Work Logs (Blank Week)</span>
                    <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* iOS Native Bottom Tab Bar (`UITabBar`) */}
        <nav className="fixed bottom-0 inset-x-0 z-30 h-[76px] pb-5 px-6 bg-[#1C1C1E]/85 backdrop-blur-xl border-t border-[#38383A] flex items-center justify-around select-none">
          {/* Tab 1: Today */}
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
              activeTab === 'today' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
            }`}
          >
            <Clock className="w-6 h-6 stroke-[2]" />
            <span className="text-[10px] font-semibold tracking-tight">Today</span>
          </button>

          {/* Tab 2: Weekly Report */}
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
              activeTab === 'weekly' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
            }`}
          >
            <FileText className="w-6 h-6 stroke-[2]" />
            <span className="text-[10px] font-semibold tracking-tight">Weekly Report</span>
          </button>

          {/* Tab 3: Settings */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
              activeTab === 'settings' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
            }`}
          >
            <SettingsIcon className="w-6 h-6 stroke-[2]" />
            <span className="text-[10px] font-semibold tracking-tight">Settings</span>
          </button>
        </nav>

        {/* iOS Home Indicator Bar */}
        <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none z-40">
          <div className="w-32 h-1 bg-white/40 rounded-full" />
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-14 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
            <div className="bg-[#2C2C2E]/90 text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-2xl backdrop-blur-md border border-[#38383A] flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
              <span className="w-2 h-2 rounded-full bg-[#30D158]" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-0 lg:p-6 overflow-x-hidden">
      {/* If Frame View is active on Desktop, render inside an authentic iPhone 16 chassis */}
      {isMobileFrameView ? (
        <div className="relative w-full max-w-[430px] h-[100dvh] lg:h-[880px] lg:rounded-[54px] lg:shadow-[0_25px_70px_rgba(0,0,0,0.85)] lg:border-[10px] lg:border-[#2C2C2E] overflow-hidden bg-black flex flex-col">
          {/* iPhone Dynamic Island */}
          <div className="hidden lg:flex absolute top-3 inset-x-0 justify-center z-40 pointer-events-none">
            <div className="w-28 h-7 bg-black rounded-full flex items-center justify-between px-3 border border-white/10 shadow-md">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-white/10" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>
          </div>

          {renderAppContent()}
        </div>
      ) : (
        /* Wide Mode for Desktop Full-Screen viewing */
        <div className="w-full max-w-5xl h-[100dvh] lg:h-[90vh] bg-black lg:rounded-[24px] lg:border border-[#2C2C2E] overflow-hidden shadow-2xl flex flex-col">
          {renderAppContent()}
        </div>
      )}

      {/* Hidden print element for direct browser print dialog if user ever presses window.print() */}
      <WeeklyPrintView
        dates={getWeekRange(selectedWeekStart).dates}
        logs={logs}
        profile={auth.user}
      />

      {/* Full Photo Viewer Modal */}
      <PhotoViewerModal
        photo={viewingPhoto ? viewingPhoto.photo : null}
        unitLabel={viewingPhoto?.unitLabel}
        onClose={() => setViewingPhoto(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        profile={auth.user}
        isLoggedIn={!!auth.token}
        onClose={() => setIsSettingsOpen(false)}
        onSaveProfile={(updated) => {
          setAuth({ ...auth, user: updated });
          saveStoredAuth(auth.token, updated);
          showToast('Settings saved');
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onRestoreUnit1324={handleRestoreUnit1324}
        onClearAllData={handleClearAllData}
        onRestoreSnapshotLogs={handleRestoreSnapshotLogs}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
