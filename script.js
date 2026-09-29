const CONFIG={
  discord:"https://discord.gg/uJvjg8PWAp",
  store:"https://bloodline-rust.paynow.store/",
  wipeTime:"14:00:00",
  ips:["135.148.15.176:20002","135.148.172.229:28560"]
};
document.querySelectorAll("[data-ip]").forEach(btn=>btn.addEventListener("click",()=>{
  const ip=btn.dataset.ip;navigator.clipboard.writeText(ip).then(()=>toast("COPIED "+ip));
}));
document.querySelectorAll(".connect").forEach(btn=>btn.addEventListener("click",()=>{
  location.href="steam://connect/"+btn.dataset.ip;
}));
document.querySelectorAll('a[href="https://discord.gg/"]').forEach(a=>a.href=CONFIG.discord);
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function getFirstThursday(year,month){
  const d=new Date(year,month,1,14,0,0);
  d.setDate(1+((4-d.getDay()+7)%7));
  return d;
}
function getNextWipe(){
  const now=new Date();
  let wipe=getFirstThursday(now.getFullYear(),now.getMonth());
  if(wipe<=now) wipe=getFirstThursday(now.getFullYear(),now.getMonth()+1);
  return wipe;
}
function tick(){
  const wipe=getNextWipe();
  const d=Math.max(0,wipe-Date.now());
  document.getElementById("d").textContent=String(Math.floor(d/864e5)).padStart(2,"0");
  document.getElementById("h").textContent=String(d/36e5%24|0).padStart(2,"0");
  document.getElementById("m").textContent=String(d/6e4%60|0).padStart(2,"0");
  document.getElementById("s").textContent=String(d/1e3%60|0).padStart(2,"0");
  document.getElementById("wipeText").textContent="Next wipe: "+wipe.toLocaleString();
}
tick();setInterval(tick,1000);


// Bloodline live leaderboard
const LEADERBOARD_API = "https://bloodline-leaderboard.bloodlinerust.workers.dev/leaderboard";
const leaderboardServer = document.getElementById("leaderboardServer");
const leaderboardBody = document.getElementById("leaderboardBody");
const leaderboardTotal = document.getElementById("leaderboardTotal");
const leaderboardUpdated = document.getElementById("leaderboardUpdated");

function formatLeaderboardPlaytime(seconds) {
  const totalMinutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function escapeLeaderboardHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#039;"}[c]));
}

async function loadLeaderboard() {
  if (!leaderboardBody || !leaderboardServer) return;
  const server = leaderboardServer.value;
  leaderboardBody.innerHTML = '<div class="leaderboard-loading">LOADING LEADERBOARD...</div>';
  try {
    const response = await fetch(`${LEADERBOARD_API}?server=${encodeURIComponent(server)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const players = Array.isArray(data.Leaderboard) ? data.Leaderboard : [];
    leaderboardTotal.textContent = `${data.TotalPlayers ?? players.length} PLAYERS`;
    leaderboardUpdated.textContent = data.UpdatedAt ? `UPDATED ${new Date(data.UpdatedAt * 1000).toLocaleString()}` : "NOT UPDATED";
    if (!players.length) {
      leaderboardBody.innerHTML = '<div class="leaderboard-loading">NO PLAYERS YET</div>';
      return;
    }
    leaderboardBody.innerHTML = players.map(player => `
      <div class="leaderboard-row">
        <div class="leaderboard-cell leaderboard-player">${escapeLeaderboardHtml(player.Name || "Unknown")}</div>
        <div class="leaderboard-cell leaderboard-number">${Number(player.Kills || 0)}</div>
        <div class="leaderboard-cell leaderboard-number">${Number(player.Deaths || 0)}</div>
        <div class="leaderboard-cell leaderboard-number">${Number(player.KD || 0).toFixed(2)}</div>
        <div class="leaderboard-cell leaderboard-number">${Number(player.Headshots || 0)}</div>
        <div class="leaderboard-cell">${formatLeaderboardPlaytime(player.PlaytimeSeconds)}</div>
      </div>`).join("");
  } catch (error) {
    leaderboardBody.innerHTML = '<div class="leaderboard-error">COULD NOT LOAD LEADERBOARD</div>';
    if (leaderboardTotal) leaderboardTotal.textContent = "UNAVAILABLE";
    if (leaderboardUpdated) leaderboardUpdated.textContent = "CHECK API";
    console.error("Bloodline leaderboard error:", error);
  }
}

if (leaderboardServer) {
  leaderboardServer.addEventListener("change", loadLeaderboard);
  loadLeaderboard();
  setInterval(loadLeaderboard, 30000);
}
