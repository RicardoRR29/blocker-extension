class FocusBlockerOptions {
  constructor() {
    this.urlInput = document.getElementById("urlInput");
    this.addBtn = document.getElementById("addBtn");
    this.addForm = document.getElementById("addForm");
    this.blockedList = document.getElementById("blockedList");
    this.emptyState = document.getElementById("emptyState");
    this.blockedCount = document.getElementById("blockedCount");
    this.toastContainer = document.getElementById("toastContainer");

    this.blockedKeywords = [];

    this.init();
  }

  init() {
    this.loadBlockedUrls();
    this.bindEvents();
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

  async addUrl() {
    const keyword = this.normalizeUrl(this.urlInput.value);

    if (!keyword) {
      this.showToast("Digite um site para bloquear", "warning");
      return;
    }

    this.setLoading(true);

    const blockedKeywords = await this.getBlockedKeywords();

    if (!blockedKeywords.includes(keyword)) {
      blockedKeywords.push(keyword);
      await this.setBlockedKeywords(blockedKeywords);
      this.blockedKeywords = blockedKeywords;
      this.updateUI();
      this.urlInput.value = "";
      this.showToast(`${keyword} foi bloqueado`, "success");
    } else {
      this.showToast("Este site já está bloqueado", "warning");
    }

    this.setLoading(false);
  }

  async removeUrl(index) {
    const keyword = this.blockedKeywords[index];
    if (!keyword) return;

    const blockedKeywords = await this.getBlockedKeywords();
    blockedKeywords.splice(index, 1);
    await this.setBlockedKeywords(blockedKeywords);

    this.blockedKeywords = blockedKeywords;
    this.updateUI();
    this.showToast(`${keyword} foi desbloqueado`, "success");
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

    this.blockedKeywords.forEach((item, index) => {
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
    this.blockedCount.textContent = this.blockedKeywords.length;
  }

  toggleEmptyState() {
    if (this.blockedKeywords.length === 0) {
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

  async loadBlockedUrls() {
    this.blockedKeywords = await this.getBlockedKeywords();
    this.updateUI();
  }

  async getBlockedKeywords() {
    const { blockedKeywords = [] } = await chrome.storage.local.get("blockedKeywords");
    return blockedKeywords;
  }

  setBlockedKeywords(keywords) {
    return chrome.storage.local.set({ blockedKeywords: keywords });
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  window.focusBlocker = new FocusBlockerOptions();
});
