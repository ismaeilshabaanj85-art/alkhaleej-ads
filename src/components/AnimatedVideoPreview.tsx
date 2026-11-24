import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Loader2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { VideoSlide } from '../types/ads';
import {
  ensureArabicFontsLoaded,
  exportSlideshowVideoWebm,
  renderVideoFrame,
} from '../utils/canvasMedia';
import {
  isSpeechSynthesisSupported,
  speakArabicText,
  stopArabicSpeech,
} from '../utils/speech';

interface AnimatedVideoPreviewProps {
  slides: VideoSlide[];
  brandFooter: string;
  topBrandTitle?: string;
  downloadFilename: string;
  downloadLabel: string;
  testId?: string;
  voiceoverEnabled?: boolean;
  voiceoverText?: string;
  onToast?: (message: string) => void;
}

export function AnimatedVideoPreview({
  slides,
  brandFooter,
  topBrandTitle = 'إعلان الخليج الذكي',
  downloadFilename,
  downloadLabel,
  testId = 'video-preview-canvas',
  voiceoverEnabled = false,
  voiceoverText = '',
  onToast,
}: AnimatedVideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const elapsedRef = useRef(0);

  const totalDurationMs = 12000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || slides.length === 0) return;

    let rafId = 0;
    let cancelled = false;
    let lastTime = performance.now();
    let lastDraw = 0;

    const startLoop = async () => {
      await ensureArabicFontsLoaded();
      if (cancelled) return;

      renderVideoFrame(
        canvas,
        slides,
        brandFooter,
        elapsedRef.current,
        totalDurationMs,
        topBrandTitle
      );

      if (!isPlaying) return;

      const drawLoop = (now: number) => {
        if (cancelled) return;
        const dt = now - lastTime;
        lastTime = now;
        elapsedRef.current = (elapsedRef.current + dt) % totalDurationMs;

        if (now - lastDraw >= 65) {
          lastDraw = now;
          renderVideoFrame(
            canvas,
            slides,
            brandFooter,
            elapsedRef.current,
            totalDurationMs,
            topBrandTitle
          );
        }
        rafId = requestAnimationFrame(drawLoop);
      };

      rafId = requestAnimationFrame(drawLoop);
    };

    startLoop();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [slides, brandFooter, topBrandTitle, isPlaying]);

  useEffect(() => {
    if (!voiceoverEnabled || !isPlaying || !voiceoverText.trim()) {
      stopArabicSpeech();
      setIsVoiceSpeaking(false);
      return;
    }

    if (!isSpeechSynthesisSupported()) {
      setIsVoiceSpeaking(false);
      return;
    }

    elapsedRef.current = 0;
    setIsVoiceSpeaking(true);
    const cancel = speakArabicText(voiceoverText, {
      onStart: () => setIsVoiceSpeaking(true),
      onEnd: () => setIsVoiceSpeaking(false),
      onError: () => setIsVoiceSpeaking(false),
    });

    return () => {
      cancel();
      setIsVoiceSpeaking(false);
    };
  }, [voiceoverEnabled, voiceoverText, isPlaying]);

  const handleToggleVoicePlayback = () => {
    if (!voiceoverText.trim()) return;

    if (!isSpeechSynthesisSupported()) {
      onToast?.('متصفحك الحالي لا يدعم النطق الصوتي العربي التلقائي.');
      return;
    }

    if (isVoiceSpeaking) {
      stopArabicSpeech();
      setIsVoiceSpeaking(false);
      return;
    }

    elapsedRef.current = 0;
    if (!isPlaying) {
      setIsPlaying(true);
    }
    setIsVoiceSpeaking(true);
    speakArabicText(voiceoverText, {
      onStart: () => setIsVoiceSpeaking(true),
      onEnd: () => setIsVoiceSpeaking(false),
      onError: () => setIsVoiceSpeaking(false),
    });
  };

  const handleDownloadVideo = async () => {
    setExportError(null);
    setIsExporting(true);
    setExportProgress(0);
    try {
      await exportSlideshowVideoWebm({
        slides,
        brandFooter,
        topBrandTitle,
        filename: downloadFilename,
        durationMs: totalDurationMs,
        onProgress: (p) => setExportProgress(p),
      });
      onToast?.('تم تجهيز وتحميل الفيديو الإعلاني بنجاح.');
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'تعذر تصدير الفيديو حالياً.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto w-full max-w-[290px] overflow-hidden rounded-xl border border-[#D4AF37]/25 bg-[#070A12]">
        <canvas
          ref={canvasRef}
          data-testid={testId}
          className="block aspect-[9/16] w-full"
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => setIsPlaying((prev) => !prev)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-[#F4F1EA] transition-colors hover:bg-white/10"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              <span>إيقاف مؤقت</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>تشغيل المعاينة</span>
            </>
          )}
        </button>

        {voiceoverEnabled && voiceoverText.trim().length > 0 && (
          <button
            type="button"
            onClick={handleToggleVoicePlayback}
            data-testid={`${testId}-voice-btn`}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
              isVoiceSpeaking
                ? 'border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#F0D57A] hover:bg-[#D4AF37]/25'
                : 'border-white/15 bg-white/5 text-[#F4F1EA] hover:bg-white/10'
            }`}
          >
            {isVoiceSpeaking ? (
              <>
                <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                <span>إيقاف الصوت</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تشغيل الصوت</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleDownloadVideo}
          disabled={isExporting}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#0B0F19] transition-colors hover:bg-[#E5C354] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span className="tabular-nums-ar">
                جاري التصدير ({exportProgress}%)
              </span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{downloadLabel}</span>
            </>
          )}
        </button>
      </div>

      {exportError && (
        <p role="alert" className="text-center text-xs text-red-400">
          {exportError}
        </p>
      )}
    </div>
  );
}
