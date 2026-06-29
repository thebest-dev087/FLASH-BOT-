// lib/vcard.js — gera vCard do criador
const config = require("../config");

function creator() {
  const c = config.creator;
  const vcard =
`BEGIN:VCARD
VERSION:3.0
FN:${c.name}
ORG:${c.tag};
TEL;type=CELL;type=VOICE;waid=${c.wa}:+${c.wa}
URL:${c.waLink}
NOTE:Criador do FLASH-BOT — github: ${c.github}
END:VCARD`;
  return {
    contacts: {
      displayName: c.name,
      contacts: [{ vcard }]
    }
  };
}

function fromUser(user) {
  const num = (user.jid || "").split("@")[0];
  const name = user.name || "Utilizador";
  const vcard =
`BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;type=CELL;type=VOICE;waid=${num}:+${num}
NOTE:LID ${user.lid || "?"} • FLASH-BOT user
END:VCARD`;
  return { contacts: { displayName: name, contacts: [{ vcard }] } };
}

module.exports = { creator, fromUser };
