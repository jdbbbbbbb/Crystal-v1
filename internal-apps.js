const iconUrl = (name) => `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${name}.svg`;

const apps = [
  { name: 'Google', url: 'https://www.google.com', icon: 'google' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: 'youtube' },
  { name: 'GitHub', url: 'https://github.com', icon: 'github' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: 'wikipedia' },
  { name: 'Reddit', url: 'https://www.reddit.com', icon: 'reddit' },
  { name: 'Discord', url: 'https://discord.com/app', icon: 'discord' },
  { name: 'Twitch', url: 'https://www.twitch.tv', icon: 'twitch' },
  { name: 'Spotify', url: 'https://open.spotify.com', icon: 'spotify' },
  { name: 'Netflix', url: 'https://www.netflix.com', icon: 'netflix' },
  { name: 'Pinterest', url: 'https://www.pinterest.com', icon: 'pinterest' },
  { name: 'TikTok', url: 'https://www.tiktok.com', icon: 'tiktok' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: 'stackoverflow' }
];

const sharedStyles = `
  :root { color-scheme: dark; font-family: "Segoe UI Variable", "Aptos", sans-serif; color: #f7f7f7; background: #050505; --theme-bg: #050505; --theme-panel: #0c0c0c; --theme-line: #303030; }
  :root[data-theme="ocean"] { --theme-bg: #06131b; --theme-panel: #102731; --theme-line: #29444f; }
  :root[data-theme="forest"] { --theme-bg: #07140e; --theme-panel: #13251a; --theme-line: #304638; }
  :root[data-theme="plum"] { --theme-bg: #140d16; --theme-panel: #271a2d; --theme-line: #48364e; }
  * { box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  body { margin: 0; min-height: 100vh; background: var(--theme-bg); color: #f7f7f7; text-shadow: 0 0 8px #fff5; }
  button, input { font: inherit; }
  button { color: inherit; }
  .page { width: min(940px, calc(100% - 36px)); margin: 0 auto; padding: 34px 0 44px; }
  .eyebrow { color: #aaa; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
  h1 { margin: 9px 0 7px; font-family: inherit; font-size: 36px; font-weight: 400; text-shadow: 0 0 12px #fff, 0 0 32px #fff8; }
  .intro { margin: 0 0 25px; color: #c9c9c9; font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 12px; }
  .card, .panel { border: 1px solid var(--theme-line); border-radius: 7px; background: var(--theme-panel); }
  .card { min-height: 112px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 12px; padding: 15px; cursor: pointer; text-align: left; transition: border-color .16s, transform .16s, box-shadow .16s; }
  .card:hover, .card:focus-visible { transform: translateY(-2px); border-color: #fff; outline: 0; box-shadow: 0 0 18px #ffffff25; }
  .app-icon { width: 25px; height: 25px; object-fit: contain; filter: brightness(0) invert(1) drop-shadow(0 0 5px #fff); }
  .panel { padding: 20px; }
  .field { display: grid; gap: 7px; margin: 15px 0; color: #ccc; font-size: 12px; }
  .field input, .message-input { width: 100%; min-height: 42px; border: 1px solid #393939; border-radius: 5px; background: #111; color: #fff; padding: 0 12px; outline: none; }
  .field input:focus, .message-input:focus { border-color: #fff; box-shadow: 0 0 12px #ffffff20; }
  .primary, .secondary { min-height: 38px; border: 1px solid #fff; border-radius: 5px; padding: 0 14px; background: #fff; color: #050505; cursor: pointer; font-weight: 650; }
  .secondary { background: #111; color: #fff; }
  .primary:hover, .secondary:hover { box-shadow: 0 0 15px #ffffff40; }
  .switches { display: flex; gap: 8px; margin-bottom: 16px; }
  .notice { min-height: 20px; margin: 12px 0 0; color: #d3d3d3; font-size: 12px; }
  .muted { color: #aaa; font-size: 12px; }
  .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
  .messages { height: min(54vh, 480px); min-height: 240px; overflow: auto; display: flex; flex-direction: column; gap: 12px; padding: 15px; border: 1px solid #303030; border-radius: 6px; background: #080808; }
  .message { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; align-items: baseline; border-radius: 4px; padding: 8px; margin: -8px; }
  .message:hover, .message:focus-within { background: #ffffff08; }
  .message-author { border: 0; padding: 0; background: transparent; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; }
  .message-author:hover { text-decoration: underline; }
  .message time { color: #777; font-size: 10px; }
  .message p { grid-column: 1 / -1; margin: 0; color: #ddd; font-size: 13px; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; }
  .message .receipt { grid-column: 1 / -1; color: #888; font-size: 10px; }
  .message .reply-context { grid-column: 1 / -1; border-left: 2px solid #888; padding-left: 8px; color: #999; font-size: 11px; }
  .message-actions { position: absolute; z-index: 2; top: -12px; right: 7px; display: flex; gap: 2px; padding: 3px; border: 1px solid #383838; border-radius: 5px; background: #171717; opacity: 0; pointer-events: none; transition: opacity .12s; }
  .message:hover .message-actions, .message:focus-within .message-actions { opacity: 1; pointer-events: auto; }
  .message-action { min-width: 27px; height: 27px; display: grid; place-items: center; border: 0; border-radius: 3px; padding: 0 5px; background: transparent; color: #ddd; cursor: pointer; font-size: 13px; }
  .message-action:hover { background: #ffffff1a; color: #fff; }
  .reactions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 5px; }
  .reaction-pill { min-height: 25px; border: 1px solid #3b3b3b; border-radius: 12px; padding: 2px 8px; background: #ffffff08; color: #ddd; cursor: pointer; font-size: 11px; }
  .reaction-pill.reacted { border-color: #bbb; background: #ffffff20; color: #fff; }
  .chat-shell { min-height: min(660px, 78vh); display: grid; grid-template-columns: 205px minmax(0, 1fr); overflow: hidden; border: 1px solid var(--theme-line); border-radius: 7px; background: var(--theme-panel); }
  .page-chat { width: 100%; height: 100vh; display: flex; flex-direction: column; overflow: hidden; padding: 0; }
  .page-chat > .eyebrow, .page-chat > h1, .page-chat > .intro { display: none; }
  .page-chat #auth-panel { width: min(420px, calc(100% - 32px)); align-self: center; margin: auto; }
  .page-chat .chat-shell { width: 100%; min-height: 0; height: 100%; flex: 1; border: 0; border-radius: 0; }
  .chat-sidebar { min-width: 0; padding: 14px 9px; border-right: 1px solid var(--theme-line); background: #08080866; }
  .chat-section-title { display: flex; align-items: center; gap: 7px; margin: 4px 4px 8px; color: #a9a9a9; font-size: 10px; font-weight: 750; letter-spacing: 1px; text-transform: uppercase; }
  .chat-section-title svg { width: 15px; height: 15px; flex: 0 0 15px; fill: currentColor; }
  .chat-divider { height: 1px; margin: 15px 3px; background: var(--theme-line); }
  .chat-user, .channel-button { width: 100%; min-height: 34px; display: flex; align-items: center; gap: 8px; border: 0; border-radius: 4px; padding: 5px 7px; background: transparent; color: #d0d0d0; cursor: pointer; text-align: left; font-size: 12px; }
  .chat-user:hover, .channel-button:hover, .channel-button.active { background: #ffffff12; color: #fff; }
  .user-avatar { width: 22px; height: 22px; display: grid; place-items: center; flex: 0 0 22px; border: 1px solid #777; border-radius: 50%; color: #fff; font-size: 9px; font-weight: 700; }
  .chat-main { min-width: 0; min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr) auto auto auto auto; padding: 15px; }
  .chat-main .toolbar { min-height: 42px; margin: 0; padding: 0 0 12px; border-bottom: 1px solid var(--theme-line); }
  .messages { height: auto; min-height: 200px; border: 0; border-radius: 0; background: transparent; }
  .typing-row { min-height: 18px; margin: 0; color: #aaa; font-size: 11px; }
  .reply-composer { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-left: 2px solid #aaa; padding: 5px 8px; background: #ffffff08; color: #bbb; font-size: 11px; }
  .reply-composer button { border: 0; background: transparent; color: #bbb; cursor: pointer; }
  .profile-dialog { width: min(330px, calc(100vw - 32px)); border: 1px solid #444; border-radius: 8px; padding: 22px; background: #111; color: #fff; box-shadow: 0 18px 70px #000b; }
  .profile-dialog::backdrop { background: #000a; }
  .profile-dialog-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .profile-dialog .user-avatar { width: 42px; height: 42px; font-size: 14px; }
  .profile-dialog h2 { margin: 0; font-size: 16px; }
  .profile-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .send-row { display: flex; gap: 8px; margin-top: 10px; }
  .message-input { flex: 1; }
  .setting-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 17px 0; border-bottom: 1px solid #292929; }
  .setting-row h2 { margin: 0 0 5px; font-size: 14px; }
  .setting-row p { margin: 0; color: #aaa; font-size: 12px; }
  .switch { width: 18px; height: 18px; accent-color: #fff; }
  .game-frame { width: 100%; height: min(72vh, 680px); min-height: 320px; border: 1px solid #333; border-radius: 6px; background: #000; }
  .game-tools { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 15px 0 10px; }
  .game-search { width: min(440px, 100%); min-height: 42px; margin: 0 0 17px; border: 1px solid var(--theme-line); border-radius: 5px; padding: 0 12px; background: #111; color: #fff; outline: 0; }
  .game-search:focus { border-color: #fff; box-shadow: 0 0 12px #fff2; }
  .game-card { position: relative; min-height: 164px; justify-content: flex-end; overflow: hidden; padding: 0; isolation: isolate; }
  .game-card::after { position: absolute; z-index: -1; inset: 0; background: linear-gradient(180deg, #0001 18%, #000e 100%); content: ""; }
  .game-cover { position: absolute; z-index: -2; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .8; transition: transform .2s, opacity .2s; }
  .game-card:hover .game-cover { transform: scale(1.05); opacity: 1; }
  .game-card strong { padding: 14px; text-shadow: 0 1px 5px #000, 0 0 8px #fff5; }
  .game-placeholder { position: absolute; z-index: -2; inset: 0; display: grid; place-items: center; background: radial-gradient(circle at 50% 30%, #333, #101010 70%); color: #fff9; font-size: 35px; font-weight: 300; }
  .theme-select { min-width: 150px; min-height: 38px; border: 1px solid #444; border-radius: 5px; padding: 0 10px; background: #111; color: #fff; }
  .file-input { max-width: 240px; color: #bbb; font-size: 11px; }
  .file-input::file-selector-button { min-height: 34px; margin-right: 9px; border: 1px solid #555; border-radius: 4px; padding: 0 10px; background: #171717; color: #fff; cursor: pointer; }
  [hidden] { display: none !important; }
  @media (max-width: 620px) { .chat-shell { grid-template-columns: 132px minmax(0, 1fr); } .chat-sidebar { padding: 10px 5px; } .chat-section-title { font-size: 9px; letter-spacing: .5px; } .chat-main { padding: 10px; } .messages { padding: 10px 2px; } .send-row { flex-wrap: wrap; } .send-row button { min-width: 100%; } }
  @media (max-width: 520px) { .page { width: calc(100% - 24px); padding-top: 24px; } .page.page-chat { width: 100%; padding: 0; } h1 { font-size: 31px; } .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } .panel { padding: 15px; } .chat-shell { min-height: 70vh; grid-template-columns: 112px minmax(0, 1fr); } .chat-user { gap: 5px; padding-right: 2px; padding-left: 3px; font-size: 10px; } }
`;

function appDocument(title, description, body, script = '') {
  const scriptTag = script ? `<script>${script}</script>` : '';
  const pageClass = title === 'Chat' ? 'page page-chat' : 'page';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${location.origin}/"><title>${title} | Crystal</title><style>${sharedStyles}</style><script>document.documentElement.dataset.theme=localStorage.getItem('crystal-theme')||'obsidian';</script></head><body><main class="${pageClass}"><div class="eyebrow">Crystal v1 / ${title}</div><h1>${title}</h1><p class="intro">${description}</p>${body}</main>${scriptTag}</body></html>`;
}

const chatMarkup = `
  <section id="auth-panel" class="panel">
    <div class="switches"><button class="secondary" type="button" data-mode="login">Sign in</button><button class="secondary" type="button" data-mode="register">Create account</button></div>
    <form id="auth-form">
      <label class="field">Username<input id="username" name="username" minlength="3" maxlength="24" autocomplete="username" required></label>
      <label class="field">Password<input id="password" name="password" type="password" minlength="10" maxlength="128" autocomplete="current-password" required></label>
      <button id="auth-submit" class="primary" type="submit">Sign in</button>
      <p class="notice" id="auth-notice" role="status">Accounts are stored on this Crystal server.</p>
    </form>
  </section>
  <section id="room-panel" class="chat-shell" hidden>
    <aside class="chat-sidebar" aria-label="Chat navigation">
      <div class="chat-section-title"><svg viewBox="0 0 640 640" aria-hidden="true"><path d="M320 80C377.4 80 424 126.6 424 184C424 241.4 377.4 288 320 288C262.6 288 216 241.4 216 184C216 126.6 262.6 80 320 80zM96 152C135.8 152 168 184.2 168 224C168 263.8 135.8 296 96 296C56.2 296 24 263.8 24 224C24 184.2 56.2 152 96 152zM0 480C0 409.3 57.3 352 128 352C140.8 352 153.2 353.9 164.9 357.4C132 394.2 112 442.8 112 496L112 512C112 523.4 114.4 534.2 118.7 544L32 544C14.3 544 0 529.7 0 512L0 480zM521.3 544C525.6 534.2 528 523.9 528 512L528 496C528 442.8 508 394.2 475.1 357.4C486.8 353.9 499.2 352 512 352C582.7 352 640 409.3 640 480L640 512C640 529.7 625.7 544 608 544L521.3 544zM472 224C472 184.2 504.2 152 544 152C583.8 152 616 184.2 616 224C616 263.8 583.8 296 544 296C504.2 296 472 263.8 472 224zM160 496C160 407.6 231.6 336 320 336C408.4 336 480 407.6 480 496L480 512C480 529.7 465.7 544 448 544L192 544C174.3 544 160 529.7 160 512L160 496z"/></svg><span>Direct Messages</span></div>
      <div id="user-list"></div>
      <div class="chat-divider"></div>
      <div class="chat-section-title"><svg viewBox="0 0 640 640" aria-hidden="true"><path d="M267.7 576.9C267.7 576.9 267.7 576.9 267.7 576.9L229.9 603.6C222.6 608.8 213 609.4 205 605.3C197 601.2 192 593 192 584L192 512L160 512C107 512 64 469 64 416L64 192C64 139 107 96 160 96L480 96C533 96 576 139 576 192L576 416C576 469 533 512 480 512L359.6 512L267.7 576.9zM332 472.8C340.1 467.1 349.8 464 359.7 464L480 464C506.5 464 528 442.5 528 416L528 192C528 165.5 506.5 144 480 144L160 144C133.5 144 112 165.5 112 192L112 416C112 442.5 133.5 464 160 464L216 464C226.4 464 235.3 470.6 238.6 479.9C239.5 482.4 240 485.1 240 488L240 537.7C272.7 514.6 303.3 493 331.9 472.8z"/></svg><span>Channels</span></div>
      <button id="general-channel" class="channel-button active" type="button"><span>#</span> general</button>
      <div class="chat-divider"></div>
      <button id="sign-out" class="channel-button" type="button">Sign out</button>
    </aside>
    <section class="chat-main">
      <div class="toolbar"><div><strong id="room-title"># general</strong><div id="room-subtitle" class="muted">Signed in as <span id="room-user"></span></div></div></div>
      <div id="messages" class="messages" aria-live="polite"></div>
      <p id="typing-indicator" class="typing-row" aria-live="polite"></p>
      <div id="reply-composer" class="reply-composer" hidden><span>Replying to <strong id="reply-user"></strong>: <span id="reply-text"></span></span><button id="cancel-reply" type="button" title="Cancel reply" aria-label="Cancel reply">&#215;</button></div>
      <form id="send-form" class="send-row"><input id="message-input" class="message-input" maxlength="500" autocomplete="off" placeholder="Message #general" aria-label="Message #general" required><button class="primary" type="submit">Send</button></form>
      <p class="notice" id="chat-notice" role="status"></p>
    </section>
  </section>`;

const profileMarkup = `
  <dialog id="profile-dialog" class="profile-dialog">
    <div class="profile-dialog-head"><span id="profile-avatar" class="user-avatar"></span><div><h2 id="profile-name"></h2><span class="muted">Crystal member</span></div></div>
    <div class="profile-dialog-actions"><button id="profile-close" class="secondary" type="button">Close</button><button id="profile-message" class="primary" type="button">Message</button></div>
  </dialog>`;

const chatScript = `
  const authPanel = document.querySelector('#auth-panel');
  const roomPanel = document.querySelector('#room-panel');
  const authNotice = document.querySelector('#auth-notice');
  const chatNotice = document.querySelector('#chat-notice');
  const authForm = document.querySelector('#auth-form');
  const messages = document.querySelector('#messages');
  const typingIndicator = document.querySelector('#typing-indicator');
  const profileDialog = document.querySelector('#profile-dialog');
  let mode = 'login';
  let currentUser = null;
  let currentConversation = 'general';
  let selectedProfile = null;
  let replyTargetId = null;
  let typingActive = false;
  let eventStream = null;
  let typingTimer = 0;
  async function api(path, options = {}) {
    const response = await fetch(path, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }
  function setMode(nextMode) {
    mode = nextMode;
    document.querySelector('#auth-submit').textContent = mode === 'register' ? 'Create account' : 'Sign in';
    document.querySelector('#password').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
    authNotice.textContent = mode === 'register' ? 'Choose a username and a password of at least 10 characters.' : 'Accounts are stored on this Crystal server.';
  }
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  function showProfile(user) {
    selectedProfile = user;
    document.querySelector('#profile-name').textContent = user.username;
    document.querySelector('#profile-avatar').textContent = user.username.slice(0, 1).toUpperCase();
    document.querySelector('#profile-message').hidden = user.id === currentUser.id;
    profileDialog.showModal();
  }
  function selectConversation(conversation, user = null) {
    setTyping(false);
    if (eventStream) eventStream.close();
    currentConversation = conversation;
    typingActive = false;
    replyTargetId = null;
    document.querySelector('#reply-composer').hidden = true;
    document.querySelector('#room-title').textContent = user ? '@ ' + user.username : '# general';
    document.querySelector('#room-subtitle').textContent = user ? 'Direct message' : 'Signed in as ' + currentUser.username;
    document.querySelector('#message-input').placeholder = user ? 'Message @' + user.username : 'Message #general';
    document.querySelector('#general-channel').classList.toggle('active', !user);
    messages.replaceChildren();
    typingIndicator.textContent = '';
    loadMessages();
    openEventStream();
  }
  function renderUsers(users) {
    const list = document.querySelector('#user-list');
    list.replaceChildren();
    for (const user of users) {
      const button = document.createElement('button');
      button.className = 'chat-user';
      button.type = 'button';
      const avatar = document.createElement('span');
      avatar.className = 'user-avatar';
      avatar.textContent = user.username.slice(0, 1).toUpperCase();
      const name = document.createElement('span');
      name.textContent = user.username;
      button.append(avatar, name);
      button.addEventListener('click', () => showProfile(user));
      list.append(button);
    }
  }
  function addMessage(item) {
    const row = document.createElement('article');
    row.className = 'message';
    row.tabIndex = 0;
    const author = document.createElement('button');
    author.className = 'message-author';
    author.type = 'button';
    author.textContent = item.username;
    author.addEventListener('click', () => showProfile({ id: item.userId, username: item.username }));
    const time = document.createElement('time');
    time.dateTime = item.createdAt;
    time.textContent = new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const body = document.createElement('p');
    body.textContent = item.content;
    row.append(author, time, body);
    if (item.replyTo) {
      const context = document.createElement('div');
      context.className = 'reply-context';
      context.textContent = 'Replying to ' + item.replyTo.username + ': ' + item.replyTo.content;
      row.append(context);
    }
    if (item.userId === currentUser.id && item.readBy.length) {
      const receipt = document.createElement('span');
      receipt.className = 'receipt';
      receipt.textContent = 'Seen by ' + item.readBy.join(', ');
      row.append(receipt);
    }
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    const reply = document.createElement('button');
    reply.className = 'message-action';
    reply.type = 'button';
    reply.textContent = 'Reply';
    reply.title = 'Reply to message';
    reply.addEventListener('click', () => {
      replyTargetId = item.id;
      document.querySelector('#reply-user').textContent = item.username;
      document.querySelector('#reply-text').textContent = item.content;
      document.querySelector('#reply-composer').hidden = false;
      document.querySelector('#message-input').focus();
    });
    actions.append(reply);
    for (const emoji of ['👍', '❤️', '😂', '😮', '😢']) {
      const react = document.createElement('button');
      react.className = 'message-action';
      react.type = 'button';
      react.textContent = emoji;
      react.title = 'React with ' + emoji;
      react.setAttribute('aria-label', 'React with ' + emoji);
      react.addEventListener('click', () => toggleReaction(item.id, emoji));
      actions.append(react);
    }
    row.append(actions);
    if (item.reactions.length) {
      const reactions = document.createElement('div');
      reactions.className = 'reactions';
      for (const reaction of item.reactions) {
        const pill = document.createElement('button');
        pill.className = 'reaction-pill' + (reaction.reacted ? ' reacted' : '');
        pill.type = 'button';
        pill.textContent = reaction.emoji + ' ' + reaction.count;
        pill.setAttribute('aria-label', 'Toggle ' + reaction.emoji + ' reaction');
        pill.addEventListener('click', () => toggleReaction(item.id, reaction.emoji));
        reactions.append(pill);
      }
      row.append(reactions);
    }
    messages.append(row);
  }
  async function loadMessages() {
    try {
      const data = await api('/api/chat/messages?conversation=' + encodeURIComponent(currentConversation));
      const wasNearBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight < 70;
      messages.replaceChildren();
      data.messages.messages.forEach(addMessage);
      if (wasNearBottom) messages.scrollTop = messages.scrollHeight;
      chatNotice.textContent = '';
      if (data.messages.readChanged) loadMessages();
    } catch (error) {
      chatNotice.textContent = error.message;
    }
  }
  function openEventStream() {
    eventStream = new EventSource('/api/chat/events?conversation=' + encodeURIComponent(currentConversation));
    eventStream.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.conversation === currentConversation) loadMessages();
    });
    eventStream.addEventListener('typing', (event) => {
      const data = JSON.parse(event.data);
      typingIndicator.textContent = data.users.length ? data.users.join(', ') + (data.users.length === 1 ? ' is' : ' are') + ' typing...' : '';
    });
    eventStream.addEventListener('error', () => {
      typingIndicator.textContent = 'Reconnecting to chat...';
    });
  }
  async function toggleReaction(messageId, emoji) {
    try {
      await api('/api/chat/reactions', { method: 'POST', body: JSON.stringify({ conversation: currentConversation, messageId, emoji }) });
      loadMessages();
    } catch (error) {
      chatNotice.textContent = error.message;
    }
  }
  async function setTyping(active) {
    if (typingActive === active) return;
    typingActive = active;
    try {
      await api('/api/chat/typing', { method: 'POST', body: JSON.stringify({ conversation: currentConversation, typing: active }) });
    } catch {}
  }
  function showRoom(user) {
    currentUser = user;
    authPanel.hidden = true;
    roomPanel.hidden = false;
    document.querySelector('#room-user').textContent = user.username;
    api('/api/chat/users').then((data) => renderUsers(data.users)).catch((error) => { chatNotice.textContent = error.message; });
    selectConversation('general');
  }
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authNotice.textContent = 'Signing in...';
    const payload = { username: document.querySelector('#username').value, password: document.querySelector('#password').value };
    try {
      const data = await api(mode === 'register' ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
      showRoom(data.user);
    } catch (error) {
      authNotice.textContent = error.message;
    }
  });
  document.querySelector('#send-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.querySelector('#message-input');
    const content = input.value.trim();
    if (!content) return;
    clearTimeout(typingTimer);
    setTyping(false);
    try {
      await api('/api/chat/messages', { method: 'POST', body: JSON.stringify({ content, conversation: currentConversation, replyTo: replyTargetId }) });
      input.value = '';
      replyTargetId = null;
      document.querySelector('#reply-composer').hidden = true;
      await loadMessages();
    } catch (error) {
      chatNotice.textContent = error.message;
    }
  });
  document.querySelector('#sign-out').addEventListener('click', async () => {
    setTyping(false);
    if (eventStream) eventStream.close();
    clearTimeout(typingTimer);
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
    roomPanel.hidden = true;
    authPanel.hidden = false;
    authNotice.textContent = 'Signed out.';
    document.querySelector('#password').value = '';
  });
  document.querySelector('#general-channel').addEventListener('click', () => selectConversation('general'));
  document.querySelector('#cancel-reply').addEventListener('click', () => {
    replyTargetId = null;
    document.querySelector('#reply-composer').hidden = true;
  });
  document.querySelector('#message-input').addEventListener('input', (event) => {
    clearTimeout(typingTimer);
    if (event.target.value.trim()) {
      setTyping(true);
      typingTimer = setTimeout(() => setTyping(false), 3500);
    } else {
      setTyping(false);
    }
  });
  document.querySelector('#message-input').addEventListener('blur', () => {
    clearTimeout(typingTimer);
    setTyping(false);
  });
  document.querySelector('#profile-close').addEventListener('click', () => profileDialog.close());
  document.querySelector('#profile-message').addEventListener('click', () => {
    if (!selectedProfile || selectedProfile.id === currentUser.id) return;
    const user = selectedProfile;
    profileDialog.close();
    selectConversation('dm/' + user.id, user);
  });
  api('/api/auth/me').then((data) => showRoom(data.user)).catch(() => {});
`;

const settingsMarkup = `
  <section class="panel">
    <div class="setting-row"><div><h2>Color theme</h2><p>Choose a dark Crystal theme.</p></div><select id="theme-select" class="theme-select" aria-label="Color theme"><option value="obsidian">Obsidian</option><option value="ocean">Ocean</option><option value="forest">Forest</option><option value="plum">Plum</option></select></div>
    <div class="setting-row"><div><h2>Start-page background</h2><p>Choose an image up to 2 MB.</p></div><input id="background-upload" class="file-input" type="file" accept="image/png,image/jpeg,image/webp"></div>
    <div class="setting-row"><div><h2>Background image</h2><p>Remove your saved start-page picture.</p></div><button id="clear-background" class="secondary" type="button">Clear image</button></div>
    <label class="setting-row"><div><h2>Reduced motion</h2><p>Pause animated particles on the start page.</p></div><input id="reduced-motion" class="switch" type="checkbox"></label>
    <p id="settings-notice" class="notice" role="status"></p>
  </section>`;

const settingsScript = `
  const allowedThemes = ['obsidian', 'ocean', 'forest', 'plum'];
  const themeSelect = document.querySelector('#theme-select');
  const settingsNotice = document.querySelector('#settings-notice');
  const backgroundInput = document.querySelector('#background-upload');
  const savedTheme = localStorage.getItem('crystal-theme') || 'obsidian';
  themeSelect.value = allowedThemes.includes(savedTheme) ? savedTheme : 'obsidian';
  document.documentElement.dataset.theme = themeSelect.value;
  function applyAppearance(background) {
    const theme = themeSelect.value;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('crystal-theme', theme);
    parent.postMessage({ type: 'crystal:appearance', theme, background }, location.origin);
  }
  themeSelect.addEventListener('change', () => {
    applyAppearance(localStorage.getItem('crystal-background') || '');
    settingsNotice.textContent = 'Theme updated.';
  });
  backgroundInput.addEventListener('change', () => {
    const file = backgroundInput.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      settingsNotice.textContent = 'Choose a PNG, JPEG, or WebP image smaller than 2 MB.';
      backgroundInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const background = String(reader.result);
      localStorage.setItem('crystal-background', background);
      applyAppearance(background);
      settingsNotice.textContent = 'Start-page background updated.';
    });
    reader.addEventListener('error', () => { settingsNotice.textContent = 'Unable to read that image.'; });
    reader.readAsDataURL(file);
  });
  document.querySelector('#clear-background').addEventListener('click', () => {
    localStorage.removeItem('crystal-background');
    applyAppearance('');
    backgroundInput.value = '';
    settingsNotice.textContent = 'Start-page background cleared.';
  });
  const motionToggle = document.querySelector('#reduced-motion');
  motionToggle.checked = localStorage.getItem('crystal-reduced-motion') === '1';
  motionToggle.addEventListener('change', () => {
    localStorage.setItem('crystal-reduced-motion', motionToggle.checked ? '1' : '0');
    parent.postMessage({ type: 'crystal:motion' }, location.origin);
  });
`;

const appsMarkup = `<section class="grid">${apps.map((app) => `<button class="card" type="button" data-url="${app.url}"><img class="app-icon" src="${iconUrl(app.icon)}" alt=""><strong>${app.name}</strong></button>`).join('')}</section>`;
const appsScript = `
  document.querySelectorAll('[data-url]').forEach((button) => button.addEventListener('click', () => {
    parent.postMessage({ type: 'crystal:navigate', url: button.dataset.url }, location.origin);
  }));
`;

const gamesMarkup = `<section class="panel"><div id="games"></div></section><div class="game-tools"><h2>More games</h2></div><input id="game-search" class="game-search" type="search" autocomplete="off" placeholder="Search games" aria-label="Search games"><p id="games-status" class="notice" role="status">Loading games catalogue...</p><section id="games-grid" class="grid"></section><script src="https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js"></script>`;
const gamesScript = `
  const grid = document.querySelector('#games-grid');
  const status = document.querySelector('#games-status');
  const search = document.querySelector('#game-search');
  try {
    if (window.Lumin && typeof window.Lumin.init === 'function') {
      window.Lumin.init({ container: '#games', theme: 'dark' });
    } else {
      status.textContent = 'Lumin games could not load. The searchable catalogue is still available below.';
    }
  } catch {
    status.textContent = 'Lumin games could not start. The searchable catalogue is still available below.';
  }
  let games = [];
  function renderGames() {
    const query = search.value.trim().toLowerCase();
    const results = games.filter((game) => game.name.toLowerCase().includes(query));
    grid.replaceChildren();
    status.textContent = query ? results.length + ' matching games' : games.length + ' games, including ' + games.filter((game) => game.source === 'Seraph').length + ' from Seraph';
    if (!results.length) status.textContent = 'No games match that search.';
    for (const game of results) {
      const card = document.createElement('button');
      card.className = 'card game-card';
      card.type = 'button';
      card.setAttribute('aria-label', 'Play ' + game.name);
      const placeholder = document.createElement('span');
      placeholder.className = 'game-placeholder';
      placeholder.textContent = game.name.slice(0, 1).toUpperCase();
      card.append(placeholder);
      if (game.image) {
        const cover = document.createElement('img');
        cover.className = 'game-cover';
        cover.src = game.image;
        cover.alt = '';
        cover.loading = 'lazy';
        cover.addEventListener('load', () => { placeholder.hidden = true; });
        cover.addEventListener('error', () => cover.remove());
        card.append(cover);
      }
      const name = document.createElement('strong');
      name.textContent = game.name;
      card.append(name);
      card.addEventListener('click', () => parent.postMessage({ type: 'crystal:open-game', id: game.id }, location.origin));
      grid.append(card);
    }
  }
  search.addEventListener('input', renderGames);
  fetch('/api/games').then(async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Games catalogue is unavailable.');
    games = data.games;
    renderGames();
  }).catch((error) => { status.textContent = error.message; });
`;

function gameDocument(id) {
  const body = `<div class="game-tools"><button id="back-to-games" class="secondary" type="button">Back to Games</button><span id="game-name" class="muted">Loading game...</span></div><section class="panel"><p>This game opens in the current browser tab.</p><button id="launch-game" class="primary" type="button">Play game</button></section>`;
  const script = `
    document.querySelector('#back-to-games').addEventListener('click', () => parent.postMessage({ type: 'crystal:navigate', url: 'crystal://games' }, location.origin));
    fetch('/api/games').then((response) => response.json()).then((data) => {
      const game = data.games.find((item) => item.id === ${id});
      if (game) document.querySelector('#game-name').textContent = game.name;
    }).catch(() => { document.querySelector('#game-name').textContent = 'Game unavailable'; });
    document.querySelector('#launch-game').addEventListener('click', () => parent.postMessage({ type: 'crystal:open-game', id: ${id} }, location.origin));
  `;
  return appDocument('Games', 'Selected game', body, script);
}

function internalDocumentFor(url) {
  const route = url.slice('crystal://'.length).replace(/\/$/, '');
  if (route === 'chat') return appDocument('Chat', 'Sign in or create an account to join #general.', chatMarkup + profileMarkup, chatScript);
  if (route === 'settings') return appDocument('Settings', 'Personalize your Crystal session.', settingsMarkup, settingsScript);
  if (route === 'apps') return appDocument('Apps', 'Popular sites, opened in the current browser tab.', appsMarkup, appsScript);
  if (route === 'games') return appDocument('Games', 'A curated catalogue from Interstellar. Selected games open in a sandboxed frame.', gamesMarkup, gamesScript);
  const gameMatch = /^game\/(\d+)$/.exec(route);
  if (gameMatch) return gameDocument(Number(gameMatch[1]));
  return appDocument('Not found', 'This Crystal app route does not exist.', '<section class="panel"><p>Unknown internal app.</p></section>');
}

window.renderCrystalPage = internalDocumentFor;