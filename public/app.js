const $ = (id) => document.getElementById(id);

const BTC_ADDRESS = "bc1q6p2ugwymlzvm7mrzpy2axh8czm2h9n496082ag";
const BLOCK_REWARD = 3.125;

const $qrCode = $("qrCode");
const $headerPrice = $("headerPrice");
const $currentBlock = $("currentBlock");
const $blockUsd = $("blockUsd");
const $globalHash = $("globalHash");
const $difficulty = $("difficulty");
const $activeMiners = $("activeMiners");
const $miningArc = $("miningArc");
const $miningPercent = $("miningPercent");
const $payAddr = $("payAddr");
const $btnCopy = $("btnCopy");
const $btnPaid = $("btnPaid");
const $poolMiners = $("poolMiners");
const $poolBtc = $("poolBtc");
const $poolHash = $("poolHash");
const $minerList = $("minerList");
const $minerEmpty = $("minerEmpty");

let btcPrice = 0;
let blockHeight = 0;

// ===== QR CODE =====
function loadQR() {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&color=111118&bgcolor=ffffff&data=bitcoin:${BTC_ADDRESS}`;
  $qrCode.src = qrUrl;
  $qrCode.onerror = () => {
    $qrCode.src = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=bitcoin:${encodeURIComponent(BTC_ADDRESS)}`;
  };
}

// ===== BTC PRICE =====
async function fetchPrice() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true");
    const data = await res.json();
    if (data.bitcoin) {
      btcPrice = data.bitcoin.usd;
      const change = data.bitcoin.usd_24h_change;
      const arrow = change >= 0 ? "▲" : "▼";
      $headerPrice.textContent = `$${fmtPrice(btcPrice)} ${arrow}${fmtNum(Math.abs(change), 1)}%`;
      $blockUsd.textContent = `≈ $${fmtPrice(BLOCK_REWARD * btcPrice)}`;
    }
  } catch (e) {
    $headerPrice.textContent = "BTC price unavailable";
  }
}

// ===== BLOCK DATA =====
async function fetchBlockData() {
  try {
    const [heightRes, diffRes, hashRes] = await Promise.all([
      fetch("https://blockchain.info/q/getblockcount"),
      fetch("https://blockchain.info/q/getdifficulty"),
      fetch("https://blockchain.info/q/hashrate")
    ]);

    blockHeight = parseInt(await heightRes.text());
    const diff = parseFloat(await diffRes.text());
    const hash = parseFloat(await hashRes.text());

    $("currentBlock").textContent = blockHeight.toLocaleString("es-ES");
    $difficulty.textContent = fmtNum(diff / 1e12, 2) + " T";
    $globalHash.textContent = fmtNum(hash / 1e6, 1) + " EH/s";
    $activeMiners.textContent = fmtNum(Math.floor(hash / 1e6 * 100000), 0);

    updateMiningRing();
  } catch (e) {
    $currentBlock.textContent = "—";
    $difficulty.textContent = "—";
    $globalHash.textContent = "—";
  }
}

// ===== UTILS =====
function fmtPrice(n) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtNum(n, decimals = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

// ===== MINING RING =====
function updateMiningRing() {
  const miners = getMiners();
  const circumference = 2 * Math.PI * 52;
  const maxMiners = 50;
  const progress = Math.min(miners.length / maxMiners, 1);
  const offset = circumference - (progress * circumference);
  $miningArc.setAttribute("stroke-dashoffset", offset);
  $miningPercent.textContent = Math.round(progress * 100) + "%";
}

// ===== MINERS (localStorage) =====
function getMiners() {
  try {
    return JSON.parse(localStorage.getItem("btc_miners") || "[]");
  } catch {
    return [];
  }
}

function saveMiners(miners) {
  localStorage.setItem("btc_miners", JSON.stringify(miners));
}

function addMiner(amount) {
  const names = [
    "Satoshi_Fan", "HashKing", "BlockRunner", "CryptoMiner", "BTCWhale",
    "NodeOperator", "SHA256Pro", "DigitalGold", "ChainReactor", "BlockBuilder",
    "HashHunter", "MempoolKing", "DifficultyRider", "NonceSeeker", "PeerMiner"
  ];
  const name = names[Math.floor(Math.random() * names.length)] + "_" + Math.floor(Math.random() * 999);
  const now = new Date();

  const miner = {
    name,
    amount: parseFloat(amount) || 0.001,
    time: now.toISOString(),
    hash: (Math.random() * 500 + 50).toFixed(1)
  };

  const miners = getMiners();
  miners.unshift(miner);
  saveMiners(miners.slice(0, 100));
  renderMiners();
  updatePoolStats();
  updateMiningRing();
  showToast("¡Registrado en el pool de minería!");
}

function renderMiners() {
  const miners = getMiners();

  if (miners.length === 0) {
    $minerEmpty.style.display = "block";
    const items = $minerList.querySelectorAll(".miner-item");
    items.forEach(el => el.remove());
    return;
  }

  $minerEmpty.style.display = "none";

  const items = $minerList.querySelectorAll(".miner-item");
  items.forEach(el => el.remove());

  miners.slice(0, 20).forEach((m, i) => {
    const el = document.createElement("div");
    el.className = "miner-item";
    el.style.animationDelay = `${i * 0.05}s`;

    const timeAgo = getTimeAgo(new Date(m.time));
    const avatar = ["⛏", "₿", "◆", "▲", "●", "★"][Math.floor(Math.random() * 6)];

    el.innerHTML = `
      <div class="miner-avatar">${avatar}</div>
      <div class="miner-info">
        <div class="miner-name">${m.name}</div>
        <div class="miner-time">${timeAgo} · ${m.hash} TH/s</div>
      </div>
      <div class="miner-amount">${m.amount} BTC</div>
      <div class="miner-status"></div>
    `;

    $minerList.appendChild(el);
  });
}

function updatePoolStats() {
  const miners = getMiners();
  const totalBtc = miners.reduce((sum, m) => sum + m.amount, 0);
  const totalHash = miners.reduce((sum, m) => sum + parseFloat(m.hash), 0);

  $poolMiners.textContent = miners.length;
  $poolBtc.textContent = fmtNum(totalBtc, 4) + " BTC";
  $poolHash.textContent = fmtNum(totalHash, 0) + " TH/s";
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

// ===== COPY ADDRESS =====
function copyAddress() {
  navigator.clipboard.writeText(BTC_ADDRESS).then(() => {
    $btnCopy.textContent = "✓ Copiado";
    $btnCopy.classList.add("copied");
    setTimeout(() => {
      $btnCopy.textContent = "Copiar";
      $btnCopy.classList.remove("copied");
    }, 2000);
  }).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = BTC_ADDRESS;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    $btnCopy.textContent = "✓ Copiado";
    $btnCopy.classList.add("copied");
    setTimeout(() => {
      $btnCopy.textContent = "Copiar";
      $btnCopy.classList.remove("copied");
    }, 2000);
  });
}

// ===== TOAST =====
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ===== AMOUNT BUTTONS =====
function setupAmountButtons() {
  document.querySelectorAll(".amt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const amount = btn.dataset.amount;
      const uri = `bitcoin:${BTC_ADDRESS}?amount=${amount}`;
      $("btnWallet").href = uri;
      document.querySelectorAll(".amt-btn").forEach(b => b.style.borderColor = "");
      btn.style.borderColor = "var(--orange)";
    });
  });
}

// ===== PAY BUTTON =====
function setupPayButton() {
  $btnPaid.addEventListener("click", () => {
    const selectedAmt = document.querySelector(".amt-btn[style*='border-color']");
    const amount = selectedAmt ? selectedAmt.dataset.amount : "0.001";
    addMiner(amount);
  });
}

// ===== INIT =====
loadQR();
fetchPrice();
fetchBlockData();
renderMiners();
updatePoolStats();
setupAmountButtons();
setupPayButton();

$btnCopy.addEventListener("click", copyAddress);

setInterval(fetchPrice, 60000);
setInterval(() => {
  $activeMiners.textContent = fmtNum(Math.floor(Math.random() * 500000 + 800000), 0);
}, 5000);
