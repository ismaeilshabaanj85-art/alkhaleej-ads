import { useEffect, useState } from 'react';
import { Lock, ShieldAlert, X } from 'lucide-react';
import type { AdminLockoutState } from '../types/ads';
import {
  MAX_ADMIN_ATTEMPTS,
  getRemainingLockSeconds,
  isLockedOut,
  recordFailedAttempt,
  resetLockout,
  verifyAdminCredentials,
} from '../utils/auth';
import { loadLockoutState, saveLockoutState } from '../utils/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockout, setLockout] = useState<AdminLockoutState>(() =>
    loadLockoutState()
  );
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingLockSeconds(loadLockoutState())
  );

  useEffect(() => {
    if (!isOpen) return;
    const loaded = loadLockoutState();
    setLockout(loaded);
    setRemainingSeconds(getRemainingLockSeconds(loaded));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isLockedOut(lockout)) return;
    const timer = setInterval(() => {
      const rem = getRemainingLockSeconds(lockout);
      setRemainingSeconds(rem);
      if (rem <= 0) {
        const cleared = resetLockout();
        setLockout(cleared);
        saveLockoutState(cleared);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, lockout]);

  if (!isOpen) return null;

  const locked = isLockedOut(lockout) && remainingSeconds > 0;
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (locked) return;

    if (verifyAdminCredentials(username, password)) {
      const cleared = resetLockout();
      setLockout(cleared);
      saveLockoutState(cleared);
      setUsername('');
      setPassword('');
      onSuccess();
      return;
    }

    const nextLockout = recordFailedAttempt(lockout);
    setLockout(nextLockout);
    saveLockoutState(nextLockout);

    if (isLockedOut(nextLockout)) {
      setRemainingSeconds(getRemainingLockSeconds(nextLockout));
      setError(
        'تم تجاوز الحد المسموح (3 محاولات خاطئة). تم حظر الدخول لمدة 30 دقيقة.'
      );
    } else {
      const left = MAX_ADMIN_ATTEMPTS - nextLockout.failedAttempts;
      setError(
        `بيانات الدخول غير صحيحة. المتبقي قبل الحظر المؤقت: ${left} محاولات.`
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[#D4AF37]/35 bg-[#0F1626] p-6 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق نافذة دخول الإدارة"
          className="absolute top-4 left-4 cursor-pointer rounded-lg p-2 text-[#B8B4AA] hover:bg-white/10 hover:text-[#F4F1EA]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10">
            <Lock className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="admin-login-title"
              className="text-lg font-extrabold text-[#F4F1EA]"
            >
              بوابة الإدارة السرية
            </h2>
            <p className="text-xs text-[#9C978B]">
              لوحة تحكم المؤسس · اسماعيل زكريا شعبان
            </p>
          </div>
        </div>

        {locked && (
          <div
            role="alert"
            data-testid="admin-lockout-banner"
            className="mb-5 rounded-xl border border-red-500/45 bg-red-500/12 p-4 text-xs leading-relaxed text-red-200"
          >
            <div className="flex items-center gap-2 font-bold text-red-300">
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>تم حظر محاولة الدخول مؤقتاً</span>
            </div>
            <p className="mt-1.5">
              بسبب 3 محاولات خاطئة، يرجى الانتظار لمدة:{' '}
              <span className="font-mono-code font-bold text-white">
                {formattedCountdown}
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-username"
              className="mb-1.5 block text-sm font-semibold text-[#E8E4DA]"
            >
              اسم المستخدم
            </label>
            <input
              id="admin-username"
              type="text"
              dir="ltr"
              autoComplete="off"
              disabled={locked}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-4 py-2.5 text-sm text-[#F4F1EA] focus:border-[#D4AF37] focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-semibold text-[#E8E4DA]"
            >
              كلمة المرور
            </label>
            <input
              id="admin-password"
              type="password"
              dir="ltr"
              autoComplete="off"
              disabled={locked}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-4 py-2.5 text-sm text-[#F4F1EA] focus:border-[#D4AF37] focus:outline-none disabled:opacity-50"
            />
          </div>

          {error && !locked && (
            <p role="alert" className="text-xs font-medium text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={locked}
            className="w-full cursor-pointer rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-extrabold text-[#0B0F19] transition-colors hover:bg-[#E5C354] disabled:cursor-not-allowed disabled:opacity-50"
          >
            دخول إلى لوحة التحكم
          </button>
        </form>
      </div>
    </div>
  );
}
