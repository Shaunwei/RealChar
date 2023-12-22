const host = process.env.API_HOST;

export async function getCharacters() {
  const res = await fetch(`${host}/characters`, { next: { revalidate: 30 } });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data');
  }
  return res.json();
}
