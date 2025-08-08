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

(function () {
  try {
    browser.storage.local.get("focus-blocker-theme", (data) => {
      let storedTheme = data["focus-blocker-theme"];
      if (storedTheme) {
        try {
          storedTheme = decrypt(storedTheme);
        } catch {
          storedTheme = null;
        }
      }
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const theme = storedTheme || (systemPrefersDark ? "dark" : "light");
      if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", "#000000");
      } else {
        document.documentElement.removeAttribute("data-theme");
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", "#ffffff");
      }
    });
  } catch (e) {
    console.warn("Theme init failed:", e);
  }
})();
