import Chat from './Chat';
import { Avatar } from '@nextui-org/avatar';

export default function HandsFreeMode({
  isDisplay,
  character,
  chatContent
}) {
  const display = isDisplay ? 'flex' : 'hidden';
  return (
    <section className={`flex flex-col gap-6 justify-center ${display}`}>
      <Avatar
        name={character.name}
        src={character.image_url}
        classNames={{
          img: "w-80"
        }}
      />
      <p>{character.name}</p>
      <Chat chatContent='chat content here' />
    </section>
  );
}
