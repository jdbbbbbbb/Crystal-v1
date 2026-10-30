import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ChatStore } from './chat-store.js';
import { server as wispServer } from '@mercuryworkshop/wisp-js/server';
import { proxyAllowedHosts, proxyHostnamePatterns } from './proxy-policy.js';

const port = Number(process.env.PORT || 4173);
const page = new URL('./index.html', import.meta.url);
const internalApps = new URL('./internal-apps.js', import.meta.url);
const serviceWorkerFile = new URL('./scramjet-sw.js', import.meta.url);
const store = new ChatStore(process.env.CRYSTAL_DB || join(homedir(), '.crystal-v1.sqlite'));
const gameCatalogueUrl = 'https://raw.githubusercontent.com/UseInterstellar/Interstellar/main/static/assets/json/games.min.json';
const seraphTreeUrl = 'https://api.github.com/repos/a456pur/seraph/git/trees/main?recursive=1';
const sessionCookie = 'crystal_session';
let gamesCache = { expiresAt: 0, games: [] };
let seraphGamesCache = { expiresAt: 0, games: [] };
let allGamesCache = { expiresAt: 0, games: [] };
const typingStates = new Map();

wispServer.options.hostname_whitelist = proxyHostnamePatterns;
wispServer.options.port_whitelist = [443];
wispServer.options.allow_private_ips = false;
wispServer.options.allow_loopback_ips = false;
wispServer.options.allow_direct_ip = false;
wispServer.options.allow_udp_streams = false;
wispServer.options.stream_limit_per_host = 16;
wispServer.options.stream_limit_total = 64;

const proxyAssets = new Map([
  ['/scramjet/scramjet.js', new URL('./node_modules/@mercuryworkshop/scramjet/dist/scramjet.js', import.meta.url)],
  ['/scramjet/scramjet.wasm', new URL('./node_modules/@mercuryworkshop/scramjet/dist/scramjet.wasm', import.meta.url)],
  ['/controller/controller.api.js', new URL('./node_modules/@mercuryworkshop/scramjet-controller/dist/controller.api.js', import.meta.url)],
  ['/controller/controller.inject.js', new URL('./node_modules/@mercuryworkshop/scramjet-controller/dist/controller.inject.js', import.meta.url)],
  ['/controller/controller.sw.js', new URL('./node_modules/@mercuryworkshop/scramjet-controller/dist/controller.sw.js', import.meta.url)],
  ['/libcurl/index.js', new URL('./node_modules/@mercuryworkshop/libcurl-transport/dist/index.js', import.meta.url)]
]);

function proxyAssetContentType(pathname) {
  return pathname.endsWith('.wasm') ? 'application/wasm' : 'text/javascript; charset=utf-8';
}

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.jsdelivr.net https://raw.githubusercontent.com data:; connect-src 'self' ws: wss:; worker-src 'self' blob:; frame-src 'self' https:; object-src 'none'; frame-ancestors 'self'"
};

function send(response, statusCode, data, extraHeaders = {}) {
  response.writeHead(statusCode, {
    ...securityHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  response.end(JSON.stringify(data));
}

function getSessionToken(request) {
  const cookies = request.headers.cookie?.split(';') ?? [];
  for (const cookie of cookies) {
    const [name, ...value] = cookie.trim().split('=');
    if (name === sessionCookie) return decodeURIComponent(value.join('='));
  }
  return '';
}

function setSessionCookie(request, response, token) {
  const secure = request.headers['x-forwarded-proto'] === 'https' || request.socket.encrypted;
  response.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure ? '; Secure' : ''}`);
}

function clearSessionCookie(request, response) {
  const secure = request.headers['x-forwarded-proto'] === 'https' || request.socket.encrypted;
  response.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`);
}

function sameOriginWrite(request) {
  const origin = request.headers.origin;
  return !origin || new URL(origin).host === request.headers.host;
}

const eventClients = new Set();

function sendEvent(client, event, data) {
  if (client.response.destroyed) {
    eventClients.delete(client);
    return;
  }
  client.response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function publishConversation(conversation, event, data) {
  for (const client of eventClients) {
    if (client.conversation === conversation) sendEvent(client, event, { ...data, conversation });
  }
}

function typingUsers(conversation, excludeUserId = null) {
  const users = [];
  for (const [key, state] of typingStates) {
    if (state.expiresAt <= Date.now()) {
      typingStates.delete(key);
    } else if (state.conversation === conversation && state.userId !== excludeUserId) {
      const user = store.userById(state.userId);
      if (user) users.push(user.username);
    }
  }
  return [...new Set(users)];
}

function publishMembers() {
  for (const client of eventClients) {
    sendEvent(client, 'members', { users: store.listUsers(client.userId) });
  }
}

function openEventStream(request, response, user, conversation) {
  response.writeHead(200, {
    ...securityHeaders,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  response.write('retry: 2000\n\n');
  const client = { userId: user.id, conversation, response };
  eventClients.add(client);
  sendEvent(client, 'typing', { users: typingUsers(conversation, user.id) });
  const heartbeat = setInterval(() => {
    if (response.destroyed) return clearInterval(heartbeat);
    response.write(': keep-alive\n\n');
  }, 25000);
  response.on('close', () => {
    clearInterval(heartbeat);
    eventClients.delete(client);
  });
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw Object.assign(new Error('Request is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid JSON body.'), { status: 400 });
  }
}

async function loadGames() {
  if (gamesCache.expiresAt > Date.now()) return gamesCache.games;
  const response = await fetch(gameCatalogueUrl, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Games catalogue is unavailable.');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Games catalogue is invalid.');
  const games = data.flatMap((game) => {
    if (!game || typeof game.name !== 'string' || typeof game.link !== 'string') return [];
    try {
      const url = new URL(game.link);
      if (url.protocol !== 'https:') return [];
      const imagePath = typeof game.image === 'string' && /^\/assets\/media\/[a-zA-Z0-9_./-]+$/.test(game.image) && !game.image.includes('..')
        ? game.image
        : '';
      const image = imagePath
        ? new URL(`static${imagePath}`, 'https://raw.githubusercontent.com/UseInterstellar/Interstellar/main/').href
        : '';
      return [{ name: game.name.slice(0, 100), url: url.href, image }];
    } catch {
      return [];
    }
  }).slice(0, 200).map((game, id) => ({ ...game, id }));
  gamesCache = { expiresAt: Date.now() + 15 * 60 * 1000, games };
  return games;
}

function seraphRawUrl(path) {
  return `https://raw.githubusercontent.com/a456pur/seraph/main/${path.split('/').map(encodeURIComponent).join('/')}`;
}

async function loadSeraphGames() {
  if (seraphGamesCache.expiresAt > Date.now()) return seraphGamesCache.games;
  const response = await fetch(seraphTreeUrl, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Crystal-v1' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Seraph catalogue returned HTTP ${response.status}.`);
  const data = await response.json();
  if (!Array.isArray(data.tree) || data.truncated) throw new Error('Seraph game tree is incomplete.');

  const directories = new Map();
  for (const item of data.tree) {
    if (item.type !== 'blob') continue;
    const match = /^games\/([a-zA-Z0-9._-]+)\/(.+)$/.exec(item.path);
    if (!match) continue;
    const [, slug, relativePath] = match;
    let game = directories.get(slug);
    if (!game) {
      game = { slug, launchPath: '', imagePath: '', imageScore: Infinity };
      directories.set(slug, game);
    }
    if (relativePath === 'index.html') game.launchPath = item.path;
    if (!/\.(png|jpe?g|webp)$/i.test(relativePath) || relativePath.split('/').includes('..')) continue;
    const filename = relativePath.split('/').at(-1);
    const isRootAsset = !relativePath.includes('/');
    const isCoverName = /(cover|thumb|thumbnail|preview|icon|logo|splash)/i.test(filename);
    const score = (isRootAsset ? 0 : 20) + (isCoverName ? 0 : 5);
    if (score < game.imageScore) {
      game.imagePath = item.path;
      game.imageScore = score;
    }
  }

  const games = [...directories.values()]
    .filter((game) => game.launchPath)
    .sort((left, right) => left.slug.localeCompare(right.slug))
    .map((game, id) => ({
      id,
      name: game.slug.replace(/([a-z])([0-9])/gi, '$1 $2').replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
      url: seraphRawUrl(game.launchPath),
      image: game.imagePath ? seraphRawUrl(game.imagePath) : '',
      source: 'Seraph'
    }));

  seraphGamesCache = { expiresAt: Date.now() + 60 * 60 * 1000, games };
  return games;
}

async function loadAllGames() {
  if (allGamesCache.expiresAt > Date.now()) return allGamesCache.games;
  const [interstellarGames, seraphGames] = await Promise.all([
    loadGames(),
    loadSeraphGames().catch((error) => {
    console.error('Unable to load Seraph game tree:', error.message);
      return [];
    })
  ]);
  const games = [
    ...interstellarGames,
    ...seraphGames.map((game, index) => ({ ...game, id: interstellarGames.length + index }))
  ];
  allGamesCache = { expiresAt: Date.now() + 5 * 60 * 1000, games };
  return games;
}

async function handleApi(request, response, url) {
  if (request.method !== 'GET' && !sameOriginWrite(request)) {
    send(response, 403, { error: 'Cross-origin requests are not allowed.' });
    return;
  }

  if (url.pathname === '/api/auth/register' && request.method === 'POST') {
    const body = await readJson(request);
    const user = store.createAccount(body.username, body.password);
    setSessionCookie(request, response, store.createSession(user.id));
    send(response, 201, { user });
    publishMembers();
    return;
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const body = await readJson(request);
    const user = store.authenticate(body.username, body.password);
    if (!user) {
      send(response, 401, { error: 'Username or password is incorrect.' });
      return;
    }
    setSessionCookie(request, response, store.createSession(user.id));
    send(response, 200, { user });
    return;
  }

  if (url.pathname === '/api/auth/me' && request.method === 'GET') {
    const user = store.userForSession(getSessionToken(request));
    if (!user) {
      send(response, 401, { error: 'Sign in required.' });
      return;
    }
    send(response, 200, { user });
    return;
  }

  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    store.deleteSession(getSessionToken(request));
    clearSessionCookie(request, response);
    send(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/chat/messages' && request.method === 'GET') {
    const user = store.userForSession(getSessionToken(request));
    if (!user) {
      send(response, 401, { error: 'Sign in required.' });
      return;
    }
    const conversation = store.resolveConversation(user.id, url.searchParams.get('conversation'));
    const result = store.listMessages(user.id, conversation);
    if (result.readChanged) publishConversation(conversation, 'receipt', { userId: user.id });
    send(response, 200, result);
    return;
  }

  if (url.pathname === '/api/chat/messages' && request.method === 'POST') {
    const user = store.userForSession(getSessionToken(request));
    if (!user) {
      send(response, 401, { error: 'Sign in required.' });
      return;
    }
    const body = await readJson(request);
    const conversation = store.resolveConversation(user.id, body.conversation);
    const message = store.addMessage(user.id, body.content, conversation);
    send(response, 201, { message });
    return;
  }

  if (url.pathname === '/api/chat/users' && request.method === 'GET') {
    const user = store.userForSession(getSessionToken(request));
    if (!user) {
      send(response, 401, { error: 'Sign in required.' });
      return;
    }
    send(response, 200, { users: store.listUsers(user.id) });
    return;
  }

  if (url.pathname === '/api/chat/typing' && request.method === 'GET') {
    const user = store.userForSession(getSessionToken(request));
    if (!user) {
      send(response, 401, { error: 'Sign in required.' });
      return;
    }
    const conversation = store.resolveConversation(user.id, url.searchParams.get('conversation'));
    const names = [];
    for (const [key, state] of typingStates) {
      if (state.expiresAt <= Date.now()) {
        typingStates.delete(key);
      } else if (state.conversation === conversation && state.userId !== user.id) {
        const typingUser = store.userById(state.userId);
        if (typingUser) names.push(typingUser.username);
      }
    }
    send(response, 200, { users: [...new Set(names)] });
    return;
  }

  if (url.pathname === '/api/chat/typing' && request.method === 'POST') {
    const user = store.userForSession(getSessionToken(request));
    if (!user) {
      send(response, 401, { error: 'Sign in required.' });
      return;
    }
    const body = await readJson(request);
    const conversation = store.resolveConversation(user.id, body.conversation);
    const key = `${conversation}:${user.id}`;
    if (body.typing === true) typingStates.set(key, { userId: user.id, conversation, expiresAt: Date.now() + 5000 });
    else typingStates.delete(key);
    send(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/games' && request.method === 'GET') {
    send(response, 200, { games: await loadAllGames() });
    return;
  }

  const gameDetailsPath = /^\/api\/games\/(\d+)$/.exec(url.pathname);
  if (gameDetailsPath && request.method === 'GET') {
    const game = (await loadAllGames()).find((item) => item.id === Number(gameDetailsPath[1]));
    if (!game) {
      send(response, 404, { error: 'Game not found.' });
      return;
    }
    send(response, 200, { game });
    return;
  }

  const gamePath = /^\/api\/games\/(\d+)\/open$/.exec(url.pathname);
  if (gamePath && request.method === 'GET') {
    const game = (await loadAllGames()).find((item) => item.id === Number(gamePath[1]));
    if (!game) {
      send(response, 404, { error: 'Game not found.' });
      return;
    }
    response.writeHead(302, { ...securityHeaders, Location: game.url, 'Cache-Control': 'no-store' });
    response.end();
    return;
  }

  send(response, 404, { error: 'API route not found.' });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url);
    return;
  }

    if ((url.pathname === '/' || url.pathname === '/index.html') && request.method === 'GET') {
      const content = await readFile(page);
      response.writeHead(200, { ...securityHeaders, 'Content-Type': 'text/html; charset=utf-8' });
      response.end(content);
      return;
    }

    if (url.pathname === '/internal-apps.js' && request.method === 'GET') {
      const content = await readFile(internalApps);
      response.writeHead(200, { ...securityHeaders, 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
      response.end(content);
      return;
    }

    if (url.pathname === '/proxy-config.js' && request.method === 'GET') {
      response.writeHead(200, { ...securityHeaders, 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(`window.CRYSTAL_PROXY_HOSTS = ${JSON.stringify(proxyAllowedHosts)};`);
      return;
    }

    if (url.pathname === '/sw.js' && request.method === 'GET') {
      const content = await readFile(serviceWorkerFile);
      response.writeHead(200, {
        ...securityHeaders,
        'Content-Type': 'text/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'no-cache'
      });
      response.end(content);
      return;
    }

    if (proxyAssets.has(url.pathname) && request.method === 'GET') {
      const content = await readFile(proxyAssets.get(url.pathname));
      response.writeHead(200, {
        ...securityHeaders,
        'Content-Type': proxyAssetContentType(url.pathname),
        'Cache-Control': 'public, max-age=604800, immutable'
      });
      response.end(content);
      return;
    }

    response.writeHead(404, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  } catch (error) {
    if (!response.headersSent) send(response, error.status || 500, { error: error.message || 'Unable to complete request.' });
    else response.destroy();
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Crystal is running at http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
  let pathname;
  try {
    pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;
  } catch {
    socket.destroy();
    return;
  }
  if (pathname !== '/wisp/') {
    socket.destroy();
    return;
  }
  wispServer.routeRequest(request, socket, head);
});

server.on('close', () => store.close());