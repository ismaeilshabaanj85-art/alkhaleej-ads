import type { GeneratedMarketingCampaign, VideoSlide } from '../types/ads';

export function cleanSpeechText(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/[\uFE0F\u200D]/g, '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[*_`#~|•·✦◆★☆«»"(){}[\]<>]+/g, ' ')
    .replace(/([،؛,.!؟?])(?:\s*\1)+/g, '$1')
    .replace(/\s+([،؛,.!؟?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildAdVoiceoverScript(
  slides: VideoSlide[],
  adCopy?: string
): string {
  const cleanedCopy = adCopy ? cleanSpeechText(adCopy) : '';
  if (cleanedCopy && cleanedCopy.length <= 280) {
    return cleanedCopy;
  }

  const parts = slides
    .map((s) =>
      cleanSpeechText([s.headline, s.subline, s.accentValue].filter(Boolean).join('، '))
    )
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join('. ');
  }

  return cleanedCopy;
}

export function buildPromoVoiceoverScript(
  slides: VideoSlide[],
  campaign: GeneratedMarketingCampaign | null
): string {
  if (campaign) {
    const combined = cleanSpeechText(
      [campaign.videoHook, campaign.tiktokReelsScript].filter(Boolean).join('. ')
    );
    if (combined) {
      return combined.slice(0, 340);
    }
  }

  return slides
    .map((s) =>
      cleanSpeechText([s.headline, s.subline, s.accentValue].filter(Boolean).join('، '))
    )
    .filter(Boolean)
    .join('. ');
}

export interface VoiceLike {
  lang: string;
  name?: string;
  default?: boolean;
}

function isArabicLang(lang: string): boolean {
  const lower = lang.toLowerCase();
  return lower === 'ar' || lower.startsWith('ar-') || lower.startsWith('ar_');
}

export function pickArabicVoice<T extends VoiceLike>(voices: T[]): T | null {
  if (!voices || voices.length === 0) return null;

  const arabicVoices = voices.filter((v) => isArabicLang(v.lang || ''));
  if (arabicVoices.length === 0) return null;

  const scoreVoice = (v: T): number => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    let score = 0;

    if (name.includes('google')) score += 40;
    else if (name.includes('microsoft')) score += 35;

    if (lang === 'ar-sa') score += 30;
    else if (['ar-ae', 'ar-kw', 'ar-qa', 'ar-bh', 'ar-om'].includes(lang)) score += 20;
    else if (lang === 'ar') score += 10;
    else score += 5;

    return score;
  };

  return [...arabicVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

export function stopArabicSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore speech synthesis teardown errors
  }
}

export interface SpeakCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

export function speakArabicText(
  text: string,
  callbacks: SpeakCallbacks = {}
): () => void {
  if (!isSpeechSynthesisSupported()) {
    callbacks.onError?.();
    return () => {};
  }

  const cleaned = cleanSpeechText(text);
  if (!cleaned) {
    callbacks.onEnd?.();
    return () => {};
  }

  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore cancel errors
  }

  let cancelled = false;
  let started = false;

  const dispatchUtterance = () => {
    if (cancelled || started) return;
    started = true;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    const voices = window.speechSynthesis.getVoices?.() ?? [];
    const arabicVoice = pickArabicVoice(voices);

    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = arabicVoice.lang || 'ar-SA';
    } else {
      utterance.lang = 'ar-SA';
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.02;

    utterance.onstart = () => {
      if (!cancelled) callbacks.onStart?.();
    };
    utterance.onend = () => {
      if (!cancelled) callbacks.onEnd?.();
    };
    utterance.onerror = () => {
      if (!cancelled) callbacks.onError?.();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      if (!cancelled) callbacks.onError?.();
    }
  };

  const initialVoices = window.speechSynthesis.getVoices?.() ?? [];
  if (initialVoices.length > 0 || !window.speechSynthesis.addEventListener) {
    dispatchUtterance();
  } else {
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', onVoicesChanged);
      dispatchUtterance();
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    // Do not block if the browser never emits voiceschanged
    setTimeout(() => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', onVoicesChanged);
      dispatchUtterance();
    }, 120);
  }

  return () => {
    cancelled = true;
    stopArabicSpeech();
  };
}
