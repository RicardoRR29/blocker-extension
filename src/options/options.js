import { getBlockedKeywords, setBlockedKeywords } from "./storage.js";
import { showToast } from "./toast.js";
import { normalizeUrl } from "./utils.js";

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
    this.addBtn.addEventListener("click", () => {
      this.addUrl();
    });

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

  async addUrl() {
    const keyword = normalizeUrl(this.urlInput.value);

    if (!keyword) {
      showToast(this.toastContainer, "Enter a site to block", "warning");
      return;
    }

    this.setLoading(true);

    const blockedKeywords = await getBlockedKeywords();

    if (!blockedKeywords.includes(keyword)) {
      blockedKeywords.push(keyword);
      await setBlockedKeywords(blockedKeywords);
      this.blockedKeywords = blockedKeywords;
      this.updateUI();
      this.urlInput.value = "";
      showToast(this.toastContainer, `${keyword} was blocked`, "success");
    } else {
      showToast(this.toastContainer, "This site is already blocked", "warning");
    }

    this.setLoading(false);
  }

  async removeUrl(index) {
    const keyword = this.blockedKeywords[index];
    if (!keyword) return;

    const blockedKeywords = await getBlockedKeywords();
    blockedKeywords.splice(index, 1);
    await setBlockedKeywords(blockedKeywords);

    this.blockedKeywords = blockedKeywords;
    this.updateUI();
    showToast(this.toastContainer, `${keyword} was unblocked`, "success");
  }

    setLoading(loading) {
      if (this.addBtn) {
        this.addBtn.disabled = loading;
        this.addBtn.textContent = loading ? "Adding..." : "Add";
      }
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
      <button class="remove-btn" title="Remove">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18"/>
          <path d="M6 6l12 12"/>
        </svg>
      </button>
    `;

    const removeBtn = div.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      this.removeUrl(index);
    });

    return div;
  }

    updateCount() {
      if (this.blockedCount) {
        this.blockedCount.textContent = this.blockedKeywords.length;
      }
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

  async loadBlockedUrls() {
    this.blockedKeywords = await getBlockedKeywords();
    this.updateUI();
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.focusBlocker = new FocusBlockerOptions();
});
