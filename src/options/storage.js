const SECRET_KEY = "focus-blocker-key";
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

// Funções para keywords individuais (mantidas para compatibilidade)
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

// Funções para grupos de links
export async function getLinkGroups() {
  const { linkGroups = [] } = await browser.storage.local.get("linkGroups");
  return linkGroups.map(group => ({
    ...group,
    name: decrypt(group.name),
    urls: group.urls.map(decrypt)
  }));
}

export function setLinkGroups(groups) {
  const encrypted = groups.map(group => ({
    ...group,
    name: encrypt(group.name),
    urls: group.urls.map(encrypt)
  }));
  return browser.storage.local.set({ linkGroups: encrypted });
}

export async function addLinkGroup(groupName, urls) {
  const groups = await getLinkGroups();
  const newGroup = {
    id: Date.now().toString(),
    name: groupName,
    urls: urls,
    createdAt: new Date().toISOString()
  };
  groups.push(newGroup);
  await setLinkGroups(groups);
  return newGroup;
}

export async function updateLinkGroup(groupId, updates) {
  const groups = await getLinkGroups();
  const index = groups.findIndex(group => group.id === groupId);
  if (index !== -1) {
    groups[index] = { ...groups[index], ...updates };
    await setLinkGroups(groups);
    return groups[index];
  }
  return null;
}

export async function deleteLinkGroup(groupId) {
  const groups = await getLinkGroups();
  const filteredGroups = groups.filter(group => group.id !== groupId);
  await setLinkGroups(filteredGroups);
  return filteredGroups;
}

export async function addUrlsToGroup(groupId, urls) {
  const groups = await getLinkGroups();
  const group = groups.find(g => g.id === groupId);
  if (group) {
    const newUrls = urls.filter(url => !group.urls.includes(url));
    group.urls = [...group.urls, ...newUrls];
    await setLinkGroups(groups);
    return group;
  }
  return null;
}

export async function removeUrlFromGroup(groupId, url) {
  const groups = await getLinkGroups();
  const group = groups.find(g => g.id === groupId);
  if (group) {
    group.urls = group.urls.filter(u => u !== url);
    await setLinkGroups(groups);
    return group;
  }
  return null;
}
