// ---------- CONFIG ----------
const JSONBIN_API_KEY = "YOUR_JSONBIN_KEY"; // replace
const BIN_ID = "6983e9a943b1c97be966219e"; // your bin ID
const TAP_STEP = 75;

// ---------- UI ----------
const tapArea = document.getElementById("tapArea");
const countEl = document.getElementById("count");
const navUser = document.getElementById("navUser");
const authLink = document.getElementById("authLink");
const logoutLink = document.getElementById("logoutLink");
const toast = document.getElementById("toast");
const petBadge = document.getElementById("petBadge");
const duckLayer = document.getElementById("duckLayer");

// ---------- STATE ----------
let user = { username:"guest", taps:0 };
let petTimer = null;
let rainbowActive = false;

// ---------- HELPERS ----------
function showToast(msg){ toast.textContent = msg; toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"),900);}
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
  })
  .then(r=>r.json()).then(d=>{user=d.record; updateUI();});
}
function updateUI(){ countEl.textContent = user.taps; navUser.textContent = user.username;}

// ---------- PETS ----------
function goldenDuck(){
  const gd = document.createElement("div");
  gd.className="duck pet";
  gd.innerHTML='🪿<span class="legs"></span>';
  gd.style.left="200px"; gd.style.top="100px";
  duckLayer.appendChild(gd);
  petTimer = setInterval(()=>{
    user.taps+=2; updateUI(); saveData();
  },1000);
  gd.onclick = ()=>{ user.taps+=1; updateUI(); saveData();}
  showToast("Golden Duck +2/sec active");
}
function rainbowDuck(){
  if(rainbowActive) return;
  rainbowActive=true;
  const rd = document.createElement("div");
  rd.className="duck pet";
  rd.innerHTML='🌈🦆<span class="legs"></span>';
  rd.style.left="300px"; rd.style.top="50px";
  duckLayer.appendChild(rd);
  let start = Date.now();
  let interval = setInterval(()=>{
    user.taps+=1000; updateUI(); saveData();
  },1000);
  setTimeout(()=>{
    clearInterval(interval); rd.remove(); rainbowActive=false; showToast("Rainbow Duck left!");
  },60000);
}

// ---------- TAP ----------
tapArea.addEventListener("pointerdown",(e)=>{
  if(e.target!==tapArea) return;
  user.taps+=1;
  updateUI();
  saveData();
  if(user.taps % 5000===0) rainbowDuck(); // super rare
});

// ---------- INIT ----------
loadData();
