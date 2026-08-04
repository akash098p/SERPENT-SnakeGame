// ════════════════════════════════════════════════════════════════
// STORAGE & CONFIGURATION
// ════════════════════════════════════════════════════════════════

const LD=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}};
const SV=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

let CFG  = LD('sp2_cfg',  {volume:.7,bgVolume:1});
let HS   = LD('sp2_hs',   {easy:0,medium:0,hard:0});
let WAL  = LD('sp2_wal',  {coins:0,diamonds:0});
let SHOP = LD('sp2_shop', {skins:{owned:[0],sel:0},themes:{owned:[0],sel:0},boosts:{}});
let CHEAT_ACTIVE = LD('sp2_cheat', false);
let DEV_SNAPSHOT = null;

// Initialize shop structure
SHOP.skins=SHOP.skins||{owned:[0],sel:0};
SHOP.themes=SHOP.themes||{owned:[0],sel:0};
SHOP.boosts=SHOP.boosts||{};
if(!Array.isArray(SHOP.skins.owned)||!SHOP.skins.owned.length)SHOP.skins.owned=[0];
if(!Array.isArray(SHOP.themes.owned)||!SHOP.themes.owned.length)SHOP.themes.owned=[0];

// Validate selections
if(!CHEAT_ACTIVE){
  if(!SHOP.skins.owned.includes(SHOP.skins.sel))SHOP.skins.sel=0;
  if(!SHOP.themes.owned.includes(SHOP.themes.sel))SHOP.themes.sel=0;
}
if(typeof CFG.bgVolume!=='number')CFG.bgVolume=1;

function deepClone(obj){return JSON.parse(JSON.stringify(obj));}

function snapshotBeforeDevMode(){
  DEV_SNAPSHOT={
    themeSel:SHOP.themes.sel??0,
    skinSel:SHOP.skins.sel??0,
    boosts:deepClone(SHOP.boosts||{})
  };
}

function setAllBoostsToMax(){
  if(!SHOP.boosts)SHOP.boosts={};
  Object.keys(POWERUPS).forEach(k=>{SHOP.boosts[k]=5;});
}

function enterDevMode(){
  if(!DEV_SNAPSHOT)snapshotBeforeDevMode();
  CHEAT_ACTIVE=true;
  setAllBoostsToMax();
  SV('sp2_cheat',true);
  SV('sp2_shop',SHOP);
}

function exitDevMode(){
  CHEAT_ACTIVE=false;
  if(DEV_SNAPSHOT){
    SHOP.themes.sel=DEV_SNAPSHOT.themeSel??0;
    SHOP.skins.sel=DEV_SNAPSHOT.skinSel??0;
    SHOP.boosts=deepClone(DEV_SNAPSHOT.boosts||{});
  }else{
    SHOP.themes.sel=0;
    SHOP.skins.sel=0;
    SHOP.boosts={};
  }
  previewThemeIdx=null;previewSkinIdx=null;
  pendingThemeBuy=null;pendingSkinBuy=null;
  themeIdx=SHOP.themes.sel||0;
  skinIdx=SHOP.skins.sel||0;
  SV('sp2_cheat',false);
  SV('sp2_shop',SHOP);
}
