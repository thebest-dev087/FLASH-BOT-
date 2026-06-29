// lib/permissions.js
const db = require("./db");

function normLid(x) {
  if (!x) return null;
  return String(x).split("@")[0].split(":")[0];
}

function isOwner(jidOrLid) {
  if (!jidOrLid) return false;
  if (!db.owner.claimed) return false;
  const id = normLid(jidOrLid);
  if (db.owner.lid && normLid(db.owner.lid) === id) return true;
  if (db.owner.jid && normLid(db.owner.jid) === id) return true;
  if (Array.isArray(db.owner.sub)) {
    for (const s of db.owner.sub) if (normLid(s) === id) return true;
  }
  return false;
}

function isSupremeOwner(jidOrLid) {
  if (!db.owner.claimed) return false;
  const id = normLid(jidOrLid);
  return (db.owner.lid && normLid(db.owner.lid) === id) ||
         (db.owner.jid && normLid(db.owner.jid) === id);
}

function claimOwner(jid, lid, name) {
  db.owner = {
    lid: lid || null,
    jid: jid || null,
    claimed: true,
    name: name || "Dono",
    claimedAt: Date.now(),
    sub: db.owner.sub || []
  };
  db.save();
  return db.owner;
}

async function isGroupAdmin(sock, chat, user) {
  try {
    const md = await sock.groupMetadata(chat);
    const p = md.participants.find(x => x.id === user);
    return !!(p && ["admin", "superadmin"].includes(p.admin));
  } catch { return false; }
}

async function isBotAdmin(sock, chat) {
  try {
    const md = await sock.groupMetadata(chat);
    const meId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const p = md.participants.find(x => x.id === meId);
    return !!(p && ["admin", "superadmin"].includes(p.admin));
  } catch { return false; }
}

module.exports = { isOwner, isSupremeOwner, claimOwner, isGroupAdmin, isBotAdmin, normLid };
