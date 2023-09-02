import { useAuthContext } from '@/context/AuthContext';
import { Avatar } from '@nextui-org/avatar';

export default function ChatPreview({
  character,
  chatContent
}) {
  const {user} = useAuthContext();

  return (
    <ul className="border-2 border-real-navy/30 rounded-2xl bg-white/10">
      <li className="p-6 font-normal border-b-2 border-real-navy/30">Chat with {character.name}</li>
      {
        chatContent.map((line) => (
          <li
            key={line.timeStamp}
            className="flex flex-row p-6 gap-4 text-lg odd:bg-real-navy/10"
          >
            {line.from === 'character' && (
              <Avatar
                src={character.image_url}
                size="sm"
                radius="sm"
                classNames={{base: 'shrink-0'}}
              />
            )}
            {line.from === 'user' && (
              <Avatar
                src={user.photoURL}
                size="sm"
                radius="sm"
                classNames={{base: 'shrink-0'}}
              />
            )}
            <span>{line.content}</span>
          </li>
        ))
      }
    </ul>
  );
}