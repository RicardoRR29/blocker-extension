export async function getBlockedKeywords() {
  const { blockedKeywords = [] } = await chrome.storage.local.get("blockedKeywords");
  return blockedKeywords;
}

export function setBlockedKeywords(keywords) {
  return chrome.storage.local.set({ blockedKeywords: keywords });
}
