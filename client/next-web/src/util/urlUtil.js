import { isIP } from 'is-ip';

const apiHost = process.env.NEXT_PUBLIC_API_HOST;

function getProtocolAndHost() {
  const urlRegex = /^(https?:)\/\/([^:/]+)(:\d+)?/;
  const match = apiHost?.match(urlRegex);
  if (!match) {
    return '';
  }
  const protocol = match[1];
  const host = match[2];
  return [protocol, host];
}

export function getApiServerUrl() {
  return apiHost;
}

export function getWsServerUrl(url) {
  const [protocol, host] = getProtocolAndHost(url);
  const ws_scheme = protocol === 'https:' ? 'wss' : 'ws';
  return `${ws_scheme}://${host}`;
}
