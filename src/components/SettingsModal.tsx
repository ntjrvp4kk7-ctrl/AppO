import React, { useState } from 'react';
import {
  RotateCcw,
  Trash2,
  Check,
  ChevronRight,
  ShieldCheck,
  Database,
  History,
  Download,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { UserAccount, DailyWorkLog } from '../types/worklog';
import {
  getSavedSnapshots,
  restoreFromSnapshot,
  WorkLogSnapshot,
  saveSnapshot,
} from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  profile: UserAccount;
  isLoggedIn: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserAccount) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onRestoreUnit1324: () => void;
  onClearAllData: () => void;
  onRestoreSnapshotLogs: (logs: DailyWorkLog[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  profile,
  isLoggedIn,
  onClose,
  onSaveProfile,
  onOpenAuth,
  onLogout,
  onRestoreUnit1324,
  onClearAllData,
  onRestoreSnapshotLogs,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<UserAccount>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshots, setSnapshots] = useState<WorkLogSnapshot[]>(() => getSavedSnapshots());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const handleDownloadBackup = () => {
    try {
      const logsRaw = localStorage.getItem('paint_patch_worklog_v3') || '[]';
      const blob = new Blob([logsRaw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fieldlog_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not download backup file');
    }
  };

  const handleRollback = (snap: WorkLogSnapshot) => {
    if (confirm(`Restore backup from ${new Date(snap.timestamp).toLocaleTimeString()} (${snap.unitCount} units)?`)) {
      const restored = restoreFromSnapshot(snap.id);
      if (restored) {
        onRestoreSnapshotLogs(restored);
        setShowSnapshots(false);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#1C1C1E] border-t sm:border border-[#2C2C2E] rounded-t-[28px] sm:rounded-[24px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-250">
        {/* iOS Grab Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[#38383A]" />
        </div>

        {/* iOS Modal Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2C2C2E] bg-[#1C1C1E]">
          <button
            type="button"
            onClick={onClose}
            className="text-[17px] text-[#0A84FF] active:opacity-60 transition-opacity font-normal py-1 px-1"
          >
            Cancel
          </button>
          <span className="text-[17px] font-semibold text-white tracking-tight">
            Settings
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            className="text-[17px] text-[#0A84FF] font-semibold active:opacity-60 transition-opacity py-1 px-1 flex items-center gap-1"
          >
            {savedSuccess ? (
              <span className="text-[#30D158] flex items-center gap-1">
                <Check className="w-4 h-4" /> Done
              </span>
            ) : (
              'Done'
            )}
          </button>
        </div>

        {/* iOS Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 text-sm bg-black">
          {/* Account Inset Group */}
          <div>
            <div className="text-[13px] font-normal uppercase tracking-wider text-[#8E8E93] px-3 mb-1.5">
              Account & Sync
            </div>
            <div className="bg-[#1C1C1E] rounded-[16px] border border-[#2C2C2E] overflow-hidden divide-y divide-[#2C2C2E]">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#0A84FF]/20 border border-[#0A84FF]/30 flex items-center justify-center text-[#0A84FF] font-bold text-base">
                    {form.workerName ? form.workerName.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h4 className="text-[16px] font-semibold text-white leading-tight">
                      {form.workerName || 'Coleby Braddy'}
                    </h4>
                    <p className="text-[13px] text-[#8E8E93] mt-0.5">
                      {isLoggedIn ? (
                        <span className="text-[#30D158] inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" /> Cloud Active
                        </span>
                      ) : (
                        'Local Storage (Protected)'
                      )}
                    </p>
                  </div>
                </div>

                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-[#2C2C2E] hover:bg-[#38383A] text-[#FF453A] rounded-[10px] text-[13px] font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="px-3.5 py-1.5 bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold rounded-[10px] text-[13px] shadow-sm active:scale-95 transition-all"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Technician Profile Inset Group */}
          <div>
            <div className="text-[13px] font-normal uppercase tracking-wider text-[#8E8E93] px-3 mb-1.5">
              Technician & Supervisor Info
            </div>
            <div className="bg-[#1C1C1E] rounded-[16px] border border-[#2C2C2E] overflow-hidden divide-y divide-[#2C2C2E]">
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <label className="text-[15px] font-medium text-white w-28 shrink-0">
                  Technician
                </label>
                <input
                  type="text"
                  required
                  value={form.workerName}
                  onChange={(e) => setForm({ ...form, workerName: e.target.value })}
                  placeholder="e.g. Coleby Braddy"
                  className="w-full bg-transparent text-right text-[15px] text-white placeholder-[#636366] focus:outline-none"
                />
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <label className="text-[15px] font-medium text-white w-28 shrink-0">
                  Supervisor
                </label>
                <input
                  type="text"
                  required
                  value={form.bossName}
                  onChange={(e) => setForm({ ...form, bossName: e.target.value })}
                  placeholder="e.g. Jermaine"
                  className="w-full bg-transparent text-right text-[15px] text-white placeholder-[#636366] focus:outline-none"
                />
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <label className="text-[15px] font-medium text-white w-28 shrink-0">
                  Boss Email
                </label>
                <input
                  type="email"
                  value={form.bossEmail}
                  onChange={(e) => setForm({ ...form, bossEmail: e.target.value })}
                  placeholder="tbrrabbitbiz@gmail.com"
                  className="w-full bg-transparent text-right text-[15px] text-white placeholder-[#636366] focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[12px] text-[#8E8E93] px-3 mt-1.5">
              These details appear on your weekly supervisor reports and exports.
            </p>
          </div>

          {/* Data Recovery & Backups Inset Group */}
          <div>
            <div className="text-[13px] font-normal uppercase tracking-wider text-[#30D158] px-3 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Data Recovery & Safety Backups
            </div>
            <div className="bg-[#1C1C1E] rounded-[16px] border border-[#2C2C2E] overflow-hidden divide-y divide-[#2C2C2E]">
              {/* 1-Click Restore Unit 1324 */}
              <button
                type="button"
                onClick={() => {
                  onRestoreUnit1324();
                  onClose();
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#30D158]/10 active:bg-[#30D158]/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] bg-[#30D158]/20 flex items-center justify-center text-[#30D158]">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[15px] font-semibold text-[#30D158] block">
                      Update TBRRABBITBIZ Work Week
                    </span>
                    <span className="text-[12px] text-[#8E8E93]">
                      Full schedule: Olympus, Legends North, Marsh Point, Old Folks Home (Oct 26 - 30)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#636366]" />
              </button>

              {/* View Automatic Snapshots Rollback */}
              <button
                type="button"
                onClick={() => {
                  setSnapshots(getSavedSnapshots());
                  setShowSnapshots(!showSnapshots);
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#2C2C2E]/50 active:bg-[#2C2C2E] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF]">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[15px] font-medium text-white block">
                      Automatic Snapshots & Rollback
                    </span>
                    <span className="text-[12px] text-[#8E8E93]">
                      {snapshots.length} auto-saved versions available
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-[#636366] transition-transform ${showSnapshots ? 'rotate-90' : ''}`} />
              </button>

              {/* Expanded Snapshots List */}
              {showSnapshots && (
                <div className="p-3 bg-black/40 space-y-2">
                  {snapshots.length === 0 ? (
                    <p className="text-[12px] text-[#8E8E93] text-center py-2">
                      No previous snapshots recorded yet.
                    </p>
                  ) : (
                    snapshots.map((snap) => (
                      <div
                        key={snap.id}
                        className="p-2.5 rounded-[12px] bg-[#2C2C2E]/60 border border-[#38383A] flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-[13px] font-medium text-white">
                            {snap.label}
                          </p>
                          <p className="text-[11px] text-[#8E8E93]">
                            {new Date(snap.timestamp).toLocaleString()} • {snap.unitCount} units • {snap.totalHours.toFixed(1)} hrs
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRollback(snap)}
                          className="px-2.5 py-1 bg-[#0A84FF] hover:bg-[#0071E3] text-white text-[12px] font-semibold rounded-[8px] shrink-0"
                        >
                          Restore
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Download Backup File */}
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#2C2C2E]/50 active:bg-[#2C2C2E] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] bg-[#64D2FF]/20 flex items-center justify-center text-[#64D2FF]">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[15px] font-medium text-white block">
                      Download Local Backup (JSON)
                    </span>
                    <span className="text-[12px] text-[#8E8E93]">
                      Save an offline copy of all work logs & photos
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#636366]" />
              </button>
            </div>
          </div>

          {/* Danger Zone: Clear Data */}
          <div>
            <div className="text-[13px] font-normal uppercase tracking-wider text-[#FF453A] px-3 mb-1.5">
              Reset Options
            </div>
            <div className="bg-[#1C1C1E] rounded-[16px] border border-[#2C2C2E] overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all work logs to start with a blank week? An automatic backup will be saved first.')) {
                    onClearAllData();
                    onClose();
                  }
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#FF453A]/10 active:bg-[#FF453A]/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] bg-[#FF453A]/20 flex items-center justify-center text-[#FF453A]">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[15px] font-medium text-[#FF453A] block">
                      Clear All Work Logs (Blank Week)
                    </span>
                    <span className="text-[12px] text-[#8E8E93]">
                      Empties week logs (safely backed up in snapshots)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#636366]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
