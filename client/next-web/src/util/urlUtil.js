import {isIP} from 'is-ip';

function getProtocolAndHost(url) {
  const urlRegex = /^(https?:)\/\/([^:/]+)(:\d+)?/;
  const match = url?.match(urlRegex);
  if (!match) {
    return '';
  }
  const protocol = match[1];
  const host = match[2];
  return [protocol, host];
}

export function getApiServerUrl(url) {
  const [protocol, host] = getProtocolAndHost(url)
  return `${protocol}//${getServerUrl(protocol, host)}`;
}


export function getWsServerUrl(url) {
  const [protocol, host] = getProtocolAndHost(url);
  const ws_scheme = protocol === 'https:' ? 'wss' : 'ws';
  return `${ws_scheme}://${getServerUrl(protocol, host)}`;
}

export function getServerUrl(protocol, host) {
    const parts = host.split(':');
    let hostname = parts[0];
    // Local deployment uses 8000 port by default.
    let newPort = '8000';

    if (!(hostname === 'localhost' || isIP(hostname))) {
      // Remove www. from hostname
      hostname = hostname.replace('www.', '');
      hostname = 'api.' + hostname;
      newPort = protocol === 'https:' ? 443 : 80;
    }
  return hostname + ':' + newPort;
}
