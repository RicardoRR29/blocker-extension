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

function decrypt(text) {
  return xor(atob(text));
}

browser.runtime.onInstalled.addListener(async () => {
  const { blockedKeywords = [] } = await browser.storage.local.get(
    "blockedKeywords"
  );
  updateRules(blockedKeywords.map(decrypt));
});

browser.storage.onChanged.addListener(({ blockedKeywords }) => {
  if (blockedKeywords) {
    updateRules(blockedKeywords.newValue.map(decrypt));
  }
});

async function updateRules(keywords = []) {
  const existingRules = await browser.declarativeNetRequest.getDynamicRules();
  const allIds = existingRules.map((rule) => rule.id);

  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: allIds,
  });

  const rules = keywords.map((keyword, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { extensionPath: "/src/blocked/blocked.html" },
    },
    condition: {
      urlFilter: keyword,
      resourceTypes: ["main_frame"],
    },
  }));

  if (rules.length) {
    await browser.declarativeNetRequest.updateDynamicRules({ addRules: rules });
  }
}
