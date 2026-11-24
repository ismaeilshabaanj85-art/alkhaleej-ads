import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Film,
  Key,
  KeyRound,
  Loader2,
  Megaphone,
  Plus,
  RotateCcw,
  Send,
  Settings,
  Trash2,
  Volume2,
  Wifi,
  X,
} from 'lucide-react';
import type {
  AdminEngineSettings,
  GeneratedMarketingCampaign,
  GulfDialect,
  VideoSlide,
} from '../types/ads';
import { generateActivationCode } from '../utils/activation';
import {
  generateMarketingClientSide,
  testGeminiConnection,
} from '../utils/geminiClient';
import { buildPromoVoiceoverScript } from '../utils/speech';
import {
  clearGeminiApiKey,
  loadGeminiApiKey,
  loadGeneratedCodes,
  saveGeminiApiKey,
  saveGeneratedCodes,
} from '../utils/storage';
import { AnimatedVideoPreview } from './AnimatedVideoPreview';

const DEFAULT_PROMO_SLIDES: VideoSlide[] = [
  {
    badge: 'إعلان الخليج الذكي',
    headline: 'وفّر +80% من تكاليف التسويق والتصميم',
    subline: 'منصة الذكاء الاصطناعي الأولى لأصحاب متاجر سلة وزد في الخليج',
    accentValue: 'جاهز في 10 ثوانٍ فقط',
  },
  {
    badge: 'نتائج ومبيعات',
    headline: 'حملة إعلانية كاملة بضغطة زر واحدة',
    subline: 'وصف SEO متصدر · نص بيعي خليجي · بوستر PNG فاخر · فيديو 9:16',
    accentValue: 'أكثر من 4 مخرجات فورية',
  },
  {
    badge: 'عرض التجار الحصري',
    headline: 'ابدأ مجاناً قبل الاشتراك الرمزي',
    subline: 'اشتراك يبدأ من 95 ريال سعودي مقارنة بآلاف الريالات للمصممين',
    accentValue: 'مناسب لسناب شات وتيك توك',
  },
  {
    badge: 'إعلان الخليج الذكي',
    headline: 'ضاعف مبيعات متجرك الخليجي الآن',
    subline: 'تطوير: اسماعيل زكريا شعبان · Smart Gulf Ads',
    accentValue: 'جرّب المنصة مجاناً الآن',
  },
];

const DIALECTS: GulfDialect[] = [
  'خليجية بيضاء',
  'سعودية',
  'إماراتية',
  'كويتية',
];

const TONES: AdminEngineSettings['creativeTone'][] = [
  'فاخر ومقنع',
  'سريع وحماسي',
  'رسمي وموثوق',
];

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineSettings: AdminEngineSettings;
  onUpdateSettings: (next: AdminEngineSettings) => void;
  remainingTrialsLabel: string;
  onResetTrials: () => void;
  onToast: (message: string) => void;
}

export function AdminDashboardModal({
  isOpen,
  onClose,
  engineSettings,
  onUpdateSettings,
  remainingTrialsLabel,
  onResetTrials,
  onToast,
}: AdminDashboardModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState(() => loadGeminiApiKey());
  const [hasSavedKey, setHasSavedKey] = useState(
    () => loadGeminiApiKey().length > 0
  );
  const [showKey, setShowKey] = useState(false);
  const [keyStatusMessage, setKeyStatusMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);

  const [codes, setCodes] = useState<string[]>(() => loadGeneratedCodes());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [focusAngle, setFocusAngle] = useState(
    'توفير آلاف الريالات وصناعة حملة كاملة في ثوانٍ'
  );
  const [promoVoiceoverEnabled, setPromoVoiceoverEnabled] = useState(false);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaign, setCampaign] =
    useState<GeneratedMarketingCampaign | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = loadGeminiApiKey();
      setApiKeyInput(stored);
      setHasSavedKey(stored.length > 0);
      setKeyStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setKeyStatusMessage({
        ok: false,
        text: 'يرجى لصق مفتاح Gemini API أولاً قبل الحفظ.',
      });
      return;
    }
    saveGeminiApiKey(trimmed);
    setHasSavedKey(true);
    const msg = 'تم حفظ المفتاح في المتصفح (LocalStorage) بنجاح.';
    setKeyStatusMessage({ ok: true, text: msg });
    onToast(msg);
  };

  const handleTestApiKey = async () => {
    const candidate = apiKeyInput.trim() || loadGeminiApiKey();
    if (!candidate) {
      setKeyStatusMessage({
        ok: false,
        text: 'يرجى إدخال المفتاح (صيغة AQ. أو AIzaSy) أولاً لاختبار الاتصال.',
      });
      return;
    }
    setIsTestingKey(true);
    setKeyStatusMessage(null);
    const res = await testGeminiConnection(candidate);
    setIsTestingKey(false);
    setKeyStatusMessage({ ok: res.ok, text: res.message });
    if (res.ok) {
      onToast('تم التحقق من المفتاح بنجاح!');
    }
  };

  const handleClearApiKey = () => {
    clearGeminiApiKey();
    setApiKeyInput('');
    setHasSavedKey(false);
    const msg = 'تم مسح المفتاح من المتصفح.';
    setKeyStatusMessage({ ok: false, text: msg });
    onToast(msg);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      onToast('تم النسخ إلى الحافظة بنجاح.');
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const handleGenerateCode = () => {
    const newCode = generateActivationCode();
    const next = [newCode, ...codes];
    setCodes(next);
    saveGeneratedCodes(next);
    onToast(`تم توليد كود جديد: ${newCode}`);
  };

  const handleGenerateCampaign = async () => {
    setCampaignError(null);
    setIsGeneratingCampaign(true);
    try {
      const currentKey = apiKeyInput.trim() || loadGeminiApiKey();
      const generated = await generateMarketingClientSide(
        currentKey,
        focusAngle
      );
      setCampaign(generated);
      onToast('تم توليد الحملة التسويقية للموقع بنجاح!');
    } catch (err) {
      setCampaignError(
        err instanceof Error ? err.message : 'حدث خطأ غير متوقع.'
      );
    } finally {
      setIsGeneratingCampaign(false);
    }
  };

    const promoSlides = campaign
    ? [
        {
          badge: 'إعلان الخليج الذكي ⚡',
          headline: promoAngle || 'توفير آلاف الريالات في ثوانٍ',
          subtext: campaign.videoScript?.split('\n')[0]?.replace(/[*#]/g, '').slice(0, 65) || 'اصنع إعلانك وبوسترك وفيديو متجرك بضغطة زر',
          priceTag: 'جرّب مجاناً الآن',
        },
        {
          badge: 'لأصحاب متاجر سلة وزد 🇸🇦🇦🇪',
          headline: campaign.tweets?.[0]?.slice(0, 55) || 'إعلانات خليجية مقنعة ترفع مبيعاتك',
          subtext: 'وصف SEO + نص خليجي + تصميم جاهز للنشر فوراً',
          priceTag: 'بدون خبرة تصميم',
        },
        {
          badge: 'ابدأ حملتك الآن 🚀',
          headline: 'صمّم إعلانك الأول مجاناً',
          subtext: 'أدخل اسم منتجك وسعره واستلم حملتك الكاملة في 10 ثوانٍ',
          priceTag: 'الرابط في البايو 👇',
        },
      ]
    : DEFAULT_PROMO_SLIDES;


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dashboard-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#070A12]/95 p-4 backdrop-blur-md md:p-8"
    >
      <div className="mx-auto max-w-[1200px] rounded-2xl border border-[#D4AF37]/30 bg-[#0E1422] p-6 shadow-2xl md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold text-[#D4AF37]">
              لوحة التحكم السرية للمؤسس
            </p>
            <h2
              id="admin-dashboard-title"
              className="mt-1 text-2xl font-extrabold text-[#F4F1EA]"
            >
              مرحباً أستاذ اسماعيل زكريا شعبان
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onResetTrials}
              data-testid="reset-founder-trials-btn"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-4 py-2 text-xs font-bold text-[#F0D57A] transition-colors hover:bg-[#D4AF37]/25"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>تفعيل التجربة المجانية لصاحب الموقع (Reset My Trials)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-[#F4F1EA] hover:bg-white/10"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span>إغلاق اللوحة</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#B8B4AA]">
          <span>حالة العداد في الصفحة الرئيسية: {remainingTrialsLabel}</span>
          <span>صيغة الأكواد النشطة: KHALEEJ-XXXX-XXXX (تشفير 12 خانة)</span>
        </div>

        {/* Prominent Top Section: Gemini API Key Settings */}
        <section className="mt-5 rounded-2xl border border-[#D4AF37]/45 bg-[#121B30] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <Key className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
              <h3 className="text-base font-extrabold text-[#F4F1EA]">
                إعدادات مفتاح الذكاء الاصطناعي (OpenRouter / Gemini / Groq)
              </h3>
            </div>
            <span
              data-testid="api-key-status"
              className={`text-xs font-bold ${
                hasSavedKey ? 'text-emerald-400' : 'text-[#E5C354]'
              }`}
            >
              {hasSavedKey
                ? 'مفتاح خارجي محفوظ وجاهز للعمل'
                : 'المحرك الاحتياطي المدمج نشط · يمكنك إضافة مفتاح خارجي'}
            </span>
          </div>

          <form onSubmit={handleSaveApiKey} className="space-y-3">
            <label
              htmlFor="admin-gemini-api-key"
              className="block text-xs font-semibold text-[#C8C3B8]"
            >
              أدخل مفتاح OpenRouter المجاني المتوافق مع المتصفح (sk-or-) أو مفتاح
              Google AI Studio / Gemini (AQ. أو AIzaSy) أو Groq (gsk_) ليتم حفظه
              في المتصفح (LocalStorage)
            </label>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <input
                  id="admin-gemini-api-key"
                  type={showKey ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="off"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-or-... أو AQ.... أو AIzaSy..."
                  className="font-mono-code w-full rounded-xl border border-white/15 bg-[#0B0F19] py-2.5 pr-4 pl-11 text-sm text-[#F4F1EA] placeholder-[#726E65] focus:border-[#D4AF37] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  aria-label={showKey ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                  className="absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer text-[#9C978B] hover:text-[#F4F1EA]"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-extrabold text-[#0B0F19] transition-colors hover:bg-[#E5C354] whitespace-nowrap"
                >
                  حفظ المفتاح
                </button>

                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={isTestingKey}
                  data-testid="test-api-key-btn"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-2.5 text-xs font-bold text-[#F0D57A] transition-colors hover:bg-[#D4AF37]/20 disabled:opacity-60 whitespace-nowrap"
                >
                  {isTestingKey ? (
                    <>
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                      <span>جاري الاختبار...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>اختبار الاتصال بالمفتاح</span>
                    </>
                  )}
                </button>

                {hasSavedKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    aria-label="مسح المفتاح المحفوظ"
                    className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 whitespace-nowrap"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>مسح</span>
                  </button>
                )}
              </div>
            </div>

            {keyStatusMessage && (
              <p
                role="status"
                data-testid="api-key-feedback"
                className={`text-xs font-semibold ${
                  keyStatusMessage.ok ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {keyStatusMessage.text}
              </p>
            )}
          </form>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Column 1: Dialect Settings & Activation Code Generator */}
          <div className="space-y-6 lg:col-span-5">
            <section className="rounded-2xl border border-white/12 bg-[#111829] p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <Settings
                  className="h-4 w-4 text-[#D4AF37]"
                  aria-hidden="true"
                />
                <h3 className="text-base font-bold text-[#F4F1EA]">
                  تفضيلات الصياغة واللهجة
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-dialect-select"
                    className="mb-1.5 block text-xs font-semibold text-[#C8C3B8]"
                  >
                    اللهجة الافتراضية للتوليد
                  </label>
                  <select
                    id="admin-dialect-select"
                    value={engineSettings.defaultDialect}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...engineSettings,
                        defaultDialect: e.target.value as GulfDialect,
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-3.5 py-2.5 text-sm text-[#F4F1EA] focus:border-[#D4AF37] focus:outline-none"
                  >
                    {DIALECTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-tone-select"
                    className="mb-1.5 block text-xs font-semibold text-[#C8C3B8]"
                  >
                    الأسلوب الإبداعي للإعلانات
                  </label>
                  <select
                    id="admin-tone-select"
                    value={engineSettings.creativeTone}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...engineSettings,
                        creativeTone: e.target
                          .value as AdminEngineSettings['creativeTone'],
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-3.5 py-2.5 text-sm text-[#F4F1EA] focus:border-[#D4AF37] focus:outline-none"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/12 bg-[#111829] p-5">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound
                    className="h-4 w-4 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <h3 className="text-base font-bold text-[#F4F1EA]">
                    مولّد أكواد التفعيل
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  data-testid="generate-code-btn"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3.5 py-2 text-xs font-bold text-[#0B0F19] hover:bg-[#E5C354]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>توليد كود جديد</span>
                </button>
              </div>

              {codes.length === 0 ? (
                <p className="py-4 text-center text-xs text-[#9C978B]">
                  اضغط &quot;توليد كود جديد&quot; لإصدار كود تفعيل مشفّر خوارزمياً
                  بصيغة KHALEEJ-XXXX-XXXX.
                </p>
              ) : (
                <ul
                  data-testid="generated-codes-list"
                  className="max-h-64 space-y-2 overflow-y-auto"
                >
                  {codes.map((code) => (
                    <li
                      key={code}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0B0F19] px-3.5 py-2.5"
                    >
                      <span className="font-mono-code text-sm font-semibold text-[#F0D57A]">
                        {code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`code-${code}`, code)}
                        aria-label={`نسخ الكود ${code}`}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#F4F1EA] hover:bg-white/10"
                      >
                        {copiedId === `code-${code}` ? (
                          <>
                            <Check
                              className="h-3.5 w-3.5 text-emerald-400"
                              aria-hidden="true"
                            />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Column 2: AI Marketing Factory & Promotional Video Exporter */}
          <div className="space-y-6 lg:col-span-7">
            <section className="rounded-2xl border border-white/12 bg-[#111829] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone
                    className="h-4 w-4 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <h3 className="text-base font-bold text-[#F4F1EA]">
                    مصنع المحتوى والتسويق الآلي للموقع
                  </h3>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="marketing-focus-angle"
                    className="mb-1.5 block text-xs font-semibold text-[#C8C3B8]"
                  >
                    زاوية الرسالة التسويقية لجلب التجار
                  </label>
                  <input
                    id="marketing-focus-angle"
                    type="text"
                    value={focusAngle}
                    onChange={(e) => setFocusAngle(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-3.5 py-2.5 text-sm text-[#F4F1EA] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateCampaign}
                  disabled={isGeneratingCampaign}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-extrabold text-[#0B0F19] hover:bg-[#E5C354] disabled:opacity-60 whitespace-nowrap"
                >
                  {isGeneratingCampaign ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>جاري التوليد...</span>
                    </>
                  ) : (
                    <span>توليد حملة تسويقية لجلب التجار</span>
                  )}
                </button>
              </div>

              <label
                htmlFor="admin-promo-voiceover-toggle"
                className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#0B0F19] px-4 py-2.5 text-xs font-semibold text-[#E8E4DA] transition-colors hover:border-[#D4AF37]/40"
              >
                <span className="flex items-center gap-2">
                  <Volume2
                    className="h-4 w-4 shrink-0 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <span>تفعيل التعليق الصوتي العربي مع الفيديو (اختياري)</span>
                </span>
                <input
                  id="admin-promo-voiceover-toggle"
                  type="checkbox"
                  checked={promoVoiceoverEnabled}
                  onChange={(e) => setPromoVoiceoverEnabled(e.target.checked)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-[#D4AF37]"
                />
              </label>

              {campaignError && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300"
                >
                  {campaignError}
                </p>
              )}

              {campaign && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-white/10 bg-[#0B0F19] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#D4AF37]">
                        1. فكرة ونص فيديو 15 ثانية (تيك توك / ريلز)
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'mkt-script',
                            `${campaign.videoHook}\n\n${campaign.tiktokReelsScript}`
                          )
                        }
                        className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#F4F1EA] hover:text-[#D4AF37]"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {copiedId === 'mkt-script' ? 'تم النسخ' : 'نسخ النص'}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs font-bold text-[#F0D57A]">
                      الخطاف: {campaign.videoHook}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[#E5E0D5]">
                      {campaign.tiktokReelsScript}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0B0F19] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#D4AF37]">
                        2. وصف الفيديو والهاشتاغات الخليجية
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'mkt-desc',
                            `${campaign.videoDescription}\n\n${campaign.hashtags.join(' ')}`
                          )
                        }
                        className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#F4F1EA] hover:text-[#D4AF37]"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {copiedId === 'mkt-desc' ? 'تم النسخ' : 'نسخ الكل'}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-[#E5E0D5]">
                      {campaign.videoDescription}
                    </p>
                    <p className="mt-2 text-xs text-[#D4AF37]">
                      {campaign.hashtags.join(' ')}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#D4AF37]">
                      3. تغريدات جاهزة لمنصة X (تويتر)
                    </h4>
                    {campaign.tweets.map((tweet, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/10 bg-[#0B0F19] p-4"
                      >
                        <p className="text-xs leading-relaxed text-[#F4F1EA]">
                          {tweet}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F1EA] px-3 py-1.5 text-xs font-bold text-[#0B0F19] hover:bg-white"
                          >
                            <Send className="h-3 w-3" aria-hidden="true" />
                            <span>مشاركة مباشرة على X</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(`tweet-${idx}`, tweet)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#F4F1EA] hover:bg-white/10"
                          >
                            <Copy className="h-3 w-3" aria-hidden="true" />
                            <span>
                              {copiedId === `tweet-${idx}` ? 'تم النسخ' : 'نسخ'}
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/12 bg-[#111829] p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <Film className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                <h3 className="text-base font-bold text-[#F4F1EA]">
                  صانع فيديو الترويج للموقع (Promotional Video Exporter)
                </h3>
              </div>
              <p className="mb-5 text-xs leading-relaxed text-[#B8B4AA]">
                {campaign
                  ? 'تم تحديث الشرائح آلياً من الحملة التسويقية المولّدة مع شعار إعلان الخليج الذكي وتوقيع المطور.'
                  : 'يعرض إحصائيات وعبارات تسويقية جاهزة للتجار الخليجيين مع شعار إعلان الخليج الذكي وتوقيع المطور، ويتحدث آلياً عند توليد حملة تسويقية.'}
              </p>

              <AnimatedVideoPreview
                slides={promoSlides}
                topBrandTitle="إعلان الخليج الذكي"
                brandFooter="تطوير: اسماعيل زكريا شعبان  ·  Smart Gulf Ads"
                downloadFilename="smart-gulf-ads-promo"
                downloadLabel="تحميل فيديو الترويج للموقع"
                testId="admin-promo-video-canvas"
                voiceoverEnabled={promoVoiceoverEnabled}
                voiceoverText={buildPromoVoiceoverScript(promoSlides, campaign)}
                onToast={onToast}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
