export async function getDefaultCharacters() {
  const res = await fetch('http://127.0.0.1:8000/characters');
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }
  return res.json();
}