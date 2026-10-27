import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, X, Check } from 'lucide-react';
import { UserAccount } from '../types/worklog';
import { saveStoredAuth } from '../utils/storage';

interface AuthModalProps {
  isOpen: boolean;
  currentUser?: UserAccount;
  onClose: () => void;
  onAuthSuccess: (token: string, user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, currentUser, onClose, onAuthSuccess }) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [bossName, setBossName] = useState('');
  const [bossEmail, setBossEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload =
      mode === 'login'
        ? { email, password }
        : {
            email,
            password,
            workerName: workerName || 'Coleby Braddy',
            bossName: bossName || 'Jermaine',
            bossEmail: bossEmail || 'jermaine@company.com',
            companyName: 'Field Services',
          };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check credentials.');
      }

      saveStoredAuth(data.token, data.user);
      onAuthSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'technician@paintpros.com',
          password: 'password123',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        saveStoredAuth(data.token, data.user);
        onAuthSuccess(data.token, data.user);
        onClose();
      } else {
        // Register demo user if not existing yet
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'technician@paintpros.com',
            password: 'password123',
            workerName: 'Coleby Braddy',
            bossName: 'Jermaine',
            bossEmail: 'jermaine@company.com',
            companyName: 'Field Services',
          }),
        });
        const regData = await regRes.json();
        if (regRes.ok) {
          saveStoredAuth(regData.token, regData.user);
          onAuthSuccess(regData.token, regData.user);
          onClose();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#1C1C1E] border-t sm:border border-[#2C2C2E] rounded-t-[28px] sm:rounded-[24px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-250">
        {/* iOS Grab Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[#38383A]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2C2C2E] bg-[#1C1C1E]">
          <button
            type="button"
            onClick={onClose}
            className="text-[17px] text-[#0A84FF] active:opacity-60 transition-opacity font-normal py-1"
          >
            Cancel
          </button>
          <span className="text-[17px] font-semibold text-white tracking-tight">
            {mode === 'login' ? 'Sign In' : 'New Account'}
          </span>
          <div className="w-12" />
        </div>

        {/* iOS Segmented Control */}
        <div className="p-4 pb-2 bg-black">
          <div className="p-0.5 bg-[#1C1C1E] border border-[#2C2C2E] rounded-[10px] flex">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-[13px] font-semibold rounded-[8px] transition-all ${
                mode === 'login'
                  ? 'bg-[#636366]/40 text-white shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-[13px] font-semibold rounded-[8px] transition-all ${
                mode === 'register'
                  ? 'bg-[#636366]/40 text-white shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-4 mb-2 p-3 bg-[#FF453A]/15 border border-[#FF453A]/30 rounded-[12px] text-[13px] text-[#FF453A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 bg-black">
          {/* Credentials Inset Group */}
          <div className="bg-[#1C1C1E] rounded-[16px] border border-[#2C2C2E] overflow-hidden divide-y divide-[#2C2C2E]">
            {mode === 'register' && (
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <label className="text-[15px] font-medium text-white w-24 shrink-0">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Coleby Braddy"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full bg-transparent text-right text-[15px] text-white placeholder-[#636366] focus:outline-none"
                />
              </div>
            )}

            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <label className="text-[15px] font-medium text-white w-24 shrink-0">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="tech@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-right text-[15px] text-white placeholder-[#636366] focus:outline-none"
              />
            </div>

            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <label className="text-[15px] font-medium text-white w-24 shrink-0">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-right text-[15px] text-white placeholder-[#636366] focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <div className="text-[13px] font-normal uppercase tracking-wider text-[#8E8E93] px-3 mb-1.5">
                Supervisor Details
              </div>
              <div className="bg-[#1C1C1E] rounded-[16px] border border-[#2C2C2E] overflow-hidden divide-y divide-[#2C2C2E]">
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <label className="text-[15px] font-medium text-white w-28 shrink-0">
                    Boss Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jermaine"
                    value={bossName}
                    onChange={(e) => setBossName(e.target.value)}
                    className="w-full bg-transparent text-right text-[15px] text-white placeholder-[#636366] focus:outline-none"
                  />
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <label className="text-[15px] font-medium text-white w-28 shrink-0">
                    Boss Email
                  </label>
                  <input
                    type="email"
                    placeholder="jermaine@company.com"
                    value={bossEmail}
                    onChange={(e) => setBossEmail(e.target.value)}
                    className="w-full bg-transparent text-right text-[15px] text-white placeholder-[#636366] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold rounded-[14px] text-[16px] active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Connecting...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          {mode === 'login' && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="text-[13px] text-[#0A84FF] hover:underline"
              >
                Instant Demo Sign In (Coleby Braddy)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
