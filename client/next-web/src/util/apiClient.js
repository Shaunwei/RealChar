import useSWR from 'swr';
import { getApiServerUrl } from './urlUtil';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export function useMyCharacters() {
  // TODO
  const origin = window.location.origin;
  const { data, error, isLoading } = useSWR(`${getApiServerUrl(origin)}/characters`, fetcher);
  
  if (error) {
    console.log('error');
    return;
  }
  return {
    characters: data,
    isLoading
  }
}
