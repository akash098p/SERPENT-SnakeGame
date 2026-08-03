// ════════════════════════════════════════════════════════════════
// UI BUILDERS & SCREEN ROUTING
// ════════════════════════════════════════════════════════════════

let curScreen='menuScreen';
const ALL_SCREENS=['menuScreen','themeScreen','skinScreen','boostScreen','infoScreen','settingsScreen'];

// ── INFO SCREEN ───────────────────────────────────────────────────
function buildInfo(){
  const content=document.getElementById('infoContent');content.innerHTML='';
  const grid=document.createElement('div');grid.className='card-grid';
  Object.entries(FOODS).forEach(([k,v])=>{
    const card=document.createElement('div');card.className='s-card';
    card.innerHTML=`<div class="s-icon" style="font-size:2.5rem">${v.emoji}</div>
      <div class="s-body"><div class="s-name">${k[0].toUpperCase()+k.slice(1)}</div>
      <div class="s-desc">Points: <span style="color:${v.color};font-weight:700">+${v.pts}</span></div></div>`;
    grid.appendChild(card);
  });
  content.appendChild(grid);
}

// ── MENU BUILD ────────────────────────────────────────────────────
function buildMenu(){
  AU.sfx('menu_select');
  const sk=SKINS[skinIdx];
  const prev=document.getElementById('snakePrev');prev.innerHTML='';
  for(let i=0;i<9;i++){
    const d=document.createElement('div');d.className='sp-seg';
    const sz=Math.max(10,22-i*1.5);
    d.style.cssText=`width:${sz}px;height:${sz}px;background:${i===0?sk.head:sk.body};box-shadow:0 0 ${i<2?12:5}px ${i===0?sk.head:sk.body}80`;
    prev.appendChild(d);
  }
  document.getElementById('mCoins').textContent='🪙 '+WAL.coins;
  document.getElementById('mDias').textContent='💎 '+WAL.diamonds;
  const mhs=document.getElementById('menuHs');mhs.innerHTML='';
  Object.entries(MODES).forEach(([k,v])=>{
    const d=document.createElement('div');d.className='menu-hs-item';
    d.innerHTML=`${v.emoji} <span class="menu-hs-val">${HS[k]||0}</span>`;mhs.appendChild(d);
  });
  const mc=document.getElementById('modeCards');mc.innerHTML='';
  const modeImages={easy:'images/easy.png',medium:'images/medium.png',hard:'images/hard.png'};
  Object.entries(MODES).forEach(([k,v])=>{
    const c=document.createElement('div');
    c.className='mode-card'+(selMode===k?' sel':'');
    c.innerHTML=`<div class="mc-art" style="background:linear-gradient(135deg,${v.track},#0b1020)">
      <img src="${modeImages[k]}" alt="${v.label}" class="mc-img" onerror="this.style.display='none'">
      <div class="mc-pulse" style="color:${v.color}"></div>
    </div>
    <div class="mc-name">${v.label}</div><div class="mc-tip">${v.tip}</div>
    <div class="mc-stats"><span class="mc-pill">SPD ${v.speed}</span><span class="mc-pill">RISK ${v.danger}</span></div>`;
    c.onclick=()=>{AU.sfx('menu_select');selMode=k;buildMenu();};
    mc.appendChild(c);
  });
  document.getElementById('startBtn').disabled=!selMode;
  const tabs=document.getElementById('menuTabs');tabs.innerHTML='';
  [['themeScreen','🎨 Themes'],['skinScreen','🐍 Skins'],['boostScreen','⚡ Upgrades'],['infoScreen','ℹ️ Info'],['settingsScreen','⚙️ Settings']].forEach(([sc,lbl])=>{
    const b=document.createElement('button');b.className='tab-btn';b.textContent=lbl;
    b.onclick=()=>{AU.sfx('menu_select');showScreen(sc);};
    tabs.appendChild(b);
  });
}

// ── SHOP BUILDERS ─────────────────────────────────────────────────
function buildThemes(){
  document.getElementById('thC').textContent='🪙 '+WAL.coins;
  document.getElementById('thD').textContent='💎 '+WAL.diamonds;
  const list=document.getElementById('thList');list.innerHTML='';
  THEMES.forEach((th,i)=>{
    const owned=SHOP.themes.owned.includes(i)||CHEAT_ACTIVE;
    const sel=SHOP.themes.sel===i;
    const preview=!owned&&previewThemeIdx===i;
    const card=document.createElement('div');
    card.className='s-card'+(sel?' active':owned?' owned':!th.ok?' locked':'');
    let badge=!th.ok&&!CHEAT_ACTIVE?`<span class="s-badge bl">SOON</span>`:
      sel?`<span class="s-badge ba">ACTIVE</span>`:
      preview?`<span class="s-badge bo">PREVIEW</span>`:
      owned?`<span class="s-badge bo">OWNED</span>`:
      `<span class="s-badge bp">🪙${th.cost.c}${th.cost.d?' 💎'+th.cost.d:''}</span>`;
    if(CHEAT_ACTIVE&&!th.ok)badge='<span class="s-badge bcheat">UNLOCKED</span>';
    const sw=`<div class="theme-swatch" style="background:${th.bg};border-color:${th.gc};color:${TH_ACC[i]}">${TH_ICONS[i]}</div>`;
    const strips=`<div style="display:flex;gap:3px;margin-top:5px">
      <div style="width:28px;height:8px;border-radius:3px;background:${th.gA}"></div>
      <div style="width:28px;height:8px;border-radius:3px;background:${th.gB}"></div>
      <div style="width:28px;height:8px;border-radius:3px;background:${th.gc}"></div></div>`;
    card.innerHTML=`${sw}<div class="s-body"><div class="s-name">${th.name}</div><div class="s-desc">${th.desc}</div>${strips}</div>${badge}`;
    if(th.ok||CHEAT_ACTIVE)card.onclick=()=>{AU.sfx('menu_select');handleThemeClick(i);};
    list.appendChild(card);
  });
  renderThemePreview();
}

function handleThemeClick(i){
  const owned=SHOP.themes.owned.includes(i)||CHEAT_ACTIVE;
  if(owned){pendingThemeBuy=null;previewThemeIdx=null;buyTheme(i);return;}
  pendingThemeBuy=i;previewThemeIdx=i;themeIdx=i;
  buildThemes();buildMenu();syncSidebar();
}

function buyTheme(i){
  const owned=SHOP.themes.owned.includes(i)||CHEAT_ACTIVE;
  if(owned){SHOP.themes.sel=i;themeIdx=i;SV('sp2_shop',SHOP);}
  else{
    const th=THEMES[i];
    if(WAL.coins>=th.cost.c&&WAL.diamonds>=th.cost.d){
      WAL.coins-=th.cost.c;WAL.diamonds-=th.cost.d;
      SHOP.themes.owned.push(i);SHOP.themes.sel=i;themeIdx=i;
      pendingThemeBuy=null;previewThemeIdx=null;
      SV('sp2_wal',WAL);SV('sp2_shop',SHOP);
    }else{uiToast('Not enough coins/diamonds for this theme');return;}
  }
  buildThemes();buildMenu();
}

function renderThemePreview(){
  const idx=previewThemeIdx??SHOP.themes.sel??0;
  const th=THEMES[idx];
  const el=document.getElementById('thPreview');if(!el)return;
  const canBuy=previewThemeIdx!==null&&!(SHOP.themes.owned.includes(idx)||CHEAT_ACTIVE);
  el.innerHTML=`<div class="shop-preview-title">LIVE THEME PREVIEW</div>
    <div class="shop-preview-board" style="background:repeating-linear-gradient(45deg,${th.gA} 0 18px,${th.gB} 18px 36px);box-shadow:inset 0 0 0 2px ${th.gc}">
      <div style="position:absolute;right:10px;top:10px;font-size:1.2rem">${TH_ICONS[idx]}</div>
      <div style="position:absolute;left:10px;bottom:8px;font-family:'Orbitron',monospace;font-size:.62rem;color:${TH_ACC[idx]}">${th.name.toUpperCase()}</div>
    </div>
    <div class="shop-preview-note">${canBuy?'Previewing selected theme.':'Active in owned/equipped selection.'}</div>
    <div class="preview-actions">${canBuy?`<button id="thPreviewBuyBtn" class="preview-buy-btn">BUY 🪙${th.cost.c}${th.cost.d?' 💎'+th.cost.d:''}</button>`:''}</div>`;
  const b=document.getElementById('thPreviewBuyBtn');
  if(b)b.onclick=()=>{AU.sfx('menu_select');buyTheme(idx);};
}

function buildSkins(){
  document.getElementById('skC').textContent='🪙 '+WAL.coins;
  const list=document.getElementById('skList');list.innerHTML='';
  SKINS.forEach((sk,i)=>{
    const owned=SHOP.skins.owned.includes(i)||CHEAT_ACTIVE;
    const sel=SHOP.skins.sel===i;
    const preview=!owned&&previewSkinIdx===i;
    const card=document.createElement('div');
    card.className='s-card'+(sel?' active':owned?' owned':!sk.ok?' locked':'');
    let badge=!sk.ok&&!CHEAT_ACTIVE?`<span class="s-badge bl">SOON</span>`:
      sel?`<span class="s-badge ba">ACTIVE</span>`:
      preview?`<span class="s-badge bo">PREVIEW</span>`:
      owned?`<span class="s-badge bo">OWNED</span>`:
      `<span class="s-badge bp">🪙${sk.cost}</span>`;
    if(CHEAT_ACTIVE&&!sk.ok)badge='<span class="s-badge bcheat">UNLOCKED</span>';
    const dots=`<div class="skin-dots"><div class="skin-dot" style="background:${sk.head};box-shadow:0 0 6px ${sk.head}88"></div><div class="skin-dot" style="background:${sk.body}"></div><div class="skin-dot" style="background:${sk.belly};border:1px solid #ffffff22"></div></div>`;
    card.innerHTML=`<div class="s-icon">🐍</div><div class="s-body"><div class="s-name">${sk.name}</div><div class="s-desc">${sk.desc}</div>${dots}</div>${badge}`;
    if(sk.ok||CHEAT_ACTIVE)card.onclick=()=>{AU.sfx('menu_select');handleSkinClick(i);};
    list.appendChild(card);
  });
  renderSkinPreview();
}

function handleSkinClick(i){
  const owned=SHOP.skins.owned.includes(i)||CHEAT_ACTIVE;
  if(owned){pendingSkinBuy=null;previewSkinIdx=null;buySkin(i);return;}
  pendingSkinBuy=i;previewSkinIdx=i;skinIdx=i;
  buildSkins();buildMenu();syncSidebar();
}

function buySkin(i){
  const owned=SHOP.skins.owned.includes(i)||CHEAT_ACTIVE;
  if(owned){SHOP.skins.sel=i;skinIdx=i;SV('sp2_shop',SHOP);}
  else{
    const sk=SKINS[i];
    if(WAL.coins>=sk.cost){
      WAL.coins-=sk.cost;
      SHOP.skins.owned.push(i);SHOP.skins.sel=i;skinIdx=i;
      pendingSkinBuy=null;previewSkinIdx=null;
      SV('sp2_wal',WAL);SV('sp2_shop',SHOP);
    }else{uiToast('Not enough coins for this skin');return;}
  }
  buildSkins();buildMenu();
}

function renderSkinPreview(){
  const idx=previewSkinIdx??SHOP.skins.sel??0;
  const sk=SKINS[idx];
  const el=document.getElementById('skPreview');if(!el)return;
  const canBuy=previewSkinIdx!==null&&!(SHOP.skins.owned.includes(idx)||CHEAT_ACTIVE);
  const segs=Array.from({length:8},(_,i)=>{const sz=Math.max(9,20-i*1.6);const col=i===0?sk.head:sk.body;return `<i style="width:${sz}px;height:${sz}px;background:${col};box-shadow:0 0 ${i<2?10:4}px ${col}66"></i>`;}).join('');
  el.innerHTML=`<div class="shop-preview-title">LIVE SKIN PREVIEW</div>
    <div class="shop-preview-board" style="background:linear-gradient(135deg,#0a0d1c,#070a15)">
      <div class="shop-preview-snake">${segs}</div>
    </div>
    <div class="shop-preview-note">${canBuy?'Previewing selected skin.':'Active in owned/equipped selection.'}</div>
    <div class="preview-actions">${canBuy?`<button id="skPreviewBuyBtn" class="preview-buy-btn">BUY 🪙${sk.cost}</button>`:''}</div>`;
  const b=document.getElementById('skPreviewBuyBtn');
  if(b)b.onclick=()=>{AU.sfx('menu_select');buySkin(idx);};
}

function buildBoosts(){
  document.getElementById('buC').textContent='🪙 '+WAL.coins;
  const list=document.getElementById('buList');list.innerHTML='';
  Object.entries(POWERUPS).forEach(([k,v])=>{
    const lv=SHOP.boosts?.[k]||0;
    const dur=Math.floor(boostDur(v.dur,k)/1000);
    const card=document.createElement('div');card.className='s-card';card.style.cursor='default';
    const stars='★'.repeat(lv)+'☆'.repeat(5-lv);
    const canUp=lv<5;const cost=canUp?BOOST_LV[lv+1].cost:0;
    const badge=canUp?`<span class="s-badge bp">🪙${cost}</span>`:`<span class="s-badge ba">MAX</span>`;
    card.innerHTML=`<div class="s-icon">${v.emoji}</div>
      <div class="s-body"><div class="s-name">${v.label}</div><div class="s-desc">${dur}s duration · <span style="color:var(--gold)">${stars}</span> Lv${lv}</div></div>
      ${badge}
      <button class="boost-up-btn"${canUp?'':' disabled'}>${canUp?'UPGRADE':'MAXED'}</button>`;
    const btn=card.querySelector('.boost-up-btn');
    if(canUp&&btn)btn.onclick=(e)=>{e.stopPropagation();AU.sfx('menu_select');upgradeBoost(k);};
    list.appendChild(card);
  });
}

function upgradeBoost(type){
  const lv=SHOP.boosts?.[type]||0;if(lv>=5)return;
  const cost=BOOST_LV[lv+1].cost;
  if(WAL.coins>=cost){WAL.coins-=cost;if(!SHOP.boosts)SHOP.boosts={};
    SHOP.boosts[type]=lv+1;SV('sp2_wal',WAL);SV('sp2_shop',SHOP);buildBoosts();}
  else uiToast('Not enough coins to upgrade this boost');
}

// Build sidebar food legend (once)
function buildLegend(){
  const leg=document.getElementById('sbLegend');leg.innerHTML='';
  Object.entries(FOODS).forEach(([k,v])=>{
    const d=document.createElement('div');d.className='sb-leg-item';
    d.innerHTML=`<span>${v.emoji}</span><span>${k[0].toUpperCase()+k.slice(1)}</span><span class="sb-leg-pts">+${v.pts}</span>`;
    leg.appendChild(d);
  });
}

// ── CHEAT CODE ────────────────────────────────────────────────────
function initCheatUI(){
  const input=document.getElementById('cheatInput');
  const submit=document.getElementById('cheatSubmitBtn');
  const status=document.getElementById('cheatStatus');
  const activeBar=document.getElementById('cheatActiveBar');
  const inputSection=document.getElementById('cheatInputSection');
  const exitBtn=document.getElementById('cheatExitBtn');
  function refreshCheatUI(){
    if(CHEAT_ACTIVE){activeBar.style.display='flex';inputSection.style.display='none';}
    else{activeBar.style.display='none';inputSection.style.display='block';input.value='';input.className='cheat-input';status.textContent='';status.className='cheat-status';}
  }
  refreshCheatUI();
  submit.onclick=()=>{
    AU.sfx('menu_select');
    const val=input.value.trim().toUpperCase();
    if(val===CHEAT_PASSWORD){enterDevMode();input.className='cheat-input valid';status.textContent='✅ DEVELOPER MODE ACTIVATED';status.className='cheat-status ok';
      setTimeout(()=>{refreshCheatUI();buildThemes();buildSkins();buildBoosts();buildMenu();syncSidebar();},800);}
    else{input.className='cheat-input invalid';status.textContent='❌ INVALID CODE';status.className='cheat-status err';
      setTimeout(()=>{input.className='cheat-input';status.textContent='';},1500);}
  };
  input.addEventListener('keydown',e=>{if(e.key==='Enter')submit.click();});
  input.addEventListener('input',()=>{input.value=input.value.toUpperCase();});
  exitBtn.onclick=()=>{AU.sfx('menu_select');exitDevMode();refreshCheatUI();buildThemes();buildSkins();buildBoosts();buildMenu();syncSidebar();};
}

// ── SCREEN ROUTING ────────────────────────────────────────────────
function showScreen(id){
  if(id!=='menuScreen')AU.sfx('menu_select');
  if(id==='menuScreen'){previewThemeIdx=null;previewSkinIdx=null;pendingThemeBuy=null;pendingSkinBuy=null;themeIdx=SHOP.themes.sel||0;skinIdx=SHOP.skins.sel||0;}
  if(id==='menuScreen')buildMenu();
  else if(id==='themeScreen')buildThemes();
  else if(id==='skinScreen')buildSkins();
  else if(id==='boostScreen')buildBoosts();
  else if(id==='infoScreen')buildInfo();
  else if(id==='settingsScreen')initCheatUI();
  ALL_SCREENS.forEach(s=>document.getElementById(s).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  curScreen=id;
  document.getElementById('hud').style.display='none';
  document.getElementById('puBar').style.display='none';
  AU.playMusic('menu_music');
  syncSidebar();
}

// ── GAME ACTIONS ──────────────────────────────────────────────────
function startGame(){
  if(!selMode)return;
  previewThemeIdx=null;previewSkinIdx=null;pendingThemeBuy=null;pendingSkinBuy=null;
  themeIdx=SHOP.themes.sel||0;skinIdx=SHOP.skins.sel||0;
  AU.sfx('start');
  AU.stopMusic('menu_music',()=>{setTimeout(()=>AU.playMusic('background'),350);});
  ALL_SCREENS.forEach(s=>document.getElementById(s).classList.add('hidden'));
  curScreen='game';
  document.getElementById('hud').style.display='flex';
  document.getElementById('puBar').style.display='flex';
  resizeCanvas();started=true;
  requestAnimationFrame(()=>initGame(selMode));
}

function retryGame(){
  if(!curMode)return;
  AU.sfx('start');AU.stopAll();
  initGame(curMode);
  setTimeout(()=>AU.playMusic('background'),380);
}

function goToMenu(){
  AU.sfx('menu_select');
  cancelAnimationFrame(rafId);gameOver=false;paused=false;started=false;
  document.getElementById('goOverlay').classList.add('hidden');
  document.getElementById('pauseOverlay').classList.add('hidden');
  document.getElementById('hud').style.display='none';
  document.getElementById('puBar').style.display='none';
  AU.stopAll();
  showScreen('menuScreen');
}

function togglePause(){
  AU.sfx('menu_select');
  paused=!paused;
  document.getElementById('pauseOverlay').classList.toggle('hidden',!paused);
}

// ── INPUT HANDLING ────────────────────────────────────────────────
function initInput(){
  // Keyboard
  document.addEventListener('keydown',e=>{
    AU.unlock();
    if(curScreen==='game'||curScreen==='gameScreen'){
      if(e.key==='Escape'){e.preventDefault();if(gameOver)goToMenu();else togglePause();return;}
      if(e.key===' '){e.preventDefault();if(gameOver)retryGame();else togglePause();return;}
      if((e.key==='p'||e.key==='P')&&!gameOver){togglePause();return;}
      if(gameOver||paused)return;
      if(!dirLocked){
        const d=dir;
        if((e.key==='ArrowUp'||e.key==='w'||e.key==='W')&&d.y!==1){nextDir={x:0,y:-1};dirLocked=true;}
        if((e.key==='ArrowDown'||e.key==='s'||e.key==='S')&&d.y!==-1){nextDir={x:0,y:1};dirLocked=true;}
        if((e.key==='ArrowLeft'||e.key==='a'||e.key==='A')&&d.x!==1){nextDir={x:-1,y:0};dirLocked=true;}
        if((e.key==='ArrowRight'||e.key==='d'||e.key==='D')&&d.x!==-1){nextDir={x:1,y:0};dirLocked=true;}
      }
    }else{
      if(e.key==='Escape'){AU.sfx('menu_select');showScreen('menuScreen');}
      if((e.key===' '||e.key==='Enter')&&curScreen==='menuScreen'&&selMode){e.preventDefault();startGame();}
    }
  });

  // Touch/Swipe
  let tStart=null;
  document.addEventListener('touchstart',e=>{AU.unlock();tStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  document.addEventListener('touchend',e=>{
    if(!tStart)return;
    const dx=e.changedTouches[0].clientX-tStart.x,dy=e.changedTouches[0].clientY-tStart.y;
    const adx=Math.abs(dx),ady=Math.abs(dy);
    if(Math.max(adx,ady)<20){tStart=null;return;}
    if(curScreen==='game'&&!gameOver&&!paused&&!dirLocked){
      if(adx>ady){if(dx>0&&dir.x!==-1){nextDir={x:1,y:0};dirLocked=true;}else if(dx<0&&dir.x!==1){nextDir={x:-1,y:0};dirLocked=true;}}
      else{if(dy>0&&dir.y!==-1){nextDir={x:0,y:1};dirLocked=true;}else if(dy<0&&dir.y!==1){nextDir={x:0,y:-1};dirLocked=true;}}
    }
    tStart=null;
  },{passive:true});

  // Game over tap
  document.getElementById('goOverlay').addEventListener('pointerdown',e=>{if(e.target===document.getElementById('goOverlay'))retryGame();});
}

// ── BUTTON WIRING ─────────────────────────────────────────────────
function initButtons(){
  const wire=(id,fn)=>{const el=document.getElementById(id);if(el)el.onclick=fn;};
  wire('startBtn',   startGame);
  wire('pauseBtn',   togglePause);
  wire('resumeBtn',  ()=>{AU.sfx('menu_select');paused=false;document.getElementById('pauseOverlay').classList.add('hidden');});
  wire('restartBtn', ()=>{AU.sfx('menu_select');retryGame();});
  wire('pauseMenuBtn',goToMenu);
  wire('retryBtn',   retryGame);
  wire('goMenuBtn',  goToMenu);
  wire('backTh',     ()=>{AU.sfx('menu_select');showScreen('menuScreen');});
  wire('backSk',     ()=>{AU.sfx('menu_select');showScreen('menuScreen');});
  wire('backBu',     ()=>{AU.sfx('menu_select');showScreen('menuScreen');});
  wire('backInfo',   ()=>{AU.sfx('menu_select');showScreen('menuScreen');});
  wire('backSet',    ()=>{AU.sfx('menu_select');showScreen('menuScreen');});

  // Volume sliders
  const vs=document.getElementById('volSlider'),vv=document.getElementById('volVal');
  vs.value=Math.round(AU.getVol()*100);vv.textContent=Math.round(AU.getVol()*100)+'%';
  vs.oninput=()=>{const v=vs.value/100;AU.setVol(v);vv.textContent=Math.round(v*100)+'%';};
  const bvs=document.getElementById('bgVolSlider'),bvv=document.getElementById('bgVolVal');
  bvs.value=Math.round(AU.getBgVol()*100);bvv.textContent=Math.round(AU.getBgVol()*100)+'%';
  bvs.oninput=()=>{const v=bvs.value/100;AU.setBgVol(v);bvv.textContent=Math.round(v*100)+'%';};
}

// ── LOADING SCREEN ────────────────────────────────────────────────
function initLoadingScreen(){
  const loadingScreen=document.getElementById('loadingScreen');
  const loadingBarFill=document.querySelector('.loading-bar-fill');
  const loadingPercent=document.querySelector('.loading-percent');
  const particlesContainer=document.getElementById('loadingParticles');
  if(!loadingScreen)return;
  for(let i=0;i<20;i++){
    const particle=document.createElement('div');particle.className='loading-particle';
    particle.style.left=Math.random()*100+'%';particle.style.top=Math.random()*100+'%';
    particle.style.animationDelay=Math.random()*4+'s';particle.style.animationDuration=(3+Math.random()*2)+'s';
    const colors=['#00e5a0','#22d3ee','#6c3fff','#ffcc44'];
    particle.style.background=colors[Math.floor(Math.random()*colors.length)];
    particle.style.boxShadow=`0 0 10px ${particle.style.background}`;
    particlesContainer.appendChild(particle);
  }
  const unlockAudio=()=>{AU.unlock();loadingScreen.removeEventListener('click',unlockAudio);loadingScreen.removeEventListener('touchstart',unlockAudio);};
  loadingScreen.addEventListener('click',unlockAudio);loadingScreen.addEventListener('touchstart',unlockAudio);
  let progress=0;const totalDuration=2500;const intervalTime=30;const increment=100/(totalDuration/intervalTime);
  const loadingInterval=setInterval(()=>{
    progress+=increment;
    if(progress>=100){progress=100;clearInterval(loadingInterval);
      setTimeout(()=>{loadingScreen.classList.add('hidden');setTimeout(()=>{loadingScreen.style.display='none';},800);},300);}
    loadingBarFill.style.width=progress+'%';loadingPercent.textContent=Math.floor(progress)+'%';
  },intervalTime);
}