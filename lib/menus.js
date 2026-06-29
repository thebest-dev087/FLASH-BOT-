// lib/menus.js — menus bonitos com greeting e foto
const fs = require("fs");
const path = require("path");
const db = require("./db");
const M = require("./messages");
const fonts = require("./fonts");
const config = require("../config");
const moment = require("moment-timezone");

const MEDIA = path.join(__dirname, "..", "media");

function img(name) {
  const p = path.join(MEDIA, name);
  return fs.existsSync(p) ? p : null;
}

function header(name, title) {
  const now = moment().tz(config.timezone);
  const greeting = M.greet(name || "amigo");
  const cmdCount = require("./aliases").all.length;
  return (
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ ⚡ ${fonts.apply(config.botName + " V" + config.version, "botoficia")}
┃ ${greeting}
┃ ${fonts.apply("Data:", "smallcaps")} ${now.format("DD/MM/YYYY")}
┃ ${fonts.apply("Hora:", "smallcaps")} ${now.format("HH:mm:ss")} 🇲🇿
┃ ${fonts.apply("Modo:", "smallcaps")} *${config.mode.toUpperCase()}*
┃ ${fonts.apply("Prefixo:", "smallcaps")} *${db.settings.prefix}*
┃ ${fonts.apply("Comandos:", "smallcaps")} *${cmdCount}+*
┃ ${fonts.apply("Dono:", "smallcaps")} *${db.owner.claimed ? db.owner.name : "—"}*
╰━━━━━━━━━━━━━━━━━━━━╯
   ⚡ ${fonts.apply(title, "botoficia")} ⚡`);
}

function section(label, items) {
  let out = `\n┌─〔 ${fonts.apply(label, "bold")} 〕\n`;
  for (const it of items) out += `│ ◈ ${it}\n`;
  out += `└────────────────`;
  return out;
}

function foot(tag = "ASSIST") {
  return `\n\n${fonts.apply("⚡ FLASH-BOT by thebest • MOZ BOTS 2026", "italic")}\n${fonts.apply("> " + (M.FOOTERS[tag] || tag), "italic")}`;
}

function main(name, prefix = ".") {
  const body = header(name, "MENU PRINCIPAL") +
    section("GERAL", [
      `${prefix}menu`, `${prefix}perfil`, `${prefix}ping`,
      `${prefix}info`, `${prefix}prefixo`, `${prefix}dono`,
      `${prefix}vcard`, `${prefix}status`
    ]) +
    section("SUB-MENUS", [
      `${prefix}menuadm — moderação de grupo`,
      `${prefix}menudono — controlo total`,
      `${prefix}menuia — inteligência artificial`,
      `${prefix}menuvendas — vendas e megas`,
      `${prefix}menujogos — diversão`,
      `${prefix}menupersonalizar — aparência`,
      `${prefix}menumedia — downloads e tts`,
      `${prefix}menuanti — protecções`,
      `${prefix}menualuguel — códigos`,
      `${prefix}menuwelcome — boas-vindas`
    ]) +
    section("LINKS", [
      `Criador: ${config.creator.waLink}`,
      `Repo: ${config.creator.github}`
    ]) +
    foot("ASSIST");
  return { text: body, image: img("menu.jpg") };
}

function adm(name, p=".") {
  return { text: header(name, "MENU • ADMIN") + section("MODERAÇÃO", [
    `${p}ban @user`, `${p}mute @user`, `${p}unmute @user`,
    `${p}promover @user`, `${p}rebaixar @user`,
    `${p}fechar`, `${p}abrir`, `${p}fix`, `${p}desafix`,
    `${p}listadv`, `${p}listmuted`, `${p}limparwarns`,
    `${p}limpar`, `${p}all (marcar todos)`,
    `${p}agenda fechar HH:MM`, `${p}agenda abrir HH:MM`,
    `${p}grupo info`, `${p}fotogp <responde>`,
    `${p}setlimite audio @user N`, `${p}setlimite link @user N`
  ]) + foot("OWNER"), image: img("menu.jpg") };
}

function dono(name, p=".") {
  return { text: header(name, "MENU • DONO SUPREMO") + section("CONTROLO TOTAL", [
    `${p}meulid / ${p}lid`, `${p}salvar`,
    `${p}donoinfo`, `${p}setname <nome>`,
    `${p}addsubdono <lid>`, `${p}delsubdono <lid>`,
    `${p}bcgp <texto>`, `${p}bcall <texto>`,
    `${p}reiniciar`, `${p}desligar`, `${p}modo public|private|rental`,
    `${p}backup`, `${p}gencode <dias>d <usos>`,
    `${p}unblockcode <grupo>`,
    `${p}setdefaultreact <emojis>`, `${p}interactai on|off`
  ]) + foot("OWNER"), image: img("menu.jpg") };
}

function ia(name, p=".") {
  return { text: header(name, "MENU • INTELIGÊNCIA") + section("IA", [
    `${p}ia <pergunta>`, `${p}ensinar p = r`,
    `${p}esquecer <p>`, `${p}conhecimento`,
    `${p}interact on|off (responde sem prefixo)`,
    `${p}google <termo>`, `${p}gimg <termo>`,
    `${p}traduzir <lang> <texto>`,
    `${p}resumir <texto>`, `${p}analisar <texto>`
  ]) + foot("AI"), image: img("ia.jpg") };
}

function vendas(name, p=".") {
  return { text: header(name, "MENU • VENDAS") + section("MEGAS & PROJECTOS", [
    `${p}tabela — preços completos`,
    `${p}compra <pacote> — efectua compra`,
    `${p}confirmar <id> — confirma transação`,
    `${p}vendas — vendas de hoje`,
    `${p}vendasdia DD/MM — vendas de um dia`,
    `${p}totalvendas — total geral`,
    `${p}novoprojeto megas|link|produto`,
    `${p}verprojetos`, `${p}publicar <id>`,
    `${p}eliminarprojeto <id>`,
    `${p}detectar <texto> — testa detector`,
    `${p}pagamento — formas de pagamento`
  ]) + foot("SALES"), image: img("vendas.jpg") };
}

function jogos(name, p=".") {
  return { text: header(name, "MENU • JOGOS") + section("DIVERSÃO", [
    `${p}jdv <1|2|3> — jogo da velha c/ bot (níveis)`,
    `${p}jdvgp @user — desafia outro jogador`,
    `${p}jogar <0-8> — joga uma posição`,
    `${p}adivinha — pensar num número`,
    `${p}chutar <n>`,
    `${p}ppt pedra|papel|tesoura`,
    `${p}letramusica — adivinha música`,
    `${p}adivinhafilme — adivinha filme`,
    `${p}adivinhaanime — adivinha anime`,
    `${p}roleta — sorte`, `${p}dado`
  ]) + foot("GAMES"), image: img("jogos.jpg") };
}

function personalizar(name, p=".") {
  return { text: header(name, "MENU • PERSONALIZAR") + section("APARÊNCIA", [
    `${p}setprefix <novo>`, `${p}setfont <estilo>`,
    `${p}listfonts — vê todos os estilos`,
    `${p}setfoto (responde foto)`,
    `${p}setmenupic (responde foto)`,
    `${p}setwelcomepic (responde foto)`,
    `${p}setwelcome <texto>`,
    `${p}addcmd <gatilho> = <resp>`,
    `${p}delcmd <gatilho>`, `${p}listcmd`,
    `${p}setdefaultreact <emojis>`,
    `${p}setname <nome do bot>`
  ]) + foot("ASSIST"), image: img("menu.jpg") };
}

function midia(name, p=".") {
  return { text: header(name, "MENU • MEDIA") + section("FERRAMENTAS", [
    `${p}tts <texto>`, `${p}ytmp3 <link/nome>`,
    `${p}ytmp4 <link/nome>`, `${p}play <nome>`,
    `${p}img <pesquisa>`, `${p}gimg <pesquisa>`,
    `${p}sticker (responde imagem/video)`,
    `${p}toimg (responde sticker)`,
    `${p}vcard — cartão do criador`
  ]) + foot("ASSIST"), image: img("menu.jpg") };
}

function anti(name, p=".") {
  return { text: header(name, "MENU • ANTIS") + section("PROTECÇÕES (3 NÍVEIS)", [
    `${p}antilink — guia interactivo`,
    `${p}antisticker — guia interactivo`,
    `${p}antiaudio — guia interactivo`,
    `${p}antivideo — guia interactivo`,
    `${p}antidoc — guia interactivo`,
    `${p}antifake — guia interactivo`,
    `${p}antiflood — guia interactivo`,
    `${p}statusantis — vê tudo`,
    `${p}limparwarns — zera warns`,
    `${p}listadv — lista advertidos`
  ]) + foot("ANTI"), image: img("menu.jpg") };
}

function aluguel(name, p=".") {
  return { text: header(name, "MENU • ALUGUEL") + section("CÓDIGOS", [
    `${p}gencode <Nd> <usos> — gera código`,
    `${p}resgatar <codigo> — ativa grupo`,
    `${p}desbloquear <codigo> — desbloqueia bloqueado`,
    `${p}unblockcode <gp> — gera código desbloqueio`,
    `${p}listcodes — lista códigos (dono)`,
    `${p}delcode <code>`, `${p}statusaluguel`
  ]) + foot("SYSTEM"), image: img("vendas.jpg") };
}

function welcome(name, p=".") {
  return { text: header(name, "MENU • BOAS-VINDAS") + section("WELCOME", [
    `${p}bemvindo on/off`,
    `${p}bemvindo texto <msg>`,
    `${p}bemvindo foto (responde foto)`,
    `${p}bemvindo semfoto`,
    `${p}bemvindo teste`,
    `${p}bemvindo cache (limpar)`,
    `${p}bemvindo status`
  ]) + section("VARIÁVEIS", [
    `@user — menção`, `{group} — nome do grupo`,
    `{count} — n. de membros`, `{bot} — nome do bot`,
    `{data} — data actual`, `{hora} — hora actual`,
    `{name} — nome do utilizador`
  ]) + foot("WELCOME"), image: img("welcome.jpg") };
}

module.exports = { main, adm, dono, ia, vendas, jogos, personalizar, midia, anti, aluguel, welcome };
