const browser = window.browser || window.chrome;
const STATS_KEY = "blockedStats";
const STATS_VERSION = 2;
const TASKS_KEY = "blockedTasks";
const MAX_TASKS = 100;
const DEFAULT_TAG_COLOR = "#2563eb";
const TAG_COLOR_OPTIONS = [
  "#2563eb",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#7c3aed",
];

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function saveStatsToLocalStorage(stats) {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn("Error saving stats to localStorage:", error);
  }
}

function normalizeTagName(rawName) {
  return typeof rawName === "string" ? rawName.trim().slice(0, 30) : "";
}

function normalizeTagColor(rawColor) {
  if (typeof rawColor !== "string") {
    return DEFAULT_TAG_COLOR;
  }
  const value = rawColor.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(value) ? value : DEFAULT_TAG_COLOR;
}

function buildTagId(name, color) {
  return `${name.toLowerCase()}::${color.toLowerCase()}`;
}

function normalizeTaskTags(rawTags) {
  if (!Array.isArray(rawTags)) {
    return [];
  }

  const uniqueTags = new Map();

  rawTags.forEach((rawTag) => {
    if (!rawTag || typeof rawTag !== "object") {
      return;
    }

    const name = normalizeTagName(rawTag.name);
    if (!name) {
      return;
    }
    const color = normalizeTagColor(rawTag.color);
    const id =
      typeof rawTag.id === "string" && rawTag.id
        ? rawTag.id
        : buildTagId(name, color);

    if (!uniqueTags.has(id)) {
      uniqueTags.set(id, { id, name, color });
    }
  });

  return Array.from(uniqueTags.values()).slice(0, 15);
}

function normalizeTasks(rawTasks) {
  if (!Array.isArray(rawTasks)) {
    return [];
  }

  return rawTasks
    .map((task) => {
      if (!task || typeof task !== "object") {
        return null;
      }

      const name =
        typeof task.name === "string" ? task.name.trim().slice(0, 100) : "";
      const description =
        typeof task.description === "string"
          ? task.description.trim().slice(0, 300)
          : "";
      const link =
        typeof task.link === "string" ? task.link.trim().slice(0, 500) : "";
      const id =
        typeof task.id === "string" && task.id
          ? task.id
          : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
      const createdAt =
        typeof task.createdAt === "string"
          ? task.createdAt
          : new Date().toISOString();
      const tags = normalizeTaskTags(task.tags);

      if (!name || !description) {
        return null;
      }

      return { id, name, description, link, createdAt, tags };
    })
    .filter(Boolean)
    .slice(0, MAX_TASKS);
}

function loadTasksFromLocalStorage() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      return [];
    }
    return normalizeTasks(JSON.parse(raw));
  } catch (error) {
    console.warn("Error reading tasks from localStorage:", error);
    return [];
  }
}

function saveTasksToLocalStorage(tasks) {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(normalizeTasks(tasks)));
  } catch (error) {
    console.warn("Error saving tasks to localStorage:", error);
  }
}

function getTopSite(bySite) {
  if (!bySite || typeof bySite !== "object") {
    return null;
  }

  const entries = Object.entries(bySite)
    .map(([site, data]) => ({
      site,
      total: data && typeof data === "object" ? Number(data.total) || 0 : 0,
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);

  return entries.length ? entries[0] : null;
}

function getBlockedSite() {
  const params = new URLSearchParams(window.location.search);
  const blockedParam = params.get("blocked");
  if (blockedParam) {
    return blockedParam.trim().toLowerCase();
  }

  if (document.referrer) {
    try {
      return new URL(document.referrer).hostname.toLowerCase();
    } catch (error) {
      console.warn("Unable to parse referrer URL:", error);
    }
  }

  return null;
}

async function recordBlock() {
  const blockedSite = getBlockedSite();
  const now = new Date();
  const dateKey = getDateKey(now);

  const stats = loadStatsFromLocalStorage();

  stats.totalBlocks += 1;
  stats.lastBlockedAt = now.toISOString();

  if (!stats.byDate[dateKey]) {
    stats.byDate[dateKey] = { total: 0, sites: {} };
  }
  stats.byDate[dateKey].total += 1;

  if (blockedSite) {
    if (
      !stats.byDate[dateKey].sites ||
      typeof stats.byDate[dateKey].sites !== "object"
    ) {
      stats.byDate[dateKey].sites = {};
    }
    stats.byDate[dateKey].sites[blockedSite] =
      (stats.byDate[dateKey].sites[blockedSite] || 0) + 1;

    if (!stats.bySite || typeof stats.bySite !== "object") {
      stats.bySite = {};
    }
    if (!stats.bySite[blockedSite]) {
      stats.bySite[blockedSite] = { total: 0, lastBlockedAt: null };
    }
    stats.bySite[blockedSite].total += 1;
    stats.bySite[blockedSite].lastBlockedAt = now.toISOString();
  }

  saveStatsToLocalStorage(stats);
  return stats;
}

// Lista de versículos bíblicos
const motivationalQuotes = [
  'Ephesians 2:8-9 — "For by grace you have been saved through faith, and this is not from yourselves, it is the gift of God; not by works, so that no one can boast."',
  'John 3:16 — "For God so loved the world that He gave His one and only Son, that whoever believes in Him shall not perish but have eternal life."',
  'Romans 3:23-24 — "For all have sinned and fall short of the glory of God, and all are justified freely by His grace through the redemption that is in Christ Jesus."',
  'Romans 6:23 — "For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord."',
  'Romans 5:8 — "But God demonstrates His own love for us in this: while we were still sinners, Christ died for us."',
  'Romans 10:9-10 — "If you confess with your mouth that Jesus is Lord, and believe in your heart that God raised Him from the dead, you will be saved."',
  'Acts 4:12 — "Salvation is found in no one else, for there is no other name under heaven given to mankind by which we must be saved."',
  '2 Corinthians 5:17 — "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come!"',
  '2 Corinthians 5:21 — "God made Him who had no sin to be sin for us, so that in Him we might become the righteousness of God."',
  '1 John 5:11-12 — "And this is the testimony: God has given us eternal life, and this life is in His Son. Whoever has the Son has life; whoever does not have the Son of God does not have life."',
  'John 14:6 — "I am the way and the truth and the life. No one comes to the Father except through Me."',
  'John 1:12 — "Yet to all who received Him, to those who believed in His name, He gave the right to become children of God."',
  'Revelation 3:20 — "Behold, I stand at the door and knock. If anyone hears My voice and opens the door, I will come in and dine with him, and he with Me."',
  'Matthew 11:28-30 — "Come to Me, all who are weary and burdened, and I will give you rest."',
  'Luke 19:10 — "For the Son of Man came to seek and to save the lost."',
  'Mark 1:15 — "The time is fulfilled, and the kingdom of God is at hand; repent and believe in the gospel."',
  'Acts 3:19 — "Repent therefore, and turn back, that your sins may be blotted out."',
  'Acts 16:31 — "Believe in the Lord Jesus, and you will be saved—you and your household."',
  '1 Peter 3:18 — "For Christ also suffered once for sins, the righteous for the unrighteous, that He might bring us to God."',
  'Romans 8:1 — "Therefore, there is now no condemnation for those who are in Christ Jesus."',
  'Galatians 2:20 — "I have been crucified with Christ and I no longer live, but Christ lives in me."',
  'Galatians 3:13 — "Christ redeemed us from the curse of the law by becoming a curse for us."',
  'Colossians 1:13-14 — "He has delivered us from the domain of darkness and transferred us to the kingdom of His beloved Son, in whom we have redemption, the forgiveness of sins."',
  'Hebrews 7:25 — "Therefore He is able to save completely those who come to God through Him, because He always lives to intercede for them."',
  'Hebrews 9:27-28 — "So Christ was sacrificed once to take away the sins of many; and He will appear a second time."',
  '1 Timothy 2:5-6 — "For there is one God and one Mediator between God and mankind, the man Christ Jesus, who gave Himself as a ransom for all."',
  '1 Timothy 1:15 — "Here is a trustworthy saying that deserves full acceptance: Christ Jesus came into the world to save sinners."',
  'James 4:8 — "Draw near to God and He will draw near to you."',
  '1 John 1:9 — "If we confess our sins, He is faithful and just and will forgive us our sins and purify us from all unrighteousness."',
  'John 11:25-26 — "I am the resurrection and the life. The one who believes in Me will live, even though they die."',
  'John 20:31 — "That you may believe that Jesus is the Christ, the Son of God, and that by believing you may have life in His name."',
  'John 6:35 — "I am the bread of life. Whoever comes to Me shall not hunger, and whoever believes in Me shall never thirst."',
  'John 10:9-11 — "I am the door. If anyone enters by Me, he will be saved. I am the good shepherd. The good shepherd lays down His life for the sheep."',
  'John 8:12 — "I am the light of the world. Whoever follows Me will never walk in darkness, but will have the light of life."',
  'John 7:38 — "Whoever believes in Me, as Scripture has said, rivers of living water will flow from within them."',
  'John 17:3 — "Now this is eternal life: that they know You, the only true God, and Jesus Christ, whom You have sent."',
  'Romans 1:16 — "For I am not ashamed of the gospel, because it is the power of God that brings salvation to everyone who believes."',
  'Romans 10:13 — "For everyone who calls on the name of the Lord will be saved."',
  '2 Corinthians 6:2 — "Behold, now is the favorable time; behold, now is the day of salvation."',
  'Psalm 51:10 — "Create in me a clean heart, O God, and renew a steadfast spirit within me."',
  'Isaiah 53:5-6 — "The punishment that brought us peace was on Him, and by His wounds we are healed."',
  'Isaiah 55:6-7 — "Seek the Lord while He may be found; call on Him while He is near."',
  'Jeremiah 29:13 — "You will seek Me and find Me when you seek Me with all your heart."',
  'Psalm 32:1-2 — "Blessed is the one whose transgressions are forgiven, whose sins are covered."',
  'Psalm 34:8 — "Taste and see that the Lord is good; blessed is the one who takes refuge in Him."',
  'Proverbs 3:5-6 — "Trust in the Lord with all your heart and lean not on your own understanding."',
  'Isaiah 1:18 — "Come now, let us settle the matter, says the Lord. Though your sins are like scarlet, they shall be as white as snow."',
  'Isaiah 43:25 — "I, even I, am He who blots out your transgressions, for My own sake."',
  'Isaiah 45:22 — "Turn to Me and be saved, all you ends of the earth; for I am God, and there is no other."',
  'Zephaniah 3:17 — "The Lord your God is with you, the Mighty Warrior who saves."',
  'Zechariah 1:3 — "Return to Me, says the Lord of Hosts, and I will return to you."',
  'Micah 7:18-19 — "Who is a God like You, who pardons iniquity and You will cast all their sins into the depths of the sea."',
  'Jonah 2:9 — "Salvation belongs to the Lord."',
  'Matthew 1:21 — "He will save His people from their sins."',
  'Matthew 4:17 — "Repent, for the kingdom of heaven is near."',
  'Matthew 5:16 — "Let your light shine before others, so that they may see your good works and give glory to your Father in heaven."',
  'Matthew 6:33 — "But seek first His kingdom and His righteousness."',
  'Matthew 7:7-8 — "Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you."',
  'Matthew 9:13 — "I desire mercy and not sacrifice. For I came not to call the righteous, but sinners."',
  'Matthew 20:28 — "The Son of Man did not come to be served, but to serve, and to give His life as a ransom for many."',
  'Matthew 28:19-20 — "Go therefore and make disciples of all nations."',
  'Mark 8:34-35 — "If anyone would come after Me, let him deny himself, take up his cross, and follow Me."',
  'Mark 10:45 — "For even the Son of Man came not to be served but to serve, and to give His life as a ransom for many."',
  'Luke 5:31-32 — "Those who are well have no need of a physician, but those who are sick. I have not come to call the righteous but sinners to repentance."',
  'Luke 13:3 — "Unless you repent, you will all likewise perish."',
  'Luke 23:43 — "Truly I tell you, today you will be with Me in paradise."',
  'Acts 1:8 — "But you will receive power when the Holy Spirit has come upon you, and you will be My witnesses."',
  'Acts 2:21 — "And everyone who calls on the name of the Lord will be saved."',
  'Acts 2:38 — "Repent and be baptized, every one of you, in the name of Jesus Christ for the forgiveness of your sins."',
  'Acts 10:43 — "All the prophets testify about Him that everyone who believes in Him receives forgiveness of sins through His name."',
  'Acts 13:38-39 — "Through Him forgiveness of sins is proclaimed to you."',
  'Acts 17:30-31 — "God now commands all people everywhere to repent."',
  '1 Corinthians 1:18 — "The message of the cross is foolishness to those who are perishing, but to us who are being saved it is the power of God."',
  '1 Corinthians 6:19-20 — "You were bought at a price. Therefore glorify God with your body."',
  '1 Corinthians 15:3-4 — "Christ died for our sins according to the Scriptures, was buried and was raised on the third day."',
  '2 Corinthians 4:6 — "For God, who said, Let light shine out of darkness, made His light shine in our hearts."',
  '2 Corinthians 5:14-15 — "He died for all, that those who live should no longer live for themselves."',
  '2 Corinthians 5:19-20 — "God was reconciling the world to Himself in Christ. We are therefore Christ\'s ambassadors, as though God were making His appeal through us."',
  'Galatians 3:26 — "So in Christ Jesus you are all children of God through faith."',
  'Galatians 6:14 — "May I never boast except in the cross of our Lord Jesus Christ."',
  'Ephesians 1:7 — "In Him we have redemption through His blood, the forgiveness of sins, in accordance with the riches of His grace."',
  'Ephesians 2:4-5 — "But God, being rich in mercy, because of His great love made us alive together with Christ."',
  'Ephesians 3:12 — "In Him and through faith in Him we may approach God with freedom and confidence."',
  'Philippians 3:8-9 — "That I may gain Christ and be found in Him, not having a righteousness of my own that comes from the law, but that which is through faith in Christ."',
  'Colossians 2:13-14 — "God made you alive with Christ. He forgave us all our sins, having canceled the charge of our legal indebtedness."',
  '1 Thessalonians 5:9-10 — "For God did not appoint us to suffer wrath but to receive salvation through our Lord Jesus Christ."',
  '2 Thessalonians 2:13-14 — "God chose you as firstfruits to be saved through the sanctifying work of the Spirit and through belief in the truth."',
  'Titus 2:11 — "For the grace of God has appeared that offers salvation to all people."',
  'Titus 3:4-7 — "He saved us, not because of righteous things we had done, but because of His mercy. He saved us through the washing of rebirth and renewal by the Holy Spirit."',
  'Hebrews 4:16 — "Let us then approach God\'s throne of grace with confidence, so that we may receive mercy."',
  'Hebrews 10:10 — "By that will, we have been made holy through the sacrifice of the body of Jesus Christ once for all."',
  'Hebrews 12:2 — "Fixing our eyes on Jesus, the author and perfecter of faith."',
  'Hebrews 12:28 — "Let us be thankful, and so worship God acceptably with reverence and awe."',
  '1 Peter 1:18-19 — "You were redeemed with the precious blood of Christ, a lamb without blemish or defect."',
  '1 Peter 2:24 — "He Himself bore our sins in His body on the cross."',
  '1 Peter 5:10 — "The God of all grace, who called you to His eternal glory in Christ will Himself restore you."',
  '2 Peter 3:9 — "The Lord is not slow in keeping His promise but is patient with you, not wanting anyone to perish."',
  '1 John 2:1-2 — "We have an Advocate with the Father—Jesus Christ, the Righteous One. He is the atoning sacrifice for our sins."',
  '1 John 4:9-10 — "This is how God showed His love among us: He sent His one and only Son into the world."',
  'Jude 1:24-25 — "To Him who is able to keep you from stumbling and to present you before His glorious presence without fault."',
  'Revelation 1:5 — "To Him who loves us and has freed us from our sins by His blood."',
  'Revelation 5:9 — "Because You were slain, and with Your blood You purchased for God persons from every tribe and language and people and nation."',
  'Revelation 21:6 — "I am the Alpha and the Omega. To the thirsty I will give water without cost from the spring of the water of life."',
  'Revelation 22:17 — "The Spirit and the bride say, Come! Let the one who is thirsty come; and let the one who wishes take the free gift of the water of life."'
];

// Função simples para mostrar versículo aleatório
function showRandomVerse() {
  const quoteElement = document.getElementById("motivationalText");
  if (!quoteElement) return;
  
  // Selecionar versículo aleatório
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  const randomQuote = motivationalQuotes[randomIndex];
  
  // Mostrar o versículo
  quoteElement.textContent = randomQuote;
}

// Executar imediatamente quando o script carregar
(function() {
  // Tentar executar imediatamente
  showRandomVerse();
  
  // Também executar quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    showRandomVerse();
    new BlockedPage();
  });
})();

class BlockedPage {
  constructor() {
    this.motivationalQuotes = motivationalQuotes || [];
    this.tasks = loadTasksFromLocalStorage();
    this.taskElements = {};
    this.draftTags = [];
    this.editingTaskId = null;
    this.pendingDeleteTaskId = null;
    this.activeTagFilterId = "all";
    this.nextTagColorIndex = 0;
    this.init();
  }

  init() {
    this.displayRandomQuote();
    this.initializeTaskList();
    this.updateStats();
  }

  displayRandomQuote() {
    showRandomVerse();
  }

  async updateStats() {
    try {
      const stats = await recordBlock();
      const todayKey = getDateKey(new Date());
      const todayStats = stats.byDate[todayKey] || { total: 0 };
      const topSite = getTopSite(stats.bySite);

      this.displayStats({
        blocksToday: todayStats.total || 0,
        totalBlocks: stats.totalBlocks || 0,
        topSite: topSite ? topSite.site : null,
        topSiteCount: topSite ? topSite.total : 0,
      });
    } catch (error) {
      console.error("Error updating statistics:", error);
      this.displayStats({
        blocksToday: 1,
        totalBlocks: 1,
        topSite: null,
        topSiteCount: 0,
      });
    }
    this.startStatsAnimation();
  }

  displayStats(stats) {
    const timeBlockedElement = document.getElementById("timeBlocked");
    const blocksTodayElement = document.getElementById("blocksToday");
    const topSiteElement = document.getElementById("topBlockedSite");
    const topCountElement = document.getElementById("topBlockedCount");

    if (timeBlockedElement) {
      timeBlockedElement.textContent = stats.totalBlocks;
    }

    if (blocksTodayElement) {
      blocksTodayElement.textContent = stats.blocksToday;
    }

    if (topSiteElement) {
      const topSiteText = stats.topSite ? stats.topSite : "Sem dados";
      topSiteElement.textContent = topSiteText;
      topSiteElement.title = stats.topSite ? stats.topSite : "";
    }

    if (topCountElement) {
      const topCount = Number(stats.topSiteCount) || 0;
      topCountElement.textContent = stats.topSite
        ? `Mais bloqueado (${topCount}x)`
        : "Mais bloqueado";
    }
  }

  startStatsAnimation() {
    const statNumbers = document.querySelectorAll(".stat-number");

    statNumbers.forEach((element) => {
      const finalValue = Number.parseInt(element.textContent, 10);
      if (Number.isNaN(finalValue)) {
        return;
      }
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

  initializeTaskList() {
    const form = document.getElementById("taskForm");
    const list = document.getElementById("taskList");
    const error = document.getElementById("taskFormError");
    const openModalButton = document.getElementById("openTaskModalBtn");
    const modalBackdrop = document.getElementById("taskModalBackdrop");
    const closeModalButton = document.getElementById("closeTaskModalBtn");
    const cancelModalButton = document.getElementById("cancelTaskModalBtn");
    const nameInput = document.getElementById("taskName");
    const descriptionInput = document.getElementById("taskDescription");
    const linkInput = document.getElementById("taskLink");
    const tagNameInput = document.getElementById("taskTagName");
    const tagColorInput = document.getElementById("taskTagColor");
    const addTagButton = document.getElementById("addTaskTagBtn");
    const selectedTagsContainer = document.getElementById("taskSelectedTags");
    const tagFiltersContainer = document.getElementById("taskTagFilters");
    const modalTitle = document.getElementById("taskModalTitle");
    const saveTaskButton = document.getElementById("taskSaveBtn");
    const deleteModalBackdrop = document.getElementById(
      "taskDeleteModalBackdrop"
    );
    const deleteModalDescription = document.getElementById(
      "taskDeleteModalDescription"
    );
    const confirmDeleteTaskButton =
      document.getElementById("confirmDeleteTaskBtn");
    const cancelDeleteTaskButton = document.getElementById("cancelDeleteTaskBtn");

    if (
      !form ||
      !list ||
      !error ||
      !openModalButton ||
      !modalBackdrop ||
      !closeModalButton ||
      !cancelModalButton ||
      !nameInput ||
      !descriptionInput ||
      !linkInput ||
      !tagNameInput ||
      !tagColorInput ||
      !addTagButton ||
      !selectedTagsContainer ||
      !tagFiltersContainer ||
      !modalTitle ||
      !saveTaskButton ||
      !deleteModalBackdrop ||
      !deleteModalDescription ||
      !confirmDeleteTaskButton ||
      !cancelDeleteTaskButton
    ) {
      return;
    }

    this.taskElements = {
      form,
      list,
      error,
      openModalButton,
      modalBackdrop,
      closeModalButton,
      cancelModalButton,
      nameInput,
      descriptionInput,
      linkInput,
      tagNameInput,
      tagColorInput,
      addTagButton,
      selectedTagsContainer,
      tagFiltersContainer,
      modalTitle,
      saveTaskButton,
      deleteModalBackdrop,
      deleteModalDescription,
      confirmDeleteTaskButton,
      cancelDeleteTaskButton,
    };

    form.addEventListener("submit", (event) => this.handleTaskSubmit(event));
    openModalButton.addEventListener("click", () => this.openTaskModal());
    closeModalButton.addEventListener("click", () => this.closeTaskModal());
    cancelModalButton.addEventListener("click", () => this.closeTaskModal());
    addTagButton.addEventListener("click", () => this.handleAddTagFromForm());
    tagNameInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      this.handleAddTagFromForm();
    });
    modalBackdrop.addEventListener("click", (event) => {
      if (event.target === modalBackdrop) {
        this.closeTaskModal();
      }
    });
    deleteModalBackdrop.addEventListener("click", (event) => {
      if (event.target === deleteModalBackdrop) {
        this.closeDeleteTaskModal();
      }
    });
    confirmDeleteTaskButton.addEventListener("click", () =>
      this.confirmDeleteTask()
    );
    cancelDeleteTaskButton.addEventListener("click", () =>
      this.closeDeleteTaskModal()
    );
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      if (this.isDeleteTaskModalOpen()) {
        this.closeDeleteTaskModal();
        return;
      }
      if (this.isTaskModalOpen()) {
        this.closeTaskModal();
      }
    });

    this.taskElements.tagColorInput.value =
      TAG_COLOR_OPTIONS[this.nextTagColorIndex % TAG_COLOR_OPTIONS.length];

    this.setModalMode("create");
    this.renderDraftTags();
    this.renderTasks();
  }

  setTaskFormError(message = "") {
    if (!this.taskElements.error) {
      return;
    }
    this.taskElements.error.textContent = message;
  }

  isTaskModalOpen() {
    return this.taskElements.modalBackdrop?.classList.contains("is-visible");
  }

  isDeleteTaskModalOpen() {
    return this.taskElements.deleteModalBackdrop?.classList.contains("is-visible");
  }

  syncModalBodyState() {
    const shouldLockBody = this.isTaskModalOpen() || this.isDeleteTaskModalOpen();
    document.body.classList.toggle("task-modal-open", shouldLockBody);
  }

  setModalMode(mode = "create") {
    const { modalTitle, saveTaskButton } = this.taskElements;
    const isEdit = mode === "edit";

    if (modalTitle) {
      modalTitle.textContent = isEdit ? "Editar task" : "Nova task";
    }
    if (saveTaskButton) {
      saveTaskButton.textContent = isEdit ? "Salvar alteracoes" : "Salvar task";
    }
  }

  openTaskModal(taskId = null) {
    const {
      form,
      modalBackdrop,
      nameInput,
      descriptionInput,
      linkInput,
      tagColorInput,
    } = this.taskElements;
    if (
      !form ||
      !modalBackdrop ||
      !nameInput ||
      !descriptionInput ||
      !linkInput ||
      !tagColorInput
    ) {
      return;
    }

    form.reset();
    this.setTaskFormError("");

    const taskToEdit =
      typeof taskId === "string" && taskId
        ? this.tasks.find((task) => task.id === taskId)
        : null;

    if (taskToEdit) {
      this.editingTaskId = taskToEdit.id;
      this.draftTags = normalizeTaskTags(taskToEdit.tags).map((tag) => ({
        ...tag,
      }));
      nameInput.value = taskToEdit.name || "";
      descriptionInput.value = taskToEdit.description || "";
      linkInput.value = taskToEdit.link || "";
      tagColorInput.value =
        this.draftTags.length > 0
          ? normalizeTagColor(this.draftTags[this.draftTags.length - 1].color)
          : DEFAULT_TAG_COLOR;
      this.setModalMode("edit");
    } else {
      this.editingTaskId = null;
      this.draftTags = [];
      tagColorInput.value =
        TAG_COLOR_OPTIONS[this.nextTagColorIndex % TAG_COLOR_OPTIONS.length];
      this.nextTagColorIndex += 1;
      this.setModalMode("create");
    }

    this.renderDraftTags();

    modalBackdrop.classList.add("is-visible");
    modalBackdrop.setAttribute("aria-hidden", "false");
    this.syncModalBodyState();
    nameInput.focus();
  }

  closeTaskModal() {
    const { modalBackdrop } = this.taskElements;
    if (!modalBackdrop) {
      return;
    }
    this.editingTaskId = null;
    this.setModalMode("create");
    modalBackdrop.classList.remove("is-visible");
    modalBackdrop.setAttribute("aria-hidden", "true");
    this.syncModalBodyState();
  }

  openDeleteTaskModal(taskId) {
    if (typeof taskId !== "string" || !taskId) {
      return;
    }

    const taskToRemove = this.tasks.find((task) => task.id === taskId);
    if (!taskToRemove) {
      return;
    }

    const {
      deleteModalBackdrop,
      deleteModalDescription,
      confirmDeleteTaskButton,
    } = this.taskElements;
    if (!deleteModalBackdrop || !deleteModalDescription || !confirmDeleteTaskButton) {
      return;
    }

    this.pendingDeleteTaskId = taskToRemove.id;
    deleteModalDescription.textContent = `Deseja remover a task "${taskToRemove.name}"?`;
    deleteModalBackdrop.classList.add("is-visible");
    deleteModalBackdrop.setAttribute("aria-hidden", "false");
    this.syncModalBodyState();
    confirmDeleteTaskButton.focus();
  }

  closeDeleteTaskModal() {
    const { deleteModalBackdrop, deleteModalDescription } = this.taskElements;
    if (!deleteModalBackdrop || !deleteModalDescription) {
      return;
    }

    this.pendingDeleteTaskId = null;
    deleteModalDescription.textContent = "Essa task sera removida permanentemente.";
    deleteModalBackdrop.classList.remove("is-visible");
    deleteModalBackdrop.setAttribute("aria-hidden", "true");
    this.syncModalBodyState();
  }

  normalizeTaskLink(rawLink) {
    const value = rawLink.trim();
    if (!value) {
      return "";
    }

    const candidates = [value, `https://${value}`];

    for (const candidate of candidates) {
      try {
        const parsed = new URL(candidate);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return parsed.href;
        }
      } catch {
        // Try next candidate.
      }
    }

    return null;
  }

  hexToRgba(hexColor, alpha) {
    const normalized = normalizeTagColor(hexColor);
    const red = Number.parseInt(normalized.slice(1, 3), 16);
    const green = Number.parseInt(normalized.slice(3, 5), 16);
    const blue = Number.parseInt(normalized.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  createTag(rawName, rawColor) {
    const name = normalizeTagName(rawName);
    if (!name) {
      return null;
    }
    const color = normalizeTagColor(rawColor);
    return {
      id: buildTagId(name, color),
      name,
      color,
    };
  }

  handleAddTagFromForm() {
    const { tagNameInput, tagColorInput } = this.taskElements;
    if (!tagNameInput || !tagColorInput) {
      return;
    }

    const newTag = this.createTag(tagNameInput.value, tagColorInput.value);
    if (!newTag) {
      this.setTaskFormError("Informe o nome da tag para adicionar.");
      return;
    }

    const alreadyExists = this.draftTags.some((tag) => tag.id === newTag.id);
    if (alreadyExists) {
      this.setTaskFormError("Essa tag ja foi adicionada.");
      tagNameInput.value = "";
      tagNameInput.focus();
      return;
    }

    this.draftTags = [...this.draftTags, newTag];
    this.setTaskFormError("");
    tagNameInput.value = "";
    tagNameInput.focus();
    this.renderDraftTags();
  }

  removeDraftTag(tagId) {
    this.draftTags = this.draftTags.filter((tag) => tag.id !== tagId);
    this.renderDraftTags();
  }

  createTagBadgeElement(tag, className) {
    const badge = document.createElement("span");
    badge.className = className;
    badge.textContent = tag.name;
    badge.style.borderColor = tag.color;
    badge.style.backgroundColor = this.hexToRgba(tag.color, 0.13);
    badge.style.color = tag.color;
    return badge;
  }

  getTaskActionIcon(type) {
    if (type === "edit") {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5z" />
        </svg>
      `;
    }

    if (type === "delete") {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 3h7v7" />
        <path d="M10 14 21 3" />
        <path d="M21 14v5a2 2 0 0 1-2 2h-5" />
        <path d="M10 21H5a2 2 0 0 1-2-2v-5" />
      </svg>
    `;
  }

  renderDraftTags() {
    const selectedTagsContainer = this.taskElements.selectedTagsContainer;
    if (!selectedTagsContainer) {
      return;
    }

    selectedTagsContainer.textContent = "";

    if (!this.draftTags.length) {
      const empty = document.createElement("p");
      empty.className = "task-tag-empty";
      empty.textContent = "Nenhuma tag adicionada.";
      selectedTagsContainer.appendChild(empty);
      return;
    }

    this.draftTags.forEach((tag) => {
      const chip = this.createTagBadgeElement(tag, "task-tag-chip");
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "task-tag-remove";
      removeButton.textContent = "x";
      removeButton.setAttribute("aria-label", `Remover tag ${tag.name}`);
      removeButton.addEventListener("click", () => this.removeDraftTag(tag.id));
      chip.appendChild(removeButton);
      selectedTagsContainer.appendChild(chip);
    });
  }

  getAllTagsFromTasks() {
    const allTags = new Map();
    this.tasks.forEach((task) => {
      if (!Array.isArray(task.tags)) {
        return;
      }
      task.tags.forEach((tag) => {
        if (!allTags.has(tag.id)) {
          allTags.set(tag.id, tag);
        }
      });
    });

    return Array.from(allTags.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }

  getFilteredTasks() {
    if (this.activeTagFilterId === "all") {
      return this.tasks;
    }

    return this.tasks.filter((task) =>
      Array.isArray(task.tags)
        ? task.tags.some((tag) => tag.id === this.activeTagFilterId)
        : false
    );
  }

  renderTagFilters() {
    const tagFiltersContainer = this.taskElements.tagFiltersContainer;
    if (!tagFiltersContainer) {
      return;
    }

    const availableTags = this.getAllTagsFromTasks();
    if (
      this.activeTagFilterId !== "all" &&
      !availableTags.some((tag) => tag.id === this.activeTagFilterId)
    ) {
      this.activeTagFilterId = "all";
    }

    tagFiltersContainer.textContent = "";

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className = `task-filter-chip${this.activeTagFilterId === "all" ? " is-active" : ""}`;
    allButton.textContent = "Todas";
    allButton.addEventListener("click", () => {
      this.activeTagFilterId = "all";
      this.renderTasks();
    });
    tagFiltersContainer.appendChild(allButton);

    availableTags.forEach((tag) => {
      const filterButton = document.createElement("button");
      filterButton.type = "button";
      filterButton.className = `task-filter-chip${this.activeTagFilterId === tag.id ? " is-active" : ""}`;
      filterButton.textContent = tag.name;
      filterButton.style.borderColor = tag.color;
      filterButton.style.color = tag.color;
      filterButton.style.backgroundColor = this.hexToRgba(
        tag.color,
        this.activeTagFilterId === tag.id ? 0.2 : 0.1
      );
      filterButton.addEventListener("click", () => {
        this.activeTagFilterId = tag.id;
        this.renderTasks();
      });
      tagFiltersContainer.appendChild(filterButton);
    });
  }

  handleTaskSubmit(event) {
    event.preventDefault();

    const { form, nameInput, descriptionInput, linkInput } = this.taskElements;
    if (!form || !nameInput || !descriptionInput || !linkInput) {
      return;
    }

    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    const rawLink = linkInput.value.trim();

    if (!name || !description) {
      this.setTaskFormError("Preencha nome e descricao da task.");
      return;
    }

    const link = this.normalizeTaskLink(rawLink);
    if (rawLink && !link) {
      this.setTaskFormError("Informe um link valido. Ex.: https://exemplo.com");
      return;
    }

    if (this.editingTaskId) {
      let updated = false;
      this.tasks = this.tasks.map((task) => {
        if (task.id !== this.editingTaskId) {
          return task;
        }

        updated = true;
        return {
          ...task,
          name,
          description,
          link,
          tags: [...this.draftTags],
        };
      });

      if (!updated) {
        this.setTaskFormError("Nao foi possivel encontrar a task para editar.");
        return;
      }
    } else {
      this.tasks = [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
          name,
          description,
          link,
          createdAt: new Date().toISOString(),
          tags: [...this.draftTags],
        },
        ...this.tasks,
      ].slice(0, MAX_TASKS);
    }

    saveTasksToLocalStorage(this.tasks);
    this.setTaskFormError("");
    this.renderTasks();
    this.closeTaskModal();
    form.reset();
    this.draftTags = [];
    this.renderDraftTags();
  }

  removeTask(taskId) {
    this.openDeleteTaskModal(taskId);
  }

  confirmDeleteTask() {
    const taskId = this.pendingDeleteTaskId;
    if (typeof taskId !== "string" || !taskId) {
      this.closeDeleteTaskModal();
      return;
    }

    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    saveTasksToLocalStorage(this.tasks);

    if (this.editingTaskId === taskId) {
      this.closeTaskModal();
    }

    this.closeDeleteTaskModal();
    this.renderTasks();
  }

  renderTasks() {
    const list = this.taskElements.list;
    if (!list) {
      return;
    }

    this.renderTagFilters();

    list.textContent = "";
    const filteredTasks = this.getFilteredTasks();

    if (!this.tasks.length || !filteredTasks.length) {
      const empty = document.createElement("p");
      empty.className = "task-empty";
      empty.textContent = this.tasks.length
        ? "Nenhuma task com a tag selecionada."
        : "Nenhuma task cadastrada ainda.";
      list.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    filteredTasks.forEach((task) => {
      const item = document.createElement("article");
      item.className = "task-item";

      const textContainer = document.createElement("div");
      textContainer.className = "task-text";

      const name = document.createElement("h3");
      name.className = "task-name";
      name.textContent = task.name;

      const description = document.createElement("p");
      description.className = "task-description";
      description.textContent = task.description;

      textContainer.appendChild(name);
      textContainer.appendChild(description);

      if (Array.isArray(task.tags) && task.tags.length) {
        const tagsContainer = document.createElement("div");
        tagsContainer.className = "task-tags";
        task.tags.forEach((tag) => {
          tagsContainer.appendChild(this.createTagBadgeElement(tag, "task-tag"));
        });
        textContainer.appendChild(tagsContainer);
      }

      const actionsContainer = document.createElement("div");
      actionsContainer.className = "task-item-actions";

      const editButton = document.createElement("button");
      
      const normalizedLink = this.normalizeTaskLink(task.link || "");
      if (normalizedLink) {
        const linkButton = document.createElement("a");
        linkButton.className = "btn task-icon-btn task-link";
        linkButton.href = normalizedLink;
        linkButton.target = "_blank";
        linkButton.rel = "noopener noreferrer";
        linkButton.setAttribute("aria-label", "Abrir link da task");
        linkButton.title = "Abrir link";
        linkButton.innerHTML = this.getTaskActionIcon("link");
        actionsContainer.appendChild(linkButton);
      }
      
      editButton.type = "button";
      editButton.className = "btn task-icon-btn task-edit";
      editButton.setAttribute("aria-label", "Editar task");
      editButton.title = "Editar";
      editButton.innerHTML = this.getTaskActionIcon("edit");
      editButton.addEventListener("click", () => this.openTaskModal(task.id));
      actionsContainer.appendChild(editButton);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn task-icon-btn task-delete";
      deleteButton.setAttribute("aria-label", "Remover task");
      deleteButton.title = "Remover";
      deleteButton.innerHTML = this.getTaskActionIcon("delete");
      deleteButton.addEventListener("click", () => this.removeTask(task.id));
      actionsContainer.appendChild(deleteButton);


      item.appendChild(textContainer);
      item.appendChild(actionsContainer);
      fragment.appendChild(item);
    });

    list.appendChild(fragment);
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
    browser.runtime.openOptionsPage();
  } catch (error) {
    console.error("Could not open settings:", error);
    alert("To access the settings, click the extension icon in the toolbar.");
  }
}

// Initialization is now handled in blocked.html
