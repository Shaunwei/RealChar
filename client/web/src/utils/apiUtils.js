import { getHostName } from '../utils/urlUtils';

const scheme = window.location.protocol;

async function uploadfile(file, accessToken) {
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

export { uploadfile, createCharacter };
