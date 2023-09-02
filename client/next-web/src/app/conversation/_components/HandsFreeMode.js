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
      <div>  
        <Avatar
          name={character.name}
          src={character.image_url}
          classNames={{
            base: "block w-80 h-80 mx-auto"
          }}
        />
        <p className="text-center font-medium text-3xl mt-4">{character.name}</p>
      </div>
      <Chat chatContent={chatContent} />
      <div className="font-light text-lg text-center my-10">
        Start your conversation by talking to Steve Jobs
      </div>
    </section>
  );
}
