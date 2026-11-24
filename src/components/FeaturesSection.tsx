import { useState } from 'react';
import { FileText, Image as ImageIcon, Film } from 'lucide-react';
import showcaseImg from '../assets/images/showcase_gulf_commerce_1795532160188.jpg';

const FEATURES = [
  {
    index: '01',
    title: 'كتابة وصف المنتجات المتوافق مع SEO لمتاجر سلة وزد',
    description:
      'صياغة أوصاف احترافية ترفع ظهور منتجاتك في نتائج البحث وتبرز نقاط القوة والضمان بأسلوب مقنع يحول الزائر إلى مشتري.',
    meta: 'وصف متجر · نص إعلاني · سيناريو تسويقي',
    icon: FileText,
  },
  {
    index: '02',
    title: 'تصميم بوسترات إعلانية جاهزة للتحميل فوراً',
    description:
      'توليد تلقائي لبوستر إعلاني فاخر بتصميم أسود ملكي وذهبي يعرض اسم المنتج وميزته وسعر العرض بدقة عالية جاهزة للنشر.',
    meta: 'تصدير فوري بصيغة PNG عالية الدقة',
    icon: ImageIcon,
  },
  {
    index: '03',
    title: 'إنتاج فيديوهات إعلانية قصيرة متحركة لسناب شات وتيك توك',
    description:
      'تحويل بيانات منتجك إلى فيديو شرائح ديناميكي متتابع يعرض الخطاف والميزة والعرض القوي ودعوة الشراء قابلاً للتحميل مباشرة.',
    meta: 'مقاس طولي 9:16 جاهز للريلز والسناب',
    icon: Film,
  },
];

export function FeaturesSection() {
  const [imgError, setImgError] = useState(false);

  return (
    <section
      id="features"
      className="border-b border-white/8 bg-[#0E1422] py-16 md:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold text-[#D4AF37]">
              ماذا يقدم لك الاستوديو؟
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#F4F1EA] sm:text-3xl">
              منظومة متكاملة تختصر عليك فريق تسويق وتصميم كامل
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm leading-relaxed text-[#B8B4AA]">
              بدلاً من الانتظار لأيام ودفع مبالغ طائلة على كل منتج جديد في متجرك،
              احصل على حملة إعلانية جاهزة للإطلاق خلال ثوانٍ.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:col-span-8">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.index}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#12192B]/80 p-6 transition-colors hover:border-[#D4AF37]/40"
                >
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <span className="font-mono-code text-sm font-semibold text-[#D4AF37]">
                        {item.index}.
                      </span>
                      <Icon
                        className="h-5 w-5 text-[#D4AF37]"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-lg font-bold leading-snug text-[#F4F1EA]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#B8B4AA]">
                      {item.description}
                    </p>
                  </div>
                  <p className="mt-6 border-t border-white/8 pt-3 text-xs text-[#9C978B]">
                    {item.meta}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="lg:col-span-4">
            <div className="relative h-full min-h-[260px] overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#12192B]">
              {!imgError ? (
                <img
                  src={showcaseImg}
                  alt="تغليف ومنتجات فاخرة لمتاجر التجارة الإلكترونية الخليجية"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-sm text-[#B8B4AA]">
                  تغليف فاخر للتجارة الإلكترونية الخليجية
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19]/85 via-[#0B0F19]/25 to-transparent" />
              <div className="absolute right-5 bottom-5 left-5">
                <p className="text-xs font-semibold text-[#D4AF37]">
                  نتائج قابلة للقياس
                </p>
                <p className="mt-1 text-base font-bold text-[#F4F1EA]">
                  جاهز لرفع معدل التحويل في متاجر سلة وزد وحملات سناب شات
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
