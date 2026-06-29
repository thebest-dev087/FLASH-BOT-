// lib/games.js — Jogo da velha (3 níveis), PPT, adivinha, dado, roleta
const games = new Map();

function newGame(chat, lvl = 1, opponent = null) {
  const g = { b: Array(9).fill(" "), turn: "X", lvl, opponent, last: Date.now() };
  games.set(chat, g);
  return g;
}
function newAdivinha(chat) {
  const n = Math.floor(Math.random() * 100) + 1;
  games.set(chat + ":adv", { n, tries: 0 });
}

function render(b) {
  const s = (i) => b[i] === " " ? String(i) : b[i];
  return ` ${s(0)} │ ${s(1)} │ ${s(2)}\n───┼───┼───\n ${s(3)} │ ${s(4)} │ ${s(5)}\n───┼───┼───\n ${s(6)} │ ${s(7)} │ ${s(8)}`;
}

function winnerOf(b) {
  const W = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const w of W) if (b[w[0]] !== " " && b[w[0]] === b[w[1]] && b[w[1]] === b[w[2]]) return b[w[0]];
  if (!b.includes(" ")) return "draw";
  return null;
}

function move(chat, pos) {
  const g = games.get(chat);
  if (!g) return { error: "Sem jogo activo. Usa `.jdv 1|2|3` para começar." };
  if (isNaN(pos) || pos < 0 || pos > 8) return { error: "Posição inválida (0-8)." };
  if (g.b[pos] !== " ") return { error: "Casa ocupada." };
  g.b[pos] = "X";
  let w = winnerOf(g.b);
  if (!w) {
    // bot move
    const m = botMove(g.b, g.lvl);
    g.b[m] = "O";
    w = winnerOf(g.b);
  }
  if (w) games.delete(chat);
  return { board: render(g.b), winner: w };
}

function botMove(b, lvl) {
  const empty = b.map((v, i) => v === " " ? i : null).filter(x => x !== null);
  if (lvl <= 1) return empty[Math.floor(Math.random() * empty.length)];
  if (lvl === 2 && Math.random() < 0.45) return empty[Math.floor(Math.random() * empty.length)];
  // Minimax para níveis 2 (parcial) e 3
  function mm(board, isBot) {
    const w = winnerOf(board);
    if (w === "O") return { score: 10 };
    if (w === "X") return { score: -10 };
    if (w === "draw") return { score: 0 };
    let best = { score: isBot ? -99 : 99, i: -1 };
    for (let i = 0; i < 9; i++) {
      if (board[i] !== " ") continue;
      board[i] = isBot ? "O" : "X";
      const r = mm(board, !isBot);
      board[i] = " ";
      if (isBot ? r.score > best.score : r.score < best.score) best = { score: r.score, i };
    }
    return best;
  }
  return mm(b.slice(), true).i;
}

function guess(chat, n) {
  const g = games.get(chat + ":adv");
  if (!g) return { error: "Sem jogo. Usa `.adivinha`." };
  if (isNaN(n)) return { error: "Número inválido." };
  g.tries++;
  if (n === g.n) { games.delete(chat + ":adv"); return { win: true, tries: g.tries }; }
  return { hint: n < g.n ? "📈 Maior!" : "📉 Menor!", tries: g.tries };
}

function ppt(c) {
  c = (c || "").toLowerCase();
  const opts = ["pedra", "papel", "tesoura"];
  if (!opts.includes(c)) return { error: "Escolhe pedra, papel ou tesoura." };
  const bot = opts[Math.floor(Math.random() * 3)];
  if (c === bot) return { bot, result: "🤝 Empate!" };
  const win = (c === "pedra" && bot === "tesoura") || (c === "papel" && bot === "pedra") || (c === "tesoura" && bot === "papel");
  return { bot, result: win ? "🏆 Ganhaste!" : "😎 Eu venci!" };
}

function dado() { return Math.floor(Math.random() * 6) + 1; }
function roleta() {
  const r = ["🎯 Sorte grande!", "💎 Megas grátis!", "😢 Nada hoje…", "🍀 Tenta novamente", "💸 5 MT", "🔥 BÓNUS"];
  return r[Math.floor(Math.random() * r.length)];
}

// Adivinhações culturais
const FILMES = [
  { c: "Filme da Marvel onde um super-herói luta com seu pai e protege Wakanda.", a: "Pantera Negra" },
  { c: "Trilogia épica com Frodo e o anel.", a: "Senhor dos Anéis" },
  { c: "Filme onde a personagem usa pílula vermelha ou azul.", a: "Matrix" }
];
const ANIMES = [
  { c: "Ninja loiro que quer ser Hokage.", a: "Naruto" },
  { c: "Caçadores de demónios em era Taisho.", a: "Demon Slayer" },
  { c: "Piratas em busca do One Piece.", a: "One Piece" }
];
const MUSICAS = [
  { c: "Letra: 'Olha pra mim, vê como estou…' — canta MR Bow.", a: "Lágrimas" },
  { c: "Hit moçambicano sobre amor à distância.", a: "Saudade" }
];

function randomQuiz(type) {
  const pool = type === "filme" ? FILMES : type === "anime" ? ANIMES : type === "musica" ? MUSICAS : null;
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { newGame, newAdivinha, render, move, guess, ppt, dado, roleta, randomQuiz, games };
