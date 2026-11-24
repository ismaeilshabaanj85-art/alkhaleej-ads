import type { AdminLockoutState, TrialState } from '../types/ads';
import { normalizeActivationCode, verifyActivationCode } from './activation';
import {
  LOCKOUT_DURATION_MS,
  MAX_ADMIN_ATTEMPTS,
  isLockedOut,
  recordFailedAttempt,
  resetLockout,
} from './auth';

export const MAX_FREE_TRIALS = 2;

export function createInitialTrialState(): TrialState {
  return {
    usedTrials: 0,
    isActivated: false,
    activatedCode: null,
    activatedAt: null,
  };
}

export function getRemainingTrials(state: TrialState): number {
  if (state.isActivated) {
    return Infinity;
  }
  return Math.max(0, MAX_FREE_TRIALS - state.usedTrials);
}

export function canGenerateAd(state: TrialState): boolean {
  return state.isActivated || state.usedTrials < MAX_FREE_TRIALS;
}

export function consumeFreeTrial(state: TrialState): TrialState {
  if (state.isActivated) {
    return state;
  }
  return {
    ...state,
    usedTrials: Math.min(MAX_FREE_TRIALS, state.usedTrials + 1),
  };
}

export function resetFounderTrials(): TrialState {
  return createInitialTrialState();
}

export function applyActivationCode(
  state: TrialState,
  rawCode: string,
  lockoutState: AdminLockoutState = resetLockout(),
  nowMs: number = Date.now()
): {
  success: boolean;
  nextState: TrialState;
  nextLockout: AdminLockoutState;
  error?: string;
} {
  if (isLockedOut(lockoutState, nowMs)) {
    const mins = Math.ceil(
      ((lockoutState.lockedUntil ?? nowMs) - nowMs) / 60000
    );
    return {
      success: false,
      nextState: state,
      nextLockout: lockoutState,
      error: `تم حظر محاولات التفعيل لمدة 30 دقيقة بسبب 3 محاولات خاطئة. المتبقي: ${mins} دقيقة.`,
    };
  }

  const normalized = normalizeActivationCode(rawCode);
  if (!normalized) {
    return {
      success: false,
      nextState: state,
      nextLockout: lockoutState,
      error: 'يرجى إدخال كود التفعيل أولاً بصيغة KHALEEJ-XXXX-XXXX.',
    };
  }

  if (!verifyActivationCode(normalized)) {
    const nextLockout = recordFailedAttempt(lockoutState, nowMs);
    if (isLockedOut(nextLockout, nowMs)) {
      return {
        success: false,
        nextState: state,
        nextLockout,
        error:
          'تم إدخال 3 أكواد خاطئة. تم حظر إدخال الأكواد مؤقتاً لمدة 30 دقيقة.',
      };
    }
    const left = MAX_ADMIN_ATTEMPTS - nextLockout.failedAttempts;
    return {
      success: false,
      nextState: state,
      nextLockout,
      error: `كود التفعيل غير صالح. الصيغة الصحيحة KHALEEJ-XXXX-XXXX (متبقي ${left} محاولات).`,
    };
  }

  return {
    success: true,
    nextState: {
      ...state,
      isActivated: true,
      activatedCode: normalized,
      activatedAt: nowMs,
    },
    nextLockout: resetLockout(),
  };
}

export { LOCKOUT_DURATION_MS };
