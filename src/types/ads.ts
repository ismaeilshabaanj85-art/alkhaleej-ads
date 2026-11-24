export type AdPlatform =
  | 'سناب شات'
  | 'تيك توك'
  | 'إنستغرام'
  | 'متجر سلة وزد';

export type GulfDialect =
  | 'خليجية بيضاء'
  | 'سعودية'
  | 'إماراتية'
  | 'كويتية';

export interface AdInput {
  productName: string;
  category: string;
  keyFeature: string;
  priceOffer: string;
  platform: AdPlatform;
  dialect: GulfDialect;
}

export interface VideoSlide {
  badge: string;
  headline: string;
  subline: string;
  accentValue?: string;
}

export interface GeneratedAdBundle {
  seoDescription: string;
  adCopy: string;
  marketingScript: string;
  posterTagline: string;
  videoSlides: VideoSlide[];
}

export interface GeneratedMarketingCampaign {
  videoHook: string;
  tiktokReelsScript: string;
  videoDescription: string;
  hashtags: string[];
  tweets: string[];
  promoSlides: VideoSlide[];
}

export interface TrialState {
  usedTrials: number;
  isActivated: boolean;
  activatedCode: string | null;
  activatedAt: number | null;
}

export interface AdminEngineSettings {
  defaultDialect: GulfDialect;
  creativeTone: 'فاخر ومقنع' | 'سريع وحماسي' | 'رسمي وموثوق';
  showBrandWatermark: boolean;
}

export interface AdminLockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
}
