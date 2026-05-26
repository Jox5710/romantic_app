const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(passphrase: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  bytes.forEach((b) => { str += String.fromCharCode(b); });
  return btoa(str);
}

function fromBase64(str: string): ArrayBuffer {
  const bin = atob(str);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

export async function encrypt(plain: string, passphrase: string): Promise<{ ciphertext: string; nonce: string }> {
  const saltBuf = crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer;
  const ivBuf = crypto.getRandomValues(new Uint8Array(12)).buffer as ArrayBuffer;
  const key = await deriveKey(passphrase, saltBuf);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBuf }, key, enc.encode(plain));

  const combined = new ArrayBuffer(12 + 16);
  new Uint8Array(combined).set(new Uint8Array(ivBuf), 0);
  new Uint8Array(combined).set(new Uint8Array(saltBuf), 12);

  return { ciphertext: toBase64(ct), nonce: toBase64(combined) };
}

export async function decrypt(ciphertext: string, nonce: string, passphrase: string): Promise<string> {
  const combined = fromBase64(nonce);
  const iv = combined.slice(0, 12);
  const salt = combined.slice(12);
  const key = await deriveKey(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fromBase64(ciphertext));
  return dec.decode(plainBuf);
}
