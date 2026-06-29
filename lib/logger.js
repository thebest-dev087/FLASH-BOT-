// lib/logger.js — terminal bonito grande para Termux
const chalk = require("chalk");

// ASCII art FLASH-BOT grande, em blocos
const ART = [
  "███████╗██╗      █████╗ ███████╗██╗  ██╗      ██████╗  ██████╗ ████████╗",
  "██╔════╝██║     ██╔══██╗██╔════╝██║  ██║      ██╔══██╗██╔═══██╗╚══██╔══╝",
  "█████╗  ██║     ███████║███████╗███████║█████╗██████╔╝██║   ██║   ██║   ",
  "██╔══╝  ██║     ██╔══██║╚════██║██╔══██║╚════╝██╔══██╗██║   ██║   ██║   ",
  "██║     ███████╗██║  ██║███████║██║  ██║      ██████╔╝╚██████╔╝   ██║   ",
  "╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝      ╚═════╝  ╚═════╝    ╚═╝   "
];

function banner() {
  const colors = [chalk.redBright, chalk.magentaBright, chalk.blueBright, chalk.cyanBright, chalk.blueBright, chalk.magentaBright];
  console.log("");
  ART.forEach((line, i) => console.log(colors[i].bold(line)));
  console.log("");
  console.log(chalk.gray("        ") + chalk.yellowBright.bold("⚡ V 6 . 1   •   P R E M I U M   M Z   •   by thebest ⚡"));
  console.log(chalk.gray("        ") + chalk.cyanBright("MOZ BOTS 2026  •  WhatsApp  •  Baileys  •  Termux Ready"));
  console.log(chalk.magenta("        ═══════════════════════════════════════════════════════════"));
  console.log("");
}

function box(title, lines) {
  const w = 60;
  console.log(chalk.cyan("╭" + "─".repeat(w-2) + "╮"));
  console.log(chalk.cyan("│ ") + chalk.yellowBright.bold(title.padEnd(w-4)) + chalk.cyan(" │"));
  console.log(chalk.cyan("├" + "─".repeat(w-2) + "┤"));
  for (const l of lines) console.log(chalk.cyan("│ ") + l.padEnd(w-4) + chalk.cyan(" │"));
  console.log(chalk.cyan("╰" + "─".repeat(w-2) + "╯"));
}

const log = {
  banner, box,
  ok:   (m) => console.log(chalk.greenBright("  ✓ ") + chalk.white(m)),
  info: (m) => console.log(chalk.cyanBright("  ℹ ") + chalk.white(m)),
  warn: (m) => console.log(chalk.yellowBright("  ⚠ ") + chalk.white(m)),
  err:  (m) => console.log(chalk.redBright("  ✗ ") + chalk.white(m)),
  hint: (m) => console.log(chalk.gray("    → " + m)),
  step: (n, m) => console.log(chalk.magentaBright(`  [${n}] `) + chalk.whiteBright.bold(m)),
  raw:  (m) => console.log(m)
};

module.exports = log;
