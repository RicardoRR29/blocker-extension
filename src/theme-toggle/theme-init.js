(function () {
  try {
    const storedTheme = localStorage.getItem("focus-blocker-theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
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
  } catch (e) {
    console.warn("Theme init failed:", e);
  }
})();
