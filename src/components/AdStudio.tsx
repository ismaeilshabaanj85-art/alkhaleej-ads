import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Loader2,
  Lock,
  Sparkles,
  Volume2,
} from 'lucide-react';
import type {
  AdInput,
  AdPlatform,
  AdminEngineSettings,
  GeneratedAdBundle,
  TrialState,
} from '../types/ads';
import { canGenerateAd, getRemainingTrials } from '../utils/trials';
import {
  downloadCanvasAsPng,
  ensureArabicFontsLoaded,
  renderPosterCanvas,
} from '../utils/canvasMedia';
import { generateAdClientSide } from '../utils/geminiClient';
import { buildAdVoiceoverScript } from '../utils/speech';
import { loadGeminiApiKey } from '../utils/storage';
import { AnimatedVideoPreview } from './AnimatedVideoPreview';

const PLATFORMS: AdPlatform[] = [
  'سناب شات',
  'تيك توك',
  'إنستغرام',
  'متجر سلة وزد',
];

const SAMPLE_AD_INPUT: Omit<AdInput, 'dialect'> = {
  productName: 'دهن عود كمبودي معتق ملكي',
  category: 'عطور وبخور',
  keyFeature: 'ثبات يدوم أكثر من 48 ساعة برائحة خشبية دافئة وفاخرة',
  priceOffer: '199 ريال بدلاً من 340 ريال + شحن مجاني',
  platform: 'سناب شات',
};

interface AdStudioProps {
  trialState: TrialState;
  engineSettings: AdminEngineSettings;
  onTrialConsumed: () => void;
  onOpenPaywall: () => void;
  onToast: (message: string) => void;
}

export function AdStudio({
  trialState,
  engineSettings,
  onTrialConsumed,
  onOpenPaywall,
  onToast,
}: AdStudioProps) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [keyFeature, setKeyFeature] = useState('');
  const [priceOffer, setPriceOffer] = useState('');
  const [platform, setPlatform] = useState<AdPlatform>('سناب شات');
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    input: AdInput;
    bundle: GeneratedAdBundle;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const posterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const remaining = getRemainingTrials(trialState);
  const isAllowed = canGenerateAd(trialState);

  useEffect(() => {
    if (!result || !posterCanvasRef.current) return;
    let cancelled = false;
    ensureArabicFontsLoaded().then(() => {
      if (!cancelled && posterCanvasRef.current) {
        renderPosterCanvas(posterCanvasRef.current, result.input, result.bundle);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [result]);

  const handleCopy = async (fieldId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      onToast('تم نسخ النص إلى الحافظة بنجاح.');
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldId ? null : prev));
      }, 2000);
    } catch {
      setErrorMessage('تعذر النسخ التلقائي. يمكنك تحديد النص ونسخه يدوياً.');
    }
  };

  const handleFillSample = () => {
    setProductName(SAMPLE_AD_INPUT.productName);
    setCategory(SAMPLE_AD_INPUT.category);
    setKeyFeature(SAMPLE_AD_INPUT.keyFeature);
    setPriceOffer(SAMPLE_AD_INPUT.priceOffer);
    setPlatform(SAMPLE_AD_INPUT.platform);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAllowed) {
      onOpenPaywall();
      return;
    }

    if (
      !productName.trim() ||
      !category.trim() ||
      !keyFeature.trim() ||
      !priceOffer.trim()
    ) {
      setErrorMessage(
        'يرجى تعبئة اسم المنتج، الفئة، الميزة الأهم، والسعر أو العرض قبل البدء.'
      );
      return;
    }

    const payload: AdInput = {
      productName: productName.trim(),
      category: category.trim(),
      keyFeature: keyFeature.trim(),
      priceOffer: priceOffer.trim(),
      platform,
      dialect: engineSettings.defaultDialect,
    };

    const apiKey = loadGeminiApiKey();

    setIsLoading(true);
    try {
      const bundle = await generateAdClientSide(
        apiKey,
        payload,
        engineSettings.creativeTone
      );
      setResult({ input: payload, bundle });
      onTrialConsumed();
      onToast('تمت صناعة حملتك الإعلانية الكاملة بنجاح!');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء توليد الحملة الإعلانية.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPoster = () => {
    if (!posterCanvasRef.current || !result) return;
    downloadCanvasAsPng(
      posterCanvasRef.current,
      `poster-${result.input.productName.slice(0, 24)}`
    );
    onToast('تم تحميل البوستر الإعلاني (PNG) بنجاح.');
  };

  return (
    <section
      id="studio"
      className="border-b border-white/8 bg-[#0B0F19] py-16 md:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#D4AF37]">
              استوديو الصناعة الفورية
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#F4F1EA] sm:text-3xl">
              أداة التوليد الذكية المتكاملة للتاجر
            </h2>
          </div>

          <div
            data-testid="trial-counter"
            className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-[#12192B] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] tabular-nums-ar"
          >
            {trialState.isActivated ? (
              <span className="text-[#E5C354]">
                عضوية مفعّلة · استخدام غير محدود
              </span>
            ) : (
              <span>متبقي لديك {remaining} من 2 محاولات مجانية</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/12 bg-[#111829]/90 p-6 backdrop-blur-md"
            >
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-[#F4F1EA]">
                  بيانات المنتج والحملة
                </h3>
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="cursor-pointer text-xs font-semibold text-[#D4AF37] underline-offset-4 hover:underline whitespace-nowrap"
                >
                  تعبئة مثال جاهز
                </button>
              </div>

              {!isAllowed && (
                <div className="mb-5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-4">
                  <div className="flex items-start gap-3">
                    <Lock
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#F4F1EA]">
                        انتهت المحاولات المجانية
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#C8C3B8]">
                        يمكنك تفعيل الاشتراك بكود التفعيل للاستمتاع بتوليد
                        غير محدود لجميع منتجات متجرك.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenPaywall}
                        className="mt-3 cursor-pointer rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#0B0F19] hover:bg-[#E5C354]"
                      >
                        تفعيل الاشتراك الآن
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="ad-product-name"
                    className="mb-1.5 block text-sm font-semibold text-[#E8E4DA]"
                  >
                    اسم المنتج
                  </label>
                  <input
                    id="ad-product-name"
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    disabled={!isAllowed || isLoading}
                    placeholder="مثال: عود مروكي فاخر"
                    className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-4 py-3 text-sm text-[#F4F1EA] placeholder-[#726E65] focus:border-[#D4AF37] focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ad-category"
                    className="mb-1.5 block text-sm font-semibold text-[#E8E4DA]"
                  >
                    نوع المتجر / الفئة
                  </label>
                  <input
                    id="ad-category"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={!isAllowed || isLoading}
                    placeholder="مثال: عطور وبخور / أزياء / إلكترونيات"
                    className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-4 py-3 text-sm text-[#F4F1EA] placeholder-[#726E65] focus:border-[#D4AF37] focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ad-feature"
                    className="mb-1.5 block text-sm font-semibold text-[#E8E4DA]"
                  >
                    الميزة الأهم للمنتج
                  </label>
                  <textarea
                    id="ad-feature"
                    rows={2}
                    value={keyFeature}
                    onChange={(e) => setKeyFeature(e.target.value)}
                    disabled={!isAllowed || isLoading}
                    placeholder="مثال: ثبات 48 ساعة وضمان ذهبي للاسترجاع"
                    className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-4 py-3 text-sm text-[#F4F1EA] placeholder-[#726E65] focus:border-[#D4AF37] focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ad-price-offer"
                    className="mb-1.5 block text-sm font-semibold text-[#E8E4DA]"
                  >
                    السعر أو العرض
                  </label>
                  <input
                    id="ad-price-offer"
                    type="text"
                    value={priceOffer}
                    onChange={(e) => setPriceOffer(e.target.value)}
                    disabled={!isAllowed || isLoading}
                    placeholder="مثال: 199 ريال بدلاً من 320 + توصيل مجاني"
                    className="w-full rounded-xl border border-white/15 bg-[#0B0F19] px-4 py-3 text-sm text-[#F4F1EA] placeholder-[#726E65] focus:border-[#D4AF37] focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-[#E8E4DA]">
                    المنصة المستهدفة
                  </span>
                  <div
                    role="group"
                    aria-label="المنصة المستهدفة"
                    className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-[#0B0F19] p-1.5"
                  >
                    {PLATFORMS.map((p) => {
                      const active = platform === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={!isAllowed || isLoading}
                          onClick={() => setPlatform(p)}
                          className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-[#D4AF37] text-[#0B0F19]'
                              : 'text-[#B8B4AA] hover:text-[#F4F1EA]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label
                  htmlFor="ad-voiceover-toggle"
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#0B0F19] px-4 py-3 text-xs font-semibold text-[#E8E4DA] transition-colors hover:border-[#D4AF37]/40"
                >
                  <span className="flex items-center gap-2">
                    <Volume2
                      className="h-4 w-4 shrink-0 text-[#D4AF37]"
                      aria-hidden="true"
                    />
                    <span>تفعيل التعليق الصوتي العربي مع الفيديو (اختياري)</span>
                  </span>
                  <input
                    id="ad-voiceover-toggle"
                    type="checkbox"
                    checked={voiceoverEnabled}
                    onChange={(e) => setVoiceoverEnabled(e.target.checked)}
                    disabled={!isAllowed || isLoading}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-[#D4AF37]"
                  />
                </label>

                {errorMessage && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-300"
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3.5 text-sm font-extrabold text-[#0B0F19] transition-colors hover:bg-[#E5C354] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>جاري صناعة حملتك الإعلانية...</span>
                    </>
                  ) : !isAllowed ? (
                    <>
                      <Lock className="h-4 w-4" aria-hidden="true" />
                      <span>افتح الاستخدام غير المحدود الآن</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      <span>اصنع حملتي الإعلانية الكاملة الآن</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-7">
            {!result && !isLoading && (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#111829]/45 p-8 text-center">
                <Sparkles
                  className="mb-4 h-10 w-10 text-[#D4AF37]/80"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-bold text-[#F4F1EA]">
                  مخرجات حملتك الإعلانية ستظهر هنا فوراً
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#9C978B]">
                  أدخل بيانات منتجك في النموذج أو اضغط &quot;تعبئة مثال
                  جاهز&quot; لتشاهد النصوص الخليجية، البوستر الفاخر، والفيديو
                  الإعلاني المتحرك.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#111829]/70 p-8 text-center">
                <Loader2
                  className="mb-4 h-10 w-10 animate-spin text-[#D4AF37]"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-bold text-[#F4F1EA]">
                  يتم الآن صياغة الإعلان وتصميم البوستر والفيديو
                </h3>
                <p className="mt-2 text-sm text-[#B8B4AA]">
                  ثوانٍ معدودة وتكون حملتك جاهزة للتحميل والنشر.
                </p>
              </div>
            )}

            {result && !isLoading && (
              <div className="space-y-6" data-testid="generated-ad-results">
                <div className="space-y-4">
                  {[
                    {
                      id: 'seo',
                      title: '1. وصف المنتج المتوافق مع SEO (سلة / زد)',
                      content: result.bundle.seoDescription,
                    },
                    {
                      id: 'adCopy',
                      title: `2. النص الإعلاني باللهجة الخليجية (${result.input.platform})`,
                      content: result.bundle.adCopy,
                    },
                    {
                      id: 'script',
                      title: '3. سيناريو التسويق والفيديو الترويجي',
                      content: result.bundle.marketingScript,
                    },
                  ].map((block) => (
                    <article
                      key={block.id}
                      className="rounded-2xl border border-white/12 bg-[#111829]/90 p-5"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-[#D4AF37]">
                          {block.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleCopy(block.id, block.content)}
                          aria-label={`نسخ نص ${block.title}`}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#F4F1EA] transition-colors hover:bg-white/10 whitespace-nowrap"
                        >
                          {copiedField === block.id ? (
                            <>
                              <Check
                                className="h-3.5 w-3.5 text-emerald-400"
                                aria-hidden="true"
                              />
                              <span>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              <span>نسخ النص</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-[#E5E0D5]">
                        {block.content}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col justify-between rounded-2xl border border-white/12 bg-[#111829]/90 p-5">
                    <div>
                      <h3 className="mb-4 text-sm font-bold text-[#D4AF37]">
                        4. تصميم البوستر الإعلاني الفاخر
                      </h3>
                      <div className="mx-auto max-w-[300px] overflow-hidden rounded-xl border border-[#D4AF37]/25 bg-[#070A12]">
                        <canvas
                          ref={posterCanvasRef}
                          data-testid="poster-preview-canvas"
                          className="block aspect-[4/5] w-full"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadPoster}
                      className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#0B0F19] transition-colors hover:bg-[#E5C354]"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span>تحميل الصورة (PNG)</span>
                    </button>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl border border-white/12 bg-[#111829]/90 p-5">
                    <div>
                      <h3 className="mb-4 text-sm font-bold text-[#D4AF37]">
                        5. الفيديو الإعلاني القصير المتحرك
                      </h3>
                      <AnimatedVideoPreview
                        slides={result.bundle.videoSlides}
                        brandFooter="إعلان الخليج الذكي  ·  Smart Gulf Ads"
                        topBrandTitle={result.input.productName}
                        downloadFilename={`ad-video-${result.input.productName.slice(0, 20)}`}
                        downloadLabel="تحميل الفيديو الإعلاني"
                        voiceoverEnabled={voiceoverEnabled}
                        voiceoverText={buildAdVoiceoverScript(
                          result.bundle.videoSlides,
                          result.bundle.adCopy
                        )}
                        onToast={onToast}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
