const SECRET_KEY = "focus-blocker-key";

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

class ThemeToggle {
  constructor() {
    this.toggleButton = document.getElementById("themeToggle");
    this.init();
  }

  async init() {
    this.currentTheme = await this.getStoredTheme();

    if (!this.currentTheme) {
      this.currentTheme = this.getSystemTheme();
      await this.setStoredTheme(this.currentTheme);
    }

    this.applyTheme(this.currentTheme);

    if (this.toggleButton) {
      this.toggleButton.addEventListener("click", () => {
        this.toggleTheme();
      });

      this.toggleButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", async (e) => {
        if (!(await this.getStoredTheme())) {
          this.currentTheme = e.matches ? "dark" : "light";
          this.applyTheme(this.currentTheme);
        }
      });
  }

  getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  async getStoredTheme() {
    try {
      const { "focus-blocker-theme": theme } = await chrome.storage.local.get(
        "focus-blocker-theme"
      );
      return theme ? decrypt(theme) : null;
    } catch (error) {
      console.warn("chrome.storage não está disponível:", error);
      return null;
    }
  }

  async setStoredTheme(theme) {
    try {
      await chrome.storage.local.set({
        "focus-blocker-theme": encrypt(theme),
      });
    } catch (error) {
      console.warn("Não foi possível salvar o tema:", error);
    }
  }

  applyTheme(theme) {
    const currentAttr =
      document.documentElement.getAttribute("data-theme") || "light";
    if (currentAttr === theme) {
      if (this.toggleButton) {
        this.toggleButton.setAttribute(
          "aria-label",
          theme === "dark"
            ? "Alternar para modo claro"
            : "Alternar para modo escuro"
        );
      }
      this.currentTheme = theme;
      return;
    }

    // Remove any existing theme attribute
    document.documentElement.removeAttribute("data-theme");

    // Apply new theme
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (this.toggleButton) {
        this.toggleButton.setAttribute(
          "aria-label",
          "Alternar para modo claro"
        );
      }
    } else if (this.toggleButton) {
      this.toggleButton.setAttribute(
        "aria-label",
        "Alternar para modo escuro"
      );
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
    }

    // Update current theme
    this.currentTheme = theme;
  }

  async toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";

    // Add a subtle animation effect
    if (this.toggleButton) {
      this.toggleButton.style.transform = "translateY(-2px) scale(0.95)";

      setTimeout(() => {
        this.toggleButton.style.transform = "";
      }, 150);
    }

    this.applyTheme(newTheme);
    await this.setStoredTheme(newTheme);

    // Dispatch custom event for other components that might need to know about theme changes
    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: { theme: newTheme },
      })
    );
  }

  // Public method to get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Public method to set theme programmatically
  async setTheme(theme) {
    if (theme === "light" || theme === "dark") {
      this.applyTheme(theme);
      await this.setStoredTheme(theme);
    }
  }
}

// Initialize theme toggle when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Wait a bit to ensure other scripts have loaded
  setTimeout(() => {
    window.focusBlockerTheme = new ThemeToggle();
  }, 100);
});

// Optional: Expose theme toggle globally for debugging
window.setFocusBlockerTheme = (theme) => {
  if (window.focusBlockerTheme) {
    window.focusBlockerTheme.setTheme(theme);
  }
};
