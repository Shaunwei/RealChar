import { isIP } from 'is-ip';
import { headers as getNextHeaders } from 'next/headers';

export function parseUrl(url) {
  const urlRegex = /^(https?:)\/\/([^:/]+)(:\d+)?/;
  const match = url.match(urlRegex);
  if (!match) {
    return '';
  }
  const protocol = match[1];
  const host = match[2];
  return { protocol, host };
}

export function getBaseUrl() {
  // This is the way to get headers in App Router SSR.
  const headers = getNextHeaders();
  // e.g. 'http://localhost:3000/'
  const referer = headers.get('referer', '');
  const { protocol, host } = parseUrl(referer);

  // Local deployment uses 8000 port by default.
  let newPort = '8000';
  let newHost = host === 'localhost' ? '127.0.0.1' : host;

  if (!(newHost === 'localhost' || isIP(newHost))) {
    // Remove www. from hostname
    newHost = newHost.replace('www.', '');
    newHost = 'api.' + newHost;
    newPort = protocol === 'https:' ? 443 : 80;
  }
  return `${protocol}//${newHost}:${newPort}`;
}

export async function getDefaultCharacters() {
  const res = await fetch(`${getBaseUrl()}/characters`);
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }
  return res.json();
}
