chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("blockedKeywords", ({ blockedKeywords }) => {
    updateRules(blockedKeywords || []);
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedKeywords) {
    updateRules(changes.blockedKeywords.newValue);
  }
});

function updateRules(keywords) {
  // Passo 1: remove todas as regras dinâmicas
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const allIds = existingRules.map((rule) => rule.id);

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: allIds,
      },
      () => {
        // Passo 2: monta e adiciona novas regras (se houver palavras-chave)
        const rules = keywords.map((keyword, i) => ({
          id: i + 1,
          priority: 1,
          action: {
            type: "redirect",
            redirect: { extensionPath: "/blocked/blocked.html" },
          },
          condition: {
            urlFilter: keyword,
            resourceTypes: ["main_frame"],
          },
        }));

        if (rules.length > 0) {
          chrome.declarativeNetRequest.updateDynamicRules({
            addRules: rules,
          });
        }
      }
    );
  });
}
