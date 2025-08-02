class ThemeToggle {
  constructor() {
    this.toggleButton = document.getElementById("themeToggle");
    this.currentTheme = this.getStoredTheme();

    if (!this.currentTheme) {
      this.currentTheme = this.getSystemTheme();
      this.setStoredTheme(this.currentTheme);
    }

    this.init();
  }

  init() {
    // Apply the current theme
    this.applyTheme(this.currentTheme);

    // Add event listener to toggle button
    if (this.toggleButton) {
      this.toggleButton.addEventListener("click", () => {
        this.toggleTheme();
      });

      // Add keyboard support
      this.toggleButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }

    // Listen for system theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!this.getStoredTheme()) {
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

  getStoredTheme() {
    try {
      return localStorage.getItem("focus-blocker-theme");
    } catch (error) {
      console.warn("localStorage não está disponível:", error);
      return null;
    }
  }

  setStoredTheme(theme) {
    try {
      localStorage.setItem("focus-blocker-theme", theme);
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

  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";

    // Add a subtle animation effect
    if (this.toggleButton) {
      this.toggleButton.style.transform = "translateY(-2px) scale(0.95)";

      setTimeout(() => {
        this.toggleButton.style.transform = "";
      }, 150);
    }

    this.applyTheme(newTheme);
    this.setStoredTheme(newTheme);

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
  setTheme(theme) {
    if (theme === "light" || theme === "dark") {
      this.applyTheme(theme);
      this.setStoredTheme(theme);
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
