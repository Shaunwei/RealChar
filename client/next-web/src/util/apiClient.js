import useSWR from 'swr';
import {getApiServerUrl} from './urlUtil';
import {useAppStore} from "@/lib/store";

const fetcher = ([url, token]) => {
    let headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = "Bearer " + token;
    }
    return fetch(url, {
        method: 'GET',
        headers: headers
    }).then(res => {
        return res.json();
    });
}

export function useMyCharacters() {
    const {token} = useAppStore();
    const {isLoading, error, data} = useSWR([`${getApiServerUrl()}/characters`, token], fetcher);

    if (error) {
        console.log('error');
        return;
    }
    return {
        characters: data,
        isLoading
    }
}
