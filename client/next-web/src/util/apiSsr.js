const host = process.env.API_HOST;

export async function getCharacters() {
  if (!host) {
    // skip fetching during build
    return [];
  }

  const res = await fetch(`${host}/characters`, { next: { revalidate: 5 } });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data');
  }
  return res.json();
}
