const host = process.env.API_HOST;

export async function getDefaultCharacters() {
  const res = await fetch(`${host}/characters`);
 
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }
  return res.json();
}
