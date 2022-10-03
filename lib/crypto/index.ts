import _ from "lodash";
import { log } from "../graphics/ui";

export async function generateKeyPair() {
  let keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 1024,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  return keyPair;
}

export async function encrypt(args: {
  text: string;
  publicKey: CryptoKey;
}): Promise<string> {
  log("GAME/crypto", "<encrypt>", "Encoding...");
  const encoded = new TextEncoder().encode(args.text);
  log("GAME/crypto", "<encrypt>", "Encrypting...");
  log("GAME/crypto", "<encrypt>", "KEY", args.publicKey);
  // Split arraybuffer into chunks of size
  const result: ArrayBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    args.publicKey,
    encoded
  );
  log("GAME/crypto", "<encrypt>", "Decoding...");
  return Buffer.from(result).toString("base64");
}

export async function decrypt(args: {
  text: string;
  privateKey: CryptoKey;
}): Promise<string> {
  const encoded = Buffer.from(args.text, "base64");
  const result = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    args.privateKey,
    encoded
  );
  return new TextDecoder().decode(result);
}

export async function encryptSymmetric(args: {
  text: string;
  key: CryptoKey;
}): Promise<[string, string]> {
  let iv = Buffer.from(window.crypto.getRandomValues(new Uint8Array(12)));
  const encoded = new TextEncoder().encode(args.text);
  // Split arraybuffer into chunks of size
  const result: ArrayBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    args.key,
    encoded
  );
  return [Buffer.from(result).toString("base64"), iv.toString("base64")];
}

export async function decryptSymmetric(args: {
  text: string;
  key: CryptoKey;
  iv: string;
}): Promise<string> {
  const encoded = Buffer.from(args.text, "base64");
  const result = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(args.iv, "base64") },
    args.key,
    encoded
  );
  return Buffer.from(result).toString("utf8");
}

export async function generateSymmetricKey(): Promise<CryptoKey> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 128,
    },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
}
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return Buffer.from(exported).toString("base64");
}

export async function importKey(key: string): Promise<CryptoKey> {
  let buffer = Buffer.from(key, "base64");

  const imported = await window.crypto.subtle.importKey(
    "spki",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
  return imported;
}

export async function exportSymmetricKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return Buffer.from(exported).toString("base64");
}
export async function importSymmetricKey(key: string): Promise<CryptoKey> {
  let buffer = Buffer.from(key, "base64");
  const imported = await window.crypto.subtle.importKey(
    "raw",
    buffer,
    { name: "AES-GCM", length: 128 },
    true,
    ["encrypt", "decrypt"]
  );
  return imported;
}
