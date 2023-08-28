import { getApiServerUrl } from './urlUtil';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then(res => res.json());

function getBaseUrl() {
  const referer = window.location.origin;
  return getApiServerUrl(referer);
}

export function useMyCharacters() {
  // TODO
  const { data, error, isLoading } = useSWR(`${getBaseUrl()}/characters`, fetcher);
  
  if (error) {
    console.log('error');
    return;
  }
  return {
    characters: data,
    isLoading
  }
}
