`use client`

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

import { useState, useRef } from 'react';

export default function CharacterCard({
  character
}) {
  const router = useRouter();
  const [ isPlaying, setIsPlaying ] = useState(false);
  const audioRef = useRef(null);

  function handlePlay() {
    let playPromise;
    if (!isPlaying) {
      //play
      playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => {
          setIsPlaying(true);
        })
        .catch(error => {
          setIsPlaying(false);
        })
      }
    } else {
      audioRef.current.load();
    }

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
            <audio ref={audioRef} src={character.audio_url} preload="none">
              Your browser does not support the audio tag.
            </audio>
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
              className="opacity-70 absolute"
              onPress={handlePlay}
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
          className="w-full font-light bg-default/40"
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
