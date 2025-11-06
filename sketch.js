/* Dust & Letters — Integrated FINAL (p5.js)
 * - Fullscreen
 * - Subtitles: Gulim(또는 대체 폰트), size 34, leading 44, bottom center(120px)
 * - Arrow keys: ↑ Converge/Absorb, ↓ Genesis, → Legacy, ← Planet
 * - R : 안전 리셋(해상도/풀스크린 유지)
 */

// =================== OUTPUT SETTINGS ===================
let USE_FULLSCREEN = true;   // 창 모드 쓰려면 false
let OUT_W = 1080, OUT_H = 1920;

// =================== GLOBAL COMMON =====================
let scene = 0; // 0:CONVERGE, 1:GENESIS, 2:LEGACY, 3:PLANET

let R = 200;                 // 구 반지름(실행 시 화면 크기로 재설정)
let DETAIL = 40;             // 와이어 라인 디테일

let glowSprite;              // 소프트 글로우 스프라이트 (p5.Graphics)
let glowSpriteSize = 512;

let legacyFontName = 'Arial';   // 웹 폰트 가용성 때문에 이름만
let legacyText = 'LEGACY LACE';

// =================== SUBTITLES =========================
let subtitleFontName = 'Gulim, Arial, sans-serif';
const SUB_FONT_SIZE   = 34;
const SUB_LINE_HEIGHT = 44;
let SUB_DURATION_MS = 4000;
let subtitleColor = '#C8FF00';
let subMarginBottom = 120;

const SUB_G_CONVERGE    = 0;
const SUB_G_ABSORB      = 1; // ↑
const SUB_G_GENESIS     = 2; // ↓
const SUB_G_RECONSTRUCT = 3; // →
const SUB_G_PRESENT     = 4; // ←

let subGroups;
let curSubGroup = SUB_G_CONVERGE;
let subIndex = 0;
let subLastMillis = 0;

function buildSubtitles(){
  subGroups = [];
  subGroups[SUB_G_CONVERGE] = [
    "수렴.",
    "제각기 멀어지던 먼지들이 방향을 얻는다.",
    "현재의 기억이 흐릿한 먼지들을 한 점으로 불러 모은다.",
    "무수한 과거가, 하나의 중심을 갖기 시작한다."
  ];
  subGroups[SUB_G_ABSORB] = [
    "흡수.",
    "모인 입자들은 현재의 중심 가장자리에 닿고.",
    "미세한 떨림과 함께 조용히 삼켜진다.",
    "사라지는 것이 아니라, 더 깊은 층으로 내려간다."
  ];
  subGroups[SUB_G_GENESIS] = [
    "새로운 생성.",
    "현재의 자리에서 시간의 회전이 시작된다.",
    "가느린 선과 긴 꼬리, 미약한 숨이 궤도를 그린다.",
    "세계는 다시, 가장 단순한 규칙부터 시작한다."
  ];
  subGroups[SUB_G_RECONSTRUCT] = [
    "재구성.",
    "파동은 점을 모으고, 선을 엮어 기억의 레이스를 짜 올린다.",
    "무정형의 먼지가 문장처럼 배열되고.",
    "말 없는 문장이 다시 형상이 된다."
  ];
  subGroups[SUB_G_PRESENT] = [
    "기억의 현재화.",
    "그 형상은 지금의 이야기가되고,",
    "지나간 시간은 현재의 호흡으로 이어진다.",
    "우리는 묻는다.“당신은 지금, 무엇을 기억하나요?”"
  ];
}
function resetSubtitles(){ subIndex = 0; subLastMillis = millis(); }
function updateSubtitleTimer(){
  const cur = subGroups[curSubGroup]; if (!cur || !cur.length) return;
  if (millis() - subLastMillis >= SUB_DURATION_MS){
    subIndex = (subIndex + 1) % cur.length;
    subLastMillis = millis();
  }
}
function drawSubtitleOverlay(){
  updateSubtitleTimer();
  const cur = subGroups[curSubGroup]; if (!cur || !cur.length) return;
  const line = cur[subIndex];

  push();
  blendMode(BLEND);
  textFont(subtitleFontName);
  textSize(SUB_FONT_SIZE);
  textLeading(SUB_LINE_HEIGHT);
  fill(subtitleColor);
  textAlign(CENTER, CENTER);
  text(line, width/2, height - subMarginBottom);
  pop();
}

// =================== SCENE 0: Converge =================
let starCount = 900;
let stars = [];
let speed = 12;

const NORMAL = 0, CIRCLE_ENTER = 1, CIRCLE_HOLD1 = 2, SUCTION = 3, ABSORB = 4, FADEWHITE = 5;
let cState = NORMAL;
let cStateStart = 0;

let circleX = 0, circleY = 0, circleYStart = 0, circleYTarget = 0;
let circleR = 14;
let effectPrepared = false;
let absorbPrepared = false;
let pg; // starfield buffer (p5.Graphics)

function drawConvergeScene(){
  if (cState === NORMAL) speed = map(mouseX, 0, width, 4, 18);

  // ★ beginDraw/endDraw 없이 사용
  pg.clear();
  pg.blendMode(ADD);
  pg.push();
  pg.translate(width/2, height/2);

  if (cState===NORMAL || cState===CIRCLE_ENTER || cState===CIRCLE_HOLD1){
    for (const s of stars){ s.update(speed); s.displayPG(pg); s.cacheScreen(); }
  } else {
    if (!effectPrepared) prepareEffectCoords();

    if (cState===SUCTION){
      const tAll = constrain((millis()-cStateStart)/1200.0,0,1);
      const tSplit = 0.42;
      if (tAll < tSplit){
        const e = easeOutCubic(tAll/tSplit);
        for (const s of stars){ s.fx=lerp(s.fx0,s.fxSpread,e); s.fy=lerp(s.fy0,s.fySpread,e); }
      } else {
        const e = easeInCubic((tAll-tSplit)/(1.0-tSplit));
        for (const s of stars){ s.fx=lerp(s.fxSpread,s.fxCenter,e); s.fy=lerp(s.fySpread,s.fyCenter,e); }
      }
    } else if (cState===ABSORB){
      if (!absorbPrepared) prepareAbsorbStart();
      const e = easeInCubic(constrain((millis()-cStateStart)/900.0,0,1));
      const cx = circleX-width/2, cy = circleY-height/2;
      for (const s of stars){ s.fx=lerp(s.absFx0,cx,e); s.fy=lerp(s.absFy0,cy,e); }
    }

    pg.noStroke();
    for (const s of stars) pg.ellipse(s.fx, s.fy, 3, 3);
  }

  pg.pop();
  image(pg,0,0);

  drawSoftGlowCircle();
  updateCStateMachine();
}
function updateCStateMachine(){
  const elapsed = millis() - cStateStart;
  switch(cState){
    case NORMAL: break;
    case CIRCLE_ENTER:
      circleY = lerp(circleYStart, circleYTarget, easeOutCubic(map(elapsed,0,1200,0,1)));
      if (elapsed>=1200) changeCState(CIRCLE_HOLD1);
      break;
    case CIRCLE_HOLD1:
      if (elapsed>=3000) changeCState(SUCTION);
      break;
    case SUCTION:
      if (elapsed>=1200) changeCState(ABSORB);
      break;
    case ABSORB:
      if (elapsed>=900)  changeCState(FADEWHITE);
      break;
    case FADEWHITE:
      const a = constrain((millis()-cStateStart)/1800.0,0,1);
      push(); fill(255,255*a); noStroke(); rect(0,0,width,height); pop();
      break;
  }
}
function changeCState(next){
  cState = next; cStateStart = millis();
  if (cState===CIRCLE_ENTER){
    circleX=width*0.5; circleYStart=height+circleR*2.0; circleYTarget=height*0.40; circleY=circleYStart;
  } else if (cState===SUCTION) effectPrepared=false;
  else if (cState===ABSORB)    absorbPrepared=false;
}
function prepareEffectCoords(){
  const cx=circleX-width/2, cy=circleY-height/2;
  for (const s of stars){
    s.fx0=s.sx; s.fy0=s.sy;
    const dx=s.fx0-cx, dy=s.fy0-cy, d=max(1, Math.hypot(dx,dy));
    const ux=dx/d, uy=dy/d;
    const spreadAmt=Math.max(20, circleR*2.0 + random(circleR*4.5));
    s.fxSpread=s.fx0+ux*spreadAmt; s.fySpread=s.fy0+uy*spreadAmt;
    const r=random(circleR*0.04, circleR*0.10), a=random(TWO_PI);
    s.fxCenter=cx+Math.cos(a)*r; s.fyCenter=cy+Math.sin(a)*r;
    s.fx=s.fx0; s.fy=s.fy0;
  }
  effectPrepared=true;
}
function prepareAbsorbStart(){ for (const s of stars){ s.absFx0=s.fx; s.absFy0=s.fy; } absorbPrepared=true; }
function drawSoftGlowCircle(){
  if (cState===NORMAL) return;
  push(); imageMode(CENTER); blendMode(ADD);
  const dCore=circleR*2.0;
  const grow=(cState===FADEWHITE)? easeInCubic(constrain((millis()-cStateStart)/1800.0,0,1)) : 0;
  const targetD=Math.max(width,height)*1.2;
  const currentD=lerp(dCore,targetD,grow);
  tint(255,180); image(glowSprite,circleX,circleY,currentD*20.0,currentD*20.0);
  noStroke(); fill(255); ellipse(circleX,circleY,currentD,currentD);
  pop();
}

// =================== SCENE 1: Genesis ===================
const ORBITER_COUNT = 6;
let orbiters = [];
let trails   = [];
let sphereRotX=0, sphereRotY=0, sphereRotZ=0;
let sphereRX = 0.010, sphereRY = 0.020, sphereRZ = 0.006;

function setupGenesis(){
  orbiters.length=0; trails.length=0;
  for (let i=0;i<ORBITER_COUNT;i++){
    const lat0=random(-PI/2.1, PI/2.1);
    const lon0=random(TWO_PI);
    const spLat=random(0.015,0.028);
    const spLon=random(0.030,0.055);
    orbiters.push(new Orbiter(lat0,lon0,spLat,spLon));
  }
}
function drawGenesisScene(){
  const targetX = map(mouseY, 0, height, 0.03, -0.03);
  const targetY = map(mouseX, 0, width, -0.03, 0.03);
  sphereRX = lerp(sphereRX,targetX,0.05);
  sphereRY = lerp(sphereRY,targetY,0.05);
  const intensity = map(mouseY,height,0,0.5,2.0);

  sphereRotX += sphereRX; sphereRotY += sphereRY; sphereRotZ += sphereRZ;

  push(); translate(width/2, height/2);
  stroke(255,60); noFill(); drawWireSphere(R, DETAIL, sphereRotX, sphereRotY, sphereRotZ);

  blendMode(ADD);
  for (let i=trails.length-1;i>=0;i--){ const t=trails[i]; t.update(); t.display(); if(t.dead()) trails.splice(i,1); }
  for (const o of orbiters){ o.update(); o.emitTrail(intensity); o.displayGlow(intensity); }
  pop();

  if (trails.length>25000) trails.splice(0, trails.length-25000);
}
class Orbiter{
  constructor(lat0,lon0,sp1,sp2){
    this.lat=lat0; this.lon=lon0; this.spLat=sp1; this.spLon=sp2;
    this.seed=random(1000); this.jitterAmp=random(0.02,0.05);
  }
  update(){
    this.lon+=this.spLon;
    this.lat+=this.spLat*0.35*sin(frameCount*0.03+this.seed);
    const t=frameCount*0.004;
    this.lat+=0.010*(noise(this.seed+t)-0.5);
    this.lon+=0.012*(noise(this.seed+100+t*0.85)-0.5);
  }
  displayGlow(intensity){
    let p3=spherePoint(R+2,this.lat,this.lon); p3=rotate3D(p3, sphereRotX, sphereRotY, sphereRotZ);
    const q=project(p3);
    blendMode(ADD); noStroke();
    fill(255,255); ellipse(q.x,q.y,10*intensity,10*intensity);
    imageMode(CENTER); tint(255,150*intensity); image(glowSprite,q.x,q.y,80*intensity,80*intensity); noTint();
  }
  emitTrail(intensity){
    let p=spherePoint(R+2,this.lat,this.lon); p=rotate3D(p, sphereRotX, sphereRotY, sphereRotZ);
    let tan=tangentOnSphere(this.lat,this.lon); tan=rotate3D(tan, sphereRotX, sphereRotY, sphereRotZ);
    const emitN=int(40*intensity);
    for(let i=0;i<emitN;i++){
      const v=p5.Vector.add(p5.Vector.mult(tan,-1.2), new p5.Vector(random(-0.03,0.03),random(-0.03,0.03),random(-0.03,0.03)));
      trails.push(new Trail(p.copy(), v, 240+random(120)));
    }
  }
}
class Trail{
  constructor(p,v,lf){ this.pos=p.copy(); this.prev=p.copy(); this.vel=v.copy().mult(0.96); this.life=lf; this.age=0; }
  update(){ this.prev.set(this.pos); this.pos.add(this.vel); this.vel.mult(0.993); this.vel.add(new p5.Vector(random(-0.002,0.002),random(-0.002,0.002),random(-0.002,0.002))); this.age++; }
  dead(){ return this.age>=this.life; }
  display(){
    const a2=project(this.prev), b2=project(this.pos); const t=this.age/this.life, alpha=lerp(255,0,t);
    stroke(255, alpha*0.25); strokeWeight(0.3); line(a2.x,a2.y,b2.x,b2.y);
    noStroke(); fill(255, alpha*0.3); ellipse(b2.x,b2.y,0.4,0.4);
  }
}

// =================== SCENE 2: Legacy ====================
let LEGACY_COUNT = 3500 * 4;
let innerDust = [];
let textDots  = [];
let legacyInited = false;
let legacyStartMillis = 0;
let textPG;
let textPGSize;
let textSampleStep = 3;

function setupLegacy(){
  innerDust.length=0; textDots.length=0;
  for (let i=0;i<LEGACY_COUNT;i++) innerDust.push(new InnerDust());

  textPGSize = int(Math.min(width, height) * 0.55);
  textPG = createGraphics(textPGSize, textPGSize);
  textPG.clear();
  textPG.fill(255);
  textPG.textAlign(CENTER,CENTER);
  textPG.textFont(legacyFontName);
  textPG.textSize(textPGSize*0.13);
  textPG.text(legacyText, textPG.width/2, textPG.height/2);

  textPG.loadPixels();
  for (let y=0; y<textPG.height; y+=textSampleStep){
    for (let x=0; x<textPG.width; x+=textSampleStep){
      const idx=(y*textPG.width + x)*4;
      const a = textPG.pixels[idx+3];
      if (a<=10) continue;
      const nx=map(x,0,textPG.width,-1,1), ny=map(y,0,textPG.height,-1,1);
      if (nx*nx+ny*ny<=1.0){
        const p3=new p5.Vector(nx*(R*0.75), ny*(R*0.75), 0);
        textDots.push(new TextDot(p3));
      }
    }
  }
  legacyInited=true; legacyStartMillis=millis();
}
function drawLegacyScene(){
  const mouseV=dist(mouseX,mouseY,pmouseX,pmouseY);
  const energy=map(mouseV,0,40,0.6,3.2);
  sphereRotX+=0.004; sphereRotY+=0.006; sphereRotZ+=0.003;

  push(); translate(width/2, height/2);
  blendMode(ADD); noStroke();

  const t=frameCount*0.02;
  for (const d of innerDust){
    d.updateWave(energy,t);
    const rp=rotate3D(d.p, sphereRotX, sphereRotY, sphereRotZ);
    const depth=map(rp.z,-R,R,1.2,0.3);
    const q=project(rp);
    if (q.x*q.x+q.y*q.y<=R*R){
      fill(255,120*depth); ellipse(q.x,q.y,0.9,0.9);
      fill(255,32*depth);  ellipse(q.x,q.y,2.1,2.1);
    }
  }

  stroke(255,36); noFill(); drawWireSphere(R, DETAIL, sphereRotX, sphereRotY, sphereRotZ);

  const dt=millis()-legacyStartMillis; const fade=constrain(map(dt,800,5000,0,1),0,1); const aText=255*easeOutCubic(fade);
  noStroke(); blendMode(ADD);
  for (const td of textDots){
    const tw=0.85+0.15*sin(t*0.7+td.seed);
    const rp=rotate3D(td.pos, sphereRotX, sphereRotY, sphereRotZ);
    const q=project(rp);
    fill(255, aText*0.85*tw); ellipse(q.x,q.y,1.3,1.3);
    fill(255, aText*0.25*tw); ellipse(q.x,q.y,3.0,3.0);
  }
  pop();
}
class InnerDust{
  constructor(){
    const dir=p5.Vector.random3D(); const rad=Math.pow(random(1),1/3)*(R-6);
    this.p=p5.Vector.mult(dir,rad); this.v=new p5.Vector(0,0,0); this.nSeed=random(1000);
  }
  updateWave(energy,t){
    const kw=0.03, fw=0.01, amp=0.9*energy;
    const wave=new p5.Vector(
      sin(this.p.y*kw+t*fw)+0.5*sin(this.p.z*kw*1.4-t*fw*0.8),
      sin(this.p.z*kw+t*fw*1.1)+0.5*sin(this.p.x*kw*1.3+t*fw*0.9),
      sin(this.p.x*kw+t*fw*0.9)+0.5*sin(this.p.y*kw*1.2-t*fw*1.0)
    ).mult(amp);
    const nx=noise(this.nSeed+7.31+this.p.x*0.006,this.p.y*0.006,t*0.6)-0.5;
    const ny=noise(this.nSeed+1.77+this.p.y*0.006,this.p.z*0.006,t*0.7)-0.5;
    const nz=noise(this.nSeed+9.13+this.p.z*0.006,this.p.x*0.006,t*0.8)-0.5;
    const n=new p5.Vector(nx,ny,nz).mult(0.6*energy);
    this.v.add(p5.Vector.add(wave,n)); this.v.mult(0.92); this.p.add(this.v);
    const d=this.p.mag(); if (d>R-4){
      const nrm=this.p.copy().normalize(); const over=d-(R-4);
      this.p.sub(p5.Vector.mult(nrm,over+0.1)); const vn=this.v.dot(nrm); this.v.sub(p5.Vector.mult(nrm,vn*1.9));
    }
  }
}
class TextDot{ constructor(p3){ this.pos=p3.copy(); this.seed=random(TWO_PI);} }

// =================== SCENE 3: Planet Nebula v2 =========
let VP_COUNT = 20000;
let vpBase, vpPhase, vpBright;
let vpFloatAmp = 7.0;
let vpFloatFreq = 0.85;

// 와이어 회전(구체만)
let pRX = 0, pRY = 0;
let pBaseX = 0.004, pBaseY = 0.010;

// 궤도(고정)
let ORBIT_COUNT = 5;
let orbitTilt = 0.62;
let orbitSpin = 0;        // 고정
let orbitSpinSpeed = 0.0; // 고정
let orbitR = [];

// 배경 별
let BG_COUNT = 420;
let bgStars = [];

// 텍스트(눈꽃) 샘플
let textMaskPG;
let textMaskSize;
let TEXT_MASK_SCALE = 0.90;
let snowPoints = [];

// 텍스트-구 파티클 간섭 완화
let TEXT_MASK_RADIUS = 0.80;
let TEXT_SKIP_PERCENT = 45;

function setupPlanetV2(){
  vpBase  = new Array(VP_COUNT);
  vpPhase = new Array(VP_COUNT);
  vpBright= new Array(VP_COUNT);

  let i=0;
  textMaskPG.loadPixels();

  while(i<VP_COUNT){
    const d=p5.Vector.random3D();
    const rad=Math.pow(random(1),1/3)*(R-6);
    const p=p5.Vector.mult(d, rad);

    const poleBias = Math.pow(Math.abs(p.y)/(R), 1.2);
    const keepProb = 0.25 + 0.75*poleBias;
    if (random(1) > keepProb) continue;

    const nx = p.x / (R*TEXT_MASK_RADIUS);
    const ny = p.y / (R*TEXT_MASK_RADIUS);
    if (nx*nx + ny*ny <= 1.0){
      const mx = int(map(nx,-1,1,0,textMaskPG.width-1));
      const my = int(map(ny,-1,1,0,textMaskPG.height-1));
      const midx = (my*textMaskPG.width + mx)*4;
      const a = textMaskPG.pixels[midx+3];
      if (a>10 && random(100)<TEXT_SKIP_PERCENT) continue;
    }

    vpBase[i]=p;
    vpPhase[i]=random(TWO_PI);

    const depthBoost = 0.6 + 0.4*map(p.z,-R,R,0.3,1.0);
    const poleBoost  = 0.9 + 0.4*poleBias;
    vpBright[i]=depthBoost*poleBoost;
    i++;
  }

  ORBIT_COUNT = 5;
  orbitR = new Array(ORBIT_COUNT);
  const rMin = R * 1.4;
  const rMax = Math.max(width, height) * 0.80;
  for (let k=0;k<ORBIT_COUNT;k++){
    const t = (ORBIT_COUNT===1)? 0 : k/(ORBIT_COUNT-1);
    orbitR[k] = lerp(rMin, rMax, t);
  }

  bgStars = new Array(BG_COUNT);
  for (let b=0;b<BG_COUNT;b++) bgStars[b]=new StarBG();

  snowPoints.length=0;
  textMaskPG.loadPixels();
  for (let y=0;y<textMaskPG.height;y+=3){
    for (let x=0;x<textMaskPG.width;x+=3){
      const idx=(y*textMaskPG.width+x)*4;
      const a=textMaskPG.pixels[idx+3];
      if (a<=10) continue;
      const nx2=map(x,0,textMaskPG.width,-1,1);
      const ny2=map(y,0,textMaskPG.height,-1,1);
      if (nx2*nx2+ny2*ny2<=1.0){
        const px = width/2  + nx2*(R*0.75);
        const py = height/2 + ny2*(R*0.75);
        snowPoints.push(new p5.Vector(px,py,0));
      }
    }
  }
}
function drawPlanetScene(){
  const mv = dist(mouseX,mouseY,pmouseX,pmouseY);
  const boost = map(mv, 0, 40, 0.0, 1.6);
  pRX += pBaseX*(1.0+0.6*boost);
  pRY += pBaseY*(1.0+1.0*boost);
  orbitSpin += orbitSpinSpeed;

  blendMode(ADD);
  imageMode(CENTER);
  tint(255,70); image(glowSprite, width*0.50, height*0.50, Math.max(width,height)*1.2, Math.max(width,height)*1.2);
  tint(255,40); image(glowSprite, width*0.52, height*0.53, Math.max(width,height)*1.6, Math.max(width,height)*1.6);
  noTint();
  for (const s of bgStars){ s.update(); s.display(); }

  push();
  translate(width/2, height/2);

  push();
  rotate(orbitSpin);
  scale(1.0, orbitTilt);
  noFill(); stroke(255,70); strokeWeight(1.2);
  for (let i=0;i<ORBIT_COUNT;i++){ const r=orbitR[i]; ellipse(0,0,r*2,r*2); }
  pop();

  const t = millis()*0.001*vpFloatFreq;
  const f = width*0.9;
  noStroke(); blendMode(ADD);
  for (let i=0;i<VP_COUNT;i++){
    const base = vpBase[i];
    const wob = new p5.Vector(0, Math.sin(t+vpPhase[i])*vpFloatAmp, 0);
    let p = p5.Vector.add(base, wob);
    p = rotate3D2(p, pRX, pRY);  // 구체만 회전

    const zc = p.z + f; const sx = (p.x*f)/zc; const sy=(p.y*f)/zc;
    const depth = map(p.z,-R,R,0.55,1.0);
    const a = 220 * vpBright[i] * depth;
    const sz= 2.0 * depth;

    fill(255, a);      ellipse(sx,sy, sz, sz);
    fill(255, a*0.18); ellipse(sx,sy, sz*1.8, sz*1.8);
  }

  stroke(255,60); noFill(); drawWireSphere(R, DETAIL, pRX, pRY, 0);
  pop();

  drawSnowText();
}
function drawSnowText(){
  blendMode(ADD);
  for (const q of snowPoints){ drawSnowflake(q.x, q.y, 3.0, 220); }
}
function drawSnowflake(x, y, size, alphaVal){
  push();
  stroke(255,alphaVal); strokeWeight(1);
  for(let k=0;k<6;k++){
    const ang = TWO_PI*k/6.0;
    const x2 = x + Math.cos(ang)*size, y2 = y + Math.sin(ang)*size;
    line(x, y, x2, y2);
  }
  noStroke(); fill(255,alphaVal); ellipse(x,y, size*0.6, size*0.6);
  pop();
}

// =================== COMMON UTILS =======================
function drawWireSphere(rad,detail,rx,ry,rz){
  strokeWeight(1);
  // latitude
  for (let j=-detail/2;j<=detail/2;j+=2){
    const lat=map(j,-detail/2,detail/2,-HALF_PI,HALF_PI);
    let prev=null;
    for (let i=0;i<=detail;i++){
      const lon=map(i,0,detail,0,TWO_PI);
      let p=spherePoint(rad,lat,lon); p=rotate3D(p,rx,ry,rz);
      const q=project(p); if(prev) line(prev.x,prev.y,q.x,q.y);
      prev={x:q.x,y:q.y};
    }
  }
  // longitude
  for (let i=0;i<=detail;i+=2){
    const lon=map(i,0,detail,0,TWO_PI);
    let prev=null;
    for (let j=-detail/2;j<=detail/2;j++){
      const lat=map(j,-detail/2,detail/2,-HALF_PI,HALF_PI);
      let p=spherePoint(rad,lat,lon); p=rotate3D(p,rx,ry,rz);
      const q=project(p); if(prev) line(prev.x,prev.y,q.x,q.y);
      prev={x:q.x,y:q.y};
    }
  }
}
function spherePoint(rad,lat,lon){
  return new p5.Vector(rad*Math.cos(lat)*Math.cos(lon), rad*Math.sin(lat), rad*Math.cos(lat)*Math.sin(lon));
}
function rotate3D(p,rx,ry,rz){
  const crx=Math.cos(rx),srx=Math.sin(rx), cry=Math.cos(ry),sry=Math.sin(ry), crz=Math.cos(rz),srz=Math.sin(rz);
  const y1=p.y*crx-p.z*srx, z1=p.y*srx+p.z*crx;
  const x2=p.x*cry+z1*sry,  z2=-p.x*sry+z1*cry;
  const x3=x2*crz-y1*srz,   y3=x2*srz+y1*crz;
  return new p5.Vector(x3,y3,z2);
}
// overload 대체 (rx, ry만)
function rotate3D2(p,rx,ry){
  const crx=Math.cos(rx),srx=Math.sin(rx), cry=Math.cos(ry),sry=Math.sin(ry);
  const y1=p.y*crx-p.z*srx, z1=p.y*srx+p.z*crx;
  const x2=p.x*cry+z1*sry,  z2=-p.x*sry+z1*cry;
  return new p5.Vector(x2,y1,z2);
}
function project(p){ const f=width*0.9, z=p.z+f; return {x:(p.x*f)/z, y:(p.y*f)/z}; }
function tangentOnSphere(lat,lon){
  const rad=R;
  const tLon=new p5.Vector(-rad*Math.cos(lat)*Math.sin(lon),0,rad*Math.cos(lat)*Math.cos(lon));
  const tLat=new p5.Vector(-rad*Math.sin(lat)*Math.cos(lon),rad*Math.cos(lat),-rad*Math.sin(lat)*Math.sin(lon));
  const t=p5.Vector.lerp(tLon,tLat,0.35); t.normalize(); return t;
}
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
function easeInCubic (t){ return t*t*t; }

// =================== GLOW SPRITE ========================
function buildGlowSprite(S){
  glowSprite = createGraphics(S, S);
  // beginDraw/endDraw 없이 직접 픽셀 작성
  glowSprite.loadPixels();
  const cx = (S-1)*0.5, cy = (S-1)*0.5, maxR = Math.min(cx, cy), power = 2.6;
  for(let y=0;y<S;y++){
    for(let x=0;x<S;x++){
      const dx=x-cx, dy=y-cy, r=constrain(Math.hypot(dx,dy)/maxR,0,1);
      const a=Math.pow(1.0-r,power);
      const idx=(y*S+x)*4;
      glowSprite.pixels[idx]   = 255;
      glowSprite.pixels[idx+1] = 255;
      glowSprite.pixels[idx+2] = 255;
      glowSprite.pixels[idx+3] = int(255*a);
    }
  }
  glowSprite.updatePixels();
}

// =================== STAR / BG STAR =====================
class Star{
  constructor(){ this.reset(); this.sx=0; this.sy=0; this.fx=0; this.fy=0;
    this.fx0=0;this.fy0=0;this.fxSpread=0;this.fySpread=0;this.fxCenter=0;this.fyCenter=0; this.absFx0=0; this.absFy0=0; }
  reset(){ this.x=random(-width,width); this.y=random(-height,height); this.z=random(width); this.pz=this.z; }
  update(spd){ this.z-=spd; if(this.z<1){ this.reset(); this.z=width; this.pz=this.z; } }
  displayPG(g){
    const sc=width*0.5, nx=(this.x/this.z)*sc, ny=(this.y/this.z)*sc, px=(this.x/this.pz)*sc, py=(this.y/this.pz)*sc;
    if (Math.abs(nx)<=width && Math.abs(ny)<=height){
      g.stroke(255,map(this.z,0,width,255,80)); g.line(px,py,nx,ny);
      g.noStroke(); g.fill(255,map(this.z,0,width,255,80)); g.ellipse(nx,ny,2,2);
    } this.pz=this.z;
  }
  cacheScreen(){ const sc=width*0.5; this.sx=(this.x/this.z)*sc+width/2; this.sy=(this.y/this.z)*sc+height/2; }
}
class StarBG{
  constructor(){ this.x=random(width); this.y=random(height); this.z=random(0.4,1.0); this.twSeed=random(TWO_PI); this.driftSeed=random(1000); }
  update(){
    const t=millis()*0.00015;
    this.x += (noise(this.driftSeed+t)-0.5)*0.3;
    this.y += (noise(this.driftSeed+200+t*1.1)-0.5)*0.3;
    if (this.x<-20||this.x>width+20||this.y<-20||this.y>height+20){ this.x=random(width); this.y=random(height); }
  }
  display(){
    const tw=0.65+0.35*sin(millis()*0.0016+this.twSeed);
    const a=150*this.z*tw; const s=1.2*this.z;
    noStroke(); blendMode(ADD);
    fill(255,a); ellipse(this.x,this.y,s,s);
    tint(255,a*0.4); imageMode(CENTER); image(glowSprite,this.x,this.y,18*s,18*s); noTint();
  }
}

// =================== SETTINGS/SETUP/DRAW/INPUT =========
function setup(){
  const cnv = USE_FULLSCREEN ? createCanvas(windowWidth, windowHeight) : createCanvas(OUT_W, OUT_H);
  cnv.parent('app');
  pixelDensity(1);

  // 반지름/글로우
  R = Math.min(width, height) * 0.28;
  buildGlowSprite(glowSpriteSize);

  // Converge
  pg = createGraphics(width, height);
  stars = new Array(starCount);
  for (let i=0;i<starCount;i++) stars[i] = new Star();
  circleX=width*0.5; circleYStart=height+circleR*2.0; circleYTarget=height*0.40; circleY=circleYStart; cState=NORMAL;

  // Genesis
  setupGenesis();

  // Legacy / Planet 준비
  buildTextMask();
  setupPlanetV2();

  buildSubtitles();
  resetSubtitles();

  textFont(legacyFontName);
}
function draw(){
  blendMode(BLEND);
  background(0);
  switch(scene){
    case 0: drawConvergeScene(); break;
    case 1: drawGenesisScene();  break;
    case 2: if(!legacyInited) setupLegacy(); drawLegacyScene(); break;
    case 3: drawPlanetScene();   break;
  }
  drawSubtitleOverlay();
}
function windowResized(){
  if (USE_FULLSCREEN){
    resizeCanvas(windowWidth, windowHeight);
    safeResetToStart(true);
  }
}
function keyPressed(){
  if (keyCode===UP_ARROW){
    scene=0; changeCState(CIRCLE_ENTER);
    curSubGroup=SUB_G_ABSORB; resetSubtitles();
  }
  if (keyCode===DOWN_ARROW){
    scene=1; curSubGroup=SUB_G_GENESIS; resetSubtitles();
  }
  if (keyCode===RIGHT_ARROW){
    scene=2; if(!legacyInited) setupLegacy(); curSubGroup=SUB_G_RECONSTRUCT; resetSubtitles();
  }
  if (keyCode===LEFT_ARROW){
    scene=3; curSubGroup=SUB_G_PRESENT; resetSubtitles();
  }
  if (key==='r' || key==='R'){
    scene=0;
    safeResetToStart(false);
  }
}

// =================== TEXT MASK (Planet) =================
function buildTextMask(){
  textMaskSize = int(Math.min(width, height) * 0.55);
  textMaskPG   = createGraphics(textMaskSize, textMaskSize);
  textMaskPG.clear();
  textMaskPG.fill(255);
  textMaskPG.textAlign(CENTER,CENTER);
  textMaskPG.textFont(legacyFontName);
  textMaskPG.textSize(textMaskSize*0.13*TEXT_MASK_SCALE);
  textMaskPG.text(legacyText, textMaskPG.width/2, textMaskPG.height/2);
}

// =================== SAFE RESET ========================
function safeResetToStart(fromResize){
  blendMode(BLEND); imageMode(CORNER); rectMode(CORNER); noStroke(); noTint();

  R = Math.min(width, height) * 0.28;

  if (!pg || pg.width !== width || pg.height !== height) pg = createGraphics(width, height);
  pg.clear();

  cState = NORMAL;
  cStateStart = millis();
  circleX = width * 0.5;
  circleYStart = height + circleR * 2.0;
  circleYTarget = height * 0.40;
  circleY = circleYStart;
  effectPrepared = false;
  absorbPrepared = false;

  if (!stars || stars.length !== starCount) stars = new Array(starCount);
  for (let i = 0; i < stars.length; i++) { if (!stars[i]) stars[i] = new Star(); else stars[i].reset(); }

  if (trails) trails.length=0;
  sphereRotX = sphereRotY = sphereRotZ = 0;
  pRX = pRY = 0;

  curSubGroup = SUB_G_CONVERGE;
  resetSubtitles();

  if (fromResize){
    buildTextMask();
    setupPlanetV2();
    legacyInited=false; // Legacy는 resize 후 다시 생성
  }

  background(0);
}

