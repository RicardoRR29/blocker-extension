class FocusBlockerOptions {
  constructor() {
    this.urlInput = document.getElementById("urlInput");
    this.addBtn = document.getElementById("addBtn");
    this.addForm = document.getElementById("addForm");
    this.blockedList = document.getElementById("blockedList");
    this.emptyState = document.getElementById("emptyState");
    this.blockedCount = document.getElementById("blockedCount");
    this.toastContainer = document.getElementById("toastContainer");

    this.blockedUrls = [];

    this.init();
  }

  init() {
    this.loadBlockedUrls();
    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    this.addBtn.onclick = () => {
      this.addUrl();
    };

    this.addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.addUrl();
    });

    this.urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.addUrl();
      }
    });
  }

  normalizeUrl(url) {
    return url.trim().toLowerCase();
  }

  addUrl() {
    const keyword = this.urlInput.value.trim().toLowerCase();

    if (!keyword) {
      this.showToast("Digite um site para bloquear", "warning");
      return;
    }

    this.setLoading(true);

    window.chrome.storage.local.get(
      "blockedKeywords",
      ({ blockedKeywords }) => {
        blockedKeywords = blockedKeywords || [];

        if (!blockedKeywords.includes(keyword)) {
          blockedKeywords.push(keyword);

          window.chrome.storage.local.set({ blockedKeywords }, () => {
            this.blockedUrls = blockedKeywords;
            this.updateUI();
            this.urlInput.value = "";
            this.showToast(`${keyword} foi bloqueado`, "success");
            this.setLoading(false);
          });
        } else {
          this.showToast("Este site já está bloqueado", "warning");
          this.setLoading(false);
        }
      }
    );
  }

  removeUrl(index) {
    const item = this.blockedUrls[index];
    if (!item) return;

    window.chrome.storage.local.get(
      "blockedKeywords",
      ({ blockedKeywords }) => {
        blockedKeywords = blockedKeywords || [];
        blockedKeywords.splice(index, 1);

        window.chrome.storage.local.set({ blockedKeywords }, () => {
          this.blockedUrls = blockedKeywords;
          this.updateUI();
          this.showToast(`${item} foi desbloqueado`, "success");
        });
      }
    );
  }

  setLoading(loading) {
    this.addBtn.disabled = loading;
    this.addBtn.textContent = loading ? "Adicionando..." : "Adicionar";
  }

  updateUI() {
    this.updateBlockedList();
    this.updateCount();
    this.toggleEmptyState();
  }

  updateBlockedList() {
    this.blockedList.innerHTML = "";

    this.blockedUrls.forEach((item, index) => {
      const element = this.createBlockedItemElement(item, index);
      this.blockedList.appendChild(element);
    });
  }

  createBlockedItemElement(item, index) {
    const div = document.createElement("div");
    div.className = "blocked-item";

    div.innerHTML = `
      <div class="blocked-item-url">${item}</div>
      <button class="remove-btn" title="Remover">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18"/>
          <path d="M6 6l12 12"/>
        </svg>
      </button>
    `;

    const removeBtn = div.querySelector(".remove-btn");
    removeBtn.onclick = () => {
      this.removeUrl(index);
    };

    return div;
  }

  updateCount() {
    this.blockedCount.textContent = this.blockedUrls.length;
  }

  toggleEmptyState() {
    if (this.blockedUrls.length === 0) {
      this.emptyState.style.display = "block";
      this.blockedList.style.display = "none";
    } else {
      this.emptyState.style.display = "none";
      this.blockedList.style.display = "block";
    }
  }

  showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  loadBlockedUrls() {
    window.chrome.storage.local.get(
      "blockedKeywords",
      ({ blockedKeywords }) => {
        this.blockedUrls = blockedKeywords || [];
        this.updateUI();
      }
    );
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  window.focusBlocker = new FocusBlockerOptions();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (!window.focusBlocker) {
      window.focusBlocker = new FocusBlockerOptions();
    }
  });
} else {
  window.focusBlocker = new FocusBlockerOptions();
}
