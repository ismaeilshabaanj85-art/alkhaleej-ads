import { useState } from 'react';
import { Check, KeyRound, MessageCircle } from 'lucide-react';

const WHATSAPP_URL =
  'https://wa.me/963984618887?text=' +
  encodeURIComponent(
    'السلام عليكم أستاذ اسماعيل، أرغب بالاشتراك والحصول على كود تفعيل لموقع إعلان الخليج الذكي'
  );

interface PricingSectionProps {
  isActivated: boolean;
  activatedCode: string | null;
  onActivateCode: (code: string) => { success: boolean; error?: string };
}

export function PricingSection({
  isActivated,
  activatedCode,
  onActivateCode,
}: PricingSectionProps) {
  const [codeInput, setCodeInput] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onActivateCode(codeInput);
    if (res.success) {
      setFeedback({
        type: 'success',
        text: 'تم تفعيل اشتراكك بنجاح! يمكنك الآن التوليد بلا حدود.',
      });
      setCodeInput('');
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'كود التفعيل غير صحيح.',
      });
    }
  };

  return (
    <section
      id="pricing"
      className="border-b border-white/8 bg-[#0E1422] py-16 md:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold text-[#D4AF37]">
            باقات الاشتراك للتجار
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#F4F1EA] sm:text-3xl">
            استثمار رمزي مقابل مبيعات تتضاعف في متجرك
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#B8B4AA]">
            سعر الاشتراك أقل من تكلفة تصميم إعلان واحد لدى أي مصمم، ويمنحك
            وصولاً مفتوحاً لصناعة الحملات والبوسترات والفيديوهات لجميع منتجاتك.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-2xl border border-white/12 bg-[#111829] p-7">
            <div>
              <p className="text-xs font-semibold text-[#B8B4AA]">
                للمتاجر الناشئة والتجربة الشهرية
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#F4F1EA]">
                الباقة الشهرية
              </h3>
              <div className="mt-5 flex items-baseline gap-3 tabular-nums-ar">
                <span className="text-4xl font-extrabold text-[#F4F1EA]">
                  25$
                </span>
                <span className="text-sm font-semibold text-[#D4AF37]">
                  / 95 ريال سعودي شهرياً
                </span>
              </div>
              <ul className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-[#D6D1C7]">
                <li className="flex items-center gap-2.5">
                  <Check
                    className="h-4 w-4 shrink-0 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <span>توليد غير محدود للنصوص الإعلانية وأوصاف SEO</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check
                    className="h-4 w-4 shrink-0 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <span>تصميم وتحميل غير محدود للبوسترات الإعلانية PNG</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check
                    className="h-4 w-4 shrink-0 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <span>إنتاج وتصدير فيديوهات إعلانية قصيرة لسناب وتيك توك</span>
                </li>
              </ul>
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>اطلب كود التفعيل الآن عبر واتساب</span>
            </a>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#D4AF37]/60 bg-gradient-to-b from-[#172138] to-[#111829] p-7">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#D4AF37]">
                  الأكثر توفيراً لأصحاب المتاجر النشطة
                </p>
                <span className="text-xs font-bold text-[#F0D57A]">
                  وفر 15$ مقارنة بالشهري
                </span>
              </div>
              <h3 className="mt-1 text-xl font-bold text-[#F4F1EA]">
                الباقة ربع السنوية (3 أشهر)
              </h3>
              <div className="mt-5 flex items-baseline gap-3 tabular-nums-ar">
                <span className="text-4xl font-extrabold text-[#F0D57A]">
                  60$
                </span>
                <span className="text-sm font-semibold text-[#F4F1EA]">
                  / 225 ريال سعودي كل 3 أشهر
                </span>
              </div>
              <ul className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-[#E5E0D5]">
                <li className="flex items-center gap-2.5">
                  <Check
                    className="h-4 w-4 shrink-0 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <span>كامل مميزات الاستوديو بلا حدود لمدة 90 يوماً</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check
                    className="h-4 w-4 shrink-0 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <span>مثالية لحملات المواسم، رمضان، واليوم الوطني</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check
                    className="h-4 w-4 shrink-0 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <span>أولوية الدعم المباشر عبر واتساب</span>
                </li>
              </ul>
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>اطلب كود التفعيل الآن عبر واتساب</span>
            </a>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-white/12 bg-[#111829] p-6">
          {isActivated ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5 font-bold text-emerald-400">
                <Check className="h-5 w-5" aria-hidden="true" />
                <span>اشتراكك مفعّل بالكامل على هذا المتصفح</span>
              </div>
              {activatedCode && (
                <span className="font-mono-code text-xs text-[#D4AF37]">
                  {activatedCode}
                </span>
              )}
            </div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-3">
              <label
                htmlFor="pricing-activation-code"
                className="flex items-center gap-2 text-sm font-bold text-[#F4F1EA]"
              >
                <KeyRound
                  className="h-4 w-4 text-[#D4AF37]"
                  aria-hidden="true"
                />
                <span>هل لديك كود تفعيل؟ أدخله هنا لفتح الاستخدام غير المحدود</span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="pricing-activation-code"
                  type="text"
                  dir="ltr"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="KHALEEJ-XXXX-XXXX"
                  className="font-mono-code flex-1 rounded-xl border border-white/15 bg-[#0B0F19] px-4 py-2.5 text-center text-sm uppercase text-[#F4F1EA] placeholder-[#726E65] focus:border-[#D4AF37] focus:outline-none"
                />
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-[#0B0F19] transition-colors hover:bg-[#E5C354] whitespace-nowrap"
                >
                  تفعيل الكود
                </button>
              </div>
              {feedback && (
                <p
                  role="status"
                  className={`text-xs font-medium ${
                    feedback.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {feedback.text}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
