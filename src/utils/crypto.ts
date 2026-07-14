/**
 * Hashes a plain-text string using SHA-256.
 * Uses native Web Crypto API where available, with a lightweight pure TypeScript fallback
 * to guarantee compatibility inside sandboxed iframe environments.
 */

function sha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number, j: number;
  const result: string[] = [];

  const words: number[] = [];
  const asciiLength = ascii[lengthProperty] * 8;
  
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  let candidate = 2;
  while (primeCounter < 64) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
    candidate++;
  }

  let asciiBytes = ascii + '\x80';
  while ((asciiBytes[lengthProperty] % 64) !== 56) {
    asciiBytes += '\x00';
  }

  for (i = 0; i < asciiBytes[lengthProperty]; i++) {
    const charCode = asciiBytes.charCodeAt(i);
    if (charCode >> 8) return ''; // ASCII check
    words[i >> 2] |= charCode << (((3 - i) % 4) * 8);
  }
  
  words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiLength | 0);

  // Process each 512-bit block
  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      if (i >= 16) {
        const w15 = w[i - 15];
        const w2 = w[i - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const a = hash[0], e = hash[4];
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
      const t2 = (s0 + maj) | 0;
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & hash[5]) ^ ((~e) & hash[6]);
      const t1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;

      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
      hash.length = 8;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    let word = hash[i];
    if (word < 0) word += maxWord;
    const hex = word.toString(16).padStart(8, '0');
    result.push(hex);
  }

  return result.join('');
}

export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto error, falling back to TS SHA-256', e);
  }
  return sha256Fallback(password);
}
