// ----------------- CONFIG -----------------
const JSONBIN_API_KEY = "$2a$10$eSpu6OdVbWfJzjSGdvMa5uwYI15tXgj1Syd97vF3Hb/xA4PljLNma";
const BIN_ID = "6983e9a943b1c97be966219e";
const TAP_STEP = 1; // 1 tap per click
const RAID_INTERVAL = 75; // every 75 taps
const CHAD_INTERVAL = 1000; // every 1000 taps
const SAVE_INTERVAL = 5000; // autosave every 5 sec

// ----------------- STATE -----------------
let user = { username: "Guest", taps: 0, pets: {}, scoreHistory: [] };
let petTimers = {};
let rainbowActive = false;
let raidActive = false;
let chadActive = false;

// ----------------- UI -----------------
const tapArea = document.getElementById("tapArea");
const countEl = document.getElementById("count");
const navUser = document.getElementById("navUser");
const authLink = document.getElementById("authLink");
const logoutLink = document.getElementById("logoutLink");
const toast = document.getElementById("toast");
const petBadge = document.getElementById("petBadge");
const duckLayer = document.getElementById("duckLayer");
const shopLink = document.getElementById("shopLink");
const leaderboardLink = document.getElementById("leaderboardLink");
const shopModal = document.getElementById("shopModal");
const shopItemsEl = document.getElementById("shopItems");
const closeShop = document.getElementById("closeShop");
const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardList = document.getElementById("leaderboardList");
const closeLeaderboard = document.getElementById("closeLeaderboard");

// ----------------- HELPERS -----------------
function showToast(msg){ toast.textContent = msg; toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"),1000);}
function saveData(){
    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
        method:"PUT",
        headers:{'Content-Type':'application/json','X-Master-Key':JSONBIN_API_KEY},
        body:JSON.stringify(user)
    }).then(()=>console.log("Saved"));
}
function loadData(){
    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,{
        headers:{'X-Master-Key':JSONBIN_API_KEY}
    }).then(r=>r.json()).then(d=>{
        if(d.record) user=d.record;
        updateUI();
    });
}
function updateUI(){
    countEl.textContent = user.taps;
    navUser.textContent = user.username;
}

// ----------------- PETS -----------------
const petTypes = {
    goldenDuck: {emoji:"🪿", perSec:2, price:50},
    rainbowDuck: {emoji:"🌈🦆", perSec:1000, price:5000, rare:true},
    redDuck: {emoji:"🦆", perSec:0, price:20, clickMulti:3},
    goldenCat: {emoji:"🐱‍👓", perSec:50, price:300, rare:true},
};

function addPet(type){
    if(!petTypes[type]) return;
    if(user.pets[type]) user.pets[type]++;
    else user.pets[type]=1;

    let pet = document.createElement("div");
    pet.className="duck pet";
    pet.innerHTML=petTypes[type].emoji+'<span class="legs"></span>';
    pet.style.left=Math.random()*300+"px";
    pet.style.top=Math.random()*200+"px";
    duckLayer.appendChild(pet);

    if(petTypes[type].perSec>0){
        if(petTimers[type]) clearInterval(petTimers[type]);
        petTimers[type] = setInterval(()=>{
            user.taps += petTypes[type].perSec;
            updateUI();
        },1000);
    }

    if(petTypes[type].clickMulti){
        pet.onclick = ()=>{
            user.taps += petTypes[type].clickMulti;
            updateUI();
        }
    }

    showToast(`${type} purchased! +${petTypes[type].perSec}/sec`);
}

// ----------------- TAP -----------------
tapArea.addEventListener("pointerdown", (e)=>{
    if(e.target!==tapArea) return;
    user.taps += TAP_STEP;
    updateUI();

    if(user.taps % RAID_INTERVAL===0 && !raidActive) startRaid();
    if(user.taps % CHAD_INTERVAL===0 && !chadActive) spawnChad();

    if(Math.random()<0.01 && !rainbowActive) spawnRainbow();
});

// ----------------- RAIDS -----------------
function startRaid(){
    raidActive=true;
    showToast("🐤 Duck Raid Incoming!");
    setTimeout(()=>{ raidActive=false; },10000);
}

// ----------------- RAINBOW -----------------
function spawnRainbow(){
    rainbowActive=true;
    addPet("rainbowDuck");
    setTimeout(()=>{ rainbowActive=false; showToast("Rainbow Duck disappeared!"); },60000);
}

// ----------------- CHAD PENGUIN -----------------
function spawnChad(){
    chadActive=true;
    let hp = 50;
    let chad = document.createElement("div");
    chad.className="duck pet";
    chad.innerHTML="🐧 CHAD<span class='legs'></span>";
    chad.style.left="150px";
    chad.style.top="50px";
    duckLayer.appendChild(chad);

    chad.onclick=()=>{
        hp--;
        showToast(`Chad HP: ${hp}`);
        if(hp<=0){
            chad.remove();
            chadActive=false;
            showToast("You defeated Chad!");
        }
    }
}

// ----------------- SHOP -----------------
const shopList = Object.keys(petTypes);
shopLink.onclick=()=>{
    shopModal.style.display="flex";
    shopItemsEl.innerHTML="";
    shopList.forEach(p=>{
        let b=document.createElement("button");
        b.textContent=`Buy ${p} (${petTypes[p].price} taps)`;
        b.onclick=()=>{
            if(user.taps>=petTypes[p].price){
                user.taps-=petTypes[p].price;
                addPet(p);
                updateUI();
                saveData();
            }else showToast("Not enough taps!");
        }
        shopItemsEl.appendChild(b);
    });
};
closeShop.onclick=()=>shopModal.style.display="none";

// ----------------- LEADERBOARD -----------------
leaderboardLink.onclick=()=>{
    leaderboardModal.style.display="flex";
    leaderboardList.innerHTML="";
    // For now just show local score history
    user.scoreHistory.sort((a,b)=>b-a).forEach((s,i)=>{
        let div=document.createElement("div");
        div.textContent=`#${i+1}: ${s} taps`;
        leaderboardList.appendChild(div);
    });
};
closeLeaderboard.onclick=()=>leaderboardModal.style.display="none";

// ----------------- AUTO SAVE -----------------
setInterval(saveData, SAVE_INTERVAL);

// ----------------- INIT -----------------
loadData();
updateUI();
