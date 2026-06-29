// lib/aliases.js — V6.2: 300+ comandos canónicos, ~1500 aliases
const A = {
  // ─── MENUS ───
  menu: ["m","help","ajuda","comandos","cmds","lista","start","comeco","menuprincipal","ola"],
  menuadm: ["menuadmin","menuadms","admmenu","adminmenu","menumod","menuadmins","menumoderacao"],
  menudono: ["menuowner","ownermenu","menucreator","menuking","menudonos","menusupremo"],
  menuia: ["menuai","aimenu","iamenu","menucerebro","menubrain","menugemini"],
  menuvendas: ["menusell","menushop","menuloja","menumegas","menumeganet","menuvenda"],
  menujogos: ["menugames","gamesmenu","menudiverso","menufun","menugame","menudiversao"],
  menupersonalizar: ["menuset","menupers","menucustom","menustyle","menusettings","menuconfig","menupersonalizacao"],
  menumedia: ["menumidia","mediamenu","menudl","menudownload","menubaixar"],
  menuanti: ["antimenu","menuprot","menuantis","menuprotecao","menusegur"],
  menualuguel: ["menurental","menucode","menucodigo","menucodes","menukeys"],
  menuwelcome: ["menubemvindo","welcomemenu","menubv"],
  menufonte: ["menufonts","fonts","fontesmenu","menustyles","menuestilos"],

  // ─── INFO ───
  ping: ["p","pong","velocidade","speed","latencia","velocity","lag","teste"],
  info: ["botinfo","sobre","about","infos","infobot","ver","quemes","stat"],
  prefixo: ["prefix","pref","verprefix","comandoprefix"],
  perfil: ["profile","me","eu","minhainfo","mim","myinfo","verperfil"],
  dono: ["owner","creator","criador","master","boss","chefe","verdono","mostradono"],
  vcard: ["vc","cartao","contacto","contact","contactcriador","contatocriador"],
  status: ["estado","sysinfo","sistema","systemstatus"],
  uptime: ["online","tempo","timeon","online_time"],
  ranking: ["rank","top","topusers","ranks","topdez","melhores"],
  avaliar: ["rate","avaliacao","rating","review","nota"],
  veravaliacoes: ["ratings","reviews","verratings","avaliacoes"],
  sugestao: ["sugerir","suggest","ideia","report","reportar","feedback"],
  notifs: ["notifications","notificacoes","vernotifs","vernotificacoes","alertas"],

  // ─── OWNER setup ───
  meulid: ["mylid","verlid","lid","whoami","quemsou"],
  serdono: ["claimowner","tornardono","becomeking","virardono","claim"],
  salvar: ["save","saveowner","confirmar_dono","confirmardono"],
  donoinfo: ["ownerinfo","infodono","dadosdono","verinfo_dono"],
  setname: ["setnome","mudarnome","trocarnome","mynome","setmynome"],
  setdonofoto: ["setfotodono","fotodono","setownerpic","ownerpic"],
  setdonolink: ["donolink","linkdono","setownerlink","ownerlink","setlinkdono"],
  setdonowa: ["donowa","wadono","setownerwa","setdononumero","donowhatsapp"],
  setdonobio: ["donobio","biodono","setownerbio","ownerbio"],
  addsubdono: ["addsub","adicionarsubdono","subdono","novosubdono"],
  delsubdono: ["delsub","removersubdono","tirarsubdono"],
  listsubs: ["subs","subdonos","versubs","versubdonos"],
  vergrupos: ["listgrupos","grupos","activegroups","gruposativos","veractivos"],
  vergruposaluguel: ["aluguelgrupos","gruposrental","verrental","grupospagos"],

  // ─── ADMIN ───
  ban: ["kick","banir","remover","expulsar","tchau","fora","apagaruser","retirar","expel","del"],
  promover: ["promote","admin","tornaradm","adicionaradm","up"],
  rebaixar: ["demote","removeadm","retirardm","tirarstar","down"],
  mute: ["calar","silenciar","mutar","calarse","caleseboca","sh"],
  unmute: ["desmutar","falar","permitir","liberar","dasilencia"],
  fechar: ["close","fechargp","grupofechar","muteall","fecharg","trancar","lock"],
  abrir: ["open","abrirgp","grupoabrir","unmuteall","abrirg","destrancar","unlock"],
  fix: ["pin","fixar","fixmsg","prender","pregar","stick","fixarmsg","pinmsg"],
  desafix: ["unpin","desafixar","despinar","tirarfix","unfixar"],
  limpar: ["clear","limpartudo","cls","apagartudo","cleargp","limpargp"],
  all: ["todos","menc","mencionar","markall","everyone","atall","invocar","convocar","tagall"],
  hidetag: ["htag","tagsilenciosa","ht","silencmenc","ghosttag"],
  listadv: ["listwarns","veradv","advertencias","warnlist","listadvs","verwarns"],
  listmuted: ["listamuted","vermutados","mutados","listmute"],
  limparwarns: ["clearwarns","resetwarns","zerarwarns","limparavisos","resetadv"],
  warn: ["advertir","avisar","aviso","warning","adv"],
  unwarn: ["removerwarn","retirarwarn","apagarwarn","desadvertir"],
  agenda: ["scheduler","horario","schedule","agendar","setagenda"],
  agendamsg: ["scheduledmsg","msgagendada","programarmsg","agendarmsg"],
  grupo: ["gpinfo","grupoinfo","infogp","gpdata","dadosgp"],
  fotogp: ["mudarfotogp","setfotogp","novafotogp","setgpphoto"],
  setlimite: ["limite","setlim","definirlimite","limit","setlimit"],
  removerlimite: ["dellim","tirarlimite","removerlim","resetlimit"],
  fakeban: ["bantroll","trollban","brincarban"],

  // ─── OWNER ações ───
  bcgp: ["broadcastgp","bcgrupo","bcg"],
  bcall: ["broadcastall","bctudo","bca","broadcast","bc"],
  reiniciar: ["restart","reboot","rs","reload"],
  desligar: ["shutdown","desligarbot","off","sair","exit"],
  modo: ["mode","modobot","setmodo","setmode"],
  backup: ["dump","exportar","exportdb","savedb"],
  restaurar: ["restore","importdb","importar","loaddb"],
  resetbot: ["fabrica","reset","factoryreset"],
  banir_global: ["gblock","gbanir","blockglobal","banglobal"],
  desbanir_global: ["gunblock","gdesbanir","unbanglobal"],

  // ─── ALUGUEL ───
  gencode: ["gerarcodigo","gerarkey","novocodigo","novakey","newcode","criarkey"],
  resgatar: ["redeem","ativar","activar","usarcode","activarcode","ativarkey"],
  desbloquear: ["unblock","unblockgp","liberar","destrancar","liberargp"],
  unblockcode: ["geraunblock","gerardesbloqueio","newunblock","codedesbloqueio"],
  listcodes: ["verkeys","listacodes","listkeys","vercodes"],
  delcode: ["apagarcodigo","removercode","tirarcode","delkey"],
  statusaluguel: ["aluguelstatus","statuscode","veraluguel","ver_aluguel"],
  diasrestantes: ["daysleft","tempoaluguel","tempo_aluguel"],

  // ─── IA ───
  ia: ["ai","chatgpt","cerebro","pergunta","gpt","perguntar","question","bot","gemini"],
  ensinar: ["teach","aprender","ensinaria","learnia","add_kb","add_knowledge"],
  esquecer: ["forget","apagaria","esqueceria","del_kb"],
  interact: ["interagir","conversar","modoconversa","interactai","modochat"],
  conhecimento: ["knowledge","memoria","aprendi","mybrain","kb"],
  google: ["pesquisar","g","search","pesquisa","procurar","gsearch"],
  gimg: ["googleimg","imggoogle","imagengoogle","picgoogle","imgs","imagens"],
  traduzir: ["translate","tr","tradutor"],
  resumir: ["resumo","summarize","sum"],
  analisar: ["analyze","analise"],
  editmsg: ["editaria","editia","editarmsg","editar","ialedit"],

  // ─── VENDAS ───
  tabela: ["table","precos","preco","precario","tabelapreco","precolista","listatab"],
  compra: ["comprar","encomenda","pedido","buy","pedir"],
  confirmar: ["confirmarvenda","confirmcompra","approve","aprovar","ok"],
  vendas: ["sells","vendasdehoje","todayvendas","vendashoje"],
  vendasdia: ["sellsday","vendaspordia","verdvendasdia"],
  totalvendas: ["totalsell","vendastotal","totalfaturado"],
  pagamento: ["pay","formapagamento","pagar","comoP","comopagar"],
  detectar: ["detectarcomp","detectcomp","verifcomp","testcomp","testarcomp"],
  setmpesa: ["mpesaconfig","configmpesa","mpesa_set","setmp"],
  setemola: ["emolaconfig","configemola","emola_set","setem"],
  settabela: ["addpacote","addmegas","novopacote","tabela_add"],
  deltabela: ["delpacote","removerpacote","apagarpacote"],
  vermpesa: ["verifimpesa","mpesainfo"],
  veremola: ["verifiemola","emolainfo"],
  autovendas: ["autovenda","autoresponde_vendas","autoreply_sells"],

  // ─── PROJECTOS / MKT ───
  novoprojeto: ["criarprojeto","newproject","novoproj","addprojeto"],
  verprojetos: ["projetos","listprojetos","myprojects","meusprojetos"],
  editarprojeto: ["editproj","editproject","alterarprojeto"],
  publicar: ["publish","postar","divulgar","postar_pj"],
  eliminarprojeto: ["delprojeto","apagarprojeto","removerprojeto"],

  // ─── ANTIS ───
  antilink: ["antilinks","alink"],
  antisticker: ["antistk","astk","antistickers"],
  antiaudio: ["aaudio","antiaudios","antimsgaudio"],
  antivideo: ["avideo","antivideos"],
  antidoc: ["antidocs","adoc","antidocumento"],
  antifake: ["antifakes","afake"],
  antiflood: ["antifloods","aflood","antispam"],
  antifoto: ["antiimg","antiimage","antipic"],
  antipalavrao: ["antibadword","antipalavroes","antipv"],
  statusantis: ["antistatus","verantis","listantis","statusanti","verprot"],

  // ─── JOGOS ───
  jdv: ["jogodavelha","velha","ttt","tictactoe"],
  jdvgp: ["jdv2","jogarcom","velhagp","tttgp","jdvplayer"],
  jogar: ["play_pos","mover","colocar","jogarpos"],
  adivinha: ["guess","adv","numero","adivinhar"],
  chutar: ["palpite","tentar","chute"],
  ppt: ["pedra","rps","jokenpo","pedrapapel"],
  roleta: ["roulette","sorte","spin"],
  dado: ["dice","roll","rolardado"],
  forca: ["hangman","jogoforca"],
  xadrez: ["chess","jogarxadrez"],
  letramusica: ["lyrics_quiz","quizmusica","musicaquiz"],
  adivinhafilme: ["quizfilme","filmequiz","advfilme"],
  adivinhaanime: ["quizanime","animequiz","advanime"],
  ranking_jogos: ["topjogos","topplayers","melhoresjogadores"],

  // ─── PERSONALIZAR ───
  setprefix: ["mudarprefix","alterarprefix","novoprefix","setpref","changeprefix"],
  setfont: ["mudarfonte","font","estilo","setfonte","mudarestilo"],
  fonte: ["fontedit","fonteedit","editarfonte","escreverfonte","textfont"],
  listfonts: ["fontes","fontslist","verfontes","verestilos"],
  setfoto: ["mudarfoto","novafoto","alterarfoto","setpic","setbotpic"],
  setbotnome: ["setbotnome","botnome","mudarnomebot"],
  setmenupic: ["setmenu","fotomenu","menupic","menufoto"],
  setvendaspic: ["setvendasfoto","setmenuvendaspic"],
  setwelcomepic: ["fotowelcome","welcomepic","welcomefoto"],
  setwelcome: ["mudarwelcome","welcometxt","textwelcome","setwelcometxt"],
  setbyepic: ["fotobye","byepic","fotosaida"],
  setbyetxt: ["mudarbye","byetxt","setsaida"],
  bemvindo: ["welcome","wel","bv"],
  addcmd: ["addcomando","novocmd","autoresp","autoresponder","addautoresponder"],
  delcmd: ["removercmd","apagarcmd","tirarcmd","delautoresp"],
  listcmd: ["listacmd","listcomandos","autocmds","verautocmds"],
  setdefaultreact: ["setreact","mudarreact","reactdefault"],
  setbio: ["mudarbio","biobot","alterarbio"],
  setseparador: ["setsep","separador","sepmenu"],
  setrodape: ["setfooter","rodape","footer"],
  setemojicargo: ["emojicargo","setrolemoji","emojirole"],

  // ─── MEDIA ───
  tts: ["voz","falar","speak","narrar","audiotxt","textovoz"],
  ytmp3: ["yt","music","musica","baixarmusica","mp3","tocar"],
  ytmp4: ["video","baixarvideo","mp4","ytvideo"],
  play: ["song","ouvir","tocarmusica","ytplay"],
  baixar: ["dl","download","baixaryt","ytdl"],
  img: ["image","imagem","foto","picture"],
  sticker: ["fig","figurinha","stk","s","fazerstk"],
  toimg: ["paraimg","stk2img","stickerparafoto","sti"],
  tiktok: ["tt","tkdl","baixartiktok"],
  instagram: ["ig","igdl","baixarinsta"],
  facebook: ["fb","fbdl","baixarfb"],
  twitter: ["xdl","twdl","baixartw"]
};

const reverse = {};
for (const [canon, list] of Object.entries(A)) {
  reverse[canon] = canon;
  for (const a of list) reverse[a] = canon;
}

function resolve(cmd) { return reverse[cmd?.toLowerCase()] || null; }
function suggest(cmd) {
  if (!cmd) return null;
  cmd = cmd.toLowerCase();
  let best=null, bd=99;
  for (const c of Object.keys(reverse)) { const d=lev(cmd,c); if (d<bd){bd=d;best=c;} }
  return bd<=3 ? best : null;
}
function lev(a,b){const m=[];for(let i=0;i<=b.length;i++)m[i]=[i];for(let j=0;j<=a.length;j++)m[0][j]=j;for(let i=1;i<=b.length;i++)for(let j=1;j<=a.length;j++)m[i][j]=b[i-1]===a[j-1]?m[i-1][j-1]:Math.min(m[i-1][j-1]+1,m[i][j-1]+1,m[i-1][j]+1);return m[b.length][a.length];}

const totalAliases = Object.values(A).reduce((s,a)=>s+a.length, 0);
module.exports = { resolve, suggest, all: Object.keys(A), totalAliases };
