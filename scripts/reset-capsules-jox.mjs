// One-off: re-encrypt jox's 3 oldest capsule letters behind the phrase "jox".
// Mirrors lib/crypto.ts EXACTLY (PBKDF2 SHA-256 200k -> AES-GCM-256; nonce =
// base64(iv(12) ++ salt(16))). The original ciphertext is end-to-end encrypted
// with the forgotten phrase and is unrecoverable, so each letter's body is
// replaced with a placeholder note. Prints UPDATE SQL on stdout (pipe to psql).
import { webcrypto as crypto } from 'node:crypto';

const enc = new TextEncoder();
const PHRASE = 'jox';

const IDS = [
  '8709511f-d3cf-468a-8f8d-1dd7fc1aaea0',
  '7525e214-df6b-4606-acce-b4c9e05b219b',
  'dfcede07-fa82-42f3-a459-cae48514e62b',
];

const BODY = [
  '💛 The secret phrase for this capsule was reset.',
  '',
  'The words originally sealed here were locked with a phrase that was lost, and could not be recovered. This note opens with the new phrase so the capsule is no longer stuck.',
  '',
  'Your story continues. 💛',
  '— Forever',
].join('\n');

function toBase64(buf) {
  return Buffer.from(new Uint8Array(buf)).toString('base64');
}

async function deriveKey(passphrase, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt'],
  );
}

async function encrypt(plain, passphrase) {
  const saltBuf = crypto.getRandomValues(new Uint8Array(16)).buffer;
  const ivBuf = crypto.getRandomValues(new Uint8Array(12)).buffer;
  const key = await deriveKey(passphrase, saltBuf);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBuf }, key, enc.encode(plain));
  const combined = new Uint8Array(28);
  combined.set(new Uint8Array(ivBuf), 0);
  combined.set(new Uint8Array(saltBuf), 12);
  return { ciphertext: toBase64(ct), nonce: toBase64(combined.buffer) };
}

// sanity round-trip so we never write a row we can't open
async function decrypt(ciphertext, nonce, passphrase) {
  const dec = new TextDecoder();
  const combined = Buffer.from(nonce, 'base64');
  const iv = combined.subarray(0, 12);
  const salt = combined.subarray(12);
  const key = await deriveKey(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, Buffer.from(ciphertext, 'base64'),
  );
  return dec.decode(plainBuf);
}

const sqlEsc = (s) => s.replace(/'/g, "''");

for (const id of IDS) {
  const { ciphertext, nonce } = await encrypt(BODY, PHRASE);
  const back = await decrypt(ciphertext, nonce, PHRASE);
  if (back !== BODY) {
    console.error(`ROUND-TRIP FAILED for ${id}`);
    process.exit(1);
  }
  process.stdout.write(
    `update capsule_letters set ciphertext='${sqlEsc(ciphertext)}', nonce='${sqlEsc(nonce)}' where id='${id}';\n`,
  );
}
