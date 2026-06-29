// lib/detector.js — Detector V6.2: bonito, com mpesa/emola config
const sales = require("./sales");
const db = require("./db");
const fonts = require("./fonts");

const RE = {
  mpesa: [
    /confirmado.*?ID[: ]*\s*([A-Z0-9]{8,14}).*?([\d.,]+)\s*MT.*?(?:para|de)\s+(?:o\s+)?n[uú]mero\s+(\d{9,15})/is,
    /transac[cç][aã]o\s+([A-Z0-9]{8,14})\s+confirmada.*?([\d.,]+)\s*MT/is,
    /M-?Pesa.*?(?:ID|ref)[: ]*([A-Z0-9]{8,14}).*?([\d.,]+)\s*MT/is,
    /\b([A-Z]{2,4}\d{2}[A-Z0-9]{4,10})\b.*?([\d.,]+)\s*MT/is
  ],
  emola: [
    /e-?mola.*?(?:ref|id|cod)[: ]*([A-Z0-9]{6,14}).*?([\d.,]+)\s*MT/is,
    /transferência\s+e-?mola.*?([A-Z0-9]{8,14}).*?([\d.,]+)\s*MT/is,
    /\be-?mola\b.*?([A-Z0-9]{8,14}).*?([\d.,]+)\s*MT/is
  ],
  mola: [
    /\bmola\b.*?(?:ref|id)[: ]*([A-Z0-9]{6,14}).*?([\d.,]+)\s*MT/is
  ]
};

function val(s){ return parseFloat(String(s).replace(/\s/g,"").replace(/[.,](?=\d{3}\b)/g,"").replace(",",".")); }

function detect(text) {
  if (!text || text.length < 12) return null;
  const upper = text.toUpperCase();
  let provider=null, id=null, value=null, to=null, name=null, date=null;

  for (const re of RE.mpesa) { const m=text.match(re); if (m){ provider="M-Pesa"; id=m[1]; value=val(m[2]); to=m[3]||null; break; } }
  if (!provider) for (const re of RE.emola) { const m=text.match(re); if (m){ provider="eMola"; id=m[1]; value=val(m[2]); break; } }
  if (!provider) for (const re of RE.mola)  { const m=text.match(re); if (m){ provider="Mola";  id=m[1]; value=val(m[2]); break; } }

  if (!provider) {
    const idM = text.match(/\b([A-Z]{2,4}\d{2,4}[A-Z0-9]{4,10})\b/);
    const vM  = text.match(/([\d.,]+)\s*MT/i);
    if (idM && vM && (upper.includes("CONFIRMADO") || upper.includes("TRANSF"))) {
      provider="Genérico"; id=idM[1]; value=val(vM[1]);
    }
  }
  if (!provider || !id || !value || isNaN(value)) return null;

  const d = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s+(?:às\s+)?\d{1,2}:\d{2})?)/);
  if (d) date = d[1];
  const n = text.match(/(?:de|from)\s+([A-Z][A-Za-zÀ-ÿ\s]{3,30})/);
  if (n) name = n[1].trim();

  // Verifica destino esperado
  const cfg = sales.ensure();
  let destOk = null;
  if (provider === "M-Pesa" && cfg.mpesa.number && to) destOk = (to === cfg.mpesa.number);
  if (provider === "eMola" && cfg.emola.number && to) destOk = (to === cfg.emola.number);

  const pkg = sales.findByPrice(value);
  return { provider, id, value, to, name, date, package: pkg, destOk };
}

function render(d, sender) {
  if (!d) return null;
  const f = (t,s)=>fonts.apply(t,s);
  const verified = d.destOk === false
    ? "⚠️ " + f("Destino diferente do configurado","italic")
    : "✅ " + f("Verificado","italic");

  let body = `${verified}\n\n`;
  body += `🔑 *${f("Chave:","smallcaps")}* \`${d.id}\`\n`;
  body += `🏦 *${f("Operadora:","smallcaps")}* \`${d.provider}\`\n`;
  body += `💸 *${f("Valor:","smallcaps")}* \`${d.value.toFixed(2)} MT\`\n`;
  if (d.name) body += `👤 *${f("De:","smallcaps")}* \`${d.name}\`\n`;
  if (d.to)   body += `📲 *${f("Para:","smallcaps")}* \`${d.to}\`\n`;
  if (d.date) body += `⏰ *${f("Data:","smallcaps")}* \`${d.date}\`\n`;
  if (sender) body += `📨 *${f("Enviado por:","smallcaps")}* @${sender.split("@")[0]}\n`;
  if (d.package) {
    body += `\n🎁 *${f("Pacote correspondente:","smallcaps")}* \`${d.package.name}\` ⇢ \`${d.package.price} MT\``;
    body += `\n\n${f("Pedido recebido. Em breve serás atendido.","italic")}`;
  } else {
    body += `\n\n${f("Não encontrei pacote com este valor — atendimento manual.","italic")}`;
  }
  return body;
}

module.exports = { detect, render };
