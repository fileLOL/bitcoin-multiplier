const $ = (id) => document.getElementById(id);

const BTC_ADDRESS = "bc1q6p2ugwymlzvm7mrzpy2axh8czm2h9n496082ag";

function fmt(n, d = 8) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString("es-ES", { maximumFractionDigits: d });
}

function drawQRCode(canvas, text, size) {
  const ctx = canvas.getContext("2d");
  const modules = generateQRMatrix(text);
  const count = modules.length;
  const cellSize = Math.floor(size / (count + 8));
  const total = cellSize * count;
  const offset = Math.floor((size - total) / 2);

  canvas.width = size;
  canvas.height = size;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#111111";

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (modules[row][col]) {
        ctx.fillRect(offset + col * cellSize, offset + row * cellSize, cellSize, cellSize);
      }
    }
  }
}

function generateQRMatrix(text) {
  const size = 41;
  const matrix = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      matrix[i][j] = 0;
    }
  }

  function placeFinder(row, col) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (isBorder || isCenter) matrix[row + r][col + c] = 1;
      }
    }
    for (let r = -1; r <= 7; r++) {
      if (row + r >= 0 && row + r < size) {
        matrix[row + r][col - 1] = 0;
        matrix[row + r][col + 7] = 0;
      }
      if (col + r >= 0 && col + r < size) {
        matrix[row - 1][col + r] = 0;
        matrix[row + 7][col + r] = 0;
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  let dataBit = 0;
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i));
  }

  for (let row = size - 1; row >= 0; row -= 2) {
    if (row === 6) row = 5;
    for (let col = 0; col < size; col++) {
      for (let r = 0; r < 2; r++) {
        const y = row - r;
        const isReserved =
          (y < 9 && col < 9) ||
          (y < 9 && col >= size - 8) ||
          (y >= size - 8 && col < 9) ||
          y === 6 || col === 6;
        if (!isReserved && y >= 0) {
          const byteIdx = Math.floor(dataBit / 8);
          const bitIdx = 7 - (dataBit % 8);
          if (byteIdx < bytes.length) {
            matrix[y][col] = (bytes[byteIdx] >> bitIdx) & 1;
          } else {
            matrix[y][col] = dataBit % 3 === 0 ? 1 : 0;
          }
          dataBit++;
        }
      }
    }
  }

  return matrix;
}

function copyAddress() {
  const btn = $("payCopyBtn");
  const iconEl = $("copyIcon");
  const textEl = $("copyText");

  navigator.clipboard.writeText(BTC_ADDRESS).then(() => {
    btn.classList.add("copied");
    iconEl.textContent = "✓";
    textEl.textContent = "Copiado";
    setTimeout(() => {
      btn.classList.remove("copied");
      iconEl.textContent = "⧉";
      textEl.textContent = "Copiar";
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
    btn.classList.add("copied");
    iconEl.textContent = "✓";
    textEl.textContent = "Copiado";
    setTimeout(() => {
      btn.classList.remove("copied");
      iconEl.textContent = "⧉";
      textEl.textContent = "Copiar";
    }, 2000);
  });
}

function doMultiply() {
  const btc = parseFloat($("btcInput").value);
  const mult = parseFloat($("multiplierInput").value);

  if (isNaN(btc) || btc <= 0 || isNaN(mult) || mult <= 0) {
    $("resultValue").textContent = "—";
    $("resultSub").textContent = "Introduce una cantidad válida y pulsa multiplicar";
    $("resultBadge").textContent = "ESPERANDO";
    $("resultBadge").className = "result-badge";
    $("resultDetail").textContent = "";
    $("metricInput").innerHTML = "— <small>BTC</small>";
    $("metricMult").textContent = "—";
    $("metricResult").innerHTML = "— <small>BTC</small>";
    return;
  }

  const result = btc * mult;
  $("resultValue").textContent = fmt(result) + " BTC";
  $("resultSub").textContent = `${fmt(btc)} × ${fmt(mult)}`;
  $("resultBadge").textContent = "COMPLETADO";
  $("resultBadge").className = "result-badge ok";
  $("resultDetail").textContent = `${fmt(btc)} BTC × ${fmt(mult)} = ${fmt(result)} BTC`;
  $("metricInput").innerHTML = `${fmt(btc, 8)} <small>BTC</small>`;
  $("metricMult").textContent = `×${fmt(mult, 2)}`;
  $("metricResult").innerHTML = `${fmt(result, 8)} <small>BTC</small>`;
}

$("multiplyBtn").addEventListener("click", doMultiply);
$("btcInput").addEventListener("keydown", (e) => { if (e.key === "Enter") doMultiply(); });
$("multiplierInput").addEventListener("keydown", (e) => { if (e.key === "Enter") doMultiply(); });
$("btcInput").addEventListener("input", () => { if ($("resultBadge").classList.contains("ok")) doMultiply(); });
$("multiplierInput").addEventListener("input", () => { if ($("resultBadge").classList.contains("ok")) doMultiply(); });

$("payCopyBtn").addEventListener("click", copyAddress);

const qrCanvas = document.createElement("canvas");
drawQRCode(qrCanvas, "bitcoin:" + BTC_ADDRESS, 120);
$("payQr").appendChild(qrCanvas);
