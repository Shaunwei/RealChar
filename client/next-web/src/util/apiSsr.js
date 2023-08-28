import { headers } from 'next/headers';
import { getApiServerUrl } from './urlUtil';

export function getBaseUrl() {
  // e.g. 'http://localhost:3000/'
  const referer = headers().get('referer', '');
  return getApiServerUrl(referer);
}

export async function getDefaultCharacters() {
  const res = await fetch(`${getBaseUrl()}/characters`);
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }
  return res.json();
}
