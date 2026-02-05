// ---------- CONFIG ----------
const JSONBIN_API_KEY = "$2a$10$eSpu6OdVbWfJzjSGdvMa5uwYI15tXgj1Syd97vF3Hb/xA4PljLNma";
const BIN_ID = "6983e9a943b1c97be966219e";
const SAVE_INTERVAL = 3000; // auto-save every 3s

// ---------- UI ----------
const tapArea = document.getElementById("tapArea");
const countEl = document.getElementById("count");
const navUser = document.getElementById("navUser");
const displayName = document.getElementById("displayName");
const authLink = document.getElementById("authLink");
const logoutLink = document.getElementById("logoutLink");
const toast = document.getElementById("toast");
const duckLayer = document.getElementById("duckLayer");
const shopModal = document.getElementById("shopModal");
const shopItems = document.getElementById("shopItems");
const closeShop = document.getElementById("closeShop");

// ---------- STATE ----------
let user = {
    username: "Guest",
    taps: 0,
    pets: []
};
let petTimers = {};
let rainbowActive = false;

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
        startPets(); // start pets from saved data
    }).catch(e=>console.log("Failed to load:",e));
}

function updateUI(){
    countEl.textContent = user.taps;
    navUser.textContent = user.username;
    displayName.textContent = user.username;
}

// ---------- PETS ----------
const petDefinitions = [
    {name:"Golden Duck", icon:"🪿", cps:2, cost:50},
    {name:"Rainbow Duck", icon:"🌈🦆", cps:1000, duration:60000, cost:500},
    {name:"Red Duck", icon:"🦆🔴", cps:0, duration:30000, cost:200},
    {name:"Golden Cat", icon:"🐱🪙", cps:5, cost:150}
];

function spawnPet(pet){
    const el = document.createElement("div");
    el.className="duck pet";
    el.innerHTML=pet.icon+'<span class="legs"></span>';
    el.style.left = `${Math.random()*400+50}px`;
    el.style.top = `${Math.random()*200+50}px`;
    duckLayer.appendChild(el);

    if(pet.cps>0){
        const interval = setInterval(()=>{
            user.taps += pet.cps;
            updateUI();
        },1000);
        if(!petTimers[pet.name]) petTimers[pet.name]=[];
        petTimers[pet.name].push(interval);
    }

    if(pet.duration){
        setTimeout(()=>{
            el.remove();
            if(petTimers[pet.name]){
                petTimers[pet.name].forEach(t=>clearInterval(t));
                petTimers[pet.name]=[];
            }
            showToast(`${pet.name} left!`);
        }, pet.duration);
    }

    el.onclick = ()=>{
        if(pet.cps>0) user.taps += pet.cps;
        updateUI();
    };
}

// Start all purchased pets
function startPets(){
    user.pets.forEach(p=>{
        const petDef = petDefinitions.find(d=>d.name===p);
        if(petDef) spawnPet(petDef);
    });
}

// ---------- TAP ----------
tapArea.addEventListener("pointerdown",(e)=>{
    if(e.target !== tapArea) return;
    user.taps += 1;
    updateUI();

    // Random Rainbow Duck spawn
    if(user.taps % 5000===0 && !rainbowActive){
        rainbowActive=true;
        const rainbow = petDefinitions.find(p=>p.name==="Rainbow Duck");
        spawnPet(rainbow);
        setTimeout(()=> rainbowActive=false, rainbow.duration);
    }
});

// ---------- SHOP ----------
function openShop(){
    shopModal.style.display="flex";
    shopItems.innerHTML="";
    petDefinitions.forEach(pet=>{
        const btn = document.createElement("button");
        btn.textContent = `${pet.name} - ${pet.cost} taps`;
        btn.onclick = ()=>{
            if(user.taps>=pet.cost){
                user.taps -= pet.cost;
                user.pets.push(pet.name);
                spawnPet(pet);
                updateUI();
                saveData();
                showToast(`Bought ${pet.name}!`);
            } else showToast("Not enough taps!");
        }
        shopItems.appendChild(btn);
    });
}

closeShop.onclick = ()=> shopModal.style.display="none";
document.getElementById("shopLink").onclick = openShop;

// ---------- LOGIN ----------
authLink.onclick = ()=>{
    let name = prompt("Enter username:");
    if(name){ user.username=name; updateUI(); saveData(); logoutLink.style.display="inline"; authLink.style.display="none"; }
}

logoutLink.onclick = ()=>{
    user.username="Guest";
    updateUI();
    logoutLink.style.display="none";
    authLink.style.display="inline";
}

// ---------- AUTO SAVE ----------
setInterval(saveData,SAVE_INTERVAL);

// ---------- INIT ----------
loadData();
