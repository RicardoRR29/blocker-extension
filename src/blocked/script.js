class BlockedPage {
  constructor() {
    this.motivationalQuotes = window.motivationalQuotes || [];

    this.init();
  }

  init() {
    this.displayRandomQuote();
    this.updateStats();
    this.startStatsAnimation();
  }

  displayRandomQuote() {
    const quoteElement = document.getElementById("motivationalText");
    const randomQuote =
      this.motivationalQuotes[
        Math.floor(Math.random() * this.motivationalQuotes.length)
      ];
    quoteElement.textContent = `"${randomQuote}"`;
  }

  async updateStats() {
    try {
      const today = new Date().toDateString();
      const result = await window.chrome.storage.local.get(["blockedStats"]);
      const stats = result.blockedStats || {};

      if (!stats[today]) {
        stats[today] = { blocks: 0, timeBlocked: 0 };
      }

      stats[today].blocks += 1;
      stats[today].timeBlocked += Math.floor(Math.random() * 5) + 2;

      await window.chrome.storage.local.set({ blockedStats: stats });
      this.displayStats(stats[today]);
    } catch (error) {
      console.error("Error updating statistics:", error);
      this.displayStats({ blocks: 1, timeBlocked: 5 });
    }
  }

  displayStats(stats) {
    const timeBlockedElement = document.getElementById("timeBlocked");
    const blocksTodayElement = document.getElementById("blocksToday");

    if (timeBlockedElement && blocksTodayElement) {
      timeBlockedElement.textContent = stats.timeBlocked;
      blocksTodayElement.textContent = stats.blocks;
    }
  }

  startStatsAnimation() {
    const statNumbers = document.querySelectorAll(".stat-number");

    statNumbers.forEach((element) => {
      const finalValue = Number.parseInt(element.textContent);
      let currentValue = 0;
      const increment = Math.ceil(finalValue / 15);

      const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
          currentValue = finalValue;
          clearInterval(timer);
        }
        element.textContent = currentValue;
      }, 60);
    });
  }
}

// Global functions for buttons
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
}

function openSettings() {
  try {
    window.chrome.runtime.openOptionsPage();
  } catch (error) {
    console.error("Could not open settings:", error);
    alert("To access the settings, click the extension icon in the toolbar.");
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  new BlockedPage();
});
