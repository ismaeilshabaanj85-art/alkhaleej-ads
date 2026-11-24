import { MessageCircle } from 'lucide-react';

const WHATSAPP_URL =
  'https://wa.me/963984618887?text=' +
  encodeURIComponent(
    'السلام عليكم أستاذ اسماعيل، أرغب بالاشتراك والحصول على كود تفعيل لموقع إعلان الخليج الذكي'
  );

export function Footer() {
  return (
    <footer id="contact" className="bg-[#080B13] py-12">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-extrabold text-[#F4F1EA]">
              إعلان الخليج الذكي
            </p>
            <p className="mt-1 text-sm text-[#9C978B]">
              منصة تسويقية متكاملة لرفع مبيعات التجار في الخليج العربي
            </p>
          </div>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-600/15 px-5 py-2.5 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-600/25"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>تواصل مباشر عبر واتساب</span>
          </a>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-center text-xs text-[#9C978B] sm:flex-row sm:text-right">
          <p className="font-medium text-[#D6D1C7]">
            تم التطوير والتأسيس بواسطة: اسماعيل زكريا شعبان - جميع الحقوق
            محفوظة 2026
          </p>
          <p>السعودية · الإمارات · الكويت · قطر</p>
        </div>
      </div>
    </footer>
  );
}
