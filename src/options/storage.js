const browser = globalThis.browser || globalThis.chrome;

function xor(str) {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(
      str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
    );
  }
  return result;
}

function encrypt(text) {
  return btoa(xor(text));
}

function decrypt(text) {
  return xor(atob(text));
}

export async function getBlockedKeywords() {
  const { blockedKeywords = [] } = await browser.storage.local.get(
    "blockedKeywords"
  );
  return blockedKeywords.map(decrypt);
}

export function setBlockedKeywords(keywords) {
  const encrypted = keywords.map(encrypt);
  return browser.storage.local.set({ blockedKeywords: encrypted });
}
