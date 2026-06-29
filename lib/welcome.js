// lib/welcome.js — boas-vindas com foto e mensagem rica
const fs = require("fs");
const path = require("path");
const db = require("./db");
const M = require("./messages");
const fonts = require("./fonts");
const moment = require("moment-timezone");
const config = require("../config");

function resolveVars(text, ctx) {
  const now = moment().tz(config.timezone);
  return text
    .replace(/@user/g, "@" + ctx.user.split("@")[0])
    .replace(/\{group\}/g, ctx.groupName || "este grupo")
    .replace(/\{count\}/g, ctx.count || "?")
    .replace(/\{bot\}/g, config.botName)
    .replace(/\{data\}/g, now.format("DD/MM/YYYY"))
    .replace(/\{hora\}/g, now.format("HH:mm"))
    .replace(/\{name\}/g, ctx.name || "amigo");
}

async function handle(sock, ev) {
  if (ev.action !== "add") return;
  const g = db.group(ev.id);
  if (!g.welcome) return;
  if (!db.settings.welcomeEnabled) return;

  let groupName = "grupo", count = "?";
  try {
    const md = await sock.groupMetadata(ev.id);
    groupName = md.subject;
    count = md.participants.length;
  } catch {}

  for (const p of ev.participants) {
    const pn = p.split("@")[0];
    const text = resolveVars(db.settings.welcome, {
      user: p, groupName, count, name: pn
    });

    let photoUrl = null;
    try { photoUrl = await sock.profilePictureUrl(p, "image"); } catch {}

    const body = M.box("👋 BEM-VINDO(A)",
      `${text}\n\n` +
      `${fonts.apply("Membro:", "smallcaps")} @${pn}\n` +
      `${fonts.apply("Grupo:", "smallcaps")} *${groupName}*\n` +
      `${fonts.apply("Membros:", "smallcaps")} *${count}*\n` +
      `${fonts.apply("Hora:", "smallcaps")} ${moment().tz(config.timezone).format("DD/MM/YYYY HH:mm")}`,
      "WELCOME");

    try {
      if (photoUrl) {
        await sock.sendMessage(ev.id, { image: { url: photoUrl }, caption: body, mentions: [p] });
      } else if (db.settings.welcomePhoto && fs.existsSync(db.settings.welcomePhoto)) {
        await sock.sendMessage(ev.id, { image: { url: db.settings.welcomePhoto }, caption: body, mentions: [p] });
      } else {
        const def = path.join(__dirname, "..", "media", "welcome.jpg");
        if (fs.existsSync(def)) {
          await sock.sendMessage(ev.id, { image: { url: def }, caption: body, mentions: [p] });
        } else {
          await sock.sendMessage(ev.id, { text: body, mentions: [p] });
        }
      }
    } catch (e) {
      await sock.sendMessage(ev.id, { text: body, mentions: [p] });
    }
  }
}

function statusMessage() {
  const en = db.settings.welcomeEnabled;
  const tx = db.settings.welcome;
  const ft = db.settings.welcomePhoto;
  return `🎉👋 *${fonts.apply("BOAS-VINDAS", "botoficia")}* 👋🎉

╭━━━〔 📊 *${fonts.apply("STATUS", "smallcaps")}* 〕━━━╮
┃ 📌 ${fonts.apply("ESTADO", "smallcaps")} ➜ ${en ? "✅ ATIVADO" : "❌ DESATIVADO"}
┃ 📸 ${fonts.apply("FOTO PADRÃO", "smallcaps")} ➜ ${ft ? "✅" : "❌"}
┃ 💾 ${fonts.apply("CACHE", "smallcaps")} ➜ 0 eventos
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📝 *${fonts.apply("MENSAGEM ATUAL", "smallcaps")}* 〕━━━╮
${tx.split("\n").map(l => "┃ " + l).join("\n")}
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📋 *${fonts.apply("COMANDOS", "smallcaps")}* 〕━━━╮
┃ 🔔 .bemvindo on/off
┃ ✍️ .bemvindo texto <msg>
┃ 🖼️ .bemvindo foto (responde foto)
┃ 🚫 .bemvindo semfoto
┃ 🧪 .bemvindo teste
┃ 🗑️ .bemvindo limpar (texto)
┃ 📊 .bemvindo status
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🔤 *${fonts.apply("VARIÁVEIS", "smallcaps")}* 〕━━━╮
┃ @user, {group}, {count}, {bot}
┃ {data}, {hora}, {name}
╰━━━━━━━━━━━━━━━━━━━━╯

🎉 *FLASH-BOT • WELCOME-SYSTEM* 👋`;
}

module.exports = { handle, resolveVars, statusMessage };
