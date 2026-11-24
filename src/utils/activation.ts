const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX = 'KHALEEJ-';
const SECRET_SALT = 'KHALEEJ-GULF-2026-ISMAEL-ZAKARIA-88512-SECURE';

function computeBlockChecksum(payload: number[]): [number, number, number, number] {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  const payloadStr = payload.map((idx) => ALPHABET[idx]).join('');
  const seedInput = `${SECRET_SALT}:${payloadStr}`;

  for (let i = 0; i < seedInput.length; i++) {
    const ch = seedInput.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (Math.imul(h2 ^ (ch + i * 29), 0x85ebca6b) >>> 0) ^ (h1 >>> 5);
  }

  const len = ALPHABET.length;
  const c0 = ((h1 >>> 2) ^ (payload[0] * 11 + payload[1] * 7 + 3)) % len;
  const c1 = ((h2 >>> 4) ^ (payload[1] * 13 + payload[2] * 5 + 9)) % len;
  const c2 = (((h1 ^ h2) >>> 6) ^ (payload[2] * 17 + payload[3] * 3 + 15)) % len;
  const c3 = (((h1 + h2) >>> 8) ^ (payload[3] * 19 + payload[0] * 23 + 21)) % len;
  return [c0, c1, c2, c3];
}

export function normalizeActivationCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function generateActivationCode(randomFn: () => number = Math.random): string {
  const len = ALPHABET.length;
  const p = [
    Math.floor(randomFn() * len) % len,
    Math.floor(randomFn() * len) % len,
    Math.floor(randomFn() * len) % len,
    Math.floor(randomFn() * len) % len,
  ];
  const c = computeBlockChecksum(p);
  const block1 = p.map((idx) => ALPHABET[idx]).join('');
  const block2 = c.map((idx) => ALPHABET[idx]).join('');
  return `${PREFIX}${block1}-${block2}`;
}

export function verifyActivationCode(rawCode: string): boolean {
  const normalized = normalizeActivationCode(rawCode);
  if (!/^KHALEEJ-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(normalized)) {
    return false;
  }

  const parts = normalized.slice(PREFIX.length).split('-');
  if (parts.length !== 2) return false;

  const [block1, block2] = parts;
  const payload: number[] = [];
  for (let i = 0; i < 4; i++) {
    const idx = ALPHABET.indexOf(block1[i]);
    if (idx === -1) return false;
    payload.push(idx);
  }

  const expected = computeBlockChecksum(payload);
  for (let i = 0; i < 4; i++) {
    if (block2[i] !== ALPHABET[expected[i]]) {
      return false;
    }
  }
  return true;
}
