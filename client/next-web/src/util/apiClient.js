import useSWR from 'swr';
import {getApiServerUrl} from './urlUtil';
import {useAppStore} from "@/lib/store";

const fileUrlMap= new Map();
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
    console.log(data);

    if (error) {
        console.log('error');
        return;
    }
    return {
        characters: data,
        isLoading
    }
}

export async function generateSystemPrompt(name, background, accessToken) {
    const url = getApiServerUrl() + '/system_prompt';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            name: name,
            background: background,
        }),
    });

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export async function createCharacter(characterRequest, accessToken) {
    const url = getApiServerUrl() + '/create_character';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(characterRequest),
    });

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export async function deleteCharacter(character_id, accessToken) {
    const url = getApiServerUrl() + '/delete_character';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            character_id: character_id,
        }),
    });

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export async function uploadFile(file, accessToken) {
    if (fileUrlMap.has(file)) {
        console.log('Cache has file ' + file.name);
        return fileUrlMap.get(file);
    }
    const url = getApiServerUrl() + '/uploadfile';
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
    });

    if (response.ok) {
        const jsonResponse = await response.json();
        fileUrlMap.set(file, jsonResponse);
        return jsonResponse;
    } else {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export async function cloneVoice(files, accessToken) {
    // Check if all files are uploaded
    for (const file of files) {
        if (!fileUrlMap.has(file)) {
            await uploadFile(file, accessToken);
        }
    }
    const url = getApiServerUrl() + '/clone_voice';
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file);
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
    });

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export async function getCharacter(character_id, accessToken) {
    const url = getApiServerUrl() + '/get_character?character_id=' + character_id;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
    if (response.ok) {
        return await response.json();
    }
    throw new Error(response.toString());
}
