import type { AdInput, GeneratedAdBundle, VideoSlide } from '../types/ads';

const BG_OBSIDIAN = '#0B0F19';
const BG_NAVY = '#111A2E';
const GOLD_PRIMARY = '#D4AF37';
const GOLD_LIGHT = '#F0D57A';
const TEXT_CREAM = '#F4F1EA';
const TEXT_MUTED = '#C8C3B8';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

const wrapCache = new Map<string, string[]>();

function wrapRtlText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const clean = text.trim();
  if (!clean) return [];
  const cacheKey = `${ctx.font}|${maxWidth}|${clean}`;
  const cached = wrapCache.get(cacheKey);
  if (cached) return cached;

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  if (wrapCache.size > 250) {
    wrapCache.clear();
  }
  wrapCache.set(cacheKey, lines);
  return lines;
}

function drawLuxuryBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: number = 0
) {
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, BG_OBSIDIAN);
  bgGrad.addColorStop(0.52, BG_NAVY);
  bgGrad.addColorStop(1, '#070A12');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const glowX = width * (0.5 + 0.14 * Math.sin(phase * Math.PI * 2));
  const glowY = height * 0.28;
  const radGrad = ctx.createRadialGradient(
    glowX,
    glowY,
    20,
    glowX,
    glowY,
    width * 0.68
  );
  radGrad.addColorStop(0, 'rgba(212, 175, 55, 0.16)');
  radGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.04)');
  radGrad.addColorStop(1, 'rgba(11, 15, 25, 0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
  ctx.lineWidth = 1.5;
  const inset = Math.round(width * 0.045);
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  const cornerLen = Math.round(width * 0.045);
  ctx.strokeStyle = GOLD_PRIMARY;
  ctx.lineWidth = 3;
  const corners = [
    [inset, inset, 1, 1],
    [width - inset, inset, -1, 1],
    [inset, height - inset, 1, -1],
    [width - inset, height - inset, -1, -1],
  ] as const;

  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * cornerLen, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * cornerLen);
    ctx.stroke();
  }
}

export async function ensureArabicFontsLoaded(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
}

export function renderPosterCanvas(
  canvas: HTMLCanvasElement,
  input: AdInput,
  bundle: GeneratedAdBundle
): void {
  const width = 1080;
  const height = 1350;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  drawLuxuryBackdrop(ctx, width, height, 0.15);

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  ctx.font = '700 26px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = GOLD_LIGHT;
  ctx.fillText(`${input.category}  ·  ${input.platform}`, width / 2, 150);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.48)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 140, 185);
  ctx.lineTo(width / 2 + 140, 185);
  ctx.stroke();

  ctx.font = '800 68px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = TEXT_CREAM;
  const titleLines = wrapRtlText(ctx, input.productName, width - 180).slice(
    0,
    3
  );
  let cursorY = 300;
  for (const line of titleLines) {
    ctx.fillText(line, width / 2, cursorY);
    cursorY += 90;
  }

  ctx.font = '600 34px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = GOLD_LIGHT;
  const taglineLines = wrapRtlText(ctx, bundle.posterTagline, width - 210).slice(
    0,
    2
  );
  cursorY += 20;
  for (const line of taglineLines) {
    ctx.fillText(line, width / 2, cursorY);
    cursorY += 50;
  }

  const cardX = 110;
  const cardY = Math.max(cursorY + 35, 570);
  const cardW = width - 220;
  const cardH = 270;

  ctx.fillStyle = 'rgba(17, 26, 46, 0.85)';
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '700 24px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = GOLD_PRIMARY;
  ctx.fillText('الميزة التنافسية', width / 2, cardY + 56);

  ctx.font = '700 36px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = TEXT_CREAM;
  const featLines = wrapRtlText(ctx, input.keyFeature, cardW - 100).slice(
    0,
    3
  );
  let featY = cardY + 122;
  for (const line of featLines) {
    ctx.fillText(line, width / 2, featY);
    featY += 54;
  }

  const offerY = cardY + cardH + 65;
  const offerW = width - 260;
  const offerH = 148;
  const offerX = (width - offerW) / 2;

  const goldGrad = ctx.createLinearGradient(
    offerX,
    offerY,
    offerX + offerW,
    offerY + offerH
  );
  goldGrad.addColorStop(0, '#B99228');
  goldGrad.addColorStop(0.5, '#E7CA6A');
  goldGrad.addColorStop(1, '#C49B2D');
  ctx.fillStyle = goldGrad;
  drawRoundedRect(ctx, offerX, offerY, offerW, offerH, 18);
  ctx.fill();

  ctx.font = '700 22px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#0B0F19';
  ctx.fillText('العرض الحصري الآن', width / 2, offerY + 48);

  ctx.font = '800 42px "Cairo", "Tajawal", sans-serif';
  const offerText =
    wrapRtlText(ctx, input.priceOffer, offerW - 60)[0] ?? input.priceOffer;
  ctx.fillText(offerText, width / 2, offerY + 108);

  ctx.font = '700 30px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = TEXT_CREAM;
  ctx.fillText('اطلب الآن قبل نفاد الكمية', width / 2, height - 155);

  ctx.font = '600 21px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText('إعلان الخليج الذكي  ·  Smart Gulf Ads', width / 2, height - 96);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

export function renderVideoFrame(
  canvas: HTMLCanvasElement,
  slides: VideoSlide[],
  brandFooter: string,
  elapsedMs: number,
  totalDurationMs: number = 12000,
  topBrandTitle: string = 'إعلان الخليج الذكي'
): void {
  const width = 720;
  const height = 1280;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx || slides.length === 0) return;

  const safeElapsed =
    ((elapsedMs % totalDurationMs) + totalDurationMs) % totalDurationMs;
  const slideDuration = totalDurationMs / slides.length;
  const slideIndex = Math.min(
    slides.length - 1,
    Math.floor(safeElapsed / slideDuration)
  );
  const slideLocalT = (safeElapsed % slideDuration) / slideDuration;
  const slide = slides[slideIndex];

  const enterProgress = easeOutCubic(Math.min(1, slideLocalT / 0.22));
  const exitProgress = slideLocalT > 0.85 ? (slideLocalT - 0.85) / 0.15 : 0;
  const alpha = Math.max(0, Math.min(1, enterProgress * (1 - exitProgress)));
  const yOffset = (1 - enterProgress) * 32 - exitProgress * 20;

  drawLuxuryBackdrop(ctx, width, height, safeElapsed / totalDurationMs);

  const beamProgress = safeElapsed / totalDurationMs;
  const beamX = -width + beamProgress * width * 3;
  const beamGrad = ctx.createLinearGradient(beamX, 0, beamX + 240, height);
  beamGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
  beamGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.07)');
  beamGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  // Persistent royal brand crest at top
  ctx.font = '800 24px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = GOLD_PRIMARY;
  ctx.fillText(topBrandTitle, width / 2, 118);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, yOffset);
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  ctx.font = '700 23px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = GOLD_LIGHT;
  ctx.fillText(
    `${slide.badge}  ·  ${slideIndex + 1} / ${slides.length}`,
    width / 2,
    245
  );

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.52)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 100, 280);
  ctx.lineTo(width / 2 + 100, 280);
  ctx.stroke();

  ctx.font = '800 54px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = TEXT_CREAM;
  const headLines = wrapRtlText(ctx, slide.headline, width - 110).slice(0, 3);
  let y = 415;
  for (const line of headLines) {
    ctx.fillText(line, width / 2, y);
    y += 80;
  }

  ctx.font = '600 31px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = TEXT_MUTED;
  const subLines = wrapRtlText(ctx, slide.subline, width - 120).slice(0, 4);
  y += 26;
  for (const line of subLines) {
    ctx.fillText(line, width / 2, y);
    y += 50;
  }

  if (slide.accentValue) {
    const boxW = width - 150;
    const boxH = 110;
    const boxX = 75;
    const boxY = Math.max(y + 42, 785);

    const goldGrad = ctx.createLinearGradient(
      boxX,
      boxY,
      boxX + boxW,
      boxY + boxH
    );
    goldGrad.addColorStop(0, '#B99228');
    goldGrad.addColorStop(0.5, '#E7CA6A');
    goldGrad.addColorStop(1, '#C49B2D');
    ctx.fillStyle = goldGrad;
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.fill();

    ctx.font = '800 34px "Cairo", "Tajawal", sans-serif';
    ctx.fillStyle = '#0B0F19';
    const valLine =
      wrapRtlText(ctx, slide.accentValue, boxW - 44)[0] ?? slide.accentValue;
    ctx.fillText(valLine, width / 2, boxY + 67);
  }

  ctx.restore();

  const railX = 80;
  const railY = height - 135;
  const railW = width - 160;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  drawRoundedRect(ctx, railX, railY, railW, 6, 3);
  ctx.fill();

  ctx.fillStyle = GOLD_PRIMARY;
  drawRoundedRect(
    ctx,
    railX,
    railY,
    Math.max(10, railW * (safeElapsed / totalDurationMs)),
    6,
    3
  );
  ctx.fill();

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.font = '700 22px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = 'rgba(244, 241, 234, 0.85)';
  ctx.fillText(brandFooter, width / 2, height - 76);
}

export function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string
): void {
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportSlideshowVideoWebm(options: {
  slides: VideoSlide[];
  brandFooter: string;
  topBrandTitle?: string;
  filename: string;
  durationMs?: number;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  const {
    slides,
    brandFooter,
    topBrandTitle = 'إعلان الخليج الذكي',
    filename,
    durationMs = 12000,
    onProgress,
  } = options;

  await ensureArabicFontsLoaded();

  if (typeof MediaRecorder === 'undefined') {
    throw new Error('متصفحك الحالي لا يدعم تصدير الفيديو المباشر (MediaRecorder).');
  }

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1280;

  if (typeof canvas.captureStream !== 'function') {
    throw new Error('ميزة تسجيل البث من Canvas غير مدعومة في هذا المتصفح.');
  }

  const stream = canvas.captureStream(30);
  const candidateTypes = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  const mimeType = candidateTypes.find((type) =>
    MediaRecorder.isTypeSupported(type)
  );
  const isMp4 = mimeType ? mimeType.includes('mp4') : false;
  const ext = isMp4 ? '.mp4' : '.webm';

  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_500_000 })
    : new MediaRecorder(stream);

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return new Promise<void>((resolve, reject) => {
    let rafId = 0;
    let finished = false;

    const cleanup = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.onerror = () => {
      if (!finished) {
        finished = true;
        cleanup();
        reject(new Error('تعذر تسجيل ملف الفيديو. حاول مرة أخرى.'));
      }
    };

    recorder.onstop = () => {
      if (finished) return;
      finished = true;
      cleanup();
      onProgress?.(100);
      const blob = new Blob(chunks, {
        type: mimeType || (isMp4 ? 'video/mp4' : 'video/webm'),
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = filename.replace(/\.(webm|mp4)$/i, '');
      link.download = `${cleanName}${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve();
    };

    const startTime = performance.now();
    renderVideoFrame(
      canvas,
      slides,
      brandFooter,
      0,
      durationMs,
      topBrandTitle
    );
    recorder.start(250);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const clamped = Math.min(elapsed, durationMs);
      renderVideoFrame(
        canvas,
        slides,
        brandFooter,
        clamped,
        durationMs,
        topBrandTitle
      );
      onProgress?.(Math.min(99, Math.round((clamped / durationMs) * 100)));

      if (elapsed >= durationMs) {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  });
}
