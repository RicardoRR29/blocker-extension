class BlockedPage {
  constructor() {
    this.motivationalQuotes = [
      "O foco é a chave para transformar sonhos em realidade.",
      "Cada distração evitada é um passo em direção ao sucesso.",
      "A disciplina é a ponte entre objetivos e conquistas.",
      "Sua atenção é seu recurso mais valioso. Use-a com sabedoria.",
      "Grandes coisas nunca vêm de zonas de conforto digital.",
      "O progresso acontece quando você escolhe o importante sobre o urgente.",
      "Foco não é sobre fazer mais coisas, é sobre fazer as coisas certas.",
      "A produtividade não é sobre tempo, é sobre atenção.",
      "Cada 'não' para uma distração é um 'sim' para seus objetivos.",
      "Sua força de vontade cresce cada vez que você resiste à tentação.",
    ];

    this.init();
  }

  init() {
    this.displayBlockedSite();
    this.displayRandomQuote();
    this.updateStats();
    this.startStatsAnimation();
  }

  displayBlockedSite() {
    const blockedSiteElement = document.getElementById("blockedSite");

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const blockedSite =
        urlParams.get("site") ||
        window.location.hostname ||
        "site-bloqueado.com";
      blockedSiteElement.textContent = blockedSite;
    } catch (error) {
      blockedSiteElement.textContent = "site-bloqueado.com";
    }
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
      console.error("Erro ao atualizar estatísticas:", error);
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

// Funções globais para os botões
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
    console.error("Não foi possível abrir as configurações:", error);
    alert(
      "Para acessar as configurações, clique no ícone da extensão na barra de ferramentas."
    );
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  new BlockedPage();
});
