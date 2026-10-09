const $ = (id) => document.getElementById(id);

function fmt(n, d = 8) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString("es-ES", { maximumFractionDigits: d });
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
