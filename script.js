// --------- Firebase Setup ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-app.js";
import { getDatabase, ref, set, get, child, update, onValue } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-database.js";

// Replace this with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER",
  appId: "YOUR_APPID"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --------- Global State ----------
let sessionUser = null;
let taps = 0;
let pets = [];
let rebirths = 0;

// UI refs
const tapArea = document.getElementById("tapArea");
const countEl = document.getElementById("count");
const displayNameEl = document.getElementById("displayName");
const toast = document.getElementById("toast");
const petBadge = document.getElementById("petBadge");
const shop = document.getElementById("shop");

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),900);
}

function updateUI(){
  countEl.textContent = taps;
  displayNameEl.textContent = sessionUser || "Guest";
}

// --------- Auth / Simple Demo ----------
async function login(username){
  sessionUser = username;
  const snap = await get(ref(db, 'users/' + username));
  if(snap.exists()){
    taps = snap.val().taps || 0;
    pets = snap.val().pets || [];
    rebirths = snap.val().rebirths || 0;
  } else {
    taps = 0; pets = []; rebirths = 0;
    await set(ref(db,'users/'+username),{taps:0,pets:[],rebirths:0});
  }
  updateUI();
  showToast("Logged in as "+username);
}

// --------- Save progress ----------
async function saveProgress(){
  if(!sessionUser) return;
  await update(ref(db,'users/'+sessionUser), {taps,tapsMultiplier: 1 + rebirths*0.1,pets,rebirths});
}

// --------- Tap Logic ----------
tapArea.addEventListener("pointerdown", async()=>{
  if(!sessionUser){ showToast("Login first!"); return;}
  taps += 1 * (1 + rebirths*0.1);
  updateUI();
  await saveProgress();
});

// --------- Shop ----------
shop.addEventListener("click", async e=>{
  if(!sessionUser) return;
  if(e.target.tagName !== "BUTTON") return;
  const pet = e.target.dataset.pet;
  const cost = parseInt(e.target.dataset.cost);
  if(taps >= cost){
    taps -= cost;
    pets.push({type:pet,activeUntil:Date.now()+180000});
    showToast(`Bought ${pet}`);
    updateUI();
    await saveProgress();
  } else showToast("Not enough taps!");
});

// --------- Golden Duck AutoClick ----------
function startPet(p){
  if(p.type==="goldenGoose"){
    const interval = setInterval(async()=>{
      if(Date.now()>p.activeUntil){ clearInterval(interval); return;}
      taps += 2 * (1 + rebirths*0.1);
      updateUI();
      await saveProgress();
    },1000);
  }
}

// Start active pets
pets.forEach(startPet);

// --------- Leaderboard Live ----------
const leaderboardEl = document.getElementById("leaderboard");
if(leaderboardEl){
  const usersRef = ref(db,'users');
  onValue(usersRef,snap=>{
    const data = snap.val()||{};
    const sorted = Object.entries(data).sort((a,b)=>b[1].taps - a[1].taps);
    leaderboardEl.innerHTML = sorted.map(u=>`<li>${u[0]}: ${u[1].taps}</li>`).join("");
  });
}

// --------- Rebirth ----------
async function rebirth(){
  if(!sessionUser) return;
  taps = 0;
  rebirths +=1;
  await saveProgress();
  updateUI();
  showToast("Rebirthed! Multiplier x"+(1+rebirths*0.1));
}

// --------- Demo login
login("guest");
