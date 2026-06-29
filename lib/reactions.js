// lib/reactions.js — sistema de reactions a cada comando
const db = require("./db");
const config = require("../config");

const SPECIFIC = {
  ping: "⚡",
  ia: "🧠", google: "🔍", gimg: "🖼️",
  ytmp3: "🎵", ytmp4: "🎬", play: "🎵", tts: "🔊",
  ban: "👋", kick: "👋", promover: "👑", rebaixar: "⬇️",
  jdv: "🎮", jogodavelha: "🎮", jogar: "🎮", adivinha: "🎯", ppt: "✊", roleta: "🎲", dado: "🎲",
  tabela: "💎", compra: "🛒", confirmar: "✅", vendas: "💰",
  gencode: "🔑", resgatar: "🔓", unblockcode: "🆘",
  anti: "🛡️", antilink: "🛡️", antisticker: "🛡️", antiaudio: "🛡️", antivideo: "🛡️",
  menu: "📋", menuadm: "📋", menudono: "👑", menuvendas: "💎", menuia: "🧠", menujogos: "🎮",
  dono: "👑", serdono: "👑", salvar: "💾", lid: "🆔",
  sticker: "🎨", fix: "📌", desafix: "📌"
};

let rotIdx = 0;
function defaultEmoji() {
  const arr = db.settings.defaultReact || config.reactions.default;
  const e = arr[rotIdx % arr.length];
  rotIdx++;
  return e;
}

async function react(sock, m, cmd) {
  try {
    const emoji = SPECIFIC[cmd] || defaultEmoji();
    await sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });
  } catch {}
}

async function reactCustom(sock, m, emoji) {
  try { await sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } }); } catch {}
}

module.exports = { react, reactCustom, defaultEmoji, SPECIFIC };
