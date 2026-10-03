/* Mini serveur de présence pour Joute (compatible avec net.js, API type Firebase REST). Aucune dépendance.
   Lancer : node server.js   (port 3000, ou PORT=8080 node server.js) */
const http = require('http');
const store = {};
const PORT = process.env.PORT || 3000;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Max-Age': '86400' };
function walk(parts, create){
  let n = store;
  for (const k of parts){ if (n[k] === undefined || typeof n[k] !== 'object'){ if (!create) return undefined; n[k] = {}; } n = n[k]; }
  return n;
}
http.createServer((req, res) => {
  if (req.method === 'OPTIONS'){ res.writeHead(204, cors); return res.end(); }
  const path = decodeURIComponent(req.url.split('?')[0]).replace(/\.json$/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'joute' || parts.length < 2 || parts.length > 3 || parts.some(p => p === '__proto__' || p.length > 64)){ res.writeHead(parts.length ? 404 : 200, cors); return res.end(parts.length ? '' : 'Joute OK'); }
  let body = '';
  req.on('data', c => { body += c; if (body.length > 20000) req.destroy(); });
  req.on('end', () => {
    const json = { ...cors, 'Content-Type': 'application/json' };
    if (req.method === 'GET'){ const n = walk(parts, false); res.writeHead(200, json); return res.end(JSON.stringify(n === undefined ? null : n)); }
    if (req.method === 'PUT' && parts.length === 3){
      try { walk(parts.slice(0, 2), true)[parts[2]] = JSON.parse(body); } catch(e){ res.writeHead(400, cors); return res.end(); }
      res.writeHead(200, json); return res.end('null');
    }
    if (req.method === 'DELETE' && parts.length === 3){ const p = walk(parts.slice(0, 2), false); if (p) delete p[parts[2]]; res.writeHead(200, json); return res.end('null'); }
    res.writeHead(405, cors); res.end();
  });
}).listen(PORT, () => console.log('Joute serveur sur le port ' + PORT));
/* Ménage : on supprime les salles vides toutes les minutes. */
setInterval(() => { for (const r of Object.keys(store.joute || {})) if (!Object.keys(store.joute[r]).length) delete store.joute[r]; }, 60000);
