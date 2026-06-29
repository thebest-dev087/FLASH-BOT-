// lib/db.js — persistência JSON simples e atómica
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "database");
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const files = {
  users:     path.join(DIR, "users.json"),
  groups:    path.join(DIR, "groups.json"),
  owner:     path.join(DIR, "owner.json"),
  projects:  path.join(DIR, "projects.json"),
  knowledge: path.join(DIR, "knowledge.json"),
  autocmds:  path.join(DIR, "autocmds.json"),
  settings:  path.join(DIR, "settings.json"),
  stats:     path.join(DIR, "stats.json"),
  sales:     path.join(DIR, "sales.json"),
  rental:    path.join(DIR, "rental.json"),
  pending:   path.join(DIR, "pending.json")
};

function load(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch { return fallback; }
}
function save(file, data) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

const db = {
  users:     load(files.users, {}),
  groups:    load(files.groups, {}),
  owner:     load(files.owner, { lid: null, jid: null, claimed: false, name: null, claimedAt: null, sub: [] }),
  projects:  load(files.projects, { list: [], nextId: 1, drafts: {} }),
  knowledge: load(files.knowledge, {}),
  autocmds:  load(files.autocmds, {}),
  settings:  load(files.settings, {
    prefix: ".",
    font: "smallcaps",
    welcome: "🎉 Bem-vindo(a) ao grupo, @user! Lê as regras e diverte-te. ⚡",
    welcomePhoto: null,
    welcomeEnabled: true,
    menuPhoto: null,
    notifications: 0,
    defaultReact: ["❄️","💧","🌀","🤖","👽","🕳","👁","🩸","🥷","⚡"],
    interactAI: false
  }),
  stats:     load(files.stats, { commands: 0, messages: 0, perUser: {} }),
  sales:     load(files.sales, { all: [], daily: {}, nextId: 1 }),
  rental:    load(files.rental, { codes: {}, blockedGroups: {}, failures: {}, unlock: {} }),
  pending:   load(files.pending, {}), // estados de wizard por jid

  user(jid) {
    if (!this.users[jid]) {
      this.users[jid] = {
        jid, name: null, lid: null, xp: 0, level: 1, balance: 0,
        warns: 0, muted: false, cmdsUsed: 0, msgs: 0, firstSeen: Date.now(),
        limits: {} // audio: N/min, sticker: N/min, link: N/min
      };
    }
    return this.users[jid];
  },
  group(jid) {
    if (!this.groups[jid]) {
      this.groups[jid] = {
        jid, welcome: true,
        antilink: { lvl: "off", maxWarns: 3 },
        antisticker: { lvl: "off", maxWarns: 3 },
        antiaudio: { lvl: "off", maxWarns: 3 },
        antivideo: { lvl: "off", maxWarns: 3 },
        antidoc: { lvl: "off", maxWarns: 3 },
        antifake: { lvl: "off", maxWarns: 3 },
        antiflood: { lvl: "off", maxWarns: 3 },
        limits: {},
        muted: [], warns: {}, pinned: null,
        agenda: { open: null, close: null }
      };
    }
    return this.groups[jid];
  },

  save() {
    save(files.users, this.users);
    save(files.groups, this.groups);
    save(files.owner, this.owner);
    save(files.projects, this.projects);
    save(files.knowledge, this.knowledge);
    save(files.autocmds, this.autocmds);
    save(files.settings, this.settings);
    save(files.stats, this.stats);
    save(files.sales, this.sales);
    save(files.rental, this.rental);
    save(files.pending, this.pending);
  }
};

setInterval(() => { try { db.save(); } catch {} }, 30_000);

module.exports = db;
