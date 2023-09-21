import CharacterCard from './CharacterCard';

export default function ExploreTab({ characters, isDisplay }) {
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section className={`flex flex-row flex-wrap justify-center mt-10 gap-5 ${display}`}>
      {
        characters?.map(character => (
          <div
            key={character.character_id}
            className="basis-72 md:basis-52"
          >
            <CharacterCard character={character}/>
          </div>
        ))
      }
    </section>
  );
}
