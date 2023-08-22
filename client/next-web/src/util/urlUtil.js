import { isIP } from 'is-ip';

export function getApiServerUrl(url) {
  const urlRegex = /^(https?:)\/\/([^:/]+)(:\d+)?/;
  const match = url?.match(urlRegex);
  if (!match) {
    return '';
  }
  const protocol = match[1];
  const host = match[2];

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
