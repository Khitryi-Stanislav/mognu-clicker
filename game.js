const CHARACTERS = [
  'assets/characters/1.png','assets/characters/2.png','assets/characters/3.png','assets/characters/4.png',
  'assets/characters/5.png','assets/characters/6.png','assets/characters/7.png','assets/characters/8.png'
];

const LEVEL_GOALS = [0,100,200,500,700,1000,1400,1900,2500];
const LEVEL_NAMES = ['Первый могн','Разогрев','Уверенный могн','Могн-режим','Могн-турбо','Могн-мастер','Могн-легенда','Могн-икона'];

const UPGRADES = {
  rhythm: { name:'Ритм', desc:'+1 к силе клика', base:80, growth:1.55, max:8, icon:'🎵' },
  combo: { name:'Комбо 6–7', desc:'шанс x2 за клик', base:220, growth:1.75, max:6, icon:'⚡' },
  helper: { name:'Могн-помощник', desc:'+0.25 могна/сек', base:450, growth:1.7, max:8, icon:'👥' },
  streak: { name:'Серия без пауз', desc:'+0.1 могна/сек', base:900, growth:1.8, max:10, icon:'🔥' }
};

const ACHIEVEMENTS = {
  first: { name:'Первый шаг', desc:'Получи первый могн', icon:'👣', unlock:()=>state.totalClicks >= 1 },
  hundred: { name:'Столетие', desc:'Достигни 100 кликов', icon:'💯', unlock:()=>state.totalClicks >= 100 },
  level5: { name:'Половина', desc:'Дойди до уровня 5', icon:'🌟', unlock:()=>level() >= 5 },
  level8: { name:'Максимум', desc:'Дойди до уровня 8', icon:'👑', unlock:()=>level() >= 8 },
  upgrade10: { name:'Апгрейдер', desc:'Купи 10 улучшений', icon:'⬆️', unlock:()=>Object.values(state.upgrades).reduce((a,b)=>a+b,0) >= 10 },
  combo: { name:'Синхро', desc:'Получи x2 от комбо', icon:'⚡', unlock:()=>state.comboProcced >= 1 },
  money10k: { name:'Миллионер', desc:'Накопи 10000 могнов', icon:'💰', unlock:()=>state.money >= 10000 },
  streak30: { name:'Марафон', desc:'Купи максимум "Серия без пауз"', icon:'🏃', unlock:()=>state.upgrades.streak >= 10 },
  allmax: { name:'Легенда', desc:'Максимизируй все улучшения', icon:'🎯', unlock:()=>Object.entries(state.upgrades).every(([k,v])=>v >= UPGRADES[k].max) },
  clicks1k: { name:'Тысячелетие', desc:'Кликни 1000 раз', icon:'🎪', unlock:()=>state.totalClicks >= 1000 }
};

const state = { money:0, totalClicks:0, perSecond:0, upgrades:{}, achievements:{}, lastDaily:0, comboProcced:0, incomeMultiplier:1, lastClick:0 };
let musicTimer, ysdk = null, boostActive = false;

function initUpgrades(){ Object.keys(UPGRADES).forEach(k=>state.upgrades[k] ??= 0); }
function initAchievements(){ Object.keys(ACHIEVEMENTS).forEach(k=>state.achievements[k] ??= false); }
function level(){ return Math.min(8, LEVEL_GOALS.findIndex((goal,i)=>i>0 && state.totalClicks < goal) || 8); }
function cost(key){ const u=UPGRADES[key]; return Math.floor(u.base*Math.pow(u.growth,state.upgrades[key])); }
function clickPower(){
  const base = 1 + state.upgrades.rhythm;
  const combo = Math.random() < state.upgrades.combo*.04 ? 1 : 0;
  if(combo) state.comboProcced++;
  return (base + combo) * state.incomeMultiplier;
}
function recalc(){
  state.perSecond=+((state.upgrades.helper*.25 + state.upgrades.streak*.1) * state.incomeMultiplier).toFixed(2);
}
function format(n){ return Math.floor(n).toLocaleString('ru-RU'); }
function checkAchievements(){
  Object.entries(ACHIEVEMENTS).forEach(([key,ach])=>{
    if(!state.achievements[key] && ach.unlock()){
      state.achievements[key] = true;
      showNotification(`🏆 Достижение: ${ach.name}!`);
    }
  });
}
function render(){
  const lvl=level(), current=LEVEL_GOALS[lvl-1], next=LEVEL_GOALS[lvl] ?? current;
  document.querySelector('#money').textContent=format(state.money);
  document.querySelector('#level').textContent=lvl;
  document.querySelector('#per-second').textContent=state.perSecond.toFixed(2);
  document.querySelector('#character').src=CHARACTERS[(lvl-1)%CHARACTERS.length];
  document.querySelector('#character').alt=`Персонаж уровня ${lvl}`;
  document.querySelector('#character-name').textContent=LEVEL_NAMES[lvl-1];
  document.querySelector('#clicks').textContent=`${format(state.totalClicks)} / ${format(next)}`;
  document.querySelector('#progress-bar').style.width=`${Math.min(100,((state.totalClicks-current)/(next-current))*100)}%`;
  const achCount = Object.values(state.achievements).filter(Boolean).length;
  document.querySelector('#achievement-count').textContent=`${achCount}/10`;
  
  // Render upgrades
  const box=document.querySelector('#upgrades-container'); box.innerHTML='';
  Object.entries(UPGRADES).forEach(([key,u])=>{
    const lvl=state.upgrades[key], price=cost(key), maxed=lvl>=u.max;
    const button=document.createElement('button'); button.className='upgrade-item'; button.disabled=maxed||state.money<price;
    button.innerHTML=`<div class="upgrade-name">${u.icon} ${u.name} · ${lvl}/${u.max}</div><div class="upgrade-desc">${u.desc}</div><div class="upgrade-cost">${maxed?'МАКСИМУМ':format(price)+' мо'}</div>`;
    button.onclick=()=>buy(key); box.appendChild(button);
  });
  
  // Render achievements
  const achBox=document.querySelector('#achievements-container'); achBox.innerHTML='';
  Object.entries(ACHIEVEMENTS).forEach(([key,ach])=>{
    const div=document.createElement('div'); div.className='achievement'+(state.achievements[key]?' unlocked':''); div.textContent=ach.icon; div.title=`${ach.name}: ${ach.desc}`; achBox.appendChild(div);
  });
}
function buy(key){
  const price=cost(key);
  if(state.money<price||state.upgrades[key]>=UPGRADES[key].max)return;
  state.money-=price;
  state.upgrades[key]++;
  recalc();
  render();
  save();
  playSound('upgrade');
}
function particles(x,y,value){
  for(let i=0;i<Math.min(8,2+value);i++){
    const p=document.createElement('span');
    p.className='particle';
    p.textContent=Math.random()<.5?'6':'7';
    p.style.left=x+'px';
    p.style.top=y+'px';
    p.style.setProperty('--x',`${(Math.random()-.5)*180}px`);
    p.style.setProperty('--y',`${-40-Math.random()*150}px`);
    p.style.setProperty('--r',`${(Math.random()-.5)*90}deg`);
    document.querySelector('#particles').appendChild(p);
    setTimeout(()=>p.remove(),800);
  }
}
function startMusic(){
  const music=document.querySelector('#music');
  music.volume=.45;
  music.play().catch(()=>{});
  clearTimeout(musicTimer);
  musicTimer=setTimeout(()=>music.pause(),900);
}
function playSound(type){
  // Placeholder for sound effects
  // Can add Web Audio API later
}
function clickHero(e){
  state.lastClick = Date.now();
  const value=clickPower();
  state.money+=value;
  state.totalClicks++;
  const r=document.querySelector('#hero').getBoundingClientRect();
  particles(e.clientX||r.left+r.width/2,e.clientY||r.top+r.height/2,value);
  const hero=document.querySelector('#hero');
  hero.classList.add('pressed');
  setTimeout(()=>hero.classList.remove('pressed'),90);
  startMusic();
  checkAchievements();
  render();
}
function showNotification(text){
  const div=document.createElement('div');
  div.style.cssText='position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(255,61,154,.9);color:#fff;padding:12px 20px;border-radius:8px;z-index:999;animation:slideDown .3s ease-out';
  div.textContent=text;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(),2500);
}
function watchAd(){
  if(ysdk && ysdk.adv){
    ysdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: ()=>{},
        onRewarded: ()=>{
          state.incomeMultiplier = 2;
          showNotification('✨ x2 доход на 30 секунд!');
          setTimeout(()=>{ state.incomeMultiplier = 1; recalc(); render(); },30000);
        },
        onClose: ()=>{},
        onError: ()=>showNotification('❌ Ошибка загрузки рекламы')
      }
    });
  } else {
    state.incomeMultiplier = 2;
    showNotification('✨ x2 доход на 30 секунд! (без рекламы)');
    setTimeout(()=>{ state.incomeMultiplier = 1; recalc(); render(); },30000);
  }
}
function claimDaily(){
  const now = Date.now();
  if(now - state.lastDaily < 86400000){
    showNotification('⏰ Бонус доступен завтра!');
    return;
  }
  state.money += Math.floor(state.money * 0.2) + 500;
  state.lastDaily = now;
  showNotification('🎁 +20% от текущих могнов!');
  render();
  save();
}
function shareResult(){
  const text = `Я достиг уровня ${level()} в "Я тебя МОГНУ"! 🎯 ${format(state.totalClicks)} кликов могнули! Присоединяйся: `;
  if(ysdk && ysdk.environment){
    ysdk.environment.payload();
  }
  if(navigator.share){
    navigator.share({ title:'Я тебя МОГНУ', text:text });
  } else {
    alert(text);
  }
}
function save(){
  localStorage.setItem('mognu-save-v3',JSON.stringify(state));
  if(ysdk && ysdk.getStorage){
    ysdk.getStorage().setItem('mognu-data',JSON.stringify(state));
  }
}
function load(){
  try{
    const raw=localStorage.getItem('mognu-save-v3');
    if(raw) Object.assign(state,JSON.parse(raw));
  }catch(e){}
  initUpgrades();
  initAchievements();
  recalc();
  render();
}

// Init Yandex SDK
if(typeof YaGames !== 'undefined'){
  YaGames.init().then(sdk=>{
    ysdk = sdk;
    ysdk.features.LoadingAPI?.ready();
  }).catch(e=>console.error('YaGames init error:', e));
}

// Event listeners
document.addEventListener('DOMContentLoaded',()=>{
  load();
  document.querySelector('#hero').addEventListener('pointerdown',clickHero);
  document.querySelector('#ad-btn').addEventListener('click',watchAd);
  document.querySelector('#daily-btn').addEventListener('click',claimDaily);
  document.querySelector('#share-btn').addEventListener('click',shareResult);
  
  // Theme toggle
  document.querySelector('#theme-toggle').addEventListener('click',()=>{
    document.body.style.filter = document.body.style.filter === 'invert(1)' ? 'invert(0)' : 'invert(1)';
  });
  
  // Passive income loop
  setInterval(()=>{
    if(state.perSecond){ state.money+=state.perSecond/10; render(); }
  },100);
  
  // Auto save
  setInterval(save,5000);
});
