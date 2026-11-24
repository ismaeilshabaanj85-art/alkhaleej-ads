import type {
  AdInput,
  AdminEngineSettings,
  GeneratedAdBundle,
  GeneratedMarketingCampaign,
} from '../types/ads';

function getDialectGreeting(dialect: AdInput['dialect']): string {
  switch (dialect) {
    case 'سعودية':
      return 'يا هلا بأهل الذوق الرفيع في المملكة';
    case 'إماراتية':
      return 'حياكم الله أهل الفخامة والتميز';
    case 'كويتية':
      return 'يا هلا بالذوق الكويتي الأصيل';
    default:
      return 'يا هلا بأصحاب الذوق الرفيع في الخليج';
  }
}

function getToneHeadline(tone: AdminEngineSettings['creativeTone']): string {
  switch (tone) {
    case 'سريع وحماسي':
      return 'لا تفوّت الفرصة الآن';
    case 'رسمي وموثوق':
      return 'جودة مضمونة واختيار موثوق';
    default:
      return 'فخامة تليق بذوقك الرفيع';
  }
}

export function generateFallbackAdBundle(
  input: AdInput,
  tone: AdminEngineSettings['creativeTone']
): GeneratedAdBundle {
  const greeting = getDialectGreeting(input.dialect);
  const toneLine = getToneHeadline(tone);
  const cleanName = input.productName.trim();
  const cleanCategory = input.category.trim();
  const cleanFeature = input.keyFeature.trim();
  const cleanOffer = input.priceOffer.trim();

  const seoDescription = [
    `${cleanName} هو خيارك الأمثل ضمن فئة ${cleanCategory} لمن يبحث عن الجودة العالية والأداء الاستثنائي في السوق الخليجي.`,
    `يتميز هذا المنتج بـ ${cleanFeature}، مما يمنحك قيمة حقيقية وتجربة استخدام متفوقة تدوم طويلاً.`,
    `متوفر الآن بعرض خاص (${cleanOffer}) مع شحن سريع لجميع مناطق الخليج وضمان جودة كامل لمتاجر سلة وزد.`,
  ].join(' ');

  const adCopy = [
    `${greeting}!`,
    `تبحث عن التميز في ${cleanCategory}؟ نقدم لك ${cleanName} بتصميم وجودة تجمع بين الأصالة والاحترافية.`,
    `أهم ما يميزه: ${cleanFeature}.`,
    `العرض الحصري عبر ${input.platform}: ${cleanOffer}.`,
    `الكمية محدودة والطلب متزايد — اطلب الآن قبل نفاد العرض!`,
  ].join('\n');

  const marketingScript = [
    `الخطاف البصري: لقطة قريبة فاخرة لمنتج ${cleanName} مع عبارة "${toneLine}".`,
    `المشكلة والحل: تعبت من المنتجات التقليدية في ${cleanCategory}؟ ${cleanName} يمنحك ${cleanFeature}.`,
    `العرض القوي: اطلبه اليوم واستفد من العرض الحصري ${cleanOffer}.`,
    `الدعوة للشراء: ارفع الشاشة الآن أو اضغط على رابط المتجر عبر ${input.platform} قبل انتهاء الكمية.`,
  ].join('\n');

  const posterTagline = `${toneLine} مع ${cleanName}`.slice(0, 46);

  return {
    seoDescription,
    adCopy,
    marketingScript,
    posterTagline,
    videoSlides: [
      {
        badge: cleanCategory,
        headline: cleanName,
        subline: posterTagline,
        accentValue: input.platform,
      },
      {
        badge: 'الميزة الأهم',
        headline: toneLine,
        subline: cleanFeature,
      },
      {
        badge: 'عرض حصري',
        headline: 'اغتنم الفرصة الآن',
        subline: cleanName,
        accentValue: cleanOffer,
      },
      {
        badge: 'اطلب الآن',
        headline: 'الكمية محدودة · اطلب الآن',
        subline: `متوفر عبر ${input.platform} · ${cleanOffer}`,
        accentValue: 'اطلب الآن',
      },
    ],
  };
}

export function generateFallbackMarketingCampaign(
  focusAngle: string
): GeneratedMarketingCampaign {
  const angle =
    focusAngle.trim() || 'توفير آلاف الريالات وصناعة حملة كاملة في ثوانٍ';

  return {
    videoHook: `تاجر خليجي وتبي تضاعف مبيعاتك؟ ركّز على ${angle}!`,
    tiktokReelsScript: [
      `المشهد 1: هل ما زلت تدفع آلاف الريالات شهرياً للمصممين وكتّاب الإعلانات؟`,
      `المشهد 2: مع منصة إعلان الخليج الذكي، أدخل اسم منتجك وسعرك فقط خلال ثوانٍ.`,
      `المشهد 3: تحصل فوراً على وصف SEO لمتاجر سلة وزد، ونص خليجي مقنع، وبوستر فاخر، وفيديو 9:16 جاهز لسناب وتيك توك.`,
      `المشهد 4: جرّب الأداة مجاناً الآن وابدأ حملتك الأولى بضغطة زر!`,
    ].join('\n'),
    videoDescription: `منصة إعلان الخليج الذكي تساعد تجار سلة وزد في السعودية والإمارات والكويت وقطر على صناعة حملات إعلانية كاملة وبوسترات وفيديوهات احترافية في ثوانٍ (${angle}).`,
    hashtags: [
      '#إعلان_الخليج_الذكي',
      '#سلة',
      '#زد',
      '#تجارة_الكترونية',
      '#تسويق_رقمي',
      '#السعودية',
    ],
    tweets: [
      `ليش تدفع آلاف الريالات على كل حملة لمنتج جديد؟ منصة إعلان الخليج الذكي تكتب لك وصف SEO لمتاجر سلة وزد وتصمم البوستر والفيديو في ثوانٍ. جرّبها مجاناً الآن!`,
      `أصحاب المتاجر في الخليج: اختصر وقت فريق التسويق بالكامل مع تركيز على ${angle}، واصنع إعلانات سناب شات وتيك توك بضغطة زر واحدة.`,
    ],
    promoSlides: [
      {
        badge: 'إعلان الخليج الذكي',
        headline: 'وفّر +80% من تكاليف التسويق والتصميم',
        subline: angle,
        accentValue: 'جاهز في 10 ثوانٍ فقط',
      },
      {
        badge: 'نتائج ومبيعات',
        headline: 'حملة إعلانية كاملة بضغطة زر واحدة',
        subline: 'وصف SEO لمتاجر سلة وزد · نص خليجي · بوستر PNG · فيديو 9:16',
        accentValue: '4 مخرجات فورية',
      },
      {
        badge: 'عرض التجار الحصري',
        headline: 'ابدأ مجاناً قبل الاشتراك الرمزي',
        subline: 'باقة شهرية رمزية تبدأ من 95 ريال سعودي مقارنة بآلاف الريالات',
        accentValue: 'مناسب لسناب شات وتيك توك',
      },
      {
        badge: 'إعلان الخليج الذكي',
        headline: 'ضاعف مبيعات متجرك الخليجي الآن',
        subline: 'تطوير: اسماعيل زكريا شعبان · Smart Gulf Ads',
        accentValue: 'جرّب المنصة مجاناً',
      },
    ],
  };
}
