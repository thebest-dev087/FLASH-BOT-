// lib/google.js — pesquisa Google + DuckDuckGo (fallback). V6.2
const axios = require("axios");
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36";

async function ddg(query, limit=5) {
  try {
    const { data } = await axios.get("https://html.duckduckgo.com/html/", {
      params: { q: query },
      headers: { "User-Agent": UA, "Accept-Language":"pt-PT,pt;q=0.9" },
      timeout: 15000
    });
    const out = [];
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(data)) && out.length < limit) {
      const link = decodeURIComponent(m[1].replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/,"").split("&")[0]);
      const title = m[2].replace(/<[^>]+>/g,"").trim();
      const snip = m[3].replace(/<[^>]+>/g,"").trim();
      if (link.startsWith("http")) out.push({ title, link, snippet: snip });
    }
    return out;
  } catch { return []; }
}

async function googleText(query, limit=5) {
  try {
    const { data } = await axios.get("https://www.google.com/search", {
      params: { q: query, num: limit+3, hl: "pt" },
      headers: { "User-Agent": UA }, timeout: 15000
    });
    const out = [];
    const re = /<a href="\/url\?q=([^&"]+)[^"]*"[^>]*>(?:[^<]|<(?!h3))*<h3[^>]*>([^<]+)<\/h3>/g;
    let m;
    while ((m = re.exec(data)) && out.length < limit) {
      const link = decodeURIComponent(m[1]);
      const title = m[2].trim();
      if (link.startsWith("http") && !link.includes("google.")) out.push({ title, link, snippet:"" });
    }
    return out;
  } catch { return []; }
}

async function searchText(query, limit=5) {
  let r = await googleText(query, limit);
  if (!r.length) r = await ddg(query, limit);
  return r;
}

async function searchImages(query, limit=5) {
  try {
    const { data } = await axios.get("https://www.google.com/search", {
      params: { q: query, tbm: "isch", hl: "pt" },
      headers: { "User-Agent": UA }, timeout: 15000
    });
    const imgs = [];
    const re1 = /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi;
    let m;
    while ((m = re1.exec(data)) && imgs.length < limit) {
      const u = m[1].replace(/\\u003d/g,"=").replace(/\\u0026/g,"&");
      if (!u.includes("gstatic.com") && !u.includes("google.com/logos")) imgs.push(u);
    }
    if (!imgs.length) {
      // fallback: bing
      const r = await axios.get("https://www.bing.com/images/search", {
        params: { q: query, form: "HDRSC2" },
        headers: { "User-Agent": UA }, timeout: 15000
      });
      const re2 = /murl&quot;:&quot;(https?:\/\/[^&"]+\.(?:jpg|jpeg|png|webp)[^&"]*)/gi;
      let mm;
      while ((mm = re2.exec(r.data)) && imgs.length < limit) imgs.push(mm[1]);
    }
    return imgs;
  } catch { return []; }
}

module.exports = { searchText, searchImages };
