import React, { useState } from 'react';
import { X, User, Briefcase, Mail, RotateCcw, Trash2, Check, LogOut, LogIn } from 'lucide-react';
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
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div>
            <h2 className="text-base font-bold text-white">Technician & Boss Settings</h2>
            <p className="text-xs text-zinc-400">Configure report recipient and your Render account</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Account Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{profile.workerName}</span>
                <span className="text-[11px] text-zinc-400 block">{profile.email}</span>
              </div>
            </div>

            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs shadow-sm flex items-center gap-1 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Sync</span>
              </button>
            )}
          </div>

          {/* Profile fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={form.workerName}
                onChange={(e) => setForm({ ...form, workerName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Boss / Supervisor Name
              </label>
              <input
                type="text"
                required
                value={form.bossName}
                onChange={(e) => setForm({ ...form, bossName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Boss Email (for reports)
              </label>
              <input
                type="email"
                value={form.bossEmail}
                onChange={(e) => setForm({ ...form, bossEmail: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Demo Data / Clear */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              Data Management
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reload sample work week with units and before/after photos?')) {
                    onResetDemoData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                Reload Demo Week
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all logs and start fresh?')) {
                    onClearAllData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Clear All Logs
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : null}
              {savedSuccess ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
