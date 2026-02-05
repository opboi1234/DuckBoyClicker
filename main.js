// ---------- CONFIG ----------
const JSONBIN_API_KEY = "$2a$10$eSpu6OdVbWfJzjSGdvMa5uwYI15tXgj1Syd97vF3Hb/xA4PljLNma"; 
const BIN_ID = "6983e9a943b1c97be966219e"; 

// ---------- UI ----------
const tapArea = document.getElementById("tapArea");
const countEl = document.getElementById("count");
const navUser = document.getElementById("navUser");
const displayName = document.getElementById("displayName");
const authLink = document.getElementById("authLink");
const logoutLink = document.getElementById("logoutLink");
const toast = document.getElementById("toast");
const petBadge = document.getElementById("petBadge");
const duckLayer = document.getElementById("duckLayer");

const shopModal = document.getElementById("shopModal");
const shopItems = document.getElementById("shopItems");
const closeShop = document.getElementById("closeShop");

const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardList = document.getElementById("leaderboardList");
const closeLeaderboard = document.getElementById("closeLeaderboard");

const shopLink = document.getElementById("shopLink");
const leaderboardLink = document.getElementById("leaderboardLink");

// ---------- STATE ----------
let user = { username:"Guest", taps:0, pets:[], golden:0, rainbow:0 };
let petTimers = {};
let rainbowActive = false;
let leaderboard = [];

// ---------- HELPERS ----------
function showToast(msg){
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(()=>toast.classList.remove("show"),900);
}

function saveData(){
    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
        method:"PUT",
        headers:{
            'Content-Type':'application/json',
            'X-Master-Key':JSONBIN_API_KEY
        },
        body:JSON.stringify(user)
    });
}

function loadData(){
    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,{
        headers:{'X-Master-Key':JSONBIN_API_KEY}
    })
    .then(r=>r.json())
    .then(d=>{
        if(d.record && typeof d.record.taps==="number") user=d.record;
        updateUI();
    }).catch(e=>console.log("Failed to load:",e));
}

function updateUI(){
    countEl.textContent = user.taps;
    navUser.textContent = user.username;
    displayName.textContent = user.username;
}

// ---------- PETS ----------
function spawnGoldenDuck(){
    if(petTimers.golden) return;
    const gd = document.createElement("div");
    gd.className="duck pet";
    gd.innerHTML='🪿<span class="legs"></span>';
    gd.style.left="150px";
    gd.style.top="80px";
    duckLayer.appendChild(gd);

    petTimers.golden = setInterval(()=>{
        user.taps += 2;
        updateUI();
        saveData();
    },1000);

    gd.onclick = ()=>{
        user.taps += 1;
        updateUI();
        saveData();
    }
    showToast("Golden Duck +2/sec active");
}

function spawnRainbowDuck(){
    if(rainbowActive) return;
    rainbowActive = true;
    const rd = document.createElement("div");
    rd.className="duck pet";
    rd.innerHTML='🌈🦆<span class="legs"></span>';
    rd.style.left="300px";
    rd.style.top="50px";
    duckLayer.appendChild(rd);

    let interval = setInterval(()=>{
        user.taps += 1000;
        updateUI();
        saveData();
    },1000);

    setTimeout(()=>{
        clearInterval(interval);
        rd.remove();
        rainbowActive = false;
        showToast("Rainbow Duck left!");
    },60000); // disappears after 60s
}

function spawnRedDuck(){
    const rd = document.createElement("div");
    rd.className="duck pet";
    rd.innerHTML='🦆🔴<span class="legs"></span>';
    rd.style.left=`${Math.random()*400+50}px`;
    rd.style.top=`${Math.random()*200+50}px`;
    duckLayer.appendChild(rd);

    let clicks = 0;
    rd.onclick = ()=>{
        clicks++;
        if(clicks>=3){ rd.remove(); showToast("Red Duck removed!"); }
    }

    setTimeout(()=>{ rd.remove(); },30000); // disappears after 30s
}

// ---------- TAP ----------
tapArea.addEventListener("pointerdown",(e)=>{
    if(e.target !== tapArea) return;
    user.taps += 1;
    updateUI();
    saveData();

    // chance to spawn rare ducks
    if(user.taps % 5000 === 0) spawnRainbowDuck();
    if(user.taps % 200 === 0) spawnRedDuck();
});

// ---------- SHOP ----------
function openShop(){
    shopModal.style.display="flex";
    shopItems.innerHTML="";
    const items = [
        {name:"Golden Duck", cost:50, action:()=>{ spawnGoldenDuck(); user.golden=1; saveData(); showToast("Bought Golden Duck!"); }},
        {name:"Rainbow Duck", cost:500, action:()=>{ showToast("Rainbow Duck will appear randomly!"); }}
    ];
    items.forEach(item=>{
        const btn = document.createElement("button");
        btn.textContent=`${item.name} - ${item.cost} taps`;
        btn.onclick = ()=>{
            if(user.taps>=item.cost){ user.taps -= item.cost; item.action(); updateUI(); saveData(); }
            else showToast("Not enough taps!");
        }
        shopItems.appendChild(btn);
    });
}

closeShop.onclick = ()=> shopModal.style.display="none";
shopLink.onclick = ()=> openShop();

// ---------- LEADERBOARD ----------
function openLeaderboard(){
    leaderboardModal.style.display="flex";
    leaderboardList.innerHTML="";
    // for simplicity, we use the JSONBin same user data for leaderboard
    // in real scenario, you would need multiple bins or server
    leaderboard.push({username:user.username, taps:user.taps});
    leaderboard.sort((a,b)=>b.taps-a.taps);
    const top = leaderboard.slice(0,5);
    top.forEach(u=>{
        const div = document.createElement("div");
        div.textContent=`${u.username}: ${u.taps}`;
        leaderboardList.appendChild(div);
    });
}

closeLeaderboard.onclick = ()=> leaderboardModal.style.display="none";
leaderboardLink.onclick = ()=> openLeaderboard();

// ---------- LOGIN ----------
authLink.onclick = ()=>{
    let name = prompt("Enter your username:");
    if(name){ user.username=name; updateUI(); saveData(); logoutLink.style.display="inline"; authLink.style.display="none"; }
}

logoutLink.onclick = ()=>{
    user.username="Guest";
    updateUI();
    logoutLink.style.display="none";
    authLink.style.display="inline";
}

// ---------- INIT ----------
loadData();
