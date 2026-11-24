import { GoogleGenAI, Type } from '@google/genai';
import type {
  AdInput,
  AdminEngineSettings,
  GeneratedAdBundle,
  GeneratedMarketingCampaign,
} from '../types/ads';
import {
  generateFallbackAdBundle,
  generateFallbackMarketingCampaign,
} from './fallbackEngine';

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const VERTEX_EXPRESS_BASE_ENDPOINT =
  'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent';

export const GROQ_ENDPOINT =
  'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export const OPENROUTER_ENDPOINT =
  'https://openrouter.ai/api/v1/chat/completions';

export const OPENROUTER_FREE_MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
] as const;

export function isOpenRouterApiKey(apiKey: string): boolean {
  return apiKey.trim().startsWith('sk-or-');
}

export function isGroqApiKey(apiKey: string): boolean {
  return apiKey.trim().startsWith('gsk_');
}

export function isVertexExpressKey(apiKey: string): boolean {
  return apiKey.trim().startsWith('AQ.');
}

export function buildVertexExpressUrl(apiKey: string): string {
  return `${VERTEX_EXPRESS_BASE_ENDPOINT}?key=${encodeURIComponent(apiKey.trim())}`;
}

export function buildGeminiHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey.trim(),
  };
}

export function buildGroqHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: 'Bearer ' + apiKey.trim(),
    'Content-Type': 'application/json',
  };
}

export function buildOpenRouterHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: 'Bearer ' + apiKey.trim(),
    'Content-Type': 'application/json',
  };
}

export function parseGeminiJsonText<T>(rawText: string): T {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error('تعذر قراءة استجابة الذكاء الاصطناعي بصيغة JSON صالحة.');
  }
}

function mapClientGeminiError(status: number | undefined, rawBody: string): string {
  const lower = rawBody.toLowerCase();
  if (lower.includes('proxy_generation_disabled')) {
    return 'هذا المفتاح يتطلب نقطة نهاية Vertex AI Express (aiplatform.googleapis.com). تأكد من صلاحية المفتاح وصيغته.';
  }
  if (
    status === 401 ||
    status === 403 ||
    lower.includes('api_key_invalid') ||
    lower.includes('invalid_api_key') ||
    lower.includes('permission_denied') ||
    lower.includes('unauthenticated') ||
    (status === 400 && lower.includes('key'))
  ) {
    return 'مفتاح الذكاء الاصطناعي غير صالح أو مرفوض. تأكد من إدخال مفتاح صحيح (sk-or- أو AQ. أو AIzaSy أو gsk_) في لوحة التحكم السرية.';
  }
  if (
    status === 429 ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate_limit')
  ) {
    return 'تم تجاوز حد الاستخدام المؤقت لمفتاح الذكاء الاصطناعي. يرجى المحاولة بعد دقيقة.';
  }
  if (status === 503 || lower.includes('unavailable')) {
    return 'خادم الذكاء الاصطناعي يشهد ضغطاً مؤقتاً حالياً. يرجى المحاولة بعد ثوانٍ.';
  }
  return 'تعذر الاتصال بمحرك الذكاء الاصطناعي حالياً. يرجى التأكد من المفتاح واتصال الإنترنت.';
}

function extractErrorDetails(err: unknown): { status?: number; message: string; isTransient: boolean } {
  const obj = (typeof err === 'object' && err !== null ? err : {}) as {
    status?: number;
    code?: number;
    message?: string;
  };
  const status =
    typeof obj.status === 'number'
      ? obj.status
      : typeof obj.code === 'number'
        ? obj.code
        : undefined;
  const message =
    err instanceof Error ? err.message : typeof obj.message === 'string' ? obj.message : String(err ?? '');
  const lower = message.toLowerCase();
  const isTransient =
    status === 503 ||
    status === 429 ||
    lower.includes('unavailable') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate_limit');
  return { status, message, isTransient };
}

interface StructuredPromptPayload {
  systemInstruction: string;
  userPrompt: string;
  responseSchema?: Record<string, unknown>;
  jsonOutput: boolean;
}

async function callVertexExpressSdk(
  apiKey: string,
  payload: StructuredPromptPayload
): Promise<string> {
  const ai = new GoogleGenAI({
    apiKey: apiKey.trim(),
    vertexai: true,
  });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: payload.userPrompt,
    config: {
      ...(payload.systemInstruction
        ? { systemInstruction: payload.systemInstruction }
        : {}),
      ...(payload.jsonOutput
        ? {
            responseMimeType: 'application/json',
            ...(payload.responseSchema
              ? { responseSchema: payload.responseSchema }
              : {}),
          }
        : {}),
    },
  });

  const rawText = response.text ?? '';
  if (!rawText.trim()) {
    throw new Error('لم يُرجع محرك الذكاء الاصطناعي نصاً صالحاً. حاول مرة أخرى.');
  }
  return rawText;
}

async function callVertexExpressRest(
  apiKey: string,
  payload: StructuredPromptPayload
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: payload.userPrompt }],
      },
    ],
  };

  if (payload.systemInstruction) {
    body.systemInstruction = {
      role: 'system',
      parts: [{ text: payload.systemInstruction }],
    };
  }

  if (payload.jsonOutput) {
    body.generationConfig = {
      responseMimeType: 'application/json',
      ...(payload.responseSchema
        ? { responseSchema: payload.responseSchema }
        : {}),
    };
  }

  const response = await fetch(buildVertexExpressUrl(apiKey), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(mapClientGeminiError(response.status, errText)) as Error & {
      status?: number;
      raw?: string;
    };
    err.status = response.status;
    err.raw = errText;
    throw err;
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!rawText.trim()) {
    throw new Error('لم يُرجع محرك الذكاء الاصطناعي نصاً صالحاً. حاول مرة أخرى.');
  }
  return rawText;
}

async function callStandardGeminiRest(
  apiKey: string,
  payload: StructuredPromptPayload
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: payload.userPrompt }],
      },
    ],
  };

  if (payload.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: payload.systemInstruction }],
    };
  }

  if (payload.jsonOutput) {
    body.generationConfig = {
      responseMimeType: 'application/json',
      ...(payload.responseSchema
        ? { responseSchema: payload.responseSchema }
        : {}),
    };
  }

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: buildGeminiHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(mapClientGeminiError(response.status, errText)) as Error & {
      status?: number;
      raw?: string;
    };
    err.status = response.status;
    err.raw = errText;
    throw err;
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!rawText.trim()) {
    throw new Error('لم يُرجع محرك الذكاء الاصطناعي نصاً صالحاً. حاول مرة أخرى.');
  }
  return rawText;
}

async function callGroqRest(
  apiKey: string,
  payload: StructuredPromptPayload
): Promise<string> {
  const combinedPrompt = payload.systemInstruction
    ? `${payload.systemInstruction}\n\n${payload.userPrompt}`
    : payload.userPrompt;

  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: combinedPrompt }],
  };

  if (payload.jsonOutput) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: buildGroqHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(mapClientGeminiError(response.status, errText)) as Error & {
      status?: number;
      raw?: string;
    };
    err.status = response.status;
    err.raw = errText;
    throw err;
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const rawText = data.choices?.[0]?.message?.content ?? '';
  if (!rawText.trim()) {
    throw new Error('لم يُرجع محرك Groq نصاً صالحاً. حاول مرة أخرى.');
  }
  return rawText;
}

async function callOpenRouterWithModel(
  apiKey: string,
  model: string,
  combinedPrompt: string,
  useJsonFormat: boolean
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content: combinedPrompt }],
  };

  if (useJsonFormat) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: buildOpenRouterHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(mapClientGeminiError(response.status, errText)) as Error & {
      status?: number;
      raw?: string;
    };
    err.status = response.status;
    err.raw = errText;
    throw err;
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const rawText = data.choices?.[0]?.message?.content ?? '';
  if (!rawText.trim()) {
    throw new Error('لم يُرجع محرك OpenRouter نصاً صالحاً. حاول مرة أخرى.');
  }
  return rawText;
}

async function callOpenRouterRest(
  apiKey: string,
  payload: StructuredPromptPayload
): Promise<string> {
  const combinedPrompt = payload.systemInstruction
    ? `${payload.systemInstruction}\n\n${payload.userPrompt}`
    : payload.userPrompt;

  let lastError: unknown = null;

  for (const model of OPENROUTER_FREE_MODELS) {
    try {
      return await callOpenRouterWithModel(
        apiKey,
        model,
        combinedPrompt,
        payload.jsonOutput
      );
    } catch (err) {
      const details = extractErrorDetails(err);
      if (details.status === 401 || details.status === 403) {
        throw err;
      }
      if (payload.jsonOutput && details.status === 400) {
        try {
          return await callOpenRouterWithModel(
            apiKey,
            model,
            combinedPrompt,
            false
          );
        } catch (plainErr) {
          lastError = plainErr;
          continue;
        }
      }
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('تعذر الاتصال بمحرك OpenRouter حالياً.');
}

async function executeGeminiTextCall(
  apiKey: string,
  payload: StructuredPromptPayload
): Promise<string> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error(
      'لم يتم إدخال مفتاح الذكاء الاصطناعي بعد. يرجى الدخول إلى لوحة التحكم السرية (النقر 5 مرات على الشعار) وإدخال مفتاح OpenRouter (sk-or-) أو Gemini (AQ. أو AIzaSy) أو Groq (gsk_) وحفظه.'
    );
  }

  const delays = [0, 900];
  let lastError: Error | null = null;

  for (const delay of delays) {
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      if (isOpenRouterApiKey(trimmedKey)) {
        return await callOpenRouterRest(trimmedKey, payload);
      }

      if (isGroqApiKey(trimmedKey)) {
        return await callGroqRest(trimmedKey, payload);
      }

      if (isVertexExpressKey(trimmedKey)) {
        try {
          return await callVertexExpressSdk(trimmedKey, payload);
        } catch (sdkErr) {
          const details = extractErrorDetails(sdkErr);
          const isAuthError =
            details.status === 400 ||
            details.status === 401 ||
            details.status === 403;
          if (isAuthError) {
            throw new Error(mapClientGeminiError(details.status, details.message));
          }
          return await callVertexExpressRest(trimmedKey, payload);
        }
      }

      return await callStandardGeminiRest(trimmedKey, payload);
    } catch (err) {
      const details = extractErrorDetails(err);
      const mapped =
        err instanceof Error && err.message.startsWith('مفتاح الذكاء الاصطناعي')
          ? err
          : new Error(mapClientGeminiError(details.status, details.message));
      lastError = mapped;
      if (details.isTransient) {
        continue;
      }
      throw mapped;
    }
  }

  throw lastError ?? new Error('تعذر إتمام الطلب عبر محرك الذكاء الاصطناعي.');
}

async function callGeminiDirect<T>(
  apiKey: string,
  payload: StructuredPromptPayload
): Promise<T> {
  const rawText = await executeGeminiTextCall(apiKey, payload);
  return parseGeminiJsonText<T>(rawText);
}

export async function testGeminiConnection(
  apiKey: string
): Promise<{ ok: boolean; message: string }> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return {
      ok: false,
      message:
        'لا يوجد مفتاح خارجي محفوظ حالياً. يمكنك إدخال مفتاح OpenRouter أو Gemini لاختبار الاتصال الخارجي، مع استمرار عمل المحرك الاحتياطي الذكي المدمج تلقائياً.',
    };
  }

  try {
    const reply = await executeGeminiTextCall(trimmed, {
      systemInstruction: '',
      userPrompt: 'أجب بكلمة واحدة فقط: متصل',
      jsonOutput: false,
    });
    if (!reply.trim()) {
      return {
        ok: false,
        message:
          'تم الوصول للخادم ولكن لم يُرجع رداً نصياً صالحاً — المحرك الاحتياطي المدمج جاهز للعمل تلقائياً.',
      };
    }

    if (isOpenRouterApiKey(trimmed)) {
      return {
        ok: true,
        message:
          'تم الاتصال بنجاح! مفتاح OpenRouter (sk-or-) يعمل بكفاءة عبر المتصفح، والمحرك جاهز للعمل.',
      };
    }

    if (isGroqApiKey(trimmed)) {
      return {
        ok: true,
        message:
          'تم الاتصال بنجاح! مفتاح Groq (gsk_) يعمل بكفاءة مع نموذج Llama 3.3 70B، والمحرك جاهز.',
      };
    }

    return {
      ok: true,
      message: isVertexExpressKey(trimmed)
        ? 'تم الاتصال بنجاح! مفتاح AQ. يعمل بكفاءة عبر Vertex Express (Gemini 2.5 Flash).'
        : 'تم الاتصال بنجاح! المفتاح يعمل بكفاءة مع Gemini 2.5 Flash.',
    };
  } catch (err) {
    const reason =
      err instanceof Error
        ? err.message
        : 'تعذر الوصول إلى الخادم الخارجي.';
    return {
      ok: false,
      message: `${reason} (المحرك الاحتياطي الذكي المدمج يعمل تلقائياً لضمان عدم توقف الموقع للزوار).`,
    };
  }
}

export async function generateAdClientSide(
  apiKey: string,
  input: AdInput,
  tone: AdminEngineSettings['creativeTone']
): Promise<GeneratedAdBundle> {
  if (!apiKey.trim()) {
    return generateFallbackAdBundle(input, tone);
  }

  const prompt = `أنت خبير تسويق إلكتروني واستراتيجي إعلانات رقمية متخصص في السوق الخليجي (السعودية، الإمارات، الكويت، قطر) ومتاجر سلة وزد.
بيانات المنتج المطلوب الترويج له:
- اسم المنتج: ${input.productName}
- نوع المتجر / الفئة: ${input.category}
- الميزة الأهم للمنتج: ${input.keyFeature}
- السعر أو العرض: ${input.priceOffer}
- المنصة المستهدفة: ${input.platform}
- اللهجة المطلوبة: ${input.dialect}
- الأسلوب الإبداعي: ${tone}

المطلوب إنتاج حزمة إعلانية متكاملة وعالية التحويل باللغة العربية المناسبة لتجار ومتسوقي الخليج، بحيث تكون النصوص جاهزة للنشر الفوري بدون علامات تنسيق ماركداون مثل النجوم المزدوجة.
أعد كائن JSON صالحاً فقط بهذه الحقول النصية:
{
  "seoDescription": "وصف منتج احترافي متوافق مع SEO لمتاجر سلة وزد",
  "adCopy": "نص إعلاني تسويقي مقنع باللهجة الخليجية",
  "marketingScript": "سيناريو إعلان فيديو قصير (10 إلى 15 ثانية)",
  "posterTagline": "جملة تسويقية فخمة ومختصرة جداً من 4 إلى 7 كلمات",
  "videoSlides": [
    { "badge": "عنوان صغير", "headline": "عنوان رئيسي", "subline": "تفاصيل مختصرة", "accentValue": "قيمة بارزة" }
  ]
}`;

  try {
    const bundle = await callGeminiDirect<GeneratedAdBundle>(apiKey, {
      systemInstruction:
        'تحدث بلهجة خليجية بيضاء راقية وجذابة ومقنعة، مع التزام الدقة التجارية وتجنب المبالغة المصطنعة. أعد JSON مطابقاً للمخطط بدقة.',
      userPrompt: prompt,
      jsonOutput: true,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          seoDescription: {
            type: Type.STRING,
            description:
              'وصف منتج احترافي متوافق مع محركات البحث SEO لمتاجر سلة وزد يتضمن المزايا ونقاط البيع والضمان.',
          },
          adCopy: {
            type: Type.STRING,
            description:
              'نص إعلاني تسويقي مقنع باللهجة الخليجية مخصص للمنصة المختارة مع دعوة واضحة للشراء.',
          },
          marketingScript: {
            type: Type.STRING,
            description:
              'سيناريو إعلان فيديو قصير (10 إلى 15 ثانية) مقسم إلى خطاف بصري، المشكلة والحل، العرض، والدعوة للشراء.',
          },
          posterTagline: {
            type: Type.STRING,
            description:
              'جملة تسويقية فخمة ومختصرة جداً (من 4 إلى 7 كلمات) لتوضع على البوستر الإعلاني.',
          },
          videoSlides: {
            type: Type.ARRAY,
            description:
              '4 شرائح متتالية لفيديو الإعلان المتحرك: (1) اسم المنتج، (2) المشكلة والحل، (3) العرض القوي، (4) اطلب الآن.',
            items: {
              type: Type.OBJECT,
              properties: {
                badge: { type: Type.STRING },
                headline: { type: Type.STRING },
                subline: { type: Type.STRING },
                accentValue: { type: Type.STRING },
              },
              required: ['badge', 'headline', 'subline'],
            },
          },
        },
        required: [
          'seoDescription',
          'adCopy',
          'marketingScript',
          'posterTagline',
          'videoSlides',
        ],
      },
    });

    const fallback = generateFallbackAdBundle(input, tone);
    const guaranteedSlides = [
      {
        badge: bundle.videoSlides?.[0]?.badge || input.category,
        headline: input.productName,
        subline:
          bundle.videoSlides?.[0]?.subline ||
          bundle.posterTagline ||
          fallback.posterTagline,
        accentValue: input.platform,
      },
      {
        badge: bundle.videoSlides?.[1]?.badge || 'الميزة الأهم',
        headline: bundle.videoSlides?.[1]?.headline || 'جودة خليجية استثنائية',
        subline: input.keyFeature,
      },
      {
        badge: bundle.videoSlides?.[2]?.badge || 'عرض حصري',
        headline: bundle.videoSlides?.[2]?.headline || 'سعر استثنائي لفترة محدودة',
        subline: bundle.videoSlides?.[2]?.subline || input.productName,
        accentValue: input.priceOffer,
      },
      {
        badge: bundle.videoSlides?.[3]?.badge || 'اطلب الآن',
        headline: bundle.videoSlides?.[3]?.headline || 'الكمية محدودة · اطلب الآن',
        subline:
          bundle.videoSlides?.[3]?.subline ||
          `متوفر عبر ${input.platform} · ${input.priceOffer}`,
        accentValue: 'اطلب الآن',
      },
    ];

    return {
      seoDescription: bundle.seoDescription || fallback.seoDescription,
      adCopy: bundle.adCopy || fallback.adCopy,
      marketingScript: bundle.marketingScript || fallback.marketingScript,
      posterTagline: bundle.posterTagline || fallback.posterTagline,
      videoSlides: guaranteedSlides,
    };
  } catch {
    return generateFallbackAdBundle(input, tone);
  }
}

export async function generateMarketingClientSide(
  apiKey: string,
  focusAngle: string
): Promise<GeneratedMarketingCampaign> {
  if (!apiKey.trim()) {
    return generateFallbackMarketingCampaign(focusAngle);
  }

  const prompt = `أنشئ حملة تسويقية متكاملة باللهجة الخليجية البيضاء للترويج لمنصة "إعلان الخليج الذكي" (Smart Gulf Ads) التي أسسها اسماعيل زكريا شعبان، والموجهة لأصحاب المتاجر الإلكترونية في الخليج (سلة، زد، شوبيفاي، وتجار سناب وتيك توك).
زاوية التركيز الحالية: ${focusAngle}

المميزات التي تبرزها الحملة:
- توفر على التاجر آلاف الريالات التي يدفعها للمصممين وكتّاب المحتوى.
- تصنع وصف SEO لمتاجر سلة وزد + نص إعلان خليجي + بوستر فخم PNG + فيديو إعلاني جاهز للنشر خلال ثوانٍ.
- يوجد محاولتان مجانيتان للتجربة الآن قبل الاشتراك الرمزي.

أنتج محتوى واقعياً، جذاباً، بدون مبالغات فارغة وبدون علامات نجوم تنسيقية.
أعد كائن JSON صالحاً فقط بهذه الحقول:
{
  "videoHook": "خطاف الفيديو",
  "tiktokReelsScript": "نص فيديو 15 ثانية",
  "videoDescription": "وصف الفيديو",
  "hashtags": ["#السعودية", "#تجارة_الكترونية"],
  "tweets": ["تغريدة 1", "تغريدة 2"],
  "promoSlides": [
    { "badge": "عنوان صغير", "headline": "عنوان رئيسي", "subline": "تفاصيل", "accentValue": "قيمة" }
  ]
}`;

  try {
    const raw = await callGeminiDirect<Partial<GeneratedMarketingCampaign>>(apiKey, {
      systemInstruction:
        'أنت مدير نمو وتسويق لمنصات SaaS في الخليج العربي. أنتج محتوى تسويقياً دقيقاً وجاهزاً للنشر المباشر بصيغة JSON.',
      userPrompt: prompt,
      jsonOutput: true,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          videoHook: { type: Type.STRING },
          tiktokReelsScript: { type: Type.STRING },
          videoDescription: { type: Type.STRING },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          tweets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          promoSlides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                badge: { type: Type.STRING },
                headline: { type: Type.STRING },
                subline: { type: Type.STRING },
                accentValue: { type: Type.STRING },
              },
              required: ['badge', 'headline', 'subline'],
            },
          },
        },
        required: [
          'videoHook',
          'tiktokReelsScript',
          'videoDescription',
          'hashtags',
          'tweets',
          'promoSlides',
        ],
      },
    });

    const fallback = generateFallbackMarketingCampaign(focusAngle);
    return {
      videoHook: raw.videoHook || fallback.videoHook,
      tiktokReelsScript: raw.tiktokReelsScript || fallback.tiktokReelsScript,
      videoDescription: raw.videoDescription || fallback.videoDescription,
      hashtags:
        Array.isArray(raw.hashtags) && raw.hashtags.length > 0
          ? raw.hashtags
          : fallback.hashtags,
      tweets:
        Array.isArray(raw.tweets) && raw.tweets.length > 0
          ? raw.tweets
          : fallback.tweets,
      promoSlides:
        Array.isArray(raw.promoSlides) && raw.promoSlides.length > 0
          ? raw.promoSlides
          : fallback.promoSlides,
    };
  } catch {
    return generateFallbackMarketingCampaign(focusAngle);
  }
}
