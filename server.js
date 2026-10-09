/**
 * Bitcoin Multiplier — backend de monitorización.
 * No mina BTC por sí mismo. Consulta Bitcoin Core por RPC y nunca expone
 * las credenciales RPC al navegador.
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const RPC_URL = process.env.BITCOIN_RPC_URL || "http://127.0.0.1:8332";
const RPC_USER = process.env.BITCOIN_RPC_USER || "";
const RPC_PASSWORD = process.env.BITCOIN_RPC_PASSWORD || "";
const API_TOKEN = process.env.API_TOKEN || "";
const PUBLIC_DIR = path.join(__dirname, "public");

function send(res, status, data, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers
  });
  res.end(JSON.stringify(data));
}

async function rpc(method, params = []) {
  if (!RPC_USER || !RPC_PASSWORD) {
    const e = new Error("Faltan BITCOIN_RPC_USER y BITCOIN_RPC_PASSWORD.");
    e.code = "RPC_CONFIG";
    throw e;
  }
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + Buffer.from(`${RPC_USER}:${RPC_PASSWORD}`).toString("base64")
    },
    body: JSON.stringify({ jsonrpc: "1.0", id: "bitcoin-multiplier", method, params }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`Bitcoin Core respondió HTTP ${response.status}.`);
  const body = await response.json();
  if (body.error) throw new Error(body.error.message || "Error RPC de Bitcoin Core.");
  return body.result;
}

function authOk(req) {
  if (!API_TOKEN) return true;
  return req.headers["x-api-token"] === API_TOKEN;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    if (!authOk(req)) return send(res, 401, { ok: false, error: "Token de API no válido." });
    try {
      if (url.pathname === "/api/health") {
        return send(res, 200, { ok: true, configured: Boolean(RPC_USER && RPC_PASSWORD), timestamp: new Date().toISOString() });
      }
      if (url.pathname === "/api/status") {
        const [chain, mining] = await Promise.all([
          rpc("getblockchaininfo"),
          rpc("getmininginfo").catch(() => null)
        ]);
        let networkHashrate = null;
        try { networkHashrate = await rpc("getnetworkhashps", [120, -1]); } catch {}
        return send(res, 200, {
          ok: true,
          mode: "live",
          chain: chain.chain,
          blocks: chain.blocks,
          headers: chain.headers,
          verificationProgress: chain.verificationprogress,
          initialBlockDownload: chain.initialblockdownload,
          difficulty: mining?.difficulty ?? null,
          networkHashrate,
          mining,
          timestamp: new Date().toISOString()
        });
      }
      if (url.pathname === "/api/wallet") {
        try {
          const info = await rpc("getwalletinfo");
          return send(res, 200, { ok: true, walletLoaded: true, balanceBTC: info.balance, unconfirmedBTC: info.unconfirmed_balance });
        } catch {
          return send(res, 200, { ok: true, walletLoaded: false, message: "No hay una cartera cargada o el acceso está desactivado." });
        }
      }
      return send(res, 404, { ok: false, error: "Endpoint no encontrado." });
    } catch (err) {
      const config = err.code === "RPC_CONFIG";
      return send(res, config ? 503 : 502, {
        ok: false,
        error: config ? err.message : "No se pudo consultar Bitcoin Core.",
        detail: process.env.NODE_ENV === "production" ? undefined : err.message,
        hint: config ? "Configura las variables BITCOIN_RPC_* en el servidor." : "Comprueba que Bitcoin Core esté sincronizado y que la URL/RPC sean correctas."
      });
    }
  }

  const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const file = path.resolve(PUBLIC_DIR, requested);
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); return res.end("Not found");
  }
  const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml" };
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "X-Content-Type-Options":"nosniff" });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`Bitcoin Multiplier en http://${HOST}:${PORT}`);
  if (!API_TOKEN) console.warn("AVISO: API_TOKEN no configurado. Recomendado para despliegues accesibles desde Internet.");
});