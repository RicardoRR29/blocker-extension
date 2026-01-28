const SECRET_KEY = "focus-blocker-key";
const browser =
  globalThis.browser || globalThis.chrome || globalThis.opera || globalThis.opr;

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

  const buildRule = (keyword, index, withParam) => {
    const redirectPath = withParam
      ? `/src/blocked/blocked.html?blocked=${encodeURIComponent(keyword)}`
      : "/src/blocked/blocked.html";

    return {
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { extensionPath: redirectPath },
      },
      condition: {
        urlFilter: keyword,
        resourceTypes: ["main_frame"],
      },
    };
  };

  const rules = keywords.map((keyword, index) =>
    buildRule(keyword, index, true)
  );

  if (rules.length) {
    try {
      await browser.declarativeNetRequest.updateDynamicRules({
        addRules: rules,
      });
    } catch (error) {
      console.warn(
        "Failed to add rules with query params. Retrying without them.",
        error
      );
      const fallbackRules = keywords.map((keyword, index) =>
        buildRule(keyword, index, false)
      );
      await browser.declarativeNetRequest.updateDynamicRules({
        addRules: fallbackRules,
      });
    }
  }
}
