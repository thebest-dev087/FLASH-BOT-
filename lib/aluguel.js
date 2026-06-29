// lib/aluguel.js — sistema de aluguel por código
const db = require("./db");
const M = require("./messages");

function genId(len = 10) {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = ""; for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * c.length)];
  return "FB-" + s;
}

function parseDuration(s) {
  const m = String(s).match(/^(\d+)([dhm])$/i);
  if (!m) return null;
  const n = parseInt(m[1]);
  const u = m[2].toLowerCase();
  return n * (u === "d" ? 86400e3 : u === "h" ? 3600e3 : 60e3);
}

function genCode(durationStr, uses = 1) {
  const ms = parseDuration(durationStr);
  if (!ms) return { error: "Duração inválida. Usa formato Nd / Nh / Nm (ex: 3d, 12h, 30m)." };
  const code = genId();
  db.rental.codes[code] = {
    code, createdAt: Date.now(), expiresAt: Date.now() + ms,
    maxUses: parseInt(uses) || 1, usedBy: [], duration: durationStr
  };
  db.save();
  return { code };
}

function redeem(code, groupJid) {
  const c = db.rental.codes[code];
  if (!c) return { error: "Código não existe." };
  if (c.expiresAt < Date.now()) return { error: "Código expirado." };
  if (c.usedBy.length >= c.maxUses) return { error: "Código já atingiu o número máximo de utilizadores." };
  if (c.usedBy.includes(groupJid)) return { error: "Este grupo já usou esse código." };
  c.usedBy.push(groupJid);
  // ativa o grupo
  const g = db.group(groupJid);
  g.rentalActive = true;
  g.rentalExpiresAt = Date.now() + (parseDuration(c.duration) || 86400e3);
  db.save();
  return { ok: true, group: g, code: c };
}

function recordFailure(groupJid) {
  if (!db.rental.failures[groupJid]) db.rental.failures[groupJid] = 0;
  db.rental.failures[groupJid]++;
  db.save();
  return db.rental.failures[groupJid];
}

function isBlocked(groupJid) {
  return !!db.rental.blockedGroups[groupJid];
}
function block(groupJid) {
  db.rental.blockedGroups[groupJid] = Date.now();
  db.save();
}
function unblock(groupJid) {
  delete db.rental.blockedGroups[groupJid];
  db.rental.failures[groupJid] = 0;
  db.save();
}

function genUnlock(groupJid) {
  const code = "UNL-" + genId(8).slice(3);
  db.rental.unlock[code] = { groupJid, createdAt: Date.now() };
  db.save();
  return code;
}

function useUnlock(code, groupJid) {
  const u = db.rental.unlock[code];
  if (!u) return { error: "Código de desbloqueio inválido." };
  if (u.groupJid !== groupJid) return { error: "Este código não pertence a este grupo." };
  unblock(groupJid);
  delete db.rental.unlock[code];
  db.save();
  return { ok: true };
}

function listCodes() {
  return Object.values(db.rental.codes);
}

function statusForGroup(groupJid) {
  const g = db.group(groupJid);
  const fails = db.rental.failures[groupJid] || 0;
  const blocked = isBlocked(groupJid);
  const active = !!g.rentalActive && (g.rentalExpiresAt || 0) > Date.now();
  return { fails, blocked, active, expiresAt: g.rentalExpiresAt };
}

module.exports = { genCode, redeem, recordFailure, isBlocked, block, unblock, genUnlock, useUnlock, listCodes, statusForGroup };
