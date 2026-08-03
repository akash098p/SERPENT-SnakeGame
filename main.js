// ════════════════════════════════════════════════════════════════
// INITIALIZATION & ENTRY POINT
// ════════════════════════════════════════════════════════════════

// ── POLYFILL ──────────────────────────────────────────────────────
if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    if(Array.isArray(r))r=r[0];
    if(w<2*r)r=w/2;if(h<2*r)r=h/2;
    this.beginPath();this.moveTo(x+r,y);
    this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);
    this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);
    this.closePath();return this;
  };
}

// ── RESIZE HANDLER ────────────────────────────────────────────────
window.addEventListener('resize',()=>{if(curScreen==='game')resizeCanvas();});

// ── BOOT SEQUENCE ─────────────────────────────────────────────────
if(CHEAT_ACTIVE){
  snapshotBeforeDevMode();
  setAllBoostsToMax();
  SV('sp2_shop',SHOP);
}

// Build sidebar legend
buildLegend();

// Initialize loading screen
initLoadingScreen();

// Initialize input and buttons
initInput();
initButtons();

// Show menu screen after loading completes
setTimeout(()=>{
  showScreen('menuScreen');
},2800);