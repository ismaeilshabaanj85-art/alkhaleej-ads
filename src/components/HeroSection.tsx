import { useState } from 'react';
import { ArrowDownLeft, Sparkles } from 'lucide-react';
import heroStudioImg from '../assets/images/hero_gulf_studio_1795532159592.jpg';

interface HeroSectionProps {
  onStartStudio: () => void;
  remainingLabel: string;
}

export function HeroSection({
  onStartStudio,
  remainingLabel,
}: HeroSectionProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="relative overflow-hidden border-b border-white/8 bg-[#0B0F19]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-stretch gap-10 px-5 py-14 md:px-8 lg:grid-cols-12 lg:py-20">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="mb-4 text-xs font-semibold text-[#D4AF37]">
            السعودية · الإمارات · الكويت · قطر · متاجر سلة وزد
          </p>

          <h1 className="text-3xl font-extrabold leading-[1.28] text-[#F4F1EA] sm:text-4xl lg:text-[2.85rem]">
            ضاعف مبيعات متجرك الخليجي بضغطة زر مع الذكاء الاصطناعي
          </h1>

          <p className="mt-5 max-w-xl text-base leading-[1.75] text-[#C8C3B8] sm:text-lg">
            وفّر آلاف الريالات على وكالات التسويق والتصميم. أدخل تفاصيل منتجك
            فقط، وخلال ثوانٍ تجهز لك المنصة وصفاً متوافقاً مع محركات البحث،
            ونصوصاً بيعية بلهجة خليجية تقنع العميل، وبوستراً فاخراً، وفيديو
            إعلانياً متحركاً جاهزاً للنشر.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={onStartStudio}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl bg-[#D4AF37] px-7 py-3.5 text-base font-bold text-[#0B0F19] transition-colors hover:bg-[#E5C354] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] whitespace-nowrap"
            >
              <span>ابدأ صناعة حملتك الآن</span>
              <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <span className="text-sm font-medium text-[#B8B4AA] tabular-nums-ar">
              {remainingLabel}
            </span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#111829] lg:min-h-[420px]">
            {!imgError ? (
              <img
                src={heroStudioImg}
                alt="عرض فاخر لمنتج عطور خليجي بتصوير استوديو احترافي"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-gradient-to-br from-[#111829] via-[#0B0F19] to-[#1A243B] p-8 text-center">
                <Sparkles className="mb-3 h-10 w-10 text-[#D4AF37]" />
                <p className="text-lg font-bold text-[#F4F1EA]">
                  استوديو إعلان الخليج الذكي
                </p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19]/80 via-[#0B0F19]/15 to-transparent" />
            <div className="absolute right-6 bottom-5 left-6 border-t border-white/15 pt-3 text-xs text-[#F4F1EA]/90">
              <p className="truncate">
                نصوص بيعية خليجية · بوستر PNG فاخر · فيديو إعلاني متحرك
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
