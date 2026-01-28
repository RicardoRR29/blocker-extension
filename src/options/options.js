import { 
  getBlockedKeywords, 
  setBlockedKeywords,
  getLinkGroups,
  addLinkGroup,
  updateLinkGroup,
  deleteLinkGroup,
  addUrlsToGroup,
  removeUrlFromGroup
} from "./storage.js";
import { showToast } from "./toast.js";
import { normalizeUrl } from "./utils.js";
const browser = globalThis.browser || globalThis.chrome;
const STATS_KEY = "blockedStats";
const STATS_VERSION = 2;
const STATS_DAYS = 7;
const TOP_SITES_LIMIT = 5;

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRecentDays(count) {
  const days = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push(date);
  }
  return days;
}

function formatShortDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const dateText = date.toLocaleDateString("pt-BR");
  const timeText = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateText} ${timeText}`;
}

function normalizeStats(rawStats) {
  const baseStats = {
    version: STATS_VERSION,
    totalBlocks: 0,
    bySite: {},
    byDate: {},
    lastBlockedAt: null,
  };

  if (!rawStats || typeof rawStats !== "object") {
    return baseStats;
  }

  if (rawStats.version === STATS_VERSION) {
    return {
      ...baseStats,
      ...rawStats,
      bySite:
        rawStats.bySite && typeof rawStats.bySite === "object"
          ? rawStats.bySite
          : {},
      byDate:
        rawStats.byDate && typeof rawStats.byDate === "object"
          ? rawStats.byDate
          : {},
    };
  }

  const migrated = { ...baseStats };
  Object.entries(rawStats).forEach(([dateKey, value]) => {
    if (!value || typeof value !== "object") return;
    const blocks = Number(value.blocks) || 0;
    if (!blocks) return;

    const parsedDate = new Date(dateKey);
    if (Number.isNaN(parsedDate.getTime())) return;

    const normalizedKey = getDateKey(parsedDate);
    if (!migrated.byDate[normalizedKey]) {
      migrated.byDate[normalizedKey] = { total: 0, sites: {} };
    }
    migrated.byDate[normalizedKey].total += blocks;
    migrated.totalBlocks += blocks;
  });

  return migrated;
}

function loadStatsFromLocalStorage() {
  if (typeof localStorage === "undefined") {
    return normalizeStats(null);
  }

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return normalizeStats(null);
    }
    return normalizeStats(JSON.parse(raw));
  } catch (error) {
    console.warn("Error reading stats from localStorage:", error);
    return normalizeStats(null);
  }
}

function getTopSites(bySite, limit) {
  return Object.entries(bySite || {})
    .map(([site, data]) => ({
      site,
      total: Number(data.total) || 0,
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function formatSiteLabel(site) {
  if (!site || site === "unknown") {
    return "Desconhecido";
  }
  return site;
}

function sumRecentDays(byDate, count) {
  return getRecentDays(count).reduce((total, date) => {
    const key = getDateKey(date);
    const dayTotal = byDate && byDate[key] ? Number(byDate[key].total) || 0 : 0;
    return total + dayTotal;
  }, 0);
}

class FocusBlockerOptions {
  constructor() {
    // Individual sites elements
    this.urlInput = document.getElementById("urlInput");
    this.addBtn = document.getElementById("addBtn");
    this.blockCurrentBtn = document.getElementById("blockCurrent");
    this.addForm = document.getElementById("addForm");
    this.blockedList = document.getElementById("blockedList");
    this.emptyState = document.getElementById("emptyState");
    this.blockedCount = document.getElementById("blockedCount");
    
    // Tabs elements
    this.individualTab = document.getElementById("individualTab");
    this.groupsTab = document.getElementById("groupsTab");
    this.individualContent = document.getElementById("individualContent");
    this.groupsContent = document.getElementById("groupsContent");
    
    // Groups elements
    this.createGroupBtn = document.getElementById("createGroupBtn");
    this.groupsList = document.getElementById("groupsList");
    this.groupsEmptyState = document.getElementById("groupsEmptyState");
    this.groupsCount = document.getElementById("groupsCount");
    
    // Modal elements
    this.groupModal = document.getElementById("groupModal");
    this.modalTitle = document.getElementById("modalTitle");
    this.modalClose = document.getElementById("modalClose");
    this.modalCancel = document.getElementById("modalCancel");
    this.modalSave = document.getElementById("modalSave");
    this.groupNameInput = document.getElementById("groupNameInput");
    this.groupUrlsInput = document.getElementById("groupUrlsInput");
    
    // Stats elements
    this.statsTab = document.getElementById("statsTab");
    this.statsContent = document.getElementById("statsContent");
    this.statsSummary = document.getElementById("statsSummary");
    this.statsCharts = document.getElementById("statsCharts");
    this.statsEmptyState = document.getElementById("statsEmptyState");
    this.statsTotal = document.getElementById("statsTotal");
    this.statsToday = document.getElementById("statsToday");
    this.statsLast7 = document.getElementById("statsLast7");
    this.statsTopSite = document.getElementById("statsTopSite");
    this.statsTopCount = document.getElementById("statsTopCount");
    this.statsUpdated = document.getElementById("statsUpdated");
    this.dailyChart = document.getElementById("dailyChart");
    this.topSitesChart = document.getElementById("topSitesChart");

    this.toastContainer = document.getElementById("toastContainer");

    this.blockedKeywords = [];
    this.linkGroups = [];
    this.currentEditingGroup = null;

    this.init();
  }

  init() {
    this.loadBlockedUrls();
    this.loadLinkGroups();
    this.loadStats();
    this.bindEvents();
  }

  bindEvents() {
    // Individual sites events
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

    if (this.blockCurrentBtn) {
      this.blockCurrentBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.addCurrentSite();
      });
    }

    // Tab switching events
    this.individualTab.addEventListener("click", () => {
      this.switchTab("individual");
    });

    this.groupsTab.addEventListener("click", () => {
      this.switchTab("groups");
    });

    if (this.statsTab) {
      this.statsTab.addEventListener("click", () => {
        this.switchTab("stats");
      });
    }

    // Groups events
    this.createGroupBtn.addEventListener("click", () => {
      this.openGroupModal();
    });

    // Modal events
    this.modalClose.addEventListener("click", () => {
      this.closeGroupModal();
    });

    this.modalCancel.addEventListener("click", () => {
      this.closeGroupModal();
    });

    this.modalSave.addEventListener("click", () => {
      this.saveGroup();
    });

    // Close modal when clicking outside
    this.groupModal.addEventListener("click", (e) => {
      if (e.target === this.groupModal) {
        this.closeGroupModal();
      }
    });
  }

  async addUrl(keywordParam) {
    const keyword = normalizeUrl(keywordParam ?? this.urlInput.value);
    if (!keyword) {
      showToast(this.toastContainer, "Enter a site to block", "warning");
      return;
    }

    const origin = `*://${keyword}/*`;
    const granted = await browser.permissions.request({ origins: [origin] });
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
      if (!keywordParam) {
        this.urlInput.value = "";
      }
      showToast(this.toastContainer, `${keyword} was blocked`, "success");
    } else {
      showToast(this.toastContainer, "This site is already blocked", "warning");
    }

    this.setLoading(false);
  }

  async addCurrentSite() {
    const granted = await browser.permissions.request({ permissions: ["tabs"] });
    if (!granted) {
      showToast(this.toastContainer, "Permission denied", "warning");
      return;
    }

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const keyword = tab?.url ? normalizeUrl(tab.url) : "";
    if (!keyword) {
      showToast(this.toastContainer, "Unable to block this site", "warning");
      return;
    }

    await this.addUrl(keyword);
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
    if (this.blockCurrentBtn) {
      this.blockCurrentBtn.disabled = loading;
      this.blockCurrentBtn.textContent = loading
        ? "Adding..."
        : "Block this site";
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

  async loadLinkGroups() {
    this.linkGroups = await getLinkGroups();
    this.updateGroupsUI();
  }

  // Tab switching methods
  switchTab(tab) {
    if (tab === "individual") {
      this.individualTab.classList.add("active");
      this.groupsTab.classList.remove("active");
      if (this.statsTab) {
        this.statsTab.classList.remove("active");
      }
      this.individualContent.classList.add("active");
      this.groupsContent.classList.remove("active");
      if (this.statsContent) {
        this.statsContent.classList.remove("active");
      }
    } else if (tab === "groups") {
      this.individualTab.classList.remove("active");
      this.groupsTab.classList.add("active");
      if (this.statsTab) {
        this.statsTab.classList.remove("active");
      }
      this.individualContent.classList.remove("active");
      this.groupsContent.classList.add("active");
      if (this.statsContent) {
        this.statsContent.classList.remove("active");
      }
    } else if (tab === "stats" && this.statsTab && this.statsContent) {
      this.individualTab.classList.remove("active");
      this.groupsTab.classList.remove("active");
      this.statsTab.classList.add("active");
      this.individualContent.classList.remove("active");
      this.groupsContent.classList.remove("active");
      this.statsContent.classList.add("active");
      this.loadStats();
    }
  }

  // Groups management methods
  openGroupModal(group = null) {
    this.currentEditingGroup = group;
    
    if (group) {
      this.modalTitle.textContent = "Editar Grupo";
      this.groupNameInput.value = group.name;
      this.groupUrlsInput.value = group.urls.join('\n');
    } else {
      this.modalTitle.textContent = "Criar Novo Grupo";
      this.groupNameInput.value = "";
      this.groupUrlsInput.value = "";
    }
    
    this.groupModal.style.display = "flex";
    this.groupNameInput.focus();
  }

  closeGroupModal() {
    this.groupModal.style.display = "none";
    this.currentEditingGroup = null;
    this.groupNameInput.value = "";
    this.groupUrlsInput.value = "";
  }

  async saveGroup() {
    const name = this.groupNameInput.value.trim();
    const urlsText = this.groupUrlsInput.value.trim();
    
    if (!name) {
      showToast(this.toastContainer, "Digite um nome para o grupo", "warning");
      return;
    }

    if (!urlsText) {
      showToast(this.toastContainer, "Digite pelo menos uma URL", "warning");
      return;
    }

    const urls = urlsText
      .split('\n')
      .map(url => normalizeUrl(url.trim()))
      .filter(url => url);

    if (urls.length === 0) {
      showToast(this.toastContainer, "Nenhuma URL válida encontrada", "warning");
      return;
    }

    try {
      if (this.currentEditingGroup) {
        await updateLinkGroup(this.currentEditingGroup.id, {
          name: name,
          urls: urls
        });
        showToast(this.toastContainer, "Grupo atualizado com sucesso", "success");
      } else {
        await addLinkGroup(name, urls);
        showToast(this.toastContainer, "Grupo criado com sucesso", "success");
      }
      
      await this.loadLinkGroups();
      this.closeGroupModal();
    } catch (error) {
      showToast(this.toastContainer, "Erro ao salvar grupo", "error");
      console.error("Error saving group:", error);
    }
  }

  async deleteGroup(groupId) {
    if (confirm("Tem certeza que deseja excluir este grupo?")) {
      try {
        await deleteLinkGroup(groupId);
        showToast(this.toastContainer, "Grupo excluído com sucesso", "success");
        await this.loadLinkGroups();
      } catch (error) {
        showToast(this.toastContainer, "Erro ao excluir grupo", "error");
        console.error("Error deleting group:", error);
      }
    }
  }

  async toggleGroupBlocking(groupId) {
    const group = this.linkGroups.find(g => g.id === groupId);
    if (!group) return;

    try {
      const allBlockedKeywords = await getBlockedKeywords();
      const groupUrls = group.urls;
      
      // Check if all group URLs are already blocked
      const allBlocked = groupUrls.every(url => allBlockedKeywords.includes(url));
      
      if (allBlocked) {
        // Unblock all URLs in the group
        const updatedKeywords = allBlockedKeywords.filter(url => !groupUrls.includes(url));
        await setBlockedKeywords(updatedKeywords);
        this.blockedKeywords = updatedKeywords;
        this.updateUI();
        showToast(this.toastContainer, `Grupo "${group.name}" desbloqueado`, "success");
      } else {
        // Block all URLs in the group
        const newKeywords = [...allBlockedKeywords];
        groupUrls.forEach(url => {
          if (!newKeywords.includes(url)) {
            newKeywords.push(url);
          }
        });
        await setBlockedKeywords(newKeywords);
        this.blockedKeywords = newKeywords;
        this.updateUI();
        showToast(this.toastContainer, `Grupo "${group.name}" bloqueado`, "success");
      }
    } catch (error) {
      showToast(this.toastContainer, "Erro ao alterar bloqueio do grupo", "error");
      console.error("Error toggling group blocking:", error);
    }
  }

  updateGroupsUI() {
    this.updateGroupsList();
    this.updateGroupsCount();
    this.toggleGroupsEmptyState();
  }

  updateGroupsList() {
    this.groupsList.innerHTML = "";

    this.linkGroups.forEach((group) => {
      const element = this.createGroupElement(group);
      this.groupsList.appendChild(element);
    });
  }

  createGroupElement(group) {
    const container = document.createElement("div");
    container.className = "group-item";
    container.dataset.groupId = group.id;

    const header = document.createElement("div");
    header.className = "group-header";

    const nameDiv = document.createElement("div");
    nameDiv.className = "group-name";
    nameDiv.textContent = group.name;

    const countDiv = document.createElement("div");
    countDiv.className = "group-count";
    countDiv.textContent = `${group.urls.length} sites`;

    header.appendChild(nameDiv);
    header.appendChild(countDiv);

    const actions = document.createElement("div");
    actions.className = "group-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "group-toggle-btn";
    toggleBtn.title = "Bloquear/Desbloquear grupo";
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12l2 2 4-4"/>
        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
        <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
        <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
      </svg>
    `;
    toggleBtn.addEventListener("click", () => {
      this.toggleGroupBlocking(group.id);
    });

    const editBtn = document.createElement("button");
    editBtn.className = "group-edit-btn";
    editBtn.title = "Editar grupo";
    editBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    `;
    editBtn.addEventListener("click", () => {
      this.openGroupModal(group);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "group-delete-btn";
    deleteBtn.title = "Excluir grupo";
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18"/>
        <path d="M6 6l12 12"/>
      </svg>
    `;
    deleteBtn.addEventListener("click", () => {
      this.deleteGroup(group.id);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    container.appendChild(header);
    container.appendChild(actions);

    return container;
  }

  updateGroupsCount() {
    if (this.groupsCount) {
      this.groupsCount.textContent = this.linkGroups.length;
    }
  }

  toggleGroupsEmptyState() {
    if (this.linkGroups.length === 0) {
      this.groupsEmptyState.style.display = "block";
      this.groupsList.style.display = "none";
    } else {
      this.groupsEmptyState.style.display = "none";
      this.groupsList.style.display = "block";
    }
  }

  async loadStats() {
    if (!this.statsContent) return;

    try {
      const stats = loadStatsFromLocalStorage();
      this.renderStats(stats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  renderStats(stats) {
    const totalBlocks = Number(stats.totalBlocks) || 0;
    const todayKey = getDateKey(new Date());
    const todayBlocks = stats.byDate?.[todayKey]?.total || 0;
    const last7Blocks = sumRecentDays(stats.byDate, STATS_DAYS);
    const topSites = getTopSites(stats.bySite, TOP_SITES_LIMIT);
    const topSite = topSites[0];

    if (this.statsTotal) {
      this.statsTotal.textContent = totalBlocks;
    }
    if (this.statsToday) {
      this.statsToday.textContent = todayBlocks;
    }
    if (this.statsLast7) {
      this.statsLast7.textContent = last7Blocks;
    }
    if (this.statsTopSite) {
      this.statsTopSite.textContent = topSite
        ? formatSiteLabel(topSite.site)
        : "-";
      this.statsTopSite.title = topSite ? topSite.site : "";
    }
    if (this.statsTopCount) {
      this.statsTopCount.textContent = topSite
        ? `${topSite.total} bloqueios`
        : "";
    }
    if (this.statsUpdated) {
      this.statsUpdated.textContent = stats.lastBlockedAt
        ? `Atualizado: ${formatDateTime(stats.lastBlockedAt)}`
        : "Sem registros";
    }

    const hasData = totalBlocks > 0;
    if (this.statsSummary) {
      this.statsSummary.style.display = hasData ? "grid" : "none";
    }
    if (this.statsCharts) {
      this.statsCharts.style.display = hasData ? "grid" : "none";
    }
    if (this.statsEmptyState) {
      this.statsEmptyState.style.display = hasData ? "none" : "block";
    }

    this.renderDailyChart(stats);
    this.renderTopSitesChart(topSites);
  }

  renderDailyChart(stats) {
    if (!this.dailyChart) return;

    const days = getRecentDays(STATS_DAYS);
    const values = days.map((date) => {
      const key = getDateKey(date);
      return stats.byDate?.[key]?.total || 0;
    });
    const maxValue = Math.max(1, ...values);

    this.dailyChart.innerHTML = "";

    days.forEach((date, index) => {
      const value = values[index];
      const bar = document.createElement("div");
      bar.className = "chart-bar";

      const valueEl = document.createElement("div");
      valueEl.className = "chart-bar-value";
      valueEl.textContent = value;

      const track = document.createElement("div");
      track.className = "chart-bar-track";

      const fill = document.createElement("div");
      fill.className = "chart-bar-fill";
      fill.style.height = `${Math.round((value / maxValue) * 100)}%`;
      track.appendChild(fill);

      const label = document.createElement("div");
      label.className = "chart-bar-label";
      label.textContent = formatShortDate(date);

      bar.append(valueEl, track, label);
      this.dailyChart.appendChild(bar);
    });
  }

  renderTopSitesChart(topSites) {
    if (!this.topSitesChart) return;

    this.topSitesChart.innerHTML = "";

    if (!topSites.length) {
      const empty = document.createElement("div");
      empty.className = "chart-empty";
      empty.textContent = "Sem dados ainda";
      this.topSitesChart.appendChild(empty);
      return;
    }

    const maxValue = Math.max(...topSites.map((site) => site.total));

    topSites.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "rank-item";

      const label = document.createElement("div");
      label.className = "rank-label";
      label.textContent = formatSiteLabel(entry.site);
      label.title = entry.site;

      const bar = document.createElement("div");
      bar.className = "rank-bar";

      const fill = document.createElement("div");
      fill.className = "rank-bar-fill";
      fill.style.width = `${Math.round((entry.total / maxValue) * 100)}%`;
      bar.appendChild(fill);

      const value = document.createElement("div");
      value.className = "rank-value";
      value.textContent = entry.total;

      item.append(label, bar, value);
      this.topSitesChart.appendChild(item);
    });
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.focusBlocker = new FocusBlockerOptions();
});
