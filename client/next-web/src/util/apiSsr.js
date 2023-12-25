const host = process.env.API_HOST;

export async function getCharacters() {
  try {
    const res = await fetch(`${host}/characters`, { next: { revalidate: 5 } });
    return await res.json();
  } catch (err) {
    console.log(err);
    return [];
  }

}
