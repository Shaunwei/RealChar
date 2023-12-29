const host = process.env.API_HOST;

export async function getCharacters() {
  try {
    const res = await fetch(`${host}/characters`, { next: { revalidate: 5 } });
    const characters = await res.json();
    console.log('getCharacters: got ' + characters.length + ' characters');
    return characters;
  } catch (err) {
    console.log('getCharacters - Error: ' + err);
    return [];
  }
}
