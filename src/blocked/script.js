const browser = window.browser || window.chrome;

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
    this.init();
  }

  init() {
    this.displayRandomQuote();
    this.updateStats();
    this.startStatsAnimation();
  }

  displayRandomQuote() {
    showRandomVerse();
  }

  async updateStats() {
    try {
      const today = new Date().toDateString();
      const result = await browser.storage.local.get(["blockedStats"]);
      const stats = result.blockedStats || {};

      if (!stats[today]) {
        stats[today] = { blocks: 0, timeBlocked: 0 };
      }

      stats[today].blocks += 1;
      stats[today].timeBlocked += Math.floor(Math.random() * 5) + 2;

      await browser.storage.local.set({ blockedStats: stats });
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
    browser.runtime.openOptionsPage();
  } catch (error) {
    console.error("Could not open settings:", error);
    alert("To access the settings, click the extension icon in the toolbar.");
  }
}

// Initialization is now handled in blocked.html