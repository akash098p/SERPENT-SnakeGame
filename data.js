// ════════════════════════════════════════════════════════════════
// GAME DATA & CONSTANTS
// ════════════════════════════════════════════════════════════════

const MODES = {
  easy:   {ms:165,label:'EASY',   emoji:'🟢',tip:'Casual play',   color:'#56e39f',track:'#113425',danger:'LOW',speed:'SLOW'},
  medium: {ms:108,label:'MEDIUM', emoji:'🟡',tip:'Balanced challenge',color:'#ffd24d',track:'#3a2b08',danger:'MID',speed:'FAST'},
  hard:   {ms: 65,label:'HARD',   emoji:'🔴',tip:'Intense speed', color:'#ff5f73',track:'#3f0a15',danger:'HIGH',speed:'EXTREME'}
};

// Themes: richer, distinct visual personalities
const THEMES = [
  {name:'Abyss',    bg:'#06070d',gA:'#09090f',gB:'#07080e',gc:'#1a1a2e',cost:{c:0,d:0},ok:true, desc:'Deep dark void'},
  {name:'Forest',   bg:'#050e08',gA:'#071209',gB:'#060f07',gc:'#0d2414',cost:{c:40,d:0},ok:true, desc:'Ancient woodland'},
  {name:'Neon City',bg:'#040314',gA:'#090828',gB:'#07071e',gc:'#12103a',cost:{c:60,d:2},ok:true, desc:'Cyberpunk grid'},
  {name:'Lava',     bg:'#0d0400',gA:'#1a0800',gB:'#130600',gc:'#2a0d00',cost:{c:75,d:3},ok:true, desc:'Volcanic heat'},
  {name:'Arctic',   bg:'#030e18',gA:'#071828',gB:'#051422',gc:'#0a2035',cost:{c:90,d:5},ok:true, desc:'Frozen tundra'},
  {name:'Cosmic',   bg:'#03010e',gA:'#0b0520',gB:'#070318',gc:'#130828',cost:{c:0,d:0},ok:false, desc:'Coming soon'}
];
const TH_ICONS=['🌑','🌲','🌆','🌋','❄️','🌌'];
const TH_ACC=['#00e5a0','#22c55e','#a78bfa','#f97316','#38bdf8','#c084fc'];

// Skins: rich, realistic snake color palettes
const SKINS = [
  {name:'Emerald',   head:'#00e87c',body:'#00c464',belly:'#b8f0d8',  out:'#005a30',eyes:'#fff',cost:0, ok:true, desc:'Classic green'},
  {name:'Crimson',   head:'#e83030',body:'#c42020',belly:'#f5c0c0',  out:'#5a0000',eyes:'#fff',cost:50,ok:true, desc:'Blood red viper'},
  {name:'Royal Blue',head:'#3a8fff',body:'#2470e0',belly:'#c0d8ff',  out:'#002466',eyes:'#fff',cost:50,ok:true, desc:'Deep ocean'},
  {name:'Golden',    head:'#ffcc00',body:'#e0aa00',belly:'#fff5b0',  out:'#664400',eyes:'#222',cost:55,ok:true, desc:'Sand boa'},
  {name:'Amethyst',  head:'#a855f7',body:'#8b3de8',belly:'#e8d0ff',  out:'#3b0066',eyes:'#fff',cost:60,ok:true, desc:'Mystic purple'},
  {name:'Ghost',     head:'#c8cce8',body:'#a8acd0',belly:'#eeeef8',  out:'#404060',eyes:'#333',cost:70,ok:true, desc:'Pale albino'},
  {name:'Obsidian',  head:'#2a2a3a',body:'#1a1a28',belly:'#50506a',  out:'#0a0a14',eyes:'#ff4444',cost:80,ok:true, desc:'Midnight black'},
  {name:'Krait',     head:'#1a1a00',body:'#111100',belly:'#f0e060',  out:'#000000',eyes:'#ff0',cost:0, ok:false, desc:'Coming soon'}
];

const FOODS = {
  apple:      {color:'#ff3a3a',pts:10, emoji:'🍎',w:40},
  banana:     {color:'#ffe44a',pts:15, emoji:'🍌',w:25},
  cherry:     {color:'#cc1155',pts:20, emoji:'🍒',w:20},
  grape:      {color:'#9955ee',pts:25, emoji:'🍇',w:15},
  orange:     {color:'#ff7722',pts:12, emoji:'🍊',w:30},
  strawberry: {color:'#ff4477',pts:18, emoji:'🍓',w:25},
  watermelon: {color:'#22dd55',pts:30, emoji:'🍉',w:10},
  pineapple:  {color:'#ffdd00',pts:35, emoji:'🍍',w:8 }
};

const POWERUPS = {
  speed_boost:  {color:'#22d3ee',dur:5000,emoji:'⚡',label:'SPEED',  w:10},
  invincible:   {color:'#fbbf24',dur:3000,emoji:'🛡️',label:'SHIELD', w:5 },
  double_points:{color:'#c084fc',dur:8000,emoji:'✨',label:'2× PTS', w:8 },
  ghost_mode:   {color:'#94a3b8',dur:4000,emoji:'👻',label:'GHOST',  w:6 },
  shrink:       {color:'#60a5fa',dur:200, emoji:'🔵',label:'SHRINK', w:7 },
  magnet:       {color:'#fb923c',dur:7000,emoji:'🧲',label:'MAGNET', w:9 }
};

const COLLS = {
  coin:   {emoji:'🪙',color:'#fbbf24',w:12},
  diamond:{emoji:'💎',color:'#67e8f9',w:2}
};

const BOOST_LV=[
  {add:0,cost:0},{add:2,cost:10},{add:2,cost:25},
  {add:2,cost:40},{add:2,cost:50},{add:4,cost:80}
];

const CHEAT_PASSWORD='TMKC';