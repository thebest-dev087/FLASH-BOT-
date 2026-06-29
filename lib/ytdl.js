// lib/ytdl.js — YouTube via systemzone API + fallback yt-search
const axios = require("axios");
const config = require("../config");

const BASE = config.apis?.systemzone || "https://api.systemzone.store";

async function search(query) {
  try {
    const { data } = await axios.get(`${BASE}/v2/yt/search`, {
      params: { q: query }, timeout: 20000
    });
    if (Array.isArray(data?.results) && data.results.length) return data.results;
    if (Array.isArray(data) && data.length) return data;
  } catch {}
  try {
    const yts = require("yt-search");
    const r = await yts(query);
    return (r.videos || []).slice(0,10).map(v => ({
      title: v.title, url: v.url, duration: v.timestamp,
      thumb: v.thumbnail, author: v.author?.name, views: v.views
    }));
  } catch { return []; }
}

async function mp3(url) {
  try {
    const { data } = await axios.get(`${BASE}/v2/player`, {
      params: { url, type: "mp3" }, timeout: 60000
    });
    const u = data?.audio || data?.url || data?.result?.url || data?.data?.url;
    if (u) return { ok:true, url: u, title: data?.title || "audio" };
  } catch {}
  return { ok:false, error: "Falha ao obter MP3" };
}

async function mp4(url) {
  try {
    const { data } = await axios.get(`${BASE}/v2/player`, {
      params: { url, type: "mp4" }, timeout: 60000
    });
    const u = data?.video || data?.url || data?.result?.url || data?.data?.url;
    if (u) return { ok:true, url: u, title: data?.title || "video" };
  } catch {}
  return { ok:false, error: "Falha ao obter MP4" };
}

module.exports = { search, mp3, mp4 };
