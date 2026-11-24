import { useRef } from 'react';

interface HeaderProps {
  onSecretTrigger: () => void;
  onStartClick: () => void;
}

export function Header({ onSecretTrigger, onStartClick }: HeaderProps) {
  const clickTimestampsRef = useRef<number[]>([]);

  const handleLogoClick = () => {
    const now = Date.now();
    const recent = clickTimestampsRef.current.filter((t) => now - t < 2500);
    recent.push(now);
    clickTimestampsRef.current = recent;

    if (recent.length >= 5) {
      clickTimestampsRef.current = [];
      onSecretTrigger();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#D4AF37]/15 bg-[#0B0F19]/88 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-5 py-3.5 md:px-8">
        <button
          type="button"
          onClick={handleLogoClick}
          data-testid="brand-logo-trigger"
          className="cursor-pointer text-right text-lg font-extrabold tracking-tight text-[#F4F1EA] transition-colors hover:text-[#D4AF37] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4AF37] whitespace-nowrap shrink-0"
        >
          إعلان الخليج الذكي
        </button>

        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#B8B4AA]"
        >
          <a
            href="#features"
            className="transition-colors hover:text-[#F4F1EA] whitespace-nowrap shrink-0"
          >
            المميزات
          </a>
          <a
            href="#studio"
            className="transition-colors hover:text-[#F4F1EA] whitespace-nowrap shrink-0"
          >
            استوديو الإعلانات
          </a>
          <a
            href="#pricing"
            className="transition-colors hover:text-[#F4F1EA] whitespace-nowrap shrink-0"
          >
            الباقات
          </a>
          <a
            href="#contact"
            className="transition-colors hover:text-[#F4F1EA] whitespace-nowrap shrink-0"
          >
            تواصل معنا
          </a>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onStartClick}
            className="cursor-pointer rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-[#0B0F19] transition-colors hover:bg-[#E5C354] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] whitespace-nowrap shrink-0"
          >
            اصنع إعلانك
          </button>
        </div>
      </div>
    </header>
  );
}
