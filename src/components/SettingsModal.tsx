import React, { useState } from 'react';
import { User, Briefcase, Mail, RotateCcw, Trash2, Check, LogOut, LogIn, ChevronRight, ShieldCheck, Database, Sliders } from 'lucide-react';
import { UserAccount } from '../types/worklog';

interface SettingsModalProps {
  isOpen: boolean;
  profile: UserAccount;
  isLoggedIn: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserAccount) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  profile,
  isLoggedIn,
  onClose,
  onSaveProfile,
  onOpenAuth,
  onLogout,
  onResetDemoData,
  onClearAllData,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<UserAccount>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-[#1C1C1E] border-t sm:border border-[#2C2C2E] rounded-t-[28px] sm:rounded-[24px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-250"
      >
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
                    {form.workerName ? form.workerName.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h4 className="text-[16px] font-semibold text-white leading-tight">
                      {form.workerName || 'Field Technician'}
                    </h4>
                    <p className="text-[13px] text-[#8E8E93] mt-0.5">
                      {isLoggedIn ? (
                        <span className="text-[#30D158] inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" /> Cloud Active
                        </span>
                      ) : (
                        'Local Storage'
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
                  placeholder="boss@company.com"
                  className="w-full bg-transparent text-right text-[15px] text-white placeholder-[#636366] focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[12px] text-[#8E8E93] px-3 mt-1.5">
              These details appear on the weekly PDF timesheet and supervisor signature page.
            </p>
          </div>

          {/* Data Management Inset Group */}
          <div>
            <div className="text-[13px] font-normal uppercase tracking-wider text-[#8E8E93] px-3 mb-1.5">
              Data & Storage
            </div>
            <div className="bg-[#1C1C1E] rounded-[16px] border border-[#2C2C2E] overflow-hidden divide-y divide-[#2C2C2E]">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reload sample work week with units and before/after photos?')) {
                    onResetDemoData();
                    onClose();
                  }
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#2C2C2E]/50 active:bg-[#2C2C2E] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[8px] bg-[#30D158]/20 flex items-center justify-center text-[#30D158]">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[15px] font-medium text-white block">
                      Reload Demo Week
                    </span>
                    <span className="text-[12px] text-[#8E8E93]">
                      Restores Monday-Friday demo units & sample photos
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#636366]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all logs and photos to start fresh?')) {
                    onClearAllData();
                    onClose();
                  }
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#FF453A]/10 active:bg-[#FF453A]/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[8px] bg-[#FF453A]/20 flex items-center justify-center text-[#FF453A]">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[15px] font-medium text-[#FF453A] block">
                      Clear All Logs
                    </span>
                    <span className="text-[12px] text-[#8E8E93]">
                      Deletes local cache and resets week
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
