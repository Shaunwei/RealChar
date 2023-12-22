import {
  Card,
  CardBody,
  CardFooter,
  Avatar,
  Button
} from '@nextui-org/react';
import { FaPlay, FaStop } from 'react-icons/fa';
import Image from 'next/image';
import audioSvg from '@/assets/svgs/audio.svg';
import { useRouter } from 'next/navigation';
import lz from 'lz-string';

export default function CharacterCard({
  character,
  playingId,
  handlePlay
}) {
  const router = useRouter();
  const isPlaying = playingId == character.character_id;

  function handlePress() {
    return handlePlay(character.character_id, character.audio_url);
  }

  return (
    <Card className="p-2.5">
      <CardBody className="p-0 text-center flex-row gap-2 md:flex-col">
        <Avatar
          radius="sm"
          src={character.image_url}
          className="w-20 h-20 md:w-44 md:h-44 md:mx-auto mt-2"
        />
        <div className="grow md:ml-0">
          <p className="name text-base text-center h-12 flex flex-row justify-center items-center"><span>{character.name}</span></p>
          <div className="flex justify-center mt-1 relative h-10">
            <Image
              src={audioSvg}
              alt=""
              className="w-auto"
            />
            <Button
              isIconOnly
              variant="bordered"
              radius="full"
              color="white"
              className="opacity-70 absolute hover:opacity-80 hover:scale-105 hover:-translate-y-0.5 transform transition-transform"
              onPress={handlePress}
            >
            {!isPlaying ? (
              <FaPlay/>
            ) : (
              <FaStop/>
            )}
            </Button>
          </div>
        </div>
      </CardBody>
      <CardFooter className="mt-5">
        <Button
          className="w-full font-light bg-default/40 hover:opacity-80"
          onPress={() => {
            const compressedCharacter = lz.compressToEncodedURIComponent(
              JSON.stringify(character)
            );
            router.push(`/conversation?character=${compressedCharacter}`);
          }}
        >Chat with me</Button>
      </CardFooter>
    </Card>
  );
}
