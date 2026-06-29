// FLASH-BOT V6.2 — index.js
// Auto-pair fallback 20s; silent reconnect; notifica dono no whatsapp configurado
const {
  default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion,
  DisconnectReason, Browsers, makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const qrcode = require("qrcode-terminal");
const chalk = require("chalk");

const config = require("./config");
const log = require("./lib/logger");
const db = require("./lib/db");
const M = require("./lib/messages");
const handler = require("./handler");

const SESSION_DIR = path.join(__dirname, "sessions");
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

let isReconnect = false;
let chosenMode = null;

function ask(q, timeoutMs=0) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let done = false;
    let t;
    if (timeoutMs > 0) {
      t = setTimeout(() => { if (!done){ done=true; try{rl.close();}catch{}; resolve(null);} }, timeoutMs);
    }
    rl.question(q, a => { if (done) return; done=true; if (t) clearTimeout(t); try{rl.close();}catch{}; resolve((a||"").trim()); });
  });
}
function cleanSession() {
  try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }); } catch {}
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

async function chooseLoginMode() {
  if (chosenMode) return chosenMode;
  if (config.loginMode === "pairing" || config.loginMode === "qr") {
    chosenMode = config.loginMode; return chosenMode;
  }
  log.box("⚡ ESCOLHA DE CONEXÃO", [
    chalk.cyan("  [1] ") + "Código de Pareamento  " + chalk.gray("(recomendado)"),
    chalk.cyan("  [2] ") + "QR Code               " + chalk.gray("(scaneia)"),
    "",
    chalk.gray("  ⏱  ") + "Sem escolha em 20s → auto-pair: " + chalk.yellowBright(config.autoPair.number)
  ]);
  const a = await ask(chalk.yellowBright("  → Escolha (1 ou 2): "), config.autoPair.timeoutMs);
  if (a == null) {
    log.warn("Sem resposta — iniciando auto-pair para " + config.autoPair.number);
    chosenMode = "pairing-auto";
    return chosenMode;
  }
  chosenMode = (a === "2" || a.toLowerCase() === "qr") ? "qr" : "pairing";
  return chosenMode;
}

async function start() {
  if (!isReconnect) log.banner();
  log.step(isReconnect ? "↻" : 1, isReconnect ? "Reconectando…" : "Inicializando sistemas…");
  if (!isReconnect) {
    log.ok(`DB: ${Object.keys(db.users).length} utilizadores`);
    log.ok(`Modo: ${config.mode.toUpperCase()} | Notifs: ${db.settings.notifications||0}`);
    log.ok(`IA: ${config.ai.apiKey ? "Gemini" : chalk.yellow("offline")}`);
  }

  let mode;
  if (isReconnect && config.silentReconnect && chosenMode) {
    mode = chosenMode === "qr" ? "qr" : "pairing-silent";
  } else {
    mode = await chooseLoginMode();
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();
  if (!isReconnect) log.info("Baileys v" + version.join("."));

  const sock = makeWASocket({
    version, logger: pino({ level: "silent" }),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level:"silent" })) },
    browser: Browsers.macOS("Safari"),
    printQRInTerminal: mode === "qr",
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
    defaultQueryTimeoutMs: 60_000
  });

  // Pairing
  if (!sock.authState.creds.registered && (mode === "pairing" || mode === "pairing-auto" || mode === "pairing-silent")) {
    let num = "";
    if (mode === "pairing-auto") {
      num = config.autoPair.number;
    } else if (mode === "pairing-silent") {
      num = config.autoPair.number;
    } else {
      while (!num || num.length < 8) {
        num = (await ask(chalk.cyan("  → Número do BOT (com indicativo, ex: 258840000000): "))).replace(/\D/g,"");
        if (!num || num.length < 8) log.err("Número inválido.");
      }
    }
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(num);
        const pretty = code.match(/.{1,4}/g).join("-");
        log.box("⚡ CÓDIGO DE PAREAMENTO ⚡", [
          "", chalk.greenBright.bold(`                  ${pretty}                  `), "",
          chalk.gray("  WhatsApp → Aparelhos conectados → Usar nº de telefone"),
          chalk.yellow("  ⏳ Expira em ~60s.")
        ]);
      } catch (e) { log.err("Pairing falhou: " + e.message); }
    }, 3500);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr && mode === "qr") { qrcode.generate(qr, { small: true }); log.hint("Escaneia o QR acima."); }
    if (connection === "connecting" && !isReconnect) log.info("Ligando…");
    if (connection === "open") {
      const meId = sock.user?.id?.split(":")[0] || "?";
      if (!isReconnect) {
        log.box("✓ CONECTADO", [
          chalk.green("  Bot:      ") + chalk.bold(sock.user?.name || meId),
          chalk.green("  Número:   ") + meId,
          chalk.green("  Versão:   ") + config.version + " (" + config.edition + ")",
          chalk.green("  Prefixo:  ") + db.settings.prefix,
          chalk.green("  Dono:     ") + (db.owner.claimed ? "👑 " + db.owner.name : chalk.yellow("a definir"))
        ]);
      } else {
        log.ok("Reconectado.");
      }

      if (config.notifyOwnerOnConnect) {
        try {
          // Destino: jid do dono se configurado, senão WhatsApp do próprio bot
          const ownerJid = db.owner.claimed && db.owner.jid ? db.owner.jid
                       : (sock.user.id.split(":")[0] + "@s.whatsapp.net");
          let intro;
          if (db.owner.claimed) {
            intro = M.box(isReconnect ? "⚡ RECONECTADO" : "⚡ FLASH-BOT ONLINE",
              `${M.styled("Olá")} *${db.owner.name}*!\n\n` +
              `${M.styled("Estado:")} \`${isReconnect ? "Reconectado" : "Online"}\`\n` +
              `${M.styled("Versão:")} \`${config.version}\` (${config.edition})\n` +
              `${M.styled("Prefixo:")} \`${db.settings.prefix}\`\n` +
              `${M.styled("Modo:")} \`${config.mode.toUpperCase()}\`\n\n` +
              `> ${M.styled("Usa")} \`${db.settings.prefix}menu\` ${M.styled("para começares.")}`,
              "SYSTEM");
          } else {
            intro = M.box("👑 BEM-VINDO AO FLASH-BOT V6.2",
              `${M.styled("Olá! Sou o teu novo assistente.")}\n\n` +
              `${M.styled("Antes de tudo, preciso saber QUEM é o meu Dono Supremo.")}\n` +
              `${M.styled("O Dono Supremo é INTOCÁVEL — eu nunca o bani.")}\n\n` +
              `*━━━ COMO FAZER ━━━*\n\n` +
              `*1.* ${M.styled("Escreve")} \`${db.settings.prefix}lid\` ${M.styled("no PV.")}\n` +
              `*2.* ${M.styled("Depois")} \`flash <teu_lid>\` ${M.styled("(SEM prefixo)")}\n` +
              `*3.* ${M.styled("Eu pergunto o teu nome.")}\n` +
              `*4.* ${M.styled("Confirma com")} \`${db.settings.prefix}salvar\`\n\n` +
              `${M.styled("Criador:")} *${config.creator.name}* — ${config.creator.waLink}`,
              "WELCOME");
          }
          await sock.sendMessage(ownerJid, { text: intro });
        } catch (e) { log.warn("welcome dono falhou: " + e.message); }
      }
    }
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      log.warn("Fechado (code " + code + ")");
      const fatal = [DisconnectReason.loggedOut, DisconnectReason.badSession, DisconnectReason.forbidden, 401, 403, 405];
      if (fatal.includes(code)) {
        log.err("Sessão inválida — limpando…");
        cleanSession();
        isReconnect = false; chosenMode = null;
        setTimeout(start, 2500);
      } else if (config.autoReconnect) {
        isReconnect = true;
        setTimeout(start, 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const m of messages) {
      try { await handler.handle(sock, m); }
      catch (e) {
        // Erros nunca aparecem para o utilizador — vão para notificações do dono
        try { await M.notifyOwner(sock, `Erro: \`${e.message}\``, "SECURITY"); } catch {}
      }
    }
  });

  sock.ev.on("group-participants.update", async (ev) => {
    try { const w = require("./lib/welcome"); await w.handle(sock, ev); }
    catch (e) { try { await M.notifyOwner(sock, "welcome erro: " + e.message); } catch {} }
  });

  process.on("uncaughtException", (e) => log.err("uncaught: " + e.message));
  process.on("unhandledRejection", (e) => log.err("rejection: " + (e?.message || e)));
}

start().catch(e => { log.err(e.stack || e.message); process.exit(1); });
