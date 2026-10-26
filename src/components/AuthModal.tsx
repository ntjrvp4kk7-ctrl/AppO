import React, { useState } from 'react';
import { X, User, Lock, Mail, Building, Briefcase, CheckCircle, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { UserAccount } from '../types/worklog';
import { saveStoredAuth } from '../utils/storage';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserAccount | null;
  onClose: () => void;
  onAuthSuccess: (token: string, user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onAuthSuccess,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [bossName, setBossName] = useState('');
  const [bossEmail, setBossEmail] = useState('');
  const [companyName, setCompanyName] = useState('Apex Paint & Drywall');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Login failed');
        }
        saveStoredAuth(data.token, data.user);
        onAuthSuccess(data.token, data.user);
        onClose();
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            workerName,
            bossName,
            bossEmail,
            companyName,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        saveStoredAuth(data.token, data.user);
        onAuthSuccess(data.token, data.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    // Quick one-click sign in for testing
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'technician@paintpros.com', password: 'password123' }),
      });
      if (res.ok) {
        const data = await res.json();
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
            workerName: 'Carlos Rivera',
            bossName: 'Greg Mitchell',
            bossEmail: 'greg.m@primepropertiesmgmt.com',
            companyName: 'Apex Paint & Drywall Services',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              {mode === 'login' ? 'Technician Sign In' : 'Create Painter Account'}
            </h2>
            <p className="text-xs text-neutral-400">Save your weekly logs & photos to your account</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-400 hover:text-white'
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
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === 'register'
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-sm">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Your Full Name (Painter/Tech) <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Carlos Rivera"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Email / Username <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="email"
                required
                placeholder="carlos@paintpros.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Password <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="pt-1 border-t border-neutral-800/80">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                  Boss & Company Setup
                </span>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Boss / Supervisor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Greg Mitchell"
                      value={bossName}
                      onChange={(e) => setBossName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Boss Email Address (for reports)
                    </label>
                    <input
                      type="email"
                      placeholder="greg@properties.com"
                      value={bossEmail}
                      onChange={(e) => setBossEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs sm:text-sm active:scale-95 transition-all shadow disabled:opacity-50"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In to Account' : 'Create & Start Logging'}
            </button>
          </div>

          {mode === 'login' && (
            <div className="pt-2 border-t border-neutral-800 text-center">
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="text-xs text-neutral-400 hover:text-amber-400 underline transition-colors"
              >
                Instant Demo Sign In (Carlos Rivera)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
