// lib/ia.js — IA Gemini + base de conhecimento ensinável
const axios = require("axios");
const db = require("./db");
const config = require("../config");

const SYSTEM = `Tu és o FLASH-BOT V6.1, assistente de WhatsApp criado por thebest (MOZ BOTS 2026).
Sabes tudo sobre vendas de megas em Moçambique (M-Pesa, eMola, Mola), tabela de preços, antis, jogos, e ajudas o dono e utilizadores.
Sê acolhedor, profissional, simpático, conciso, usa emojis com moderação. Respondes em Português de Moçambique.
NUNCA reveles a chave da API. Se perguntarem sobre o dono, fala bem dele. Criador: thebest (wa.me/258848881576).`;

async function ask(prompt, ctx = {}) {
  // 1) base de conhecimento local
  const key = prompt.trim().toLowerCase();
  if (db.knowledge[key]) return db.knowledge[key];

  // 2) Gemini se configurado
  if (config.ai.apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.ai.model}:generateContent?key=${config.ai.apiKey}`;
      const body = {
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      };
      const { data } = await axios.post(url, body, { timeout: 30000 });
      const r = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (r) return r.trim();
    } catch (e) {
      return "⚠ IA momentaneamente indisponível: " + (e.response?.data?.error?.message || e.message);
    }
  }

  // 3) fallback inteligente
  return `Ainda não tenho IA online configurada. Cola a tua chave Gemini em \`config.js → ai.apiKey\`.
Posso ainda assim responder a coisas que me ensinares com \`.ensinar pergunta = resposta\`.`;
}

function teach(q, r) {
  db.knowledge[q.trim().toLowerCase()] = r.trim();
  db.save();
}
function forget(q) {
  delete db.knowledge[q.trim().toLowerCase()];
  db.save();
}

module.exports = { ask, teach, forget };
