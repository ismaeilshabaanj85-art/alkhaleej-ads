import { useState } from 'react';
import { KeyRound, Lock, MessageCircle, X } from 'lucide-react';

const WHATSAPP_URL =
  'https://wa.me/963984618887?text=' +
  encodeURIComponent(
    'السلام عليكم أستاذ اسماعيل، أرغب بالاشتراك والحصول على كود تفعيل لموقع إعلان الخليج الذكي'
  );

interface LockPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateCode: (code: string) => { success: boolean; error?: string };
}

export function LockPaywallModal({
  isOpen,
  onClose,
  onActivateCode,
}: LockPaywallModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = onActivateCode(code);
    if (res.success) {
      setCode('');
      onClose();
    } else {
      setError(res.error || 'كود التفعيل غير صالح.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#D4AF37]/40 bg-[#0F1626] p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق نافذة الاشتراك"
          className="absolute top-4 left-4 cursor-pointer rounded-lg p-2 text-[#B8B4AA] transition-colors hover:bg-white/10 hover:text-[#F4F1EA]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10">
            <Lock className="h-6 w-6 text-[#D4AF37]" aria-hidden="true" />
          </div>
          <h2
            id="paywall-modal-title"
            className="text-xl font-extrabold text-[#F4F1EA] sm:text-2xl"
          >
            استهلكت المحاولات المجانية المتاحة (2 من 2)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#B8B4AA]">
            اشترك الآن بسعر رمزي مقارنة بعائد المبيعات الذي تحققه حملاتك في
            متجرك، واحصل على كود التفعيل فوراً.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/12 bg-[#0B0F19] p-4">
            <p className="text-xs font-semibold text-[#B8B4AA]">
              الباقة الشهرية
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#F4F1EA] tabular-nums-ar">
              25$ <span className="text-xs font-semibold text-[#D4AF37]">/ 95 ريال</span>
            </p>
            <p className="mt-1 text-xs text-[#9C978B]">
              توليد لا محدود لمدة 30 يوماً
            </p>
          </div>

          <div className="rounded-xl border border-[#D4AF37]/60 bg-[#152036] p-4">
            <p className="text-xs font-semibold text-[#D4AF37]">
              الباقة ربع السنوية · الأكثر توفيراً
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#F0D57A] tabular-nums-ar">
              60$ <span className="text-xs font-semibold text-[#F4F1EA]">/ 225 ريال</span>
            </p>
            <p className="mt-1 text-xs text-[#C8C3B8]">
              توليد لا محدود لمدة 3 أشهر
            </p>
          </div>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-emerald-500"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span>اطلب كود التفعيل الآن عبر واتساب</span>
        </a>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 border-t border-white/10 pt-5"
        >
          <label
            htmlFor="modal-activation-code"
            className="flex items-center gap-2 text-sm font-bold text-[#F4F1EA]"
          >
            <KeyRound className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            <span>أدخل كود التفعيل</span>
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              id="modal-activation-code"
              type="text"
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="KHALEEJ-XXXX-XXXX"
              className="font-mono-code flex-1 rounded-xl border border-white/15 bg-[#0B0F19] px-4 py-2.5 text-center text-sm uppercase text-[#F4F1EA] placeholder-[#726E65] focus:border-[#D4AF37] focus:outline-none"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-[#0B0F19] transition-colors hover:bg-[#E5C354] whitespace-nowrap"
            >
              تفعيل الاشتراك
            </button>
          </div>
          {error && (
            <p role="alert" className="text-xs font-medium text-red-400">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
