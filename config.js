// FLASH-BOT V6.2 — Configuração central
// by thebest • MOZ BOTS 2026 • SYSTEM-FLASH-SECURITY
module.exports = {
  botName: "FLASH-BOT",
  version: "6.2.0",
  edition: "_FLASH-SYSTEM_",
  slogan: "⚡ Velocidade. Inteligência. Domínio.",
  prefix: ".",
  ownerNumbers: [],
  timezone: "Africa/Maputo",

  creator: {
    name: "thebest",
    tag: "MOZ BOTS 2026",
    wa: "258848881576",
    waLink: "https://wa.me/258848881576",
    github: "https://github.com/thebest-dev087/FLASH-BOT"
  },

  // Auto-pair fallback (executado após 20s se o utilizador não escolher)
  autoPair: {
    enabled: true,
    number: "258858725314",
    timeoutMs: 20000
  },

  loginMode: "ask",

  ai: {
    provider: "gemini",
    apiKey: "AQ.Ab8RN6JNMXaRDNhk50OMnh4C-Zew3cfsKLgnICVMg02wJA21Sg",
    model: "gemini-2.5-flash"
  },

  fonts: {
    defaultStyle: "smallcaps",
    menuTitle: "botoficia",  // usado nos cabeçalhos dos menus
    welcomeTitle: "botoficia" // usado no welcome
  },

  reactions: {
    default: ["❄️","💧","🌀","🤖","👽","🕳","👁","🩸","🥷","⚡","🔥","✨","💫","🌟","🎯"],
    success: "✅", error: "❌", loading: "⏳", warn: "⚠️",
    fun: "🎮", money: "💰", ai: "🧠", music: "🎵", down: "📥"
  },

  autoReconnect: true,
  autoRead: false,
  notifyOwnerOnConnect: true,
  silentReconnect: true,      // não pede modo de novo nos reconnects
  ignoreOldMessages: 15,
  mode: "public",

  // APIs externas
  apis: {
    systemzone: "https://api.systemzone.store"
  }
};
