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
    this.addBtn.addEventListener("click", (e) => {
      e.preventDefault();
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

    const origin = `*://${keyword}/*`;
    const granted = await chrome.permissions.request({ origins: [origin] });
    if (!granted) {
      showToast(this.toastContainer, "Permission denied", "warning");
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
    const container = document.createElement("div");
    container.className = "blocked-item";

    const urlDiv = document.createElement("div");
    urlDiv.className = "blocked-item-url";
    urlDiv.textContent = item;
    container.appendChild(urlDiv);

    const button = document.createElement("button");
    button.className = "remove-btn";
    button.title = "Remove";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");

    const path1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path1.setAttribute("d", "M18 6L6 18");
    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path2.setAttribute("d", "M6 6l12 12");

    svg.append(path1, path2);
    button.appendChild(svg);
    button.addEventListener("click", () => {
      this.removeUrl(index);
    });

    container.appendChild(button);

    return container;
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
