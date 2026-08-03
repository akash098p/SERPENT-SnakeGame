// ════════════════════════════════════════════════════════════════
// GAME LOGIC & RENDERING
// ════════════════════════════════════════════════════════════════

// ── CANVAS ────────────────────────────────────────────────────────
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
let CELL=28,COLS=22,ROWS=18;

function resizeCanvas(){
  const wrap=document.getElementById('canvasWrap');
  const W=wrap.clientWidth,H=wrap.clientHeight;
  CELL=Math.max(16,Math.floor(Math.min(W/24,H/20)));
  COLS=Math.floor(W/CELL);
  ROWS=Math.floor(H/CELL);
  canvas.width=COLS*CELL;
  canvas.height=ROWS*CELL;
}

// ── STATE ─────────────────────────────────────────────────────────
let themeIdx=SHOP.themes.sel||0, skinIdx=SHOP.skins.sel||0;
let previewThemeIdx=null, previewSkinIdx=null;
let pendingThemeBuy=null, pendingSkinBuy=null;
let snake=[],dir={x:1,y:0},nextDir={x:1,y:0},dirLocked=false;
let foods=[],pups=[],colls=[];
let score=0,lastMilestone=0,activePU={},puEnd={};
let parts=[];
let gameOver=false,paused=false,started=false;
let selMode=null,curMode=null;
let sesCoins=0,sesDias=0;
let lastStep=0,stepMs=165;
let tFood=0,tPup=0,tColl=0;
let rafId=null;

// ── HELPERS ───────────────────────────────────────────────────────
const wRand=(keys,getW)=>{let t=keys.reduce((s,k)=>s+getW(k),0),r=Math.random()*t;for(const k of keys){r-=getW(k);if(r<=0)return k}return keys[keys.length-1];};
const occ=(x,y)=>snake.some(s=>s.x===x&&s.y===y)||foods.some(f=>f.x===x&&f.y===y)||pups.some(p=>p.x===x&&p.y===y)||colls.some(c=>c.x===x&&c.y===y);

function emptyPos(){for(let i=0;i<400;i++){const x=Math.floor(Math.random()*COLS),y=Math.floor(Math.random()*ROWS);if(!occ(x,y))return{x,y};}return{x:1,y:1};}
function boostDur(base,type){const lv=SHOP.boosts?.[type]||0;let a=0;for(let i=1;i<=Math.min(lv,5);i++)a+=BOOST_LV[i].add;return base+a*1000;}
function spawnFood(){const t=wRand(Object.keys(FOODS),k=>FOODS[k].w);foods.push({...emptyPos(),t});}
function spawnPup(){const t=wRand(Object.keys(POWERUPS),k=>POWERUPS[k].w);pups.push({...emptyPos(),t,born:Date.now()});}
function spawnColl(){const t=wRand(Object.keys(COLLS),k=>COLLS[k].w);colls.push({...emptyPos(),t,born:Date.now()});}
function attractTowardHead(entity,head,range=8){const dx=head.x-entity.x,dy=head.y-entity.y,d=Math.abs(dx)+Math.abs(dy);if(d<=0||d>=range)return;if(Math.abs(dx)>Math.abs(dy))entity.x+=Math.sign(dx);else entity.y+=Math.sign(dy);}

// ── GAME INIT ─────────────────────────────────────────────────────
function initGame(mode){
  cancelAnimationFrame(rafId);
  const sx=Math.max(5,Math.floor(COLS/4)),sy=Math.floor(ROWS/2);
  snake=[{x:sx,y:sy},{x:sx-1,y:sy},{x:sx-2,y:sy},{x:sx-3,y:sy}];
  dir={x:1,y:0};nextDir={x:1,y:0};dirLocked=false;
  foods=[];pups=[];colls=[];activePU={};puEnd={};parts=[];
  score=0;lastMilestone=0;
  gameOver=false;paused=false;
  sesCoins=0;sesDias=0;
  curMode=mode;stepMs=MODES[mode].ms;
  tFood=0;tPup=0;tColl=0;
  spawnFood();spawnFood();spawnColl();
  document.getElementById('goOverlay').classList.add('hidden');
  document.getElementById('pauseOverlay').classList.add('hidden');
  syncHUD();
  lastStep=performance.now();
  rafId=requestAnimationFrame(loop);
}

// ── LOOP ──────────────────────────────────────────────────────────
function loop(ts){
  rafId=requestAnimationFrame(loop);
  if(paused||gameOver){render();return;}
  let ms=stepMs;
  if(activePU.speed_boost)ms=Math.floor(ms*.52);
  if(ts-lastStep>=ms){step(ts);lastStep=ts;}
  render();
}

// ── STEP ──────────────────────────────────────────────────────────
function step(ts){
  dir={...nextDir};dirLocked=false;
  AU.sfx('move',.14);

  const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};

  // Ghost wrapping
  if(activePU.ghost_mode){
    head.x=((head.x%COLS)+COLS)%COLS;
    head.y=((head.y%ROWS)+ROWS)%ROWS;
  }
  // Wall
  if(!activePU.ghost_mode&&(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS)){doGameOver();return;}
  // Self
  if(!activePU.invincible&&snake.some(s=>s.x===head.x&&s.y===head.y)){doGameOver();return;}

  snake.unshift(head);
  let ate=false;

  // Food
  for(let i=foods.length-1;i>=0;i--){
    const f=foods[i];
    if(activePU.magnet)attractTowardHead(f,head,10);
    if(f.x===head.x&&f.y===head.y){
      AU.sfx('eat');
      let pts=FOODS[f.t].pts;
      if(activePU.double_points)pts*=2;
      score+=pts;
      if(score>(HS[curMode]||0)){HS[curMode]=score;SV('sp2_hs',HS);}
      // Milestone check: 100, 200, 300...
      const milestone=Math.floor(score/100);
      if(milestone>lastMilestone){
        lastMilestone=milestone;
        setTimeout(()=>AU.sfx('level_up'),100);
      }
      popScore(head,'+'+pts,FOODS[f.t].color);
      spawnParts(head.x*CELL+CELL/2,head.y*CELL+CELL/2,FOODS[f.t].color,14);
      flashEat();foods.splice(i,1);ate=true;break;
    }
  }
  if(!ate)snake.pop();

  // Powerups
  const now=Date.now();
  for(let i=pups.length-1;i>=0;i--){
    const p=pups[i];
    if(now-p.born>15000){pups.splice(i,1);continue;}
    if(p.x===head.x&&p.y===head.y){
      activatePU(p.t);
      spawnParts(p.x*CELL+CELL/2,p.y*CELL+CELL/2,POWERUPS[p.t].color,20);
      pups.splice(i,1);
    }
  }

  // Collectibles
  for(let i=colls.length-1;i>=0;i--){
    const c=colls[i];
    if(now-c.born>22000){colls.splice(i,1);continue;}
    if(activePU.magnet)attractTowardHead(c,head,10);
    if(c.x===head.x&&c.y===head.y){
      if(c.t==='coin'){WAL.coins++;sesCoins++;AU.sfx('coin');}
      else{WAL.diamonds++;sesDias++;AU.sfx('diamond');}
      SV('sp2_wal',WAL);
      popScore(head,COLLS[c.t].emoji,COLLS[c.t].color);
      spawnParts(c.x*CELL+CELL/2,c.y*CELL+CELL/2,COLLS[c.t].color,16);
      colls.splice(i,1);
    }
  }

  // Expire PU timers
  for(const [k,end] of Object.entries(puEnd)){if(now>=end){delete activePU[k];delete puEnd[k];}}

  // Spawn cadence
  if(ts-tFood>2600&&foods.length<3){spawnFood();tFood=ts;}
  if(ts-tPup>11000&&pups.length<2){spawnPup();tPup=ts;}
  if(ts-tColl>8000&&colls.length<2){spawnColl();tColl=ts;}

  syncHUD();
}

function activatePU(type){
  const dur=boostDur(POWERUPS[type].dur,type);
  activePU[type]=true;puEnd[type]=Date.now()+dur;
  AU.sfx(type);
  if(type==='shrink'){while(snake.length>4)snake.pop();delete activePU.shrink;delete puEnd.shrink;}
}

function doGameOver(){
  gameOver=true;
  AU.stopMusic('background');
  AU.sfx('game_over');
  spawnParts(snake[0].x*CELL+CELL/2,snake[0].y*CELL+CELL/2,'#ff3a3a',35);
  const isHS=score>0&&score>=(HS[curMode]||0);
  document.getElementById('goScore').textContent='SCORE: '+score;
  document.getElementById('goC').textContent='🪙 '+sesCoins;
  document.getElementById('goD').textContent='💎 '+sesDias;
  document.getElementById('goHS').classList.toggle('hidden',!(isHS&&score>0));
  document.getElementById('goOverlay').classList.remove('hidden');
  syncHUD();
}

// ── RENDER ────────────────────────────────────────────────────────
function render(){
  if(!started)return;
  const W=canvas.width,H=canvas.height;
  const th=THEMES[themeIdx],sk=SKINS[skinIdx];
  const now=Date.now();

  // Background
  ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);

  // Checkerboard grid with theme color
  for(let x=0;x<COLS;x++){
    for(let y=0;y<ROWS;y++){
      ctx.fillStyle=(x+y)%2===0?th.gA:th.gB;
      ctx.fillRect(x*CELL,y*CELL,CELL,CELL);
    }
  }

  // Subtle grid lines
  ctx.strokeStyle='rgba(255,255,255,.018)';ctx.lineWidth=.5;
  for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H);ctx.stroke();}
  for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W,y*CELL);ctx.stroke();}

  // ── COLLECTIBLES ──
  colls.forEach(c=>{
    const cx=c.x*CELL+CELL/2,cy=c.y*CELL+CELL/2;
    const pulse=.9+.1*Math.sin(now/240+c.x*1.7);
    ctx.save();ctx.translate(cx,cy);ctx.scale(pulse,pulse);
    ctx.shadowColor=COLLS[c.t].color;ctx.shadowBlur=14;
    ctx.font=`${Math.round(CELL*.9)}px serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(COLLS[c.t].emoji,0,1);
    ctx.restore();
  });

  // ── FOOD ──
  foods.forEach(f=>{
    const cx=f.x*CELL+CELL/2,cy=f.y*CELL+CELL/2;
    const bob=Math.sin(now/400+f.x*1.4)*2;
    ctx.save();ctx.translate(cx,cy+bob);
    const grd=ctx.createRadialGradient(0,0,CELL*.2,0,0,CELL*.7);
    grd.addColorStop(0,FOODS[f.t].color+'44');
    grd.addColorStop(1,'transparent');
    ctx.fillStyle=grd;ctx.beginPath();ctx.arc(0,0,CELL*.7,0,Math.PI*2);ctx.fill();
    ctx.shadowColor=FOODS[f.t].color;ctx.shadowBlur=18;
    ctx.font=`${Math.round(CELL*.88)}px serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(FOODS[f.t].emoji,0,1);
    ctx.restore();
  });

  // ── POWERUPS ──
  pups.forEach(p=>{
    const cx=p.x*CELL+CELL/2,cy=p.y*CELL+CELL/2;
    const t=(now-p.born)/1000;
    const pulse=.88+.12*Math.sin(t*4.5);
    ctx.save();ctx.translate(cx,cy);ctx.scale(pulse,pulse);
    ctx.beginPath();ctx.arc(0,0,CELL*.52,0,Math.PI*2);
    ctx.strokeStyle=POWERUPS[p.t].color+'bb';ctx.lineWidth=2;
    ctx.shadowColor=POWERUPS[p.t].color;ctx.shadowBlur=18;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,CELL*.42,0,Math.PI*2);
    ctx.fillStyle=POWERUPS[p.t].color+'28';ctx.fill();
    ctx.shadowBlur=10;
    ctx.font=`${Math.round(CELL*.72)}px serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(POWERUPS[p.t].emoji,0,1);
    ctx.restore();
    const age=(now-p.born)/15000;
    ctx.fillStyle=POWERUPS[p.t].color+'60';
    ctx.fillRect(p.x*CELL,p.y*CELL+CELL-3,CELL*(1-age),3);
  });

  // ── SNAKE ──
  const ghostA=activePU.ghost_mode?.42:1;
  ctx.globalAlpha=ghostA;

  for(let i=snake.length-1;i>0;i--){
    const seg=snake[i],x=seg.x*CELL,y=seg.y*CELL;
    const isTail=i===snake.length-1;
    const prog=i/snake.length;
    const alpha=ghostA*(0.75+0.25*(1-prog));
    ctx.globalAlpha=alpha;
    const r=isTail?CELL*.44:CELL*.38;
    ctx.shadowColor=sk.body;ctx.shadowBlur=i<5?8:2;
    const grd=ctx.createRadialGradient(x+CELL*.35,y+CELL*.3,CELL*.05,x+CELL/2,y+CELL/2,CELL*.52);
    grd.addColorStop(0,lighten(sk.body,40));
    grd.addColorStop(.5,sk.body);
    grd.addColorStop(1,darken(sk.body,30));
    roundRect(x+2,y+2,CELL-4,CELL-4,r);
    ctx.fillStyle=grd;ctx.fill();
    ctx.strokeStyle=sk.out;ctx.lineWidth=1.2;ctx.stroke();
    ctx.shadowBlur=0;
    if(!isTail&&CELL>18){
      const bw=CELL*.34,bx=x+(CELL-bw)/2,by=y+CELL*.27,bh=CELL*.46;
      roundRect(bx,by,bw,bh,CELL*.12);
      ctx.fillStyle=sk.belly+'88';ctx.fill();
    }
    ctx.globalAlpha=ghostA;
  }

  // HEAD
  {
    const seg=snake[0],x=seg.x*CELL,y=seg.y*CELL;
    ctx.globalAlpha=ghostA;
    ctx.shadowColor=sk.head;ctx.shadowBlur=18;
    const grd=ctx.createRadialGradient(x+CELL*.38,y+CELL*.3,CELL*.06,x+CELL/2,y+CELL/2,CELL*.58);
    grd.addColorStop(0,lighten(sk.head,50));
    grd.addColorStop(.5,sk.head);
    grd.addColorStop(1,darken(sk.head,20));
    roundRect(x+1,y+1,CELL-2,CELL-2,CELL*.36);
    ctx.fillStyle=grd;ctx.fill();
    ctx.strokeStyle=sk.out;ctx.lineWidth=1.8;ctx.stroke();
    ctx.shadowBlur=0;
    const eR=CELL*.12,eO=CELL*.22;
    const hx=x+CELL/2,hy=y+CELL/2;
    let e1x,e1y,e2x,e2y;
    if(dir.x>0) {e1x=hx+eO;e1y=hy-eO;e2x=hx+eO;e2y=hy+eO;}
    else if(dir.x<0){e1x=hx-eO;e1y=hy-eO;e2x=hx-eO;e2y=hy+eO;}
    else if(dir.y<0){e1x=hx-eO;e1y=hy-eO;e2x=hx+eO;e2y=hy-eO;}
    else            {e1x=hx-eO;e1y=hy+eO;e2x=hx+eO;e2y=hy+eO;}
    [[e1x,e1y],[e2x,e2y]].forEach(([ex,ey])=>{
      ctx.fillStyle=sk.eyes||'#fff';
      ctx.beginPath();ctx.arc(ex,ey,eR,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#111';
      ctx.beginPath();
      ctx.ellipse(ex+dir.x*eR*.25,ey+dir.y*eR*.25,eR*.38,eR*.62,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.8)';
      ctx.beginPath();ctx.arc(ex-dir.x*eR*.28-eR*.18,ey-dir.y*eR*.28-eR*.18,eR*.28,0,Math.PI*2);ctx.fill();
    });
    if(Math.floor(now/170)%3!==2){
      const tl=CELL*.52,fk=CELL*.22;
      const tx=hx+dir.x*CELL*.46,ty=hy+dir.y*CELL*.46;
      const px=dir.x===0?1:0,py=dir.y===0?1:0;
      ctx.strokeStyle='#ff2255';ctx.lineWidth=1.8;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+dir.x*tl,ty+dir.y*tl);
      const tx2=tx+dir.x*tl,ty2=ty+dir.y*tl;
      ctx.moveTo(tx2,ty2);ctx.lineTo(tx2+px*fk+dir.x*fk*.5,ty2+py*fk+dir.y*fk*.5);
      ctx.moveTo(tx2,ty2);ctx.lineTo(tx2-px*fk+dir.x*fk*.5,ty2-py*fk+dir.y*fk*.5);
      ctx.stroke();
    }
    if(CELL>20){
      const nOff=CELL*.14,nFwd=CELL*.38;
      const nx1=hx+dir.x*nFwd+(dir.y===0?-nOff:dir.x*nOff*0);
      const ny1=hy+dir.y*nFwd+(dir.x===0?-nOff:dir.y*nOff*0);
      const nx2=hx+dir.x*nFwd+(dir.y===0?nOff:0);
      const ny2=hy+dir.y*nFwd+(dir.x===0?nOff:0);
      ctx.fillStyle='rgba(0,0,0,.35)';
      [dir.x===0?[[nx1,ny1],[nx2,ny2]]:[[nx1,ny1],[nx2,ny2]]].flat().forEach(([nx,ny])=>{
        if(!isNaN(nx)){ctx.beginPath();ctx.arc(nx,ny,CELL*.04,0,Math.PI*2);ctx.fill();}
      });
    }
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;

  // ── PARTICLES ──
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];
    p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.life--;
    if(p.life<=0){parts.splice(i,1);continue;}
    const a=(p.life/p.ml)**1.6;
    ctx.globalAlpha=a;ctx.fillStyle=p.c;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*a,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Animated border
  const bPulse=.5+.5*Math.sin(now/800);
  ctx.strokeStyle=`rgba(${hexToRgb(TH_ACC[themeIdx])},${.3+bPulse*.25})`;
  ctx.lineWidth=2.5;ctx.strokeRect(1.5,1.5,W-3,H-3);
}

// Canvas helpers
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function lighten(hex,amt){const [r,g,b]=hexToRgbArr(hex);return`rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;}
function darken(hex,amt){const [r,g,b]=hexToRgbArr(hex);return`rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;}
function hexToRgbArr(hex){const n=parseInt(hex.replace('#',''),16);return[(n>>16)&255,(n>>8)&255,n&255];}
function hexToRgb(hex){return hexToRgbArr(hex).join(',')}

// ── VFX ───────────────────────────────────────────────────────────
function spawnParts(cx,cy,color,count){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,sp=2+Math.random()*8;parts.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2.5,r:2.5+Math.random()*4.5,life:20+Math.random()*18,ml:38,c:color});}}
function popScore(pos,text,color){const r=canvas.getBoundingClientRect();const el=document.createElement('div');el.className='score-pop';el.textContent=text;el.style.color=color;el.style.textShadow=`0 0 10px ${color}`;el.style.left=(r.left+pos.x*CELL+CELL/2)+'px';el.style.top =(r.top +pos.y*CELL+CELL/2)+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),950);}
function flashEat(){const el=document.createElement('div');el.className='eat-flash';document.getElementById('canvasWrap').appendChild(el);setTimeout(()=>el.remove(),300);}

// ── HUD SYNC ──────────────────────────────────────────────────────
function syncHUD(){
  document.getElementById('hudScore').textContent=score;
  document.getElementById('hudBest').textContent='BEST: '+(HS[curMode]||0);
  document.getElementById('hudMode').textContent=curMode?.toUpperCase()||'';
  document.getElementById('hudC').textContent='🪙 '+WAL.coins;
  document.getElementById('hudD').textContent='💎 '+WAL.diamonds;
  syncPUBar();
  syncSidebar();
}

function syncPUBar(){
  const bar=document.getElementById('puBar');bar.innerHTML='';
  const now=Date.now();
  for(const [k,end] of Object.entries(puEnd)){
    if(!activePU[k])continue;
    const rem=Math.max(0,end-now),tot=boostDur(POWERUPS[k].dur,k);
    const pct=(rem/tot*100).toFixed(1);
    const b=document.createElement('div');b.className='pu-badge';
    b.style.borderColor=POWERUPS[k].color;
    b.innerHTML=`<span>${POWERUPS[k].emoji}</span><span style="color:${POWERUPS[k].color}">${POWERUPS[k].label}</span><div class="pu-tbar"><div class="pu-tfill" style="width:${pct}%;background:${POWERUPS[k].color}"></div></div>`;
    bar.appendChild(b);
  }
}

function syncSidebar(){
  document.getElementById('sbCoins').textContent=WAL.coins;
  document.getElementById('sbDias').textContent=WAL.diamonds;
  if(started&&curMode){
    document.getElementById('sbScore').textContent=score;
    document.getElementById('sbLen').textContent=snake.length;
    document.getElementById('sbMode').textContent=MODES[curMode].label;
    document.getElementById('sbBest').textContent=HS[curMode]||0;
    document.getElementById('sbScorePanel').style.display='';
    const now=Date.now();
    const hasPU=Object.keys(puEnd).some(k=>activePU[k]);
    const ppanel=document.getElementById('sbPuPanel');
    ppanel.style.display=hasPU?'':'none';
    if(hasPU){
      const list=document.getElementById('sbPuList');list.innerHTML='';
      for(const [k,end] of Object.entries(puEnd)){
        if(!activePU[k])continue;
        const rem=Math.max(0,end-Date.now()),tot=boostDur(POWERUPS[k].dur,k);
        const pct=(rem/tot*100).toFixed(1);
        const d=document.createElement('div');d.className='sb-pu-item';
        d.style.borderColor=POWERUPS[k].color;
        d.innerHTML=`<span>${POWERUPS[k].emoji}</span><span style="color:${POWERUPS[k].color}">${POWERUPS[k].label}</span><div class="sb-pu-bar"><div class="sb-pu-fill" style="width:${pct}%;background:${POWERUPS[k].color}"></div></div>`;
        list.appendChild(d);
      }
    }
  } else {
    document.getElementById('sbScorePanel').style.display='none';
    document.getElementById('sbPuPanel').style.display='none';
  }
  const ht=document.getElementById('sbHsTable');ht.innerHTML='';
  Object.entries(MODES).forEach(([k,v])=>{
    const r=document.createElement('div');r.className='sb-hs-row';
    r.innerHTML=`<span class="sb-hs-mode">${v.emoji} ${v.label}</span><span class="sb-hs-val">${HS[k]||0}</span>`;
    ht.appendChild(r);
  });
}