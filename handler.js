// FLASH-BOT V6.1 — handler.js — roteador completo
const fs = require("fs");
const path = require("path");
const os = require("os");
const moment = require("moment-timezone");
const config = require("./config");
const db = require("./lib/db");
const M = require("./lib/messages");
const fonts = require("./lib/fonts");
const menus = require("./lib/menus");
const aliases = require("./lib/aliases");
const perms = require("./lib/permissions");
const antis = require("./lib/antis");
const ia = require("./lib/ia");
const detector = require("./lib/detector");
const games = require("./lib/games");
const sales = require("./lib/sales");
const aluguel = require("./lib/aluguel");
const google = require("./lib/google");
const ytdl = require("./lib/ytdl");
const reactions = require("./lib/reactions");
const vcard = require("./lib/vcard");
const welcome = require("./lib/welcome");

const startedAt = Date.now();

// Comandos liberados em modo aluguel (quando não alugado)
const RENTAL_FREE = new Set(["lid", "meulid", "lidgrupo", "resgatar", "desbloquear", "ping", "menualuguel", "menu"]);

async function handle(sock, m) {
  try {
    if (!m.message) return;
    if (m.key.fromMe) return;
    if (m.messageTimestamp && (Date.now()/1000 - m.messageTimestamp) > (config.ignoreOldMessages || 15)) return;

    const chat = m.key.remoteJid;
    const isGroup = chat.endsWith("@g.us");
    const sender = isGroup ? (m.key.participant || m.participant) : chat;
    const senderLid = m.key.participantLid || m.key.senderLid || null;
    const pushName = m.pushName || "amigo";

    db.stats.messages++;
    const u = db.user(sender);
    u.name = pushName; if (senderLid) u.lid = senderLid; u.msgs++;

    const text = (
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      m.message.videoMessage?.caption || ""
    ).trim();

    const prefix = db.settings.prefix;
    const lower = text.toLowerCase();
    const reply = (t, extra = {}) => sock.sendMessage(chat, typeof t === "string" ? { text: t, ...extra } : { ...t, ...extra }, { quoted: m });
    const owner = perms.isOwner(sender) || perms.isOwner(senderLid);

    // ─── FLUXO DONO SUPREMO (sem prefixo: "flash <lid>" + nome + .salvar) ───
    if (!db.owner.claimed && !isGroup) {
      const ps = db.pending[sender] || {};
      // Passo 0: oferecer .lid se enviou qualquer coisa
      if (!ps.step) {
        if (lower === prefix + "lid" || lower === "lid" || lower === prefix + "meulid") {
          db.pending[sender] = { step: "showed_lid" }; db.save();
          await reactions.reactCustom(sock, m, "🆔");
          return reply(M.box("🆔 O TEU LID",
            `${M.styled("Boa,")} *${pushName}*!\n\n` +
            `${M.styled("O teu LID é:")}\n\`${senderLid || sender.split("@")[0]}\`\n\n` +
            `${M.styled("Agora, sem prefixo, escreve:")}\n› \`flash ${senderLid || sender.split("@")[0]}\`\n\n` +
            `${M.styled("(eu vou guardar esse LID como Dono Supremo)")}`,
            "OWNER"));
        }
        // se está a tentar usar bot sem ainda definir dono
        if (text.startsWith(prefix) && lower !== prefix + "menu" && lower !== prefix + "ping") {
          await reply(M.box("👑 PRIMEIRO: DEFINE-TE COMO DONO",
            `${M.styled("Olá,")} *${pushName}*!\n\n` +
            `${M.styled("Ainda não tens dono definido. Escreve")} \`${prefix}lid\` ${M.styled("para começar.")}\n` +
            `${M.styled("Depois te guio passo a passo.")}`, "OWNER"));
          return;
        }
      }
      // Passo 1: aguardar "flash <lid>"
      if (ps.step === "showed_lid" && /^flash\s+\S+/i.test(text)) {
        const lid = text.replace(/^flash\s+/i, "").trim();
        db.pending[sender] = { step: "awaiting_name", lid }; db.save();
        await reactions.reactCustom(sock, m, "✅");
        return reply(M.box("✅ LID REGISTADO",
          `${M.styled("LID guardado:")} \`${lid}\`\n\n` +
          `${M.styled("Agora diz-me — sem prefixo — como queres ser chamado.")}\n` +
          `${M.styled("Exemplo:")} \`${pushName}\` ${M.styled("ou")} \`Mestre\` ${M.styled("ou outro.")}`,
          "OWNER"));
      }
      // Passo 2: aguardar nome
      if (ps.step === "awaiting_name" && text && !text.startsWith(prefix) && !/^flash\s/i.test(text)) {
        db.pending[sender] = { step: "awaiting_save", lid: ps.lid, name: text.slice(0, 30) }; db.save();
        await reactions.reactCustom(sock, m, "💾");
        return reply(M.box("📝 PASSO FINAL",
          `${M.styled("Perfeito!")}\n\n` +
          `${M.styled("LID:")} \`${ps.lid}\`\n` +
          `${M.styled("Nome:")} *${text.slice(0,30)}*\n\n` +
          `${M.styled("Para confirmares e te tornares Dono Supremo, escreve:")}\n› \`${prefix}salvar\``,
          "OWNER"));
      }
      // Passo 3: .salvar
      if (ps.step === "awaiting_save" && (lower === prefix + "salvar" || lower === "salvar" || lower === prefix + "save")) {
        const o = perms.claimOwner(sender, ps.lid, ps.name);
        delete db.pending[sender]; db.save();
        await reactions.reactCustom(sock, m, "👑");
        return reply(M.box("👑 DONO SUPREMO DEFINIDO!",
          `${M.greet(o.name)}\n\n` +
          `${M.styled("Tu agora és o")} *DONO SUPREMO* ${M.styled("do FLASH-BOT.")}\n` +
          `${M.styled("Imune a ban, mute e antis. Controlo total.")}\n\n` +
          `${M.styled("LID:")} \`${o.lid}\`\n` +
          `${M.styled("Nome:")} *${o.name}*\n\n` +
          `${M.styled("Usa")} \`${prefix}menudono\` ${M.styled("para veres os teus comandos.")}\n` +
          `${M.styled("Bem-vindo, Mestre. ⚡")}`,
          "OWNER"));
      }
    }

    // ─── BLOQUEIO POR ALUGUEL ───
    if (isGroup && config.mode === "rental" && !owner) {
      if (aluguel.isBlocked(chat)) {
        // Tentativa de desbloqueio?
        if (lower.startsWith(prefix + "desbloquear ")) {
          const code = text.split(/\s+/)[1];
          const r = aluguel.useUnlock(code, chat);
          if (r.ok) {
            await reactions.reactCustom(sock, m, "🔓");
            return reply(M.ok("Grupo desbloqueado", `${M.styled("Tens 5 novas tentativas. Usa")} \`${prefix}resgatar <codigo>\``, "SYSTEM"));
          }
          return reply(M.err("Código inválido", r.error, "SYSTEM"));
        }
        // não responde mais nada
        return;
      }
      const st = aluguel.statusForGroup(chat);
      if (!st.active) {
        const cmdName = lower.startsWith(prefix) ? lower.slice(prefix.length).split(/\s+/)[0] : null;
        // só permite resgatar / lid / ping
        if (cmdName && !RENTAL_FREE.has(aliases.resolve(cmdName) || cmdName)) return;
      }
    }

    // ─── ANTIS ───
    if (isGroup && await antis.handle(sock, m)) return;

    // ─── DETECTOR DE COMPROVATIVOS ───
    if (text && text.length > 15) {
      const d = detector.detect(text);
      if (d) {
        await reactions.reactCustom(sock, m, "💰");
        const body = detector.render(d, sender);
        await reply(M.box("✅ COMPROVATIVO DETECTADO", body, "SALES"));
        if (db.settings.interactAI) {
          try {
            const ans = await ia.ask(`Recebi um comprovativo ${d.provider} valor ${d.value} MT. Responde simpático em PT-PT a confirmar processamento.`);
            await reply(M.box("🧠 ASSISTENTE", ans, "AI"));
          } catch (e) { await M.notifyOwner(sock, "IA erro: " + e.message); }
        }
        return;
      }
    }

    // ─── AUTO-VENDAS (responde a perguntas sobre megas) ───
    if (text && sales.isSalesQuestion(text) && !text.startsWith(prefix) && (sales.ensure().autoReplyEnabled !== false)) {
      await reactions.reactCustom(sock, m, "💰");
      const reply_body = sales.renderTable() +
        `\n\n${M.styled("Para comprar use:")} \`${prefix}compra <id|pacote>\`` +
        `\n${M.styled("Pagamento aceito: M-Pesa e eMola.")}`;
      await reply(M.box("💰 TABELA DE PREÇOS", reply_body, "SALES"));
      return;
    }

    // ─── INTERACT AI (pv e grupo) ───
    if (db.settings.interactAI && !text.startsWith(prefix) && text) {
      try {
        const a = await ia.ask(text, { user: pushName });
        await reactions.reactCustom(sock, m, "🧠");
        return reply(M.box("🧠 ASSISTENTE", a, "AI"));
      } catch (e) { await M.notifyOwner(sock, "IA erro: " + e.message); return; }
    }

    // ─── AUTO-RESPONDER (com variáveis) ───
    if (db.autocmds[lower]) {
      const tx = welcome.resolveVars(db.autocmds[lower], { user: sender, name: pushName, count: "?" });
      return reply(tx);
    }

    // ─── COMANDOS ───
    if (!text.startsWith(prefix)) return;

    const body = text.slice(prefix.length).trim();
    // .fonte#N <texto> ou .fonte<N> <texto>
    const fonteMatch = body.match(/^fonte\s*#?(\w+)\s+([\s\S]+)/i);
    if (fonteMatch) {
      const style = fonts.resolveName(fonteMatch[1]);
      if (style) return reply(fonts.apply(fonteMatch[2], style));
    }
    const args = body.split(/\s+/);
    const raw = args.shift();
    const cmd = aliases.resolve(raw);

    // anti-spam de comandos errados em grupo bloqueado por aluguel
    if (!cmd) {
      const sug = aliases.suggest(raw);
      await reactions.reactCustom(sock, m, "❓");
      return reply(M.unknown(raw, sug));
    }

    db.stats.commands++; u.cmdsUsed++;
    await reactions.react(sock, m, cmd);
    try {
      await route(sock, m, { chat, isGroup, sender, senderLid, pushName, args, cmd, text, raw, owner, prefix, reply });
    } catch (e) {
      // Erro silencioso para o utilizador, registado para o dono
      await M.notifyOwner(sock, `Erro em \`.${cmd}\`: ${e.message}`, "SECURITY");
    }

  } catch (e) {
    try { await M.notifyOwner(sock, "Handler erro: " + e.message); } catch {}
  }
}

// ───────────────── ROUTER ─────────────────
async function route(sock, m, ctx) {
  const { chat, isGroup, sender, senderLid, pushName, args, cmd, text, owner, prefix, reply } = ctx;

  // helper para enviar menu com imagem
  const sendMenu = async (mn) => {
    if (mn.image) {
      await sock.sendMessage(chat, { image: { url: mn.image }, caption: mn.text }, { quoted: m });
    } else {
      await reply(mn.text);
    }
  };

  switch (cmd) {
    // ───── MENUS ─────
    case "menu":             return sendMenu(menus.main(pushName, prefix));
    case "menuadm":          return sendMenu(menus.adm(pushName, prefix));
    case "menudono":         return sendMenu(menus.dono(pushName, prefix));
    case "menuia":           return sendMenu(menus.ia(pushName, prefix));
    case "menuvendas":       return sendMenu(menus.vendas(pushName, prefix));
    case "menujogos":        return sendMenu(menus.jogos(pushName, prefix));
    case "menupersonalizar": return sendMenu(menus.personalizar(pushName, prefix));
    case "menumedia":        return sendMenu(menus.midia(pushName, prefix));
    case "menuanti":         return sendMenu(menus.anti(pushName, prefix));
    case "menualuguel":      return sendMenu(menus.aluguel(pushName, prefix));
    case "menuwelcome":      return sendMenu(menus.welcome(pushName, prefix));

    // ───── INFO ─────
    case "ping": {
      const t0 = Date.now();
      await reply(M.info("Pong! ⚡", `${M.styled("Processando…")}`));
      const ms = Date.now() - t0;
      const up = Math.floor((Date.now() - startedAt) / 1000);
      const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      const cpu = os.cpus()[0]?.model?.split(" ").slice(0, 4).join(" ") || "?";
      const load = os.loadavg().map(n => n.toFixed(2)).join(" / ");
      return reply(M.box("⚡ PING",
        `${M.styled("Latência:")} *${ms} ms*\n` +
        `${M.styled("Uptime:")} *${formatUptime(up)}*\n` +
        `${M.styled("RAM:")} *${mem} MB*\n` +
        `${M.styled("CPU:")} ${cpu}\n` +
        `${M.styled("Carga:")} ${load}\n` +
        `${M.styled("Plataforma:")} ${os.platform()} ${os.arch()}\n` +
        `${M.styled("Node:")} ${process.version}\n` +
        `${M.styled("Mensagens:")} *${db.stats.messages}*  ${M.styled("Comandos:")} *${db.stats.commands}*`,
        "ASSIST"));
    }
    case "info": return reply(M.box("ℹ FLASH-BOT V" + config.version,
      `${M.styled("Nome:")} *${config.botName}*\n` +
      `${M.styled("Versão:")} *${config.version}* (${config.edition})\n` +
      `${M.styled("Criador:")} *${config.creator.name}* — ${config.creator.waLink}\n` +
      `${M.styled("Prefixo:")} *${prefix}*\n` +
      `${M.styled("Comandos:")} *${aliases.all.length}* canónicos + *${aliases.totalAliases}* aliases\n` +
      `${M.styled("Modo:")} *${config.mode.toUpperCase()}*\n` +
      `${M.styled("Slogan:")} ${config.slogan}\n` +
      `${M.styled("Repo:")} ${config.creator.github}`,
      "BRAND"));
    case "prefixo": return reply(M.info("Prefixo", `${M.styled("O meu prefixo é")} *${prefix}*`));
    case "uptime": return reply(M.info("Uptime", `*${formatUptime(Math.floor((Date.now()-startedAt)/1000))}*`));
    case "status": return reply(M.box("📊 STATUS DO SISTEMA",
      `${M.styled("Modo:")} *${config.mode.toUpperCase()}*\n` +
      `${M.styled("Welcome:")} ${db.settings.welcomeEnabled ? "✅" : "❌"}\n` +
      `${M.styled("Interact AI:")} ${db.settings.interactAI ? "✅" : "❌"}\n` +
      `${M.styled("Dono:")} ${db.owner.claimed ? db.owner.name : "—"}\n` +
      `${M.styled("Sub-donos:")} ${(db.owner.sub||[]).length}\n` +
      `${M.styled("Códigos aluguel:")} ${Object.keys(db.rental.codes).length}\n` +
      `${M.styled("Vendas hoje:")} ${sales.todaySales().orders.length}`, "ASSIST"));

    case "dono": {
      // VCard do criador SEMPRE + info do dono actual
      const txt = M.box("👑 INFO DE DONOS",
        `*━━━ CRIADOR ━━━*\n` +
        `${M.styled("Nome:")} *${config.creator.name}*\n` +
        `${M.styled("WhatsApp:")} ${config.creator.waLink}\n` +
        `${M.styled("Grupo:")} ${config.creator.tag}\n\n` +
        `*━━━ DONO SUPREMO ━━━*\n` +
        (db.owner.claimed
          ? `${M.styled("Nome:")} *${db.owner.name}*\n` +
            `${M.styled("LID:")} \`${db.owner.lid || "—"}\`\n` +
            `${M.styled("Número:")} \`${(db.owner.jid||"").split("@")[0] || "—"}\`\n` +
            `${M.styled("Desde:")} ${moment(db.owner.claimedAt).format("DD/MM/YYYY")}\n` +
            `${M.styled("Sub-donos:")} ${(db.owner.sub||[]).length}`
          : `${M.styled("Ainda não definido.")}`),
        "OWNER");
      await sock.sendMessage(chat, vcard.creator(), { quoted: m });
      return reply(txt);
    }
    case "vcard": return sock.sendMessage(chat, vcard.creator(), { quoted: m });

    case "perfil": {
      const isAdm = isGroup ? await perms.isGroupAdmin(sock, chat, sender) : false;
      const u = db.user(sender);
      return reply(M.box("👤 PERFIL",
        `${M.greet(pushName)}\n\n` +
        `${M.styled("Nome:")} *${pushName}*\n` +
        `${M.styled("Número:")} \`${sender.split("@")[0]}\`\n` +
        `${M.styled("LID:")} \`${senderLid || u.lid || "—"}\`\n` +
        `${M.styled("Mensagens:")} *${u.msgs}*\n` +
        `${M.styled("Comandos:")} *${u.cmdsUsed}*\n` +
        `${M.styled("Avisos:")} *${u.warns}*\n` +
        `${M.styled("Saldo:")} *${u.balance} MT*\n` +
        `${M.styled("Admin do grupo:")} *${isAdm ? "sim" : "não"}*\n` +
        `${M.styled("Dono Supremo:")} *${owner ? "👑 SIM" : "não"}*`,
        "ASSIST"), { mentions: [sender] });
    }

    // ───── DONO ─────
    case "meulid":
      return reply(M.info("O teu LID",
        `${M.styled("LID:")} \`${senderLid || "indisponível"}\`\n` +
        `${M.styled("JID:")} \`${sender}\`\n\n` +
        (db.owner.claimed
          ? `${M.styled("O dono actual é:")} *${db.owner.name}*`
          : `${M.styled("Sem dono. Escreve")} \`flash ${senderLid || sender.split("@")[0]}\` ${M.styled("para te declarar (no PV).")}`)));

    case "serdono": {
      if (db.owner.claimed) return reply(M.err("Já reclamado", `Dono actual: *${db.owner.name}*`));
      return reply(M.info("Como reclamar",
        `${M.styled("Vai ao PV do bot e segue o guia:")}\n` +
        `1. \`${prefix}lid\`\n2. \`flash <teulid>\` (sem prefixo)\n3. Diz o teu nome\n4. \`${prefix}salvar\``));
    }
    case "salvar":
      if (db.owner.claimed) return reply(M.info("OK", "Tudo guardado."));
      return reply(M.warn("Sem dados", "Não há nada para salvar agora. Começa pelo guia no PV."));

    case "donoinfo": return reply(M.info("Dono",
      db.owner.claimed
        ? `${M.styled("Nome:")} *${db.owner.name}*\n${M.styled("LID:")} \`${db.owner.lid}\`\n${M.styled("Desde:")} ${moment(db.owner.claimedAt).format("DD/MM/YYYY HH:mm")}\n${M.styled("Sub-donos:")} ${(db.owner.sub||[]).length}`
        : "Sem dono ainda."));

    case "setname": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono Supremo."));
      const n = args.join(" "); if (!n) return reply(M.usage("setname", `${prefix}setname <novo nome>`));
      db.owner.name = n.slice(0, 30); db.save();
      return reply(M.ok("Nome alterado", `Agora vou-te chamar *${db.owner.name}*.`));
    }
    case "addsubdono": {
      if (!perms.isSupremeOwner(sender) && !perms.isSupremeOwner(senderLid))
        return reply(M.err("Sem permissão", "Apenas o Dono Supremo pode adicionar sub-donos."));
      const lid = args[0]; if (!lid) return reply(M.usage("addsubdono", `${prefix}addsubdono <lid>`));
      db.owner.sub = db.owner.sub || [];
      if (!db.owner.sub.includes(lid)) db.owner.sub.push(lid);
      db.save();
      return reply(M.ok("Sub-dono adicionado", `\`${lid}\` agora tem acesso a comandos de dono (mas não pode adicionar/remover outros donos).`));
    }
    case "delsubdono": {
      if (!perms.isSupremeOwner(sender) && !perms.isSupremeOwner(senderLid))
        return reply(M.err("Sem permissão", "Apenas o Dono Supremo."));
      const lid = args[0];
      db.owner.sub = (db.owner.sub || []).filter(x => x !== lid);
      db.save();
      return reply(M.ok("Removido", `\`${lid}\` deixou de ser sub-dono.`));
    }

    case "reiniciar":
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      await reply(M.warn("A reiniciar", "Volto já! ⚡"));
      process.exit(0);

    case "desligar":
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      await reply(M.warn("Desligando", "Até já!"));
      process.exit(1);

    case "modo": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      const m2 = (args[0]||"").toLowerCase();
      if (!["public","private","rental"].includes(m2))
        return reply(M.usage("modo", `${prefix}modo public|private|rental`));
      config.mode = m2;
      return reply(M.ok("Modo alterado", `Bot agora em modo *${m2.toUpperCase()}*.`));
    }

    case "bcgp": case "bcall": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      const msg = args.join(" "); if (!msg) return reply(M.usage("bc", `${prefix}${cmd} <mensagem>`));
      const txt = M.box("📢 BROADCAST", msg, "BRAND");
      if (cmd === "bcgp") {
        if (!isGroup) return reply(M.warn("Apenas grupo", "Usa em grupos."));
        return reply(txt);
      }
      const chats = await sock.groupFetchAllParticipating();
      let n = 0;
      for (const gid of Object.keys(chats)) { try { await sock.sendMessage(gid, { text: txt }); n++; } catch{} }
      return reply(M.ok("Broadcast enviado", `Para *${n}* grupos.`));
    }

    // ───── IA ─────
    case "ia": {
      let q = args.join(" ");
      if (!q) {
        db.pending[sender] = { step: "ia_wait" }; db.save();
        return reply(M.prompt("IA",
          `${M.styled("Claro,")} *${pushName}*! ${M.styled("Estou pronto.")}\n\n${M.styled("Manda a tua pergunta agora — sem prefixo, sem comando.")}\n${M.styled("Eu respondo já a seguir.")}`,
          `Aguardando pergunta…`));
      }
      await reply(M.info("A pensar…", M.styled("Permite-me um instante…")));
      const a = await ia.ask(q, { user: pushName });
      return reply(M.box("🧠 IA", a, "AI"));
    }
    case "ensinar": {
      const j = args.join(" "); const i = j.indexOf("=");
      if (i < 0) return reply(M.usage("ensinar", `${prefix}ensinar <pergunta> = <resposta>`));
      ia.teach(j.slice(0, i), j.slice(i+1));
      return reply(M.ok("Aprendi!", M.styled("Vou lembrar-me disto.")));
    }
    case "esquecer": {
      const q = args.join(" "); if (!q) return reply(M.usage("esquecer", `${prefix}esquecer <pergunta>`));
      ia.forget(q); return reply(M.ok("Esqueci", M.styled("Já não vou lembrar.")));
    }
    case "conhecimento": {
      const k = Object.keys(db.knowledge);
      return reply(M.info("Conhecimento", k.length ? k.map((x,i)=>`*${i+1}.* ${x}`).join("\n") : "Vazio."));
    }
    case "interact": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      const v = (args[0]||"").toLowerCase();
      if (!["on","off"].includes(v)) return reply(M.usage("interact", `${prefix}interact on|off`));
      db.settings.interactAI = v === "on"; db.save();
      return reply(M.ok("Interact AI", `Agora *${v.toUpperCase()}*.\n${M.styled("Em PV, vou responder a tudo como assistente.")}`));
    }

    // ───── GOOGLE ─────
    case "google": {
      const q = args.join(" "); if (!q) return reply(M.usage("google", `${prefix}google <termo>`));
      await reply(M.info("A pesquisar…", M.styled("Um momento…")));
      const r = await google.searchText(q, 6);
      if (!r.length) return reply(M.err("Sem resultados", "Tenta outro termo."));
      const body = r.map((x,i)=>`*${i+1}.* ${x.title}\n${x.link}`).join("\n\n");
      return reply(M.box("🔍 GOOGLE — " + q, body, "AI"));
    }
    case "gimg": {
      const q = args.join(" "); if (!q) return reply(M.usage("gimg", `${prefix}gimg <termo>`));
      await reply(M.info("Buscando imagens…", M.styled("Aguenta um pouco…")));
      const imgs = await google.searchImages(q, 5);
      if (!imgs.length) return reply(M.err("Sem imagens", "Tenta outro termo."));
      // Envia carrossel: 4 + 1 com legenda
      for (let i = 0; i < imgs.length; i++) {
        try {
          await sock.sendMessage(chat, {
            image: { url: imgs[i] },
            caption: i === imgs.length-1 ? M.box("🖼️ GOOGLE IMAGES — " + q,
              `${M.styled("Resultado:")} *${i+1}/${imgs.length}*\n${M.styled("Fonte:")} Google Images`, "AI") : `*${i+1}/${imgs.length}*`
          }, { quoted: i === 0 ? m : undefined });
        } catch {}
      }
      return;
    }

    // ───── VENDAS ─────
    case "tabela": return reply(M.box("💰 TABELA DE PREÇOS", sales.renderTable(), "SALES"));
    case "pagamento": {
      const s = sales.ensure();
      return reply(M.box("💳 FORMAS DE PAGAMENTO",
        `*M-Pesa:* \`${s.mpesa.number || "—"}\` ${s.mpesa.name ? "("+s.mpesa.name+")" : ""}\n` +
        `*eMola:* \`${s.emola.number || "—"}\` ${s.emola.name ? "("+s.emola.name+")" : ""}\n\n` +
        `> ${M.styled("Após pagar, envia o comprovativo aqui — detecto automaticamente.")}`, "SALES"));
    }
    case "vermpesa": {
      const s = sales.ensure();
      return reply(M.info("M-Pesa", `Número: \`${s.mpesa.number||"—"}\`\nNome: \`${s.mpesa.name||"—"}\``, "SALES"));
    }
    case "veremola": {
      const s = sales.ensure();
      return reply(M.info("eMola", `Número: \`${s.emola.number||"—"}\`\nNome: \`${s.emola.name||"—"}\``, "SALES"));
    }
    case "setmpesa": {
      if (!owner) return reply(M.err("Sem permissão", "Apenas dono."));
      const raw = args.join(" "); const m2 = raw.match(/(\d{8,})\s*[;,]?\s*(.+)?/);
      if (!m2) return reply(M.usage("setmpesa", `${prefix}setmpesa <numero>;<nome>`, [`${prefix}setmpesa 848881576;thebest`]));
      const r = sales.setMpesa(m2[1], m2[2] || "");
      return reply(M.ok("M-Pesa configurado", `\`${r.number}\` (${r.name||"—"})`, "SALES"));
    }
    case "setemola": {
      if (!owner) return reply(M.err("Sem permissão", "Apenas dono."));
      const raw = args.join(" "); const m2 = raw.match(/(\d{8,})\s*[;,]?\s*(.+)?/);
      if (!m2) return reply(M.usage("setemola", `${prefix}setemola <numero>;<nome>`));
      const r = sales.setEmola(m2[1], m2[2] || "");
      return reply(M.ok("eMola configurado", `\`${r.number}\` (${r.name||"—"})`, "SALES"));
    }
    case "settabela": {
      if (!owner) return reply(M.err("Sem permissão", "Apenas dono."));
      const raw = args.join(" ");
      const m2 = raw.match(/(.+?)\s*[;,]\s*(\d+)(?:\s*[;,]\s*(\w+))?/);
      if (!m2) return reply(M.usage("settabela", `${prefix}settabela <nome>;<preço>[;categoria]`, [`${prefix}settabela 400 MB diário;12;diario`]));
      const it = sales.addItem(m2[1].trim(), m2[2], m2[3] || "custom");
      return reply(M.ok("Pacote adicionado", `\`${it.id}\` — ${it.name} — ${it.price} MT`, "SALES"));
    }
    case "deltabela": {
      if (!owner) return reply(M.err("Sem permissão", "Apenas dono."));
      if (!args[0]) return reply(M.usage("deltabela", `${prefix}deltabela <id|nome>`));
      const r = sales.removeItem(args.join(" "));
      if (!r) return reply(M.err("Não encontrado", "Verifica `.tabela`."));
      return reply(M.ok("Removido", `\`${r.id}\` — ${r.name}`, "SALES"));
    }
    case "compra": {
      const pkg = args.join(" ");
      if (!pkg) return reply(M.usage("compra", `${prefix}compra <id|nome|tamanho>`, [`${prefix}compra 1024`,`${prefix}compra 400mb`,`${prefix}compra vpn 30`]));
      const r = sales.order(sender, pkg);
      const s = sales.ensure();
      return reply(M.box("🛒 PEDIDO CRIADO",
        `${M.greet(pushName)}\n\n` +
        `${M.styled("Pacote:")} *${r.pkg.name}*\n` +
        (r.pkg.price ? `${M.styled("Preço:")} *${r.pkg.price} MT*\n` : `${M.styled("Preço:")} *a confirmar*\n`) +
        `${M.styled("Encomenda:")} \`${r.order.id}\`\n\n` +
        `*━━ ${M.styled("Como pagar")} ━━*\n` +
        `💳 *M-Pesa:* \`${s.mpesa.number||"—"}\` ${s.mpesa.name?"("+s.mpesa.name+")":""}\n` +
        `💳 *eMola:* \`${s.emola.number||"—"}\` ${s.emola.name?"("+s.emola.name+")":""}\n\n` +
        `> ${M.styled("Envia o comprovativo aqui — detecto automático.")}`,
        "SALES"));
    }
    case "confirmar": {
      if (!owner && !(isGroup && await perms.isGroupAdmin(sock, chat, sender)))
        return reply(M.err("Sem permissão", "Só admins/dono."));
      const id = args[0]; if (!id) return reply(M.usage("confirmar", `${prefix}confirmar <id>`));
      const r = sales.confirm(id, args[1]);
      if (!r) return reply(M.err("Não encontrado", "Verifica `.vendas`."));
      return reply(M.ok("✅ Venda confirmada", `\`${r.id}\` — ${r.pkg} — ${r.price||"?"} MT`, "SALES"));
    }
    case "vendas":
    case "totalvendas":
    case "vendasdia": {
      const t = sales.todayStats();
      return reply(M.box("💰 VENDAS",
        `${M.styled("Pedidos hoje:")} *${t.today}*\n${M.styled("Confirmados:")} *${t.confirmed}*\n${M.styled("Total:")} *${t.total} MT*`, "SALES"));
    }
    case "detectar": {
      const d = detector.detect(args.join(" "));
      if (!d) return reply(M.err("Não detectei", "Cola um comprovativo M-Pesa/eMola real."));
      return reply(M.box("✅ DETECÇÃO", detector.render(d, sender), "SALES"));
    }
    case "autovendas": {
      if (!owner) return reply(M.err("Sem permissão", "Apenas dono."));
      const s = sales.ensure();
      s.autoReplyEnabled = !s.autoReplyEnabled; db.save();
      return reply(M.ok("Auto-vendas", s.autoReplyEnabled ? "Ativado" : "Desativado", "SALES"));
    }

    // ───── ANTIS ─────
    case "antilink": case "antisticker": case "antiaudio":
    case "antivideo": case "antidoc": case "antifake": case "antiflood": {
      if (!isGroup) return reply(M.warn("Apenas grupos", "Usa em grupos."));
      const type = cmd.replace("anti", "");
      const isAdm = await perms.isGroupAdmin(sock, chat, sender);
      if (!isAdm && !owner) return reply(M.err("Sem permissão", "Só admins."));

      const g = db.group(chat);
      // .antilink off → desliga
      if ((args[0]||"").toLowerCase() === "off") {
        g["anti"+type] = { lvl: "off", maxWarns: 3 }; db.save();
        return reply(M.ok("Anti-" + type + " desligado", `${M.styled("Já não vou agir sobre")} *${type}*.`, "ANTI"));
      }
      // .antilink 1|2|3 → configura directamente
      const n = parseInt(args[0]);
      if ([1,2,3].includes(n)) {
        if (n === 2) {
          db.pending[sender] = { step: "anti_warns", type, group: chat }; db.save();
          return reply(M.prompt("⚠ Anti-" + type + " — Nível 2",
            `${M.styled("Boa escolha! Apaga + avisa.")}\n\n${M.styled("Agora diz-me — sem prefixo — quantos avisos antes de banir.")}\n${M.styled("Exemplo:")} \`3\` ${M.styled("ou")} \`5\``,
            "Aguardando número de avisos…"));
        }
        g["anti"+type] = { lvl: n, maxWarns: 3 }; db.save();
        return reply(M.ok("Anti-" + type + " configurado", antis.describe(type, g["anti"+type]), "ANTI"));
      }
      // Sem args → mostra info + guia
      return reply(antis.guideMessage(type) + "\n\n" + M.styled("Estado actual: ") + antis.describe(type, g["anti"+type]));
    }

    case "statusantis": {
      if (!isGroup) return reply(M.warn("Apenas grupos", "Usa em grupos."));
      const g = db.group(chat);
      const list = antis.TYPES.map(t => `${fonts.apply("anti-"+t, "smallcaps")}: ${antis.describe(t, g["anti"+t])}`).join("\n");
      return reply(M.box("🛡️ STATUS DOS ANTIS", list, "ANTI"));
    }

    // ───── MODERAÇÃO ─────
    case "fechar": case "abrir": {
      if (!isGroup) return reply(M.warn("Apenas grupos", "Só em grupos."));
      if (!await perms.isGroupAdmin(sock, chat, sender) && !owner) return reply(M.err("Sem permissão", "Só admins."));
      const mode = cmd === "fechar" ? "announcement" : "not_announcement";
      try { await sock.groupSettingUpdate(chat, mode); } catch (e) { return reply(M.err("Falhou", e.message)); }
      const hora = moment().tz(config.timezone).format("HH:mm:ss");
      return reply(M.ok(cmd === "fechar" ? "Grupo fechado" : "Grupo aberto",
        `${M.styled("Acção:")} ${cmd === "fechar" ? "🔒 fechar" : "🔓 abrir"}\n` +
        `${M.styled("Por:")} *${pushName}*\n` +
        `${M.styled("Hora:")} ${hora}\n\n` +
        `${M.styled(cmd === "fechar" ? "Somente admins podem enviar mensagens agora." : "Todos podem enviar mensagens novamente.")}`, "OWNER"));
    }
    case "fix": case "desafix": {
      const q = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
      if (!q) return reply(M.usage("fix", `Responde uma mensagem com .${cmd}`));
      try {
        await sock.sendMessage(chat, { pin: { key: { remoteJid: chat, id: q, fromMe: false }, type: cmd === "fix" ? 1 : 2, time: 86400*7 } });
        return reply(M.ok(cmd === "fix" ? "Fixado" : "Desafixado", `${M.styled("Acção concluída por")} *${pushName}*.`, "OWNER"));
      } catch (e) { return reply(M.err("Falhou", e.message)); }
    }
    case "ban": case "promover": case "rebaixar": case "mute": case "unmute": {
      if (!isGroup) return reply(M.warn("Apenas grupos", "Só em grupos."));
      if (!await perms.isGroupAdmin(sock, chat, sender) && !owner) return reply(M.err("Sem permissão", "Só admins."));
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                     m.message?.extendedTextMessage?.contextInfo?.participant;
      if (!target) return reply(M.usage(cmd, `${prefix}${cmd} @user`));
      if (perms.isOwner(target)) return reply(M.err("Imune", "O Dono Supremo é intocável."));
      const map = { ban: "remove", promover: "promote", rebaixar: "demote" };
      const acao = { ban: "banido(a)", promover: "promovido(a) a ADM", rebaixar: "rebaixado(a) de ADM" };
      if (map[cmd]) {
        try { await sock.groupParticipantsUpdate(chat, [target], map[cmd]); }
        catch (e) { return reply(M.err("Falhou", e.message)); }
        const hora = moment().tz(config.timezone).format("HH:mm:ss");
        return reply(M.ok(cmd.toUpperCase(),
          `${M.styled("O utilizador")} @${target.split("@")[0]} ${M.styled("foi " + acao[cmd] + ".")}\n\n` +
          `${M.styled("Acção executada por:")} *${pushName}*\n${M.styled("Hora:")} ${hora}`,
          "OWNER"), { mentions: [target] });
      }
      const g = db.group(chat);
      if (cmd === "mute") { if (!g.muted.includes(target)) g.muted.push(target); }
      else { g.muted = g.muted.filter(x => x !== target); }
      db.save();
      return reply(M.ok(cmd, `@${target.split("@")[0]} ${cmd === "mute" ? "silenciado(a)" : "libertado(a)"} por *${pushName}*.`, "OWNER"), { mentions: [target] });
    }
    case "all": {
      if (!isGroup) return reply(M.warn("Apenas grupos", "Só em grupos."));
      if (!await perms.isGroupAdmin(sock, chat, sender) && !owner) return reply(M.err("Sem permissão", "Só admins."));
      const msg = args.join(" ") || `📢 ${M.styled("Estão todos convocados por")} *${pushName}*!`;
      const md = await sock.groupMetadata(chat);
      const supremoId = (db.owner.lid || "") + "@" + (db.owner.jid?.split("@")[1]||"");
      let lines = [];
      const mentions = md.participants.map(p => p.id);
      md.participants.forEach((p, i) => {
        let emoji = "👤"; // membro
        if (perms.isOwner(p.id)) emoji = "👑";
        else if (["admin","superadmin"].includes(p.admin)) emoji = "⭐";
        const role = perms.isOwner(p.id) ? "Dono" : (["admin","superadmin"].includes(p.admin) ? "Admin" : "Membro");
        lines.push(`*${String(i+1).padStart(2,"0")}.* ${emoji} @${p.id.split("@")[0]} ${M.styled("("+role+")")}`);
      });
      const body = M.box("📢 CONVOCAÇÃO GERAL",
        `${msg}\n\n${M.styled("Grupo:")} *${md.subject}*\n${M.styled("Total:")} *${md.participants.length}*\n\n${lines.join("\n")}`,
        "OWNER");
      await sock.sendMessage(chat, { text: body, mentions });
      // Se foi por hidetag, apaga o original
      return;
    }
    case "listadv": {
      const g = db.group(chat);
      const e = Object.entries(g.warns);
      if (!e.length) return reply(M.info("Avisos", "Nenhum aviso registado."));
      return reply(M.box("⚠ LISTA DE AVISOS", e.map(([j, n]) => `• @${j.split("@")[0]} — *${n}*`).join("\n"), "ANTI"),
        { mentions: e.map(([j]) => j) });
    }
    case "listmuted": {
      const g = db.group(chat);
      if (!g.muted.length) return reply(M.info("Mutados", "Ninguém silenciado."));
      return reply(M.box("🔇 MUTADOS", g.muted.map(j => `• @${j.split("@")[0]}`).join("\n"), "OWNER"), { mentions: g.muted });
    }
    case "limparwarns": {
      const g = db.group(chat);
      g.warns = {}; db.save();
      return reply(M.ok("Warns limpos", "Todos os avisos foram zerados.", "ANTI"));
    }
    case "grupo": {
      if (!isGroup) return reply(M.warn("Apenas grupos", "Só em grupos."));
      const md = await sock.groupMetadata(chat);
      return reply(M.box("ℹ INFO DO GRUPO",
        `${M.styled("Nome:")} *${md.subject}*\n${M.styled("Membros:")} *${md.participants.length}*\n${M.styled("Descrição:")} ${md.desc || "—"}\n${M.styled("Criado:")} ${md.creation ? moment(md.creation*1000).format("DD/MM/YYYY") : "?"}`, "ASSIST"));
    }

    // ───── ALUGUEL ─────
    case "gencode": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      const dur = args[0], uses = args[1] || 1;
      if (!dur) return reply(M.usage("gencode", `${prefix}gencode <Nd|Nh|Nm> <usos>`, [`${prefix}gencode 3d 2`, `${prefix}gencode 1d 1`, `${prefix}gencode 12h 5`]));
      const r = aluguel.genCode(dur, uses);
      if (r.error) return reply(M.err("Erro", r.error));
      return reply(M.ok("🔑 Código gerado",
        `${M.styled("Código:")} \`${r.code}\`\n${M.styled("Duração:")} *${dur}*\n${M.styled("Utilizadores máx:")} *${uses}*\n\n${M.styled("Partilha com quem alugou. Eles usam:")} \`${prefix}resgatar ${r.code}\``, "SYSTEM"));
    }
    case "resgatar": {
      if (!isGroup) return reply(M.warn("Apenas grupos", "Resgate é por grupo."));
      const code = args[0]; if (!code) return reply(M.usage("resgatar", `${prefix}resgatar <codigo>`));
      const r = aluguel.redeem(code, chat);
      if (r.error) {
        const fails = aluguel.recordFailure(chat);
        if (fails >= 5) {
          aluguel.block(chat);
          return reply(M.box("🚫 GRUPO BLOQUEADO",
            `${M.styled("Foram 5 tentativas com código errado.")}\n${M.styled("Este grupo está agora BLOQUEADO.")}\n${M.styled("Só o Dono pode desbloquear.")}`, "SECURITY"));
        }
        return reply(M.err("Código inválido", `${r.error}\n\n${M.styled("Tentativas falhadas:")} *${fails}/5*`, "SYSTEM"));
      }
      return reply(M.ok("🔓 Grupo activado",
        `${M.styled("Grupo activo até")} *${moment(r.group.rentalExpiresAt).tz(config.timezone).format("DD/MM/YYYY HH:mm")}*.\n${M.styled("Bom proveito!")}`, "SYSTEM"));
    }
    case "desbloquear": {
      if (!isGroup) return reply(M.warn("Apenas grupos", "Só em grupos."));
      const code = args[0]; if (!code) return; // não revelar como
      const r = aluguel.useUnlock(code, chat);
      if (r.error) return reply(M.err("Inválido", r.error, "SYSTEM"));
      return reply(M.ok("🔓 Desbloqueado", "Tens novas tentativas. Usa `.resgatar <codigo>`.", "SYSTEM"));
    }
    case "unblockcode": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      const gp = args[0]; if (!gp) return reply(M.usage("unblockcode", `${prefix}unblockcode <jid_do_grupo>`));
      const code = aluguel.genUnlock(gp);
      return reply(M.ok("Código de desbloqueio",
        `${M.styled("Código:")} \`${code}\`\n${M.styled("Entrega ao admin do grupo. Ele usa:")} \`.desbloquear ${code}\``, "SYSTEM"));
    }
    case "listcodes": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      const c = aluguel.listCodes();
      if (!c.length) return reply(M.info("Códigos", "Nenhum código gerado."));
      const lines = c.map(x => `*${x.code}* — ${x.duration} — ${x.usedBy.length}/${x.maxUses} usos — expira ${moment(x.expiresAt).format("DD/MM HH:mm")}`).join("\n");
      return reply(M.box("🔑 CÓDIGOS", lines, "SYSTEM"));
    }
    case "statusaluguel": {
      const s = aluguel.statusForGroup(chat);
      return reply(M.box("📊 ALUGUEL",
        `${M.styled("Activo:")} ${s.active ? "✅" : "❌"}\n` +
        `${M.styled("Bloqueado:")} ${s.blocked ? "🚫" : "—"}\n` +
        `${M.styled("Tentativas falhadas:")} ${s.fails}/5\n` +
        (s.expiresAt ? `${M.styled("Expira:")} ${moment(s.expiresAt).format("DD/MM/YYYY HH:mm")}` : ""), "SYSTEM"));
    }

    // ───── JOGOS ─────
    case "jdv": {
      const lvl = parseInt(args[0]) || 1;
      const g = games.newGame(chat, lvl);
      return reply(M.box("⭕ JOGO DA VELHA",
        `${M.styled("Nível:")} *${lvl}* ${lvl===1?"(fácil)":lvl===2?"(médio)":"(imbatível)"}\n\n\`\`\`\n${games.render(g.b)}\n\`\`\`\n\n${M.styled("Para jogar, basta enviares")} *o número da casa (0-8)*${M.styled(" — com ou sem o comando.")}\n\n${M.styled("Posições:")}\n\`\`\`\n0 │ 1 │ 2\n3 │ 4 │ 5\n6 │ 7 │ 8\n\`\`\``,
        "GAMES"));
    }
    case "jogar": {
      const r = games.move(chat, parseInt(args[0]));
      if (r.error) return reply(M.err("Jogo", r.error));
      let msg = `\`\`\`\n${r.board}\n\`\`\``;
      if (r.winner) msg += `\n\n${r.winner === "draw" ? "🤝 Empate!" : r.winner === "X" ? "🏆 Ganhaste!" : "😎 Eu venci!"}`;
      return reply(M.box("⭕ Jogo da Velha", msg, "GAMES"));
    }
    case "adivinha": {
      games.newAdivinha(chat);
      return reply(M.box("🎯 ADIVINHA",
        `${M.styled("Pensei num número entre 1 e 100.")}\n${M.styled("Usa")} \`${prefix}chutar <n>\``, "GAMES"));
    }
    case "chutar": {
      const r = games.guess(chat, parseInt(args[0]));
      if (r.error) return reply(M.err("Adivinha", r.error));
      if (r.win) return reply(M.ok("Acertaste!", `Em *${r.tries}* tentativas. 🎉`, "GAMES"));
      return reply(M.info("Adivinha", `${r.hint} — tentativas: *${r.tries}*`));
    }
    case "ppt": {
      let c = args[0];
      if (!c) { db.pending[sender] = { step: "ppt" }; db.save(); return reply(M.prompt("PPT", `${M.styled("Escolhe (sem prefixo):")}\n• \`pedra\`  • \`papel\`  • \`tesoura\``, "Aguardando jogada…")); }
      const r = games.ppt(c);
      if (r.error) return reply(M.err("PPT", r.error));
      return reply(M.box("✊ PPT", `${M.styled("Joguei")} *${r.bot}*\n\n${r.result}`, "GAMES"));
    }
    case "dado":   return reply(M.box("🎲 DADO", `${M.styled("Saiu")} *${games.dado()}*`, "GAMES"));
    case "roleta": return reply(M.box("🎰 ROLETA", games.roleta(), "GAMES"));
    case "adivinhafilme": {
      const q = games.randomQuiz("filme");
      return reply(M.box("🎬 ADIVINHA FILME", `${M.styled("Pista:")} ${q.c}\n\n${M.styled("Responde:")} \`${prefix}respfilme <nome>\``, "GAMES"));
    }
    case "adivinhaanime": {
      const q = games.randomQuiz("anime");
      return reply(M.box("🍱 ADIVINHA ANIME", `${M.styled("Pista:")} ${q.c}\n\n${M.styled("Responde:")} \`${prefix}respanime <nome>\``, "GAMES"));
    }
    case "letramusica": {
      const q = games.randomQuiz("musica");
      return reply(M.box("🎵 ADIVINHA MÚSICA", `${q.c}\n\n${M.styled("Responde com")} \`${prefix}respmusica <nome>\``, "GAMES"));
    }

    // ───── PERSONALIZAR ─────
    case "setprefix": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      const p = args[0]; if (!p) return reply(M.usage("setprefix", `${prefix}setprefix <novo>`));
      db.settings.prefix = p; db.save();
      return reply(M.ok("Prefixo alterado", `Novo prefixo: *${p}*`));
    }
    case "setfont": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      const s = fonts.resolveName(args[0]);
      if (!s) return reply(M.usage("setfont", `${prefix}setfont <#N|nome>`, fonts.listAll().map(x => `${prefix}setfont #${x.n} (${x.name})`)));
      db.settings.font = s; db.save();
      return reply(M.ok("Fonte alterada", `${M.styled("Agora todas as mensagens usam:")} *${s}* → ${fonts.apply("Exemplo de texto",s)}`));
    }
    case "listfonts": {
      const lines = fonts.listAll().map(f => `*#${f.n}* — \`${f.name}\` → ${f.sample}`).join("\n");
      return reply(M.box("🎨 FONTES DISPONÍVEIS",
        lines + `\n\n> ${M.styled("Usa")} \`${prefix}setfont #N\` ${M.styled("ou")} \`${prefix}fonte #N <texto>\``, "ASSIST"));
    }
    case "fonte": {
      // .fonte#N <texto>  ou  .fonte #N <texto>  ou  .fonte <nome> <texto>
      const raw = text.slice(prefix.length).replace(/^fonte\b/i,"").trim();
      const m2 = raw.match(/^#?(\w+)\s+([\s\S]+)/);
      if (!m2) return reply(M.usage("fonte", `${prefix}fonte#<N> <texto>`, [`${prefix}fonte#1 MOZ_BOT OFICIAL`, `${prefix}fonte botoficia FLASH-BOT`]));
      const style = fonts.resolveName(m2[1]);
      if (!style) return reply(M.err("Fonte inválida", `Usa \`${prefix}listfonts\``));
      return reply(fonts.apply(m2[2], style));
    }
    case "notifs": {
      const n = db.settings.notifications || 0;
      const list = (db.pendingNotifs||[]).slice(-10).map((x,i)=>`*${i+1}.* \`${x.tag}\` — ${x.t}`).join("\n") || "Sem notificações.";
      return reply(M.box("🔔 NOTIFICAÇÕES", `Total: *${n}*\n\n${list}`, "SYSTEM"));
    }
    case "avaliar": {
      const stars = parseInt(args[0]);
      if (isNaN(stars) || stars<1 || stars>5) return reply(M.usage("avaliar", `${prefix}avaliar <1-5> [comentário]`));
      db.ratings = db.ratings || [];
      db.ratings.push({ user: sender, name: pushName, stars, msg: args.slice(1).join(" "), at: Date.now() });
      db.save();
      const s = "★".repeat(stars) + "☆".repeat(5-stars);
      return reply(M.ok("Avaliação recebida", `${s}\nObrigado, ${pushName}!`, "ASSIST"));
    }
    case "veravaliacoes": {
      const arr = db.ratings || [];
      if (!arr.length) return reply(M.info("Sem avaliações", "Sê o primeiro com `.avaliar 5`."));
      const avg = (arr.reduce((a,b)=>a+b.stars,0)/arr.length).toFixed(2);
      const last = arr.slice(-5).map(r=>`${"★".repeat(r.stars)} — *${r.name}*: ${r.msg||""}`).join("\n");
      return reply(M.box("⭐ AVALIAÇÕES", `Média: *${avg}/5* (${arr.length} votos)\n\n${last}`, "ASSIST"));
    }
    case "setdonolink": {
      if (!owner) return reply(M.err("Sem permissão", "Só dono."));
      db.owner.link = args.join(" "); db.save();
      return reply(M.ok("Link do dono", `\`${db.owner.link}\``, "OWNER"));
    }
    case "setdonowa": {
      if (!owner) return reply(M.err("Sem permissão", "Só dono."));
      db.owner.wa = args[0]; db.save();
      return reply(M.ok("WhatsApp do dono", `\`${db.owner.wa}\``, "OWNER"));
    }
    case "setdonobio": {
      if (!owner) return reply(M.err("Sem permissão", "Só dono."));
      db.owner.bio = args.join(" "); db.save();
      return reply(M.ok("Bio do dono", "Atualizada.", "OWNER"));
    }
    case "setdonofoto": {
      if (!owner) return reply(M.err("Sem permissão", "Só dono."));
      // espera que esteja respondendo a uma imagem
      const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!q?.imageMessage) return reply(M.usage("setdonofoto", "Responde a uma imagem com `.setdonofoto`"));
      // (a integração de download está no welcome/menus assets; aqui apenas marcamos pendente)
      db.owner.photoPending = true; db.save();
      return reply(M.ok("Foto do dono", "Recebida (será aplicada nos próximos menus).", "OWNER"));
    }
    case "setmenupic": {
      if (!owner) return reply(M.err("Sem permissão", "Só dono."));
      return reply(M.info("Foto do menu", `Substitui o ficheiro \`media/menu.jpg\` ou usa o módulo de upload.`));
    }
    case "setvendaspic": {
      if (!owner) return reply(M.err("Sem permissão", "Só dono."));
      return reply(M.info("Foto vendas", `Substitui \`media/vendas.jpg\`.`));
    }
    case "setwelcomepic": {
      if (!owner) return reply(M.err("Sem permissão", "Só dono."));
      return reply(M.info("Foto welcome", `Substitui \`media/welcome.jpg\`.`));
    }
    case "vergrupos": {
      if (!owner) return reply(M.err("Sem permissão", "Só dono."));
      try {
        const all = await sock.groupFetchAllParticipating();
        const list = Object.values(all);
        const lines = list.map((g,i)=>`*${i+1}.* ${g.subject}\n   id: \`${g.id}\`\n   membros: *${g.participants?.length||"?"}*`).join("\n\n");
        return reply(M.box(`📚 GRUPOS ATIVOS (${list.length})`, lines || "—", "OWNER"));
      } catch (e) { return reply(M.err("Erro", e.message)); }
    }
    case "vergruposaluguel": {
      if (!owner) return reply(M.err("Sem permissão", "Só dono."));
      const r = db.rental?.unlock || {};
      const ids = Object.keys(r);
      if (!ids.length) return reply(M.info("Aluguéis", "Nenhum grupo com aluguel ativo."));
      const lines = ids.map(g=>`• \`${g}\` — expira: ${new Date(r[g].expires||0).toLocaleString()}`).join("\n");
      return reply(M.box("📅 ALUGUÉIS ATIVOS", lines, "OWNER"));
    }
    case "listsubs": {
      const subs = db.owner.sub || [];
      return reply(M.box("👥 SUB-DONOS", subs.length ? subs.map((s,i)=>`*${i+1}.* \`${s}\``).join("\n") : "—", "OWNER"));
    }
    case "hidetag": {
      if (isGroup) {
        if (!owner && !(await perms.isGroupAdmin(sock, chat, sender))) return reply(M.err("Sem permissão", "Admins/dono."));
        try {
          const md = await sock.groupMetadata(chat);
          const t = args.join(" ") || "📢";
          await sock.sendMessage(chat, { text: t, mentions: md.participants.map(p=>p.id) });
          return;
        } catch (e) { return reply(M.err("Erro", e.message)); }
      }
      return reply(M.err("Só em grupos", "Este comando só funciona em grupo."));
    }
    case "baixar": case "ytmp4_link": {
      // delega para ytmp3/ytmp4
      const url = args[0]; if (!url) return reply(M.usage("baixar", `${prefix}baixar <link YouTube>`));
      const r = await ytdl.mp3(url);
      if (!r.ok) return reply(M.err("Download falhou", r.error));
      return sock.sendMessage(chat, { audio: { url: r.url }, mimetype:"audio/mpeg" }, { quoted: m });
    }
    case "editmsg": {
      const t = args.join(" "); if (!t) return reply(M.usage("editmsg", `${prefix}editmsg <texto a embelezar>`));
      try {
        const out = await ia.ask(`Reescreve em PT-PT de forma elegante, com emojis discretos e formatação markdown leve (negrito, itálico): ${t}`);
        return reply(out);
      } catch (e) { await M.notifyOwner(sock, "editmsg erro: "+e.message); return; }
    }
    case "setwelcome": {
      if (!owner && !(isGroup && await perms.isGroupAdmin(sock, chat, sender))) return reply(M.err("Sem permissão", "Admins/dono."));
      const t = args.join(" "); if (!t) return reply(M.usage("setwelcome", `${prefix}setwelcome <texto, use @user / {group} / {count} / {bot} / {data} / {hora} / {name}>`));
      db.settings.welcome = t; db.save();
      return reply(M.ok("Welcome actualizado", "✓"));
    }
    case "bemvindo": {
      const sub = (args[0]||"").toLowerCase();
      if (!isGroup) return reply(M.warn("Apenas grupos", "Só em grupos."));
      const g = db.group(chat);
      if (sub === "on")  { g.welcome = true; db.settings.welcomeEnabled = true; db.save(); return reply(M.ok("Welcome ON","✓")); }
      if (sub === "off") { g.welcome = false; db.save(); return reply(M.ok("Welcome OFF","✓")); }
      if (sub === "texto") { const t = args.slice(1).join(" "); if (!t) return reply(M.usage("bemvindo texto", `${prefix}bemvindo texto <msg>`)); db.settings.welcome = t; db.save(); return reply(M.ok("Texto actualizado","✓")); }
      if (sub === "teste") { await welcome.handle(sock, { id: chat, action: "add", participants: [sender] }); return; }
      if (sub === "limpar") { db.settings.welcome = "Bem-vindo @user!"; db.save(); return reply(M.ok("Limpo","✓")); }
      if (sub === "status" || !sub) return reply(welcome.statusMessage());
      return reply(welcome.statusMessage());
    }
    case "addcmd": {
      if (!owner && !(isGroup && await perms.isGroupAdmin(sock, chat, sender))) return reply(M.err("Sem permissão", "Admins/dono."));
      const j = args.join(" "); const i = j.indexOf("=");
      if (i < 0) return reply(M.usage("addcmd", `${prefix}addcmd <gatilho> = <resposta>`));
      db.autocmds[j.slice(0,i).trim().toLowerCase()] = j.slice(i+1).trim(); db.save();
      return reply(M.ok("Auto-resposta criada", "✓"));
    }
    case "delcmd": {
      delete db.autocmds[args.join(" ").toLowerCase()]; db.save();
      return reply(M.ok("Removido", "✓"));
    }
    case "listcmd": {
      const k = Object.keys(db.autocmds);
      return reply(M.info("Auto-respostas", k.length ? k.map((x,i)=>`*${i+1}.* ${x}`).join("\n") : "Nenhuma."));
    }
    case "setdefaultreact": {
      if (!owner) return reply(M.err("Sem permissão", "Só o Dono."));
      const emojis = args.join("").split("").filter(c => c.length > 0);
      if (!emojis.length) return reply(M.usage("setdefaultreact", `${prefix}setdefaultreact ❄️💧🌀🤖`));
      db.settings.defaultReact = emojis; db.save();
      return reply(M.ok("Reactions actualizadas", emojis.join(" ")));
    }

    // ───── MEDIA ─────
    case "ytmp3": {
      if (!args[0]) return reply(M.usage("ytmp3", `${prefix}ytmp3 <link/nome>`));
      try {
        let link = args.join(" ");
        // se não é URL, pesquisa
        if (!/^https?:\/\//.test(link)) {
          const r = await ytdl.search(link, 1);
          if (!r.length) return reply(M.err("Não encontrei", "Tenta outro nome."));
          link = r[0].url;
        }
        const dl = await ytdl.downloadMp3(link);
        await sock.sendMessage(chat, {
          audio: { url: dl.url }, mimetype: "audio/mpeg",
          fileName: `${(dl.title || "flashbot").replace(/[^\w\s.-]/g, "")}.mp3`,
          contextInfo: { externalAdReply: {
            title: dl.title?.slice(0,60) || "FLASH-BOT", body: "by " + (dl.author || "thebest"),
            mediaType: 2, mediaUrl: link, sourceUrl: link, thumbnailUrl: dl.thumbnail
          }}
        }, { quoted: m });
        await reactions.reactCustom(sock, m, "✅");
        return reply(M.box("🎵 " + (dl.title || "Áudio"),
          `${M.styled("Autor:")} *${dl.author||"?"}*\n${M.styled("Duração:")} ${dl.duration||"?"}\n${M.styled("Views:")} ${dl.views||"?"}\n${M.styled("Likes:")} ${dl.likes||"?"}\n${M.styled("Publicado:")} ${dl.published||"?"}\n\n${M.styled("Link:")} ${link}`, "ASSIST"));
      } catch (e) {
        await reactions.reactCustom(sock, m, "❌");
        return reply(M.err("Erro no download", e.message));
      }
    }
    case "ytmp4": {
      if (!args[0]) return reply(M.usage("ytmp4", `${prefix}ytmp4 <link/nome>`));
      try {
        let link = args.join(" ");
        if (!/^https?:\/\//.test(link)) {
          const r = await ytdl.search(link, 1);
          if (!r.length) return reply(M.err("Não encontrei", "Tenta outro nome."));
          link = r[0].url;
        }
        const dl = await ytdl.downloadMp4(link);
        await sock.sendMessage(chat, { video: { url: dl.url }, caption: M.box("🎬 " + dl.title, `${M.styled("Autor:")} ${dl.author||"?"}`, "ASSIST"), fileName: `${dl.title}.mp4` }, { quoted: m });
        return;
      } catch (e) { return reply(M.err("Erro", e.message)); }
    }
    case "play": {
      if (!args[0]) return reply(M.usage("play", `${prefix}play <nome>`));
      const r = await ytdl.search(args.join(" "), 10);
      if (!r.length) return reply(M.err("Sem resultados", "Tenta outro nome."));
      const lines = r.map((v, i) =>
        `*${i+1}.* ${v.title}\n   👤 ${v.author} • ⏱ ${v.duration} • 👁 ${v.views} views\n   🔗 ${v.url}`
      ).join("\n\n");
      return reply(M.box("🎵 RESULTADOS — " + args.join(" "),
        lines + `\n\n${M.styled("Para baixar:")} \`${prefix}ytmp3 <link>\``, "ASSIST"));
    }
    case "tts": {
      const t = args.join(" "); if (!t) return reply(M.usage("tts", `${prefix}tts <texto>`));
      try {
        const url = `https://api.streamelements.com/kappa/v2/speech?voice=Vitoria&text=${encodeURIComponent(t)}`;
        await sock.sendMessage(chat, { audio: { url }, mimetype: "audio/mpeg", ptt: true }, { quoted: m });
      } catch (e) { return reply(M.err("TTS falhou", e.message)); }
      return;
    }

    case "sugestao": {
      const s = args.join(" "); if (!s) return reply(M.usage("sugestao", `${prefix}sugestao <ideia>`));
      // guarda em um log simples
      const f = path.join(__dirname, "database", "sugestoes.json");
      let arr = []; try { arr = JSON.parse(fs.readFileSync(f, "utf8")); } catch {}
      arr.push({ from: sender, name: pushName, text: s, at: Date.now() });
      try { fs.writeFileSync(f, JSON.stringify(arr, null, 2)); } catch {}
      return reply(M.ok("Sugestão recebida", "Obrigado! O dono vai ler."));
    }

    default:
      return reply(M.info("Em construção", `O comando \`.${cmd}\` foi reconhecido mas ainda está em desenvolvimento.\n${M.styled("Sugere melhorias com")} \`${prefix}sugestao\``));
  }
}

function formatUptime(s) {
  const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

module.exports = { handle };
