// ---------- CONFIG ----------
const JSONBIN_API_KEY = "$2a$10$eSpu6OdVbWfJzjSGdvMa5uwYI15tXgj1Syd97vF3Hb/xA4PljLNma";
const BIN_ID = "6983e9a943b1c97be966219e";
const TAP_STEP = 1;

// ---------- STATE ----------
let user = { username:"Guest", taps:0, pets:{} };
let petTimers = {};
let rainbowActive=false;
let bossActive=false;

// ---------- UI ----------
const countEl = document.getElementById("count");
const navUser = document.getElementById("navUser");
const toast = document.getElementById("toast");
const duckLayer = document.getElementById("duckLayer");
const floatingLayer = document.getElementById("floatingLayer");
const petDisplay = document.getElementById("petDisplay");
const bossLayer = document.getElementById("bossLayer");
const bossHPContainer = document.getElementById("bossHPContainer");
const bossHP = document.getElementById("bossHP");

// ---------- PETS ----------
const petTypes = {
  goldenDuck:{img:"https://i.imgur.com/FfA8g17.png", perSec:2, price:50},
  rainbowDuck:{img:"https://i.imgur.com/5sX0kuK.png", perSec:1000, price:5000, rare:true},
  redDuck:{img:"https://i.imgur.com/4HNNcGZ.png", perSec:0, price:20, clickMulti:3},
  goldenCat:{img:"https://i.imgur.com/YOoS88s.png", perSec:50, price:300},
};

// ---------- HELPERS ----------
function showToast(msg){
  toast.textContent=msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),1200);
}

function saveData(){
  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
    method:"PUT",
    headers:{'Content-Type':'application/json','X-Master-Key':JSONBIN_API_KEY},
    body:JSON.stringify(user)
  });
}

function loadData(){
  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,{
    headers:{'X-Master-Key':JSONBIN_API_KEY}
  }).then(r=>r.json()).then(d=>{
    if(d.record) user=d.record;
    updateUI();
    renderPets();
  });
}

function updateUI(){ countEl.textContent=user.taps; navUser.textContent=user.username; }

// ---------- FLOATING NUMBERS ----------
function floatNumber(x,y,num){
  const f = document.createElement("div");
  f.textContent = `+${num}`;
  f.style.position="absolute";
  f.style.left=x+"px";
  f.style.top=y+"px";
  f.style.color="#ff0";
  f.style.fontWeight="bold";
  floatingLayer.appendChild(f);
  setTimeout(()=>{ f.remove(); },800);
}

// ---------- PET DISPLAY ----------
function renderPets(){
  petDisplay.innerHTML="";
  let i=0;
  for(let p in user.pets){
    const count=user.pets[p];
    for(let j=0;j<count;j++){
      const pet=document.createElement("div");
      pet.className="petImg";
      const img=document.createElement("img");
      img.src=petTypes[p].img;
      pet.appendChild(img);
      pet.style.left=20+i*70+"px";
      pet.style.bottom="10px";
      petDisplay.appendChild(pet);
      i++;
    }
  }
}

// ---------- ADD PET ----------
function addPet(type){
  if(!petTypes[type]) return;
  user.pets[type] = (user.pets[type]||0)+1;
  renderPets();
  showToast(`${type} purchased!`);
  if(petTimers[type]) clearInterval(petTimers[type]);
  if(petTypes[type].perSec>0){
    petTimers[type]=setInterval(()=>{
      user.taps += petTypes[type].perSec;
      updateUI();
    },1000);
  }
}

// ---------- TAP ----------
document.getElementById("tapArea").addEventListener("pointerdown",(e)=>{
  if(e.target.tagName==="IMG") return; 
  user.taps+=TAP_STEP;
  updateUI();
  floatNumber(e.clientX,e.clientY,TAP_STEP);

  if(Math.random()<0.01 && !rainbowActive) spawnRainbow();
  if(user.taps % 5000 ===0 && !bossActive) spawnBoss();
});

// ---------- RAINBOW ----------
function spawnRainbow(){
  rainbowActive=true;
  addPet("rainbowDuck");
  setTimeout(()=>{ rainbowActive=false; showToast("Rainbow Duck gone!"); },60000);
}

// ---------- BOSS ----------
function spawnBoss(){
  bossActive=true;
  let hp=50;
  bossHPContainer.style.display="block";
  bossHP.style.width="100%";
  bossLayer.innerHTML="";
  const boss=document.createElement("div");
  boss.className="boss";
  const img=document.createElement("img");
  img.src="https://i.imgur.com/N3r55C6.png";
  boss.appendChild(img);
  boss.style.left="200px"; boss.style.top="100px";
  bossLayer.appendChild(boss);

  boss.onclick=()=>{
    hp--;
    bossHP.style.width=(hp/50*100)+"%";
    showToast(`Boss HP: ${hp}`);
    if(hp<=0){
      bossLayer.innerHTML="";
      bossActive=false;
      bossHPContainer.style.display="none";
      showToast("Boss defeated!");
    }
  }
}

// ---------- SHOP ----------
const shopLink = document.getElementById("shopLink");
const shopModal = document.getElementById("shopModal");
const shopItemsEl = document.getElementById("shopItems");
const closeShop = document.getElementById("closeShop");

shopLink.onclick=()=>{
  shopModal.style.display="flex";
  shopItemsEl.innerHTML="";
  for(let p in petTypes){
    const b=document.createElement("button");
    const img=document.createElement("img");
    img.src=petTypes[p].img; img.style.width="30px"; img.style.height="30px";
    b.appendChild(img);
    b.appendChild(document.createTextNode(` Buy ${p} (${petTypes[p].price})`));
    b.onclick=()=>{
      if(user.taps>=petTypes[p].price){ user.taps-=petTypes[p].price; addPet(p); updateUI(); saveData(); }
      else showToast("Not enough taps!");
    };
    shopItemsEl.appendChild(b);
  }
};
closeShop.onclick=()=>shopModal.style.display="none";

// ---------- LEADERBOARD ----------
const leaderboardLink = document.getElementById("leaderboardLink");
const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardList = document.getElementById("leaderboardList");
const closeLeaderboard = document.getElementById("closeLeaderboard");
leaderboardLink.onclick=()=>{
  leaderboardModal.style.display="flex";
  leaderboardList.innerHTML=`<div>Feature coming soon!</div>`;
};
closeLeaderboard.onclick=()=>leaderboardModal.style.display="none";

// ---------- AUTO SAVE ----------
setInterval(saveData,5000);

// ---------- INIT ----------
loadData();
updateUI();
