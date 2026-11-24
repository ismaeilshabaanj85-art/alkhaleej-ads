import type {
  AdminEngineSettings,
  AdminLockoutState,
  TrialState,
} from '../types/ads';
import { createInitialTrialState } from './trials';
import { resetLockout } from './auth';

const TRIAL_KEY = 'smart_gulf_ads_trial_v1';
const LOCKOUT_KEY = 'smart_gulf_ads_admin_lockout_v1';
const ACTIVATION_LOCKOUT_KEY = 'smart_gulf_ads_activation_lockout_v1';
const SETTINGS_KEY = 'smart_gulf_ads_engine_settings_v1';
const CODES_KEY = 'smart_gulf_ads_generated_codes_v1';
const GEMINI_API_KEY_STORAGE = 'smart_gulf_ads_gemini_api_key_v1';

export function loadActivationLockoutState(): AdminLockoutState {
  try {
    const raw = localStorage.getItem(ACTIVATION_LOCKOUT_KEY);
    if (!raw) return resetLockout();
    const parsed = JSON.parse(raw) as Partial<AdminLockoutState>;
    return {
      failedAttempts:
        typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
      lockedUntil:
        typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null,
    };
  } catch {
    return resetLockout();
  }
}

export function saveActivationLockoutState(state: AdminLockoutState): void {
  try {
    localStorage.setItem(ACTIVATION_LOCKOUT_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadGeminiApiKey(): string {
  try {
    return (localStorage.getItem(GEMINI_API_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(apiKey: string): void {
  try {
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function clearGeminiApiKey(): void {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
  } catch {
    // Ignore storage errors
  }
}

export function loadTrialState(): TrialState {
  try {
    const raw = localStorage.getItem(TRIAL_KEY);
    if (!raw) return createInitialTrialState();
    const parsed = JSON.parse(raw) as Partial<TrialState>;
    return {
      usedTrials:
        typeof parsed.usedTrials === 'number' ? parsed.usedTrials : 0,
      isActivated: Boolean(parsed.isActivated),
      activatedCode:
        typeof parsed.activatedCode === 'string' ? parsed.activatedCode : null,
      activatedAt:
        typeof parsed.activatedAt === 'number' ? parsed.activatedAt : null,
    };
  } catch {
    return createInitialTrialState();
  }
}

export function saveTrialState(state: TrialState): void {
  try {
    localStorage.setItem(TRIAL_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadLockoutState(): AdminLockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return resetLockout();
    const parsed = JSON.parse(raw) as Partial<AdminLockoutState>;
    return {
      failedAttempts:
        typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
      lockedUntil:
        typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null,
    };
  } catch {
    return resetLockout();
  }
}

export function saveLockoutState(state: AdminLockoutState): void {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadEngineSettings(): AdminEngineSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        defaultDialect: 'خليجية بيضاء',
        creativeTone: 'فاخر ومقنع',
        showBrandWatermark: true,
      };
    }
    const parsed = JSON.parse(raw) as Partial<AdminEngineSettings>;
    return {
      defaultDialect: parsed.defaultDialect || 'خليجية بيضاء',
      creativeTone: parsed.creativeTone || 'فاخر ومقنع',
      showBrandWatermark:
        typeof parsed.showBrandWatermark === 'boolean'
          ? parsed.showBrandWatermark
          : true,
    };
  } catch {
    return {
      defaultDialect: 'خليجية بيضاء',
      creativeTone: 'فاخر ومقنع',
      showBrandWatermark: true,
    };
  }
}

export function saveEngineSettings(settings: AdminEngineSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadGeneratedCodes(): string[] {
  try {
    const raw = localStorage.getItem(CODES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((c): c is string => typeof c === 'string')
      : [];
  } catch {
    return [];
  }
}

export function saveGeneratedCodes(codes: string[]): void {
  try {
    localStorage.setItem(CODES_KEY, JSON.stringify(codes.slice(0, 25)));
  } catch {
    // Ignore storage quota errors
  }
}
