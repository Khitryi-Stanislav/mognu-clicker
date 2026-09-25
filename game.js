const CHARACTERS = [
  'assets/characters/1.png','assets/characters/2.png','assets/characters/3.png','assets/characters/4.png',
  'assets/characters/5.png','assets/characters/6.png','assets/characters/7.png','assets/characters/8.png'
];
// Медленнее прогресс: 8 уровней, персонажи зацикливаются после восьмого.
const LEVEL_GOALS = [0,100,200,500,700,1000,1400,1900,2500];
const LEVEL_NAMES = ['Первый могн','Разогрев','Уверенный могн','Могн-режим','Могн-турбо','Могн-мастер','Могн-легенда','Могн-икона'];
const UPGRADES = {
  rhythm: { name:'Ритм', desc:'+1 к силе клика', base:80, growth:1.55, max:8 },
  combo: { name:'Комбо 6–7', desc:'шанс x2 за клик', base:220, growth:1.75, max:6 },
  helper: { name:'Могн-помощник', desc:'+0.25 могна/сек', base:450, growth:1.7, max:8 },
  streak: { name:'Серия без пауз', desc:'+0.1 могна/сек', base:900, growth:1.8, max:10 }
};
const state = { money:0, totalClicks:0, perSecond:0, upgrades:{} };
let musicTimer;

function initUpgrades(){ Object.keys(UPGRADES).forEach(k=>state.upgrades[k] ??= 0); }
function level(){ return Math.min(8, LEVEL_GOALS.findIndex((goal,i)=>i>0 && state.totalClicks < goal) || 8); }
function cost(key){ const u=UPGRADES[key]; return Math.floor(u.base*Math.pow(u.growth,state.upgrades[key])); }
function clickPower(){ return 1 + state.upgrades.rhythm + (Math.random() < state.upgrades.combo*.04 ? 1 : 0); }
function recalc(){ state.perSecond=+(state.upgrades.helper*.25 + state.upgrades.streak*.1).toFixed(2); }
function format(n){ return Math.floor(n).toLocaleString('ru-RU'); }
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
  const box=document.querySelector('#upgrades-container'); box.innerHTML='';
  Object.entries(UPGRADES).forEach(([key,u])=>{
    const lvl=uLevel=state.upgrades[key], price=cost(key), maxed=lvl>=u.max;
    const button=document.createElement('button'); button.className='upgrade-item'; button.disabled=maxed||state.money<price;
    button.innerHTML=`<div class="upgrade-name">${u.name} · ${lvl}/${u.max}</div><div class="upgrade-desc">${u.desc}</div><div class="upgrade-cost">${maxed?'МАКСИМУМ':format(price)+' могнов'}</div>`;
    button.onclick=()=>buy(key); box.appendChild(button);
  });
}
function buy(key){ const price=cost(key); if(state.money<price||state.upgrades[key]>=UPGRADES[key].max)return; state.money-=price; state.upgrades[key]++; recalc(); render(); save(); }
function particles(x,y,value){ for(let i=0;i<Math.min(8,2+value);i++){ const p=document.createElement('span'); p.className='particle'; p.textContent=Math.random()<.5?'6':'7'; p.style.left=x+'px'; p.style.top=y+'px'; p.style.setProperty('--x',`${(Math.random()-.5)*180}px`); p.style.setProperty('--y',`${-40-Math.random()*150}px`); p.style.setProperty('--r',`${(Math.random()-.5)*90}deg`); document.querySelector('#particles').appendChild(p); setTimeout(()=>p.remove(),800); } }
function startMusic(){ const music=document.querySelector('#music'); music.volume=.45; music.play().catch(()=>{}); clearTimeout(musicTimer); musicTimer=setTimeout(()=>music.pause(),900); }
function clickHero(e){ const value=clickPower(); state.money+=value; state.totalClicks++; const r=document.querySelector('#hero').getBoundingClientRect(); particles(e.clientX||r.left+r.width/2,e.clientY||r.top+r.height/2,value); const hero=document.querySelector('#hero'); hero.classList.add('pressed'); setTimeout(()=>hero.classList.remove('pressed'),90); startMusic(); render(); }
function save(){ localStorage.setItem('mognu-save-v2',JSON.stringify(state)); }
function load(){ try{ const raw=localStorage.getItem('mognu-save-v2'); if(raw) Object.assign(state,JSON.parse(raw)); }catch(e){} initUpgrades(); recalc(); render(); }
document.addEventListener('DOMContentLoaded',()=>{ load(); document.querySelector('#hero').addEventListener('pointerdown',clickHero); setInterval(()=>{if(state.perSecond){state.money+=state.perSecond/10;render();}},100); setInterval(save,5000); });
