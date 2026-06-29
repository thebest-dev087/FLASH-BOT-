// lib/sales.js — vendas V6.2: tabela editável, mpesa/emola config, auto-replies
const db = require("./db");
const moment = require("moment-timezone");
const fonts = require("./fonts");

// Tabela default (editável via comandos)
const DEFAULT_TABLE = [
  { id:"512",   name:"512 MB diário",  price: 10,  cat:"diario" },
  { id:"1024",  name:"1 GB diário",    price: 15,  cat:"diario" },
  { id:"2048",  name:"2 GB diário",    price: 25,  cat:"diario" },
  { id:"5120",  name:"5 GB diário",    price: 50,  cat:"diario" },
  { id:"10240", name:"10 GB diário",   price: 100, cat:"diario" },
  { id:"2gbsem", name:"2 GB semanal",  price: 60,  cat:"semanal" },
  { id:"5gbsem", name:"5 GB semanal",  price: 130, cat:"semanal" },
  { id:"10gbsem",name:"10 GB semanal", price: 250, cat:"semanal" },
  { id:"5gbmes", name:"5 GB mensal",   price: 180, cat:"mensal" },
  { id:"10gbmes",name:"10 GB mensal",  price: 320, cat:"mensal" },
  { id:"20gbmes",name:"20 GB mensal",  price: 550, cat:"mensal" },
  { id:"vpn30", name:"VPN 30 dias",    price: 100, cat:"vpn" },
  { id:"vpn90", name:"VPN 90 dias",    price: 250, cat:"vpn" }
];

function ensure() {
  db.salesConfig = db.salesConfig || {
    mpesa: { number:"", name:"" },
    emola: { number:"", name:"" },
    table: JSON.parse(JSON.stringify(DEFAULT_TABLE)),
    autoReplyEnabled: true
  };
  if (!Array.isArray(db.salesConfig.table)) db.salesConfig.table = JSON.parse(JSON.stringify(DEFAULT_TABLE));
  return db.salesConfig;
}

function getTable() { return ensure().table; }

function setMpesa(number, name) {
  const s = ensure();
  s.mpesa = { number: String(number).trim(), name: String(name||"").trim() };
  db.save();
  return s.mpesa;
}
function setEmola(number, name) {
  const s = ensure();
  s.emola = { number: String(number).trim(), name: String(name||"").trim() };
  db.save();
  return s.emola;
}

function addItem(name, price, cat="custom") {
  const s = ensure();
  const id = String(name).toLowerCase().replace(/\s+/g,"-").slice(0,20);
  const item = { id, name, price: Number(price), cat };
  s.table.push(item);
  db.save();
  return item;
}
function removeItem(id) {
  const s = ensure();
  const i = s.table.findIndex(x => x.id === id || x.name.toLowerCase() === id.toLowerCase());
  if (i < 0) return null;
  const [it] = s.table.splice(i,1);
  db.save();
  return it;
}
function findPackage(q) {
  const s = ensure();
  q = String(q||"").trim().toLowerCase();
  return s.table.find(x => x.id === q || x.name.toLowerCase().includes(q));
}
function findByPrice(value) {
  const s = ensure();
  return s.table.find(x => Math.abs(x.price - value) < 0.01);
}

// Render bonito da tabela
function renderTable() {
  const s = ensure();
  const groups = {};
  for (const it of s.table) (groups[it.cat] = groups[it.cat] || []).push(it);
  let out = `╭━━〔 ⚡ ${fonts.apply("Tabela de preços", "botoficia")} 〕━━╮\n`;
  for (const [cat, items] of Object.entries(groups)) {
    out += `\n┌─〔 ${fonts.apply(cat.toUpperCase(), "bold")} 〕\n`;
    for (const it of items) out += `│ ▸ \`${it.id}\` — *${it.name}* — \`${it.price} MT\`\n`;
    out += `└──────\n`;
  }
  out += `\n💳 *M-Pesa:* \`${s.mpesa.number || "—"}\` ${s.mpesa.name ? "("+s.mpesa.name+")" : ""}`;
  out += `\n💳 *eMola:* \`${s.emola.number || "—"}\` ${s.emola.name ? "("+s.emola.name+")" : ""}`;
  out += `\n\n> ${fonts.apply("Para comprar:","italic")} \`.compra <id|nome>\``;
  out += `\n╰━━━━━━━━━━━━━━━━╯`;
  return out;
}

// Compra — funciona sempre, mesmo com pacote desconhecido
function order(user, query) {
  const s = ensure();
  let pkg = findPackage(query);
  if (!pkg) {
    // Aceita formato livre tipo "400mb", "2gb", "vpn 1 mês"
    pkg = { id: "custom-" + Date.now(), name: query.trim(), price: null, cat: "custom" };
  }
  const id = "ORD-" + Date.now().toString(36).toUpperCase();
  const rec = {
    id, user, pkg: pkg.name, price: pkg.price, status:"pending",
    at: Date.now()
  };
  db.sales.all = db.sales.all || [];
  db.sales.all.push(rec);
  db.save();
  return { order: rec, pkg, mpesa: s.mpesa, emola: s.emola };
}

function confirm(orderId, txId) {
  const rec = (db.sales.all||[]).find(x => x.id === orderId);
  if (!rec) return null;
  rec.status = "confirmed";
  rec.txId = txId || null;
  rec.confirmedAt = Date.now();
  db.save();
  return rec;
}

// Triggers de auto-resposta
const TRIGGERS = [
  /\bpre[çc]o\s*megas?\b/i,
  /\bquanto\s+(custa|sai|paga)/i,
  /\btem\s+(megas?|net|internet|gb|mb)\b/i,
  /\bpe[çc]o\s+(megas?|tabela|preco|preços)\b/i,
  /\bquero\s+(comprar|megas?|net|gb|mb)\b/i,
  /\bvende\s+(megas?|net)/i,
  /\b(tabela|preco|preços|precario)\b/i,
  /\b(mb|gb|tb)\b\s*\?/i,
  /\bcomprar\s+(net|megas?|internet)/i
];
function isSalesQuestion(text) {
  if (!text) return false;
  return TRIGGERS.some(re => re.test(text));
}

function todayStats() {
  const all = db.sales.all || [];
  const start = moment().tz("Africa/Maputo").startOf("day").valueOf();
  const today = all.filter(x => x.at >= start);
  const confirmed = today.filter(x => x.status === "confirmed");
  const total = confirmed.reduce((a,b)=>a + (b.price||0), 0);
  return { today: today.length, confirmed: confirmed.length, total };
}

module.exports = {
  ensure, getTable, setMpesa, setEmola, addItem, removeItem,
  findPackage, findByPrice, renderTable, order, confirm,
  isSalesQuestion, todayStats, DEFAULT_TABLE
};
