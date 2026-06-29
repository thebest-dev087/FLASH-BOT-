// lib/antis.js — sistemas anti com 3 níveis interactivos e mensagens bonitas
const db = require("./db");
const M = require("./messages");
const fonts = require("./fonts");
const perms = require("./permissions");

const LINK_RE = /(https?:\/\/|chat\.whatsapp\.com|wa\.me\/|t\.me\/|telegram\.me\/|\.com\b|\.net\b|\.org\b|\.xyz\b|\.io\b)/i;

const TYPES = ["link", "sticker", "audio", "video", "doc", "fake", "flood"];
// 1=apaga silenciosamente, 2=apaga+avisa(+ban após N), 3=apaga+bani

async function handle(sock, m) {
  if (!m.key.remoteJid?.endsWith("@g.us")) return false;
  const g = db.group(m.key.remoteJid);
  const sender = m.key.participant || m.participant;
  if (!sender) return false;

  // Dono e admins imunes
  if (perms.isOwner(sender) || perms.isOwner(m.key.participantLid)) return false;
  if (await perms.isGroupAdmin(sock, m.key.remoteJid, sender)) return false;

  const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || "").trim();
  const has = {
    link:    !!text && LINK_RE.test(text),
    sticker: !!m.message?.stickerMessage,
    audio:   !!m.message?.audioMessage,
    video:   !!m.message?.videoMessage,
    doc:     !!m.message?.documentMessage
  };

  for (const k of Object.keys(has)) {
    if (!has[k]) continue;
    const cfg = g["anti" + k];
    if (!cfg || cfg.lvl === "off" || cfg.lvl === 0) continue;
    return await act(sock, m, sender, k, cfg);
  }
  return false;
}

async function act(sock, m, sender, type, cfg) {
  const g = db.group(m.key.remoteJid);
  const lvl = cfg.lvl;
  const userTag = `@${sender.split("@")[0]}`;

  // Sempre apaga
  try { await sock.sendMessage(m.key.remoteJid, { delete: m.key }); } catch {}

  if (lvl === 1) return true; // silencioso

  if (lvl === 2) {
    g.warns[sender] = (g.warns[sender] || 0) + 1;
    db.save();
    const max = cfg.maxWarns || 3;
    if (g.warns[sender] >= max) {
      try { await sock.groupParticipantsUpdate(m.key.remoteJid, [sender], "remove"); } catch {}
      const banMsg = M.box("🚫 ANTI-" + type.toUpperCase(),
        `${userTag} ${M.styled("foi banido(a) por atingir o limite de avisos.")}\n\n` +
        `${fonts.apply("Tipo:", "smallcaps")} *${type}*\n` +
        `${fonts.apply("Avisos:", "smallcaps")} *${max}/${max}*\n` +
        `${fonts.apply("Acção:", "smallcaps")} *BAN*\n` +
        `${fonts.apply("Motivo:", "smallcaps")} violação repetida das regras do grupo.`,
        "ANTI");
      g.warns[sender] = 0; db.save();
      await sock.sendMessage(m.key.remoteJid, { text: banMsg, mentions: [sender] });
      return true;
    }
    const warnMsg = M.box("⚠ ANTI-" + type.toUpperCase(),
      `${userTag} ${M.styled("recebeu um aviso.")}\n\n` +
      `${fonts.apply("Tipo:", "smallcaps")} *${type}*\n` +
      `${fonts.apply("Avisos:", "smallcaps")} *${g.warns[sender]}/${max}*\n` +
      `${fonts.apply("Acção:", "smallcaps")} mensagem apagada\n` +
      `${fonts.apply("Cuidado:", "smallcaps")} ao atingir *${max}* será banido(a).`,
      "ANTI");
    await sock.sendMessage(m.key.remoteJid, { text: warnMsg, mentions: [sender] });
    return true;
  }

  if (lvl === 3) {
    try { await sock.groupParticipantsUpdate(m.key.remoteJid, [sender], "remove"); } catch {}
    const banMsg = M.box("🚫 ANTI-" + type.toUpperCase(),
      `${userTag} ${M.styled("foi BANIDO(A) imediatamente.")}\n\n` +
      `${fonts.apply("Tipo:", "smallcaps")} *${type}*\n` +
      `${fonts.apply("Acção:", "smallcaps")} *APAGAR + BAN*\n` +
      `${fonts.apply("Motivo:", "smallcaps")} violação das regras do grupo (${type} não permitido).`,
      "ANTI");
    await sock.sendMessage(m.key.remoteJid, { text: banMsg, mentions: [sender] });
    return true;
  }
  return false;
}

function describe(type, cfg) {
  const lvl = cfg?.lvl || "off";
  const max = cfg?.maxWarns || 3;
  const txt = {
    off: "❌ Desligado",
    1: "1️⃣ Apaga em silêncio",
    2: `2️⃣ Apaga + avisa (ban após ${max} avisos)`,
    3: "3️⃣ Apaga + bani imediatamente"
  };
  return txt[lvl] || "?";
}

function guideMessage(type) {
  return M.box("🛡️ ANTI-" + type.toUpperCase(),
    `${M.styled("Sistema anti-" + type + " — escolhe o nível:")}\n\n` +
    `*1️⃣* ${M.styled("Apaga em silêncio")} — apenas remove a mensagem\n\n` +
    `*2️⃣* ${M.styled("Apaga + avisa")} — apaga e avisa o utilizador.\n` +
    `   ${M.styled("Após X avisos, é banido.")}\n` +
    `   ${M.styled("(vou perguntar quantos avisos.)")}\n\n` +
    `*3️⃣* ${M.styled("Apaga + bani")} — apaga e bani imediatamente.\n\n` +
    `${M.styled("Para escolher, responde com")} *1*, *2* ${M.styled("ou")} *3*.\n` +
    `${M.styled("Para desligar:")} \`.anti${type} off\``,
    "ANTI");
}

module.exports = { handle, describe, guideMessage, TYPES };
