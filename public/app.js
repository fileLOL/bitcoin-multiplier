const $ = (id) => document.getElementById(id);
let apiBase = "";
let apiToken = "";
let busy = false;

function fmt(n, digits = 0) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString("es-ES", { maximumFractionDigits: digits });
}
function compactHash(n) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return {value:"—",unit:""};
  const x = Number(n);
  const units = [["EH/s",1e18],["PH/s",1e15],["TH/s",1e12],["GH/s",1e9],["MH/s",1e6]];
  for (const [unit, div] of units) if (x >= div) return {value:fmt(x/div,2),unit};
  return {value:fmt(x,2),unit:"H/s"};
}
function setStatus(ok, text) {
  $("statusText").textContent = text;
  $("statusDot").parentElement.classList.toggle("connected", ok);
  $("connectionLabel").textContent = ok ? "Nodo conectado" : "Sin conectar";
  $("connectionLabel").classList.toggle("connected-text", ok);
}
function showError(message) {
  $("formMessage").textContent = message;
  $("formMessage").style.color = "#ffb15c";
  setStatus(false, "SIN CONEXIÓN");
  $("apiStatus").textContent = "Error";
}
async function api(path) {
  const headers = {};
  if (apiToken) headers["x-api-token"] = apiToken;
  const response = await fetch(apiBase.replace(/\/+$/,"") + path, {headers, cache:"no-store"});
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || `Error HTTP ${response.status}`);
  return data;
}
function renderStatus(d) {
  $("blocks").textContent = fmt(d.blocks);
  $("headersText").textContent = `Cabeceras: ${fmt(d.headers)}`;
  const h = compactHash(d.networkHashrate);
  $("hashrate").innerHTML = `${h.value} <small>${h.unit}</small>`;
  $("difficulty").textContent = fmt(d.difficulty, 2);
  const pct = Math.max(0,Math.min(100,Number(d.verificationProgress || 0)*100));
  $("syncPercent").textContent = `${pct.toFixed(2).replace(".",",")}%`;
  $("syncRing").style.background = `conic-gradient(var(--orange) ${pct*3.6}deg,#292e34 ${pct*3.6}deg)`;
  $("syncBadge").textContent = d.initialBlockDownload ? "SINCRONIZANDO" : "NODO SINCRONIZADO";
  $("syncTitle").textContent = d.initialBlockDownload ? "Descargando y validando bloques" : "Nodo sincronizado";
  $("syncDescription").textContent = d.initialBlockDownload ? "Bitcoin Core todavía está sincronizando. El porcentaje es orientativo y el tiempo restante puede variar." : "Bitcoin Core indica que no está en descarga inicial.";
  $("chainName").textContent = d.chain || "—";
  $("ibd").textContent = d.initialBlockDownload ? "En curso" : "Completado";
  $("apiStatus").textContent = "Conectado";
  $("lastUpdated").textContent = new Date(d.timestamp || Date.now()).toLocaleTimeString("es-ES");
  setStatus(true,"NODO CONECTADO");
  $("notice").style.display = "none";
  $("formMessage").textContent = "Conexión establecida. Datos recibidos de Bitcoin Core.";
  $("formMessage").style.color = "#61d6a5";
}
async function connect() {
  if (busy) return;
  busy = true;
  $("refreshBtn").disabled = true;
  $("saveBtn").disabled = true;
  $("formMessage").textContent = "Conectando con el backend…";
  $("formMessage").style.color = "#929ba4";
  try {
    const d = await api("/api/status");
    renderStatus(d);
    try {
      const w = await api("/api/wallet");
      $("balance").innerHTML = w.walletLoaded ? `${fmt(w.balanceBTC,8)} <small>BTC</small>` : `— <small>BTC</small>`;
      $("walletNote").textContent = w.walletLoaded ? `Pendiente: ${fmt(w.unconfirmedBTC,8)} BTC` : "Cartera no cargada";
    } catch {
      $("balance").innerHTML = `— <small>BTC</small>`;
      $("walletNote").textContent = "No disponible";
    }
  } catch (e) {
    showError(e.message + " Revisa URL, token y backend.");
    $("notice").style.display = "flex";
    $("notice").querySelector("b").textContent = "No se pudo conectar";
    $("notice").querySelector("p").textContent = e.message + " Comprueba que el servidor Node esté activo y que Bitcoin Core acepte RPC.";
  } finally {
    busy = false;
    $("refreshBtn").disabled = false;
    $("saveBtn").disabled = false;
  }
}
$("saveBtn").addEventListener("click", () => {
  const raw = $("apiUrl").value.trim().replace(/\/+$/,"");
  if (!raw) { $("formMessage").textContent = "Introduce la URL del backend."; return; }
  try { new URL(raw); } catch { $("formMessage").textContent = "La URL no parece válida."; return; }
  apiBase = raw;
  apiToken = $("apiToken").value.trim();
  connect();
});
$("refreshBtn").addEventListener("click", () => { if (apiBase) connect(); else { $("connection").scrollIntoView({behavior:"smooth"}); $("formMessage").textContent = "Primero configura la URL del backend."; }});
$("dismissNotice").addEventListener("click", () => $("notice").style.display = "none");
document.querySelectorAll("[data-scroll]").forEach(btn => btn.addEventListener("click", () => {
  document.getElementById(btn.dataset.scroll).scrollIntoView({behavior:"smooth"});
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n===btn));
}));
setStatus(false,"DEMO / SIN CONEXIÓN");
