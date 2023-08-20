import { getHostName } from '../utils/urlUtils';

const scheme = window.location.protocol;
const fileUrlMap = new Map();

async function uploadfile(file, accessToken) {
  if (fileUrlMap.has(file)) {
    console.log('Cache has file ' + file.name);
    return fileUrlMap.get(file);
  }
  const url = scheme + '//' + getHostName() + '/uploadfile';
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

async function createCharacter(characterRequest, accessToken) {
  const url = scheme + '//' + getHostName() + '/create_character';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(characterRequest),
  });

  if (response.ok) {
    const jsonResponse = await response.json();
    return jsonResponse;
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

async function deleteCharacter(character_id, accessToken) {
  const url = scheme + '//' + getHostName() + '/delete_character';
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
    const jsonResponse = await response.json();
    return jsonResponse;
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

async function generateSystemPrompt(name, background, accessToken) {
  const url = scheme + '//' + getHostName() + '/system_prompt';
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
    const jsonResponse = await response.json();
    return jsonResponse;
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

async function cloneVoice(files, accessToken) {
  // Check if all files are uploaded
  for (const file of files) {
    if (!fileUrlMap.has(file)) {
      uploadfile(file, accessToken);
    }
  }

  const url = scheme + '//' + getHostName() + '/clone_voice';
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
    const jsonResponse = await response.json();
    return jsonResponse;
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

export {
  uploadfile,
  createCharacter,
  deleteCharacter,
  generateSystemPrompt,
  cloneVoice,
};
