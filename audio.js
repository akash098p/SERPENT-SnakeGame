// ════════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ════════════════════════════════════════════════════════════════

const AU = (()=>{
  const SFX={
    eat:          'sounds/eat.wav',
    coin:         'sounds/coin.wav',
    diamond:      'sounds/diamond.wav',
    game_over:    'sounds/game-over.wav',
    menu_select:  'sounds/menu-select.wav',
    start:        'sounds/start.wav',
    level_up:     'sounds/level-up.wav',
    shrink:       'sounds/shrink.wav',
    speed_boost:  'sounds/speed-boost.wav',
    invincible:   'sounds/invincible.wav',
    ghost_mode:   'sounds/ghost-mode.wav',
    double_points:'sounds/double-points.wav',
    magnet:       'sounds/magnet.wav',
    move:         'sounds/move.wav'
  };
  const MUSIC={
    menu_music: 'sounds/menu-music.mp3',
    background: 'sounds/background.mp3'
  };

  let vol = CFG.volume;
  let bgVol = CFG.bgVolume;
  const masters = {};
  const musicEl = {};
  let curMusic = null;
  let unlocked = false;

  // Pre-create elements
  Object.entries(SFX).forEach(([k,src])=>{
    const a=new Audio();a.src=src;a.preload='auto';a.load();masters[k]=a;
  });
  Object.entries(MUSIC).forEach(([k,src])=>{
    const a=new Audio();a.src=src;a.loop=true;a.volume=vol;a.preload='auto';musicEl[k]=a;
  });

  function showToast(){
    const t=document.getElementById('audioToast');
    t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);
  }
  const targetVol=(name)=>name==='background'?vol*bgVol:vol;

  async function unlock(){
    if(unlocked)return; unlocked=true;
    try{const ac=new(window.AudioContext||window.webkitAudioContext)();
      if(ac.state==='suspended')await ac.resume();ac.close();}catch{}
    // Warm up SFX
    Object.values(masters).forEach(a=>{
      try{const c=a.cloneNode();c.volume=0;c.play().then(()=>c.pause()).catch(()=>{});}catch{}
    });
    // Start expected music immediately after first user interaction.
    if(typeof curScreen!=='undefined'){
      if(curScreen==='game'&&!gameOver&&!paused)playMusic('background');
      else playMusic('menu_music');
    }else{
      playMusic('menu_music');
    }
    showToast();
  }

  // Play SFX — cloneNode for overlap
  function sfx(name, volMul=1){
    if(!masters[name]||vol===0)return;
    try{
      const c=masters[name].cloneNode();
      c.volume=Math.min(1,vol*volMul);
      c.play().catch(()=>{});
    }catch{}
  }

  // Crossfade music — DOES NOT restart if same track already playing
  function playMusic(name){
    if(!musicEl[name])return;
    if(curMusic===name&&!musicEl[name].paused)return; // already playing
    // Fade out old track (different track)
    if(curMusic&&curMusic!==name){
      const oldName=curMusic;
      const old=musicEl[oldName];
      let ov=old.volume;
      const fi=setInterval(()=>{
        ov=Math.max(0,ov-.07);old.volume=ov;
        if(ov<=0){old.pause();old.currentTime=0;old.volume=targetVol(oldName);clearInterval(fi);}
      },30);
    }
    curMusic=name;
    const m=musicEl[name];
    m.currentTime=0;m.volume=0;
    m.play().then(()=>{
      const tar=targetVol(name);
      let nv=0;const fi=setInterval(()=>{
        nv=Math.min(tar,nv+.05);m.volume=nv;if(nv>=tar)clearInterval(fi);
      },35);
    }).catch(()=>{});
  }

  function stopMusic(name,cb){
    if(!musicEl[name])return;
    const m=musicEl[name];
    if(m.paused){if(cb)cb();if(curMusic===name)curMusic=null;return;}
    let ov=m.volume;
    const fi=setInterval(()=>{
      ov=Math.max(0,ov-.08);m.volume=ov;
      if(ov<=0){m.pause();m.currentTime=0;m.volume=targetVol(name);clearInterval(fi);if(cb)cb();}
    },28);
    if(curMusic===name)curMusic=null;
  }

  function stopAll(){
    Object.keys(musicEl).forEach(n=>{musicEl[n].pause();musicEl[n].currentTime=0;});
    curMusic=null;
  }

  function setVol(v){
    vol=v;CFG.volume=v;SV('sp2_cfg',CFG);
    Object.entries(musicEl).forEach(([k,m])=>{if(!m.paused)m.volume=targetVol(k);});
  }

  function setBgVol(v){
    bgVol=v;CFG.bgVolume=v;SV('sp2_cfg',CFG);
    const bg=musicEl.background;
    if(bg&&!bg.paused)bg.volume=targetVol('background');
  }

  return{unlock,sfx,playMusic,stopMusic,stopAll,setVol,setBgVol,getVol:()=>vol,getBgVol:()=>bgVol};
})();

['pointerdown','keydown','touchstart'].forEach(ev=>
  document.addEventListener(ev,()=>AU.unlock(),{once:true,passive:true})
);