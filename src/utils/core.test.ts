import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  generateActivationCode,
  normalizeActivationCode,
  verifyActivationCode,
} from './activation';
import {
  LOCKOUT_DURATION_MS,
  MAX_ADMIN_ATTEMPTS,
  getRemainingLockSeconds,
  isLockedOut,
  recordFailedAttempt,
  resetLockout,
  sha256Hex,
  verifyAdminCredentials,
} from './auth';
import {
  MAX_FREE_TRIALS,
  applyActivationCode,
  canGenerateAd,
  consumeFreeTrial,
  createInitialTrialState,
  getRemainingTrials,
  resetFounderTrials,
} from './trials';
import {
  GEMINI_ENDPOINT,
  GROQ_ENDPOINT,
  GROQ_MODEL,
  OPENROUTER_ENDPOINT,
  OPENROUTER_FREE_MODELS,
  buildGeminiHeaders,
  buildGroqHeaders,
  buildOpenRouterHeaders,
  buildVertexExpressUrl,
  generateAdClientSide,
  generateMarketingClientSide,
  isGroqApiKey,
  isOpenRouterApiKey,
  isVertexExpressKey,
  parseGeminiJsonText,
  testGeminiConnection,
} from './geminiClient';
import {
  generateFallbackAdBundle,
  generateFallbackMarketingCampaign,
} from './fallbackEngine';
import {
  buildAdVoiceoverScript,
  buildPromoVoiceoverScript,
  cleanSpeechText,
  pickArabicVoice,
} from './speech';

test('sha256Hex matches Node crypto SHA-256 across inputs', () => {
  for (const sample of ['', 'ismaeil', 'ismiso885122025', 'إعلان الخليج الذكي']) {
    const expected = createHash('sha256').update(sample, 'utf8').digest('hex');
    assert.equal(sha256Hex(sample), expected);
  }
});

test('verifyAdminCredentials accepts exact founder credentials and rejects others', () => {
  assert.equal(verifyAdminCredentials('ismaeil', 'ismiso885122025'), true);
  assert.equal(verifyAdminCredentials(' ismaeil ', 'ismiso885122025'), true);
  assert.equal(verifyAdminCredentials('ismaeil', 'wrongpass'), false);
  assert.equal(verifyAdminCredentials('admin', 'ismiso885122025'), false);
});

test('admin and activation lockout enforces 30-minute ban after 3 failed attempts', () => {
  const t0 = 1_700_000_000_000;
  let state = resetLockout();

  state = recordFailedAttempt(state, t0);
  assert.equal(state.failedAttempts, 1);
  assert.equal(isLockedOut(state, t0), false);

  state = recordFailedAttempt(state, t0 + 1000);
  assert.equal(state.failedAttempts, 2);
  assert.equal(isLockedOut(state, t0 + 1000), false);

  state = recordFailedAttempt(state, t0 + 2000);
  assert.equal(state.failedAttempts, MAX_ADMIN_ATTEMPTS);
  assert.equal(isLockedOut(state, t0 + 2000), true);
  assert.equal(getRemainingLockSeconds(state, t0 + 2000), 1800);

  assert.equal(isLockedOut(state, t0 + 2000 + LOCKOUT_DURATION_MS - 1), true);
  assert.equal(isLockedOut(state, t0 + 2000 + LOCKOUT_DURATION_MS), false);
});

test('activation codes follow KHALEEJ-XXXX-XXXX format and resist guessing', () => {
  for (let i = 0; i < 20; i++) {
    const code = generateActivationCode();
    assert.match(code, /^KHALEEJ-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    assert.equal(verifyActivationCode(code), true);
    assert.equal(verifyActivationCode(`  ${code.toLowerCase()}  `), true);
  }

  assert.equal(
    normalizeActivationCode(' khaleej-abcd-efgh '),
    'KHALEEJ-ABCD-EFGH'
  );
  assert.equal(verifyActivationCode('KHALEEJ-0000-0000'), false);
  assert.equal(verifyActivationCode('KHALEEJ-1234-5678'), false);
  assert.equal(verifyActivationCode('KHALEEJ-ABCD-EFGH'), false);
  assert.equal(verifyActivationCode('KHALEEJ-ABCD'), false);
  assert.equal(verifyActivationCode(''), false);
});

test('trial counter allows 2 trials, enforces 30-min lockout on 3 bad codes, and resets for founder', () => {
  const t0 = 1_700_000_000_000;
  let state = createInitialTrialState();
  assert.equal(getRemainingTrials(state), MAX_FREE_TRIALS);
  assert.equal(canGenerateAd(state), true);

  state = consumeFreeTrial(state);
  state = consumeFreeTrial(state);
  assert.equal(getRemainingTrials(state), 0);
  assert.equal(canGenerateAd(state), false);

  let lock = resetLockout();
  for (let i = 0; i < 3; i++) {
    const bad = applyActivationCode(state, 'KHALEEJ-ABCD-EFGH', lock, t0 + i * 1000);
    assert.equal(bad.success, false);
    lock = bad.nextLockout;
  }
  assert.equal(isLockedOut(lock, t0 + 3000), true);

  // Even a valid code is blocked while 30-min lockout is active
  const validCode = generateActivationCode();
  const blocked = applyActivationCode(state, validCode, lock, t0 + 4000);
  assert.equal(blocked.success, false);

  // After lockout expiry, valid code unlocks
  const unlocked = applyActivationCode(
    state,
    validCode,
    lock,
    t0 + 4000 + LOCKOUT_DURATION_MS
  );
  assert.equal(unlocked.success, true);
  assert.equal(canGenerateAd(unlocked.nextState), true);
  assert.equal(getRemainingTrials(unlocked.nextState), Infinity);

  // Founder reset restores 2 trials
  const reset = resetFounderTrials();
  assert.equal(getRemainingTrials(reset), 2);
  assert.equal(reset.isActivated, false);
});

test('routes AQ. keys through Vertex AI Express and AIzaSy keys through generativelanguage', async () => {
  assert.equal(isVertexExpressKey('  AQ.AbCd123 '), true);
  assert.equal(isVertexExpressKey('AIzaSyTest123'), false);
  assert.equal(
    buildVertexExpressUrl(' AQ.AbCd+123 '),
    'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=AQ.AbCd%2B123'
  );

  const h2 = buildGeminiHeaders('AIzaSyExampleKey');
  assert.equal(h2['x-goog-api-key'], 'AIzaSyExampleKey');

  const fenced = parseGeminiJsonText<{ ok: boolean }>(
    '```json\n{"ok": true}\n```'
  );
  assert.equal(fenced.ok, true);

  const emptyAdBundle = await generateAdClientSide(
    ' ',
    {
      productName: 'عود كمبودي فاخر',
      category: 'عطور',
      keyFeature: 'ثبات يومين',
      priceOffer: '199 ريال',
      platform: 'سناب شات',
      dialect: 'خليجية بيضاء',
    },
    'فاخر ومقنع'
  );
  assert.match(emptyAdBundle.seoDescription, /عود كمبودي فاخر/);
  assert.match(emptyAdBundle.adCopy, /199 ريال/);
  assert.equal(emptyAdBundle.videoSlides.length, 4);
  assert.equal(emptyAdBundle.videoSlides[0].headline, 'عود كمبودي فاخر');

  const directFallbackCampaign = generateFallbackMarketingCampaign('توفير الوقت');
  assert.match(directFallbackCampaign.videoHook, /توفير الوقت/);
  assert.equal(directFallbackCampaign.promoSlides.length, 4);

  const emptyKeyConn = await testGeminiConnection('  ');
  assert.equal(emptyKeyConn.ok, false);
  assert.match(emptyKeyConn.message, /المحرك الاحتياطي/);

  const originalFetch = globalThis.fetch;
  try {
    const seenUrls: string[] = [];
    globalThis.fetch = (async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      seenUrls.push(urlStr);
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'متصل' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const aqRes = await testGeminiConnection('AQ.TestVertexKey');
    assert.equal(aqRes.ok, true);
    assert.match(seenUrls[0] ?? '', /^https:\/\/aiplatform\.googleapis\.com\//);

    const aizaRes = await testGeminiConnection('AIzaSyTestKey');
    assert.equal(aizaRes.ok, true);
    assert.equal(seenUrls[1], GEMINI_ENDPOINT);

    // Verify fallback to direct ?key= Express URL when SDK transport rejects
    seenUrls.length = 0;
    let callCount = 0;
    globalThis.fetch = (async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      seenUrls.push(urlStr);
      callCount += 1;
      if (callCount === 1) {
        throw new TypeError('Failed to fetch');
      }
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'متصل' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const fallbackRes = await testGeminiConnection('AQ.FallbackTestKey');
    assert.equal(fallbackRes.ok, true);
    assert.equal(
      seenUrls[1],
      'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=AQ.FallbackTestKey'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('routes gsk_ keys through Groq API with llama-3.3-70b-versatile and Bearer header', async () => {
  assert.equal(isGroqApiKey('  gsk_abc123 '), true);
  assert.equal(isGroqApiKey('AQ.abc123'), false);

  const headers = buildGroqHeaders(' gsk_mySecretKey ');
  assert.equal(headers.Authorization, 'Bearer gsk_mySecretKey');
  assert.equal(headers['Content-Type'], 'application/json');

  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      capturedInit = init;
      const parsedBody = JSON.parse(String(init?.body || '{}')) as {
        messages?: Array<{ content?: string }>;
      };
      const isPing = parsedBody.messages?.[0]?.content?.includes('أجب بكلمة واحدة');
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: isPing
                  ? 'متصل'
                  : JSON.stringify({
                      seoDescription: 'وصف سلة وزد احترافي',
                      adCopy: 'نص إعلاني خليجي ممتاز',
                      marketingScript: 'سيناريو قصير',
                      posterTagline: 'فخامة العود الملكي',
                      videoSlides: [
                        { badge: 'عطور', headline: 'عود', subline: 'فاخر' },
                      ],
                    }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const ping = await testGeminiConnection('gsk_liveTest123');
    assert.equal(ping.ok, true);
    assert.equal(capturedUrl, GROQ_ENDPOINT);
    const pingHeaders = capturedInit?.headers as Record<string, string>;
    assert.equal(pingHeaders.Authorization, 'Bearer gsk_liveTest123');
    assert.equal(pingHeaders['Content-Type'], 'application/json');
    const pingBody = JSON.parse(String(capturedInit?.body));
    assert.equal(pingBody.model, GROQ_MODEL);
    assert.equal(pingBody.messages[0].role, 'user');

    const bundle = await generateAdClientSide(
      'gsk_liveTest123',
      {
        productName: 'دهن عود',
        category: 'عطور',
        keyFeature: 'ثبات 48 ساعة',
        priceOffer: '199 ريال',
        platform: 'سناب شات',
        dialect: 'خليجية بيضاء',
      },
      'فاخر ومقنع'
    );
    assert.equal(bundle.seoDescription, 'وصف سلة وزد احترافي');
    assert.equal(bundle.videoSlides.length, 4);
    assert.equal(bundle.videoSlides[0].headline, 'دهن عود');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('selects best Arabic voices and strips emojis/URLs/markdown for speech', () => {
  const voice = pickArabicVoice([
    { lang: 'en-US', name: 'Google US English' },
    { lang: 'ar-EG', name: 'Arabic Egypt' },
    { lang: 'ar-SA', name: 'Arabic Saudi' },
  ]);
  assert.equal(voice?.lang, 'ar-SA');

  const googlePreferred = pickArabicVoice([
    { lang: 'ar-SA', name: 'System Saudi' },
    { lang: 'ar-XA', name: 'Google العربية' },
  ]);
  assert.equal(googlePreferred?.name, 'Google العربية');

  const microsoftOverSystem = pickArabicVoice([
    { lang: 'ar-SA', name: 'Default Arabic' },
    { lang: 'ar-SA', name: 'Microsoft Naayf - Arabic (Saudi Arabia)' },
  ]);
  assert.match(microsoftOverSystem?.name ?? '', /Microsoft/);

  const fallbackArabic = pickArabicVoice([
    { lang: 'fr-FR', name: 'French' },
    { lang: 'ar', name: 'Generic Arabic' },
  ]);
  assert.equal(fallbackArabic?.lang, 'ar');

  assert.equal(pickArabicVoice([{ lang: 'en-GB' }]), null);
  assert.equal(
    cleanSpeechText('**عرض** 🔥 _خاص_ #1 https://example.com/offer !!'),
    'عرض خاص 1!'
  );

  const adScript = buildAdVoiceoverScript(
    [{ badge: 'عطور', headline: 'عود ملكي', subline: 'ثبات يومين', accentValue: '199 ريال' }],
    'عرض **حصري** ✨ على دهن العود الملكي!'
  );
  assert.equal(adScript, 'عرض حصري على دهن العود الملكي!');

  const promoScript = buildPromoVoiceoverScript(
    [{ badge: 'المنصة', headline: 'إعلان الخليج الذكي', subline: 'وفّر وقتك' }],
    null
  );
  assert.equal(promoScript, 'إعلان الخليج الذكي، وفّر وقتك');
});

test('routes sk-or- keys through OpenRouter with CORS-safe headers, 3-model chain, and smart fallback', async () => {
  assert.equal(isOpenRouterApiKey('  sk-or-v1-test123 '), true);
  assert.equal(isOpenRouterApiKey('gsk_abc'), false);
  assert.deepEqual([...OPENROUTER_FREE_MODELS], [
    'openrouter/free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-27b-it:free',
  ]);

  const orHeaders = buildOpenRouterHeaders(' sk-or-v1-key999 ');
  assert.deepEqual(orHeaders, {
    Authorization: 'Bearer sk-or-v1-key999',
    'Content-Type': 'application/json',
  });
  assert.equal('HTTP-Referer' in orHeaders, false);
  assert.equal('X-Title' in orHeaders, false);

  const proseWrapped = parseGeminiJsonText<{ ok: boolean }>(
    'إليك النتيجة:\n```json\n{"ok": true}\n```\nبالتوفيق'
  );
  assert.equal(proseWrapped.ok, true);

  const originalFetch = globalThis.fetch;
  try {
    const requestedModels: string[] = [];
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      capturedHeaders = (init?.headers || {}) as Record<string, string>;
      const parsedBody = JSON.parse(String(init?.body || '{}')) as {
        model?: string;
        messages?: Array<{ content?: string }>;
      };
      requestedModels.push(parsedBody.model || '');

      // Simulate failures on models 1 and 2 -> succeeds on model 3 (google/gemma-3-27b-it:free)
      if (parsedBody.model === 'openrouter/free') {
        return new Response(JSON.stringify({ error: { message: 'rate_limit' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (parsedBody.model === 'meta-llama/llama-3.3-70b-instruct:free') {
        return new Response(JSON.stringify({ error: { message: 'unavailable' } }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const isPing = parsedBody.messages?.[0]?.content?.includes('أجب بكلمة واحدة');
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: isPing
                  ? 'متصل'
                  : JSON.stringify({
                      seoDescription: 'وصف متجر سلة عبر OpenRouter',
                      adCopy: 'نص إعلاني خليجي جذاب',
                      marketingScript: 'سيناريو قصير',
                      posterTagline: 'فخامة خليجية',
                      videoSlides: [],
                    }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const ping = await testGeminiConnection('sk-or-v1-live999');
    assert.equal(ping.ok, true);
    assert.equal(capturedUrl, OPENROUTER_ENDPOINT);
    assert.deepEqual(capturedHeaders, {
      Authorization: 'Bearer sk-or-v1-live999',
      'Content-Type': 'application/json',
    });
    assert.deepEqual(requestedModels, [...OPENROUTER_FREE_MODELS]);

    requestedModels.length = 0;
    const bundle = await generateAdClientSide(
      'sk-or-v1-live999',
      {
        productName: 'مبخرة ملكية',
        category: 'بخور',
        keyFeature: 'تصميم فاخر',
        priceOffer: '149 ريال',
        platform: 'تيك توك',
        dialect: 'سعودية',
      },
      'فاخر ومقنع'
    );
    assert.equal(bundle.seoDescription, 'وصف متجر سلة عبر OpenRouter');
    assert.equal(bundle.videoSlides.length, 4);
    assert.deepEqual(requestedModels, [...OPENROUTER_FREE_MODELS]);

    // When all external calls fail (CORS/network error), fallback engine activates cleanly without throwing
    globalThis.fetch = (async () => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;

    const failedConn = await testGeminiConnection('sk-or-v1-live999');
    assert.equal(failedConn.ok, false);
    assert.match(failedConn.message, /المحرك الاحتياطي الذكي/);

    const fallbackAd = await generateAdClientSide(
      'sk-or-v1-live999',
      {
        productName: 'زعفران ملكي',
        category: 'مواد غذائية فاخرة',
        keyFeature: 'نقاء أصلي 100%',
        priceOffer: '99 ريال',
        platform: 'إنستغرام',
        dialect: 'كويتية',
      },
      'رسمي وموثوق'
    );
    const expectedDirect = generateFallbackAdBundle(
      {
        productName: 'زعفران ملكي',
        category: 'مواد غذائية فاخرة',
        keyFeature: 'نقاء أصلي 100%',
        priceOffer: '99 ريال',
        platform: 'إنستغرام',
        dialect: 'كويتية',
      },
      'رسمي وموثوق'
    );
    assert.equal(fallbackAd.adCopy, expectedDirect.adCopy);
    assert.equal(fallbackAd.videoSlides.length, 4);

    const fallbackCampaign = await generateMarketingClientSide(
      'sk-or-v1-live999',
      'توفير تكاليف التصميم'
    );
    assert.match(fallbackCampaign.videoHook, /توفير تكاليف التصميم/);
    assert.equal(fallbackCampaign.promoSlides.length, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
