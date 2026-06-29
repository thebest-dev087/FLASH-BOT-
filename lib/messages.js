// lib/messages.js — templates V6.2 (rodapé único, notificações elegantes)
const db = require("./db");
const fonts = require("./fonts");
const moment = require("moment-timezone");
const config = require("../config");

const TZ = "Africa/Maputo";
function now() { return moment().tz(TZ).format("DD/MM/YYYY HH:mm:ss"); }
function hour() { return moment().tz(TZ).hour(); }

function greet(name) {
  const h = hour();
  let g = h < 5 ? "🌙 Boa madrugada" : h < 12 ? "☀️ Bom dia" : h < 18 ? "🌤️ Boa tarde" : "🌃 Boa noite";
  return styled(`${g}, ${name}!`);
}
function styled(t, style) { return fonts.apply(t, style || db.settings.font || "smallcaps"); }

const FOOTERS = {
  SYSTEM:   "SYSTEM-FLASH-SECURITY",
  ASSIST:   "FLASH-ASSISTENT • MZ EDITION",
  SECURITY: "SYSTEM-FLASH-SECURITY",
  SALES:    "FLASH-VENDAS • thebest",
  GAMES:    "FLASH-GAMES",
  AI:       "FLASH-INTELLIGENCE",
  ANTI:     "FLASH-PROTECTION",
  OWNER:    "FLASH-OWNER-CONTROL",
  WELCOME:  "FLASH-WELCOME",
  BRAND:    "FLASH-BOT • MOZ BOTS 2026"
};

function notifBlock() {
  const n = db.settings.notifications || 0;
  if (n <= 0) return "";
  return `\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n🔔 ${styled("Notificações:")} *${n}* — ${styled("usa")} \`.notifs\``;
}

// Rodapé único (apenas uma linha de marca + opcional tag)
function box(title, body, footerKey = "ASSIST") {
  const ft = FOOTERS[footerKey] || footerKey;
  const head = `╭━━━〔 ⚡ ${fonts.apply(title, "botoficia")} 〕━━━╮`;
  const foot = `╰━〔 ${fonts.apply("> " + ft, "italic")} 〕━╯`;
  return `${head}\n${body}\n${foot}${notifBlock()}`;
}

function ok(title, msg, ft="ASSIST")   { return box("✓ " + title, msg, ft); }
function err(title, msg, ft="SECURITY"){ return box("✗ " + title, msg, ft); }
function info(title, msg, ft="ASSIST") { return box("ℹ " + title, msg, ft); }
function warn(title, msg, ft="SECURITY"){return box("⚠ " + title, msg, ft); }

function usage(cmd, correct, examples=[]) {
  let body = `${styled("Percebi o que querias fazer.")}\n\n${styled("Uso correcto:")}\n› \`${correct}\``;
  if (examples.length) body += `\n\n${styled("Exemplos:")}\n` + examples.map(e=>`• \`${e}\``).join("\n");
  body += `\n\n> ${styled("Dica: usa")} \`.menu\` ${styled("para veres tudo.")}`;
  return box("Como usar — " + cmd, body, "ASSIST");
}

function unknown(cmd, suggestion) {
  let body = `${styled("Comando não reconhecido.")}`;
  if (suggestion) body += `\n\n${styled("Talvez:")} \`.${suggestion}\``;
  body += `\n\n> ${styled("Tenta")} \`.menu\` ${styled("ou")} \`.sugestao <ideia>\``;
  return box("Comando desconhecido", body, "SECURITY");
}

// Notifica o dono no privado (silencioso para o utilizador)
async function notifyOwner(sock, text, tag="SYSTEM") {
  try {
    const owner = db.owner;
    if (!owner || !owner.claimed) {
      db.settings.notifications = (db.settings.notifications||0) + 1;
      db.pendingNotifs = db.pendingNotifs || [];
      db.pendingNotifs.push({ t: text, time: Date.now(), tag });
      return;
    }
    const jid = owner.jid;
    if (!jid) return;
    await sock.sendMessage(jid, { text: box("🔔 NOTIFICAÇÃO", text, tag) });
  } catch {}
}

module.exports = { box, ok, err, info, warn, usage, unknown, styled, greet, now, FOOTERS, notifyOwner };
