export const proxyAllowedHosts = Object.freeze([
  'google.com',
  'gstatic.com',
  'googleapis.com',
  'googleusercontent.com',
  'googlevideo.com',
  'ytimg.com',
  'youtube.com',
  'youtube-nocookie.com',
  'github.com',
  'githubassets.com',
  'githubusercontent.com',
  'github.io',
  'wikipedia.org',
  'wikimedia.org',
  'wikimediafoundation.org',
  'reddit.com',
  'redd.it',
  'redditmedia.com',
  'redditstatic.com',
  'discord.com',
  'discord.gg',
  'discordapp.com',
  'discordapp.net',
  'discordcdn.com',
  'twitch.tv',
  'twitchcdn.net',
  'ttvnw.net',
  'spotify.com',
  'scdn.co',
  'spotifycdn.com',
  'netflix.com',
  'nflxvideo.net',
  'nflximg.net',
  'pinterest.com',
  'pinimg.com',
  'tiktok.com',
  'tiktokcdn.com',
  'tiktokv.com',
  'stackoverflow.com',
  'stackexchange.com',
  'sstatic.net',
  'gravatar.com'
]);

export const proxyHostnamePatterns = proxyAllowedHosts.map((host) =>
  new RegExp(`(^|\\.)${host.replaceAll('.', '\\.')}\$`, 'i')
);

export function isProxyAllowedHost(hostname) {
  const normalized = String(hostname).toLowerCase().replace(/\.$/, '');
  return proxyAllowedHosts.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}