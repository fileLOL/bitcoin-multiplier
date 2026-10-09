# Bitcoin Multiplier

Panel web para supervisar **minería real de Bitcoin** y consultar Bitcoin Core por RPC. Incluye interfaz adaptable, estado de sincronización, altura de bloques, dificultad, hashrate de red y saldo de cartera si hay una cartera cargada.

## Importante: qué hace y qué no hace

- Este proyecto **no multiplica BTC automáticamente** ni genera ganancias garantizadas.
- Bitcoin Core es un nodo; no convierte un PC normal en un minero rentable. Para minería real de Bitcoin normalmente necesitas un ASIC y conectarlo a un pool de minería, o configurar software compatible con tu equipo.
- La interfaz consulta métricas del nodo. No incluye un minero, no cambia tu cartera y no envía transacciones.
- No pongas tus claves privadas, frase semilla ni contraseña de tu cartera en esta web.
- No expongas el puerto RPC 8332 a Internet. Usa acceso local o una red privada autenticada. Si publicas el panel, protege la API con `API_TOKEN` y añade HTTPS/proxy seguro.

## Requisitos

- Node.js 18 o posterior.
- Bitcoin Core instalado y sincronizado (o en proceso de sincronización).
- Acceso RPC local a Bitcoin Core.

## Ejecutar en Windows

1. Descomprime el ZIP.
2. Abre PowerShell en la carpeta `bitcoin-multiplier`.
3. Configura Bitcoin Core. Puedes partir de `bitcoin.conf.example`; adapta el archivo `bitcoin.conf` real de Bitcoin Core y usa credenciales RPC fuertes. Reinicia Bitcoin Core después de cambiar su configuración.
4. En PowerShell define las variables para esta sesión:

```powershell
$env:BITCOIN_RPC_URL="http://127.0.0.1:8332"
$env:BITCOIN_RPC_USER="TU_USUARIO_RPC"
$env:BITCOIN_RPC_PASSWORD="TU_CONTRASENA_RPC"
$env:API_TOKEN="PON_UN_TOKEN_LARGO_ALEATORIO"
$env:HOST="127.0.0.1"
$env:PORT="3000"
node server.js
```

5. Abre `http://127.0.0.1:3000`.
6. En el panel, abre **Ajustes de conexión** e introduce el mismo token en el campo de token API. El token solo se guarda en la memoria de la pestaña mientras esté abierta.

Si `BITCOIN_RPC_URL` apunta a otro equipo, asegúrate de que el tráfico viaja por una red privada autenticada. No abras el RPC al público.

## Despliegue online (Vercel + Render u otro servidor)

El backend necesita llegar a Bitcoin Core de forma segura y persistente. No basta con publicar los archivos estáticos en Vercel.

1. Despliega este proyecto como servicio Node en un servidor que pueda alcanzar tu nodo por una red privada VPN.
2. Configura `BITCOIN_RPC_URL`, `BITCOIN_RPC_USER`, `BITCOIN_RPC_PASSWORD`, `API_TOKEN`, `HOST=0.0.0.0` y `PORT` en el panel de variables de entorno del proveedor. `HOST=0.0.0.0` solo es apropiado detrás de un servicio/proxy que proteja el acceso.
3. Mantén el RPC de Bitcoin Core limitado a la VPN y a las IP necesarias; nunca publiques directamente el puerto 8332.
4. Para producción, sirve el panel detrás de HTTPS y configura restricciones de acceso. El token es una protección básica, no sustituye un despliegue endurecido.
5. Abre la URL del servicio y configura el token en Ajustes.

No se incluye una URL pública preconfigurada: debes usar la URL real de tu backend.

## Cómo leer los datos

- **Bloques**: bloques validados por tu nodo.
- **Cabeceras**: cabeceras conocidas; si bloques está por detrás, el nodo aún puede estar sincronizando.
- **Sincronización**: estimación comunicada por Bitcoin Core, no una medida exacta del tiempo restante.
- **Hashrate de red**: estimación de la red, no el rendimiento de tu ordenador.
- **Saldo**: aparece solo si `getwalletinfo` está disponible y una cartera está cargada.

## Próximo paso para minería real

Para calcular ingresos reales hace falta conocer modelo del ASIC, hashrate (TH/s), consumo (W), coste eléctrico (€/kWh), pool y comisiones. Esta app no inventa ganancias; se pueden añadir cálculos estimados con esos datos, marcados como estimaciones.
