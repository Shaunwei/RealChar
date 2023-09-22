import useSWR from 'swr';
import { getApiServerUrl } from './urlUtil';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export function useMyCharacters() {
  const { data, error, isLoading } = useSWR(`${getApiServerUrl()}/characters`, fetcher);
  
  if (error) {
    console.log('error');
    return;
  }
  return {
    characters: data,
    isLoading
  }
}
