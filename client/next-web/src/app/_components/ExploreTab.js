import {
  Card,
  CardBody
} from '@nextui-org/card';
import { Avatar } from '@nextui-org/avatar';
import Image from 'next/image';
import audioSvg from '@/assets/svgs/audio.svg';

export default function ExploreTab({ characters, display }) {
  return (
    <section className={`flex flex-row flex-wrap justify-center mt-10 gap-5 ${display}`}>
      {
        characters.map(character => (
          <Card
            key={character.character_id}
            className="basis-48 p-2.5">
            <CardBody className="p-0">
              <Avatar
                radius="sm"
                src={character.image_url}
                className="w-44 h-44"
              />
              <p className="name text-base text-center mt-2 font-medium">{character.name}</p>
              <p className="intro text-xs text-center mt-2 font-light">"I am burdened with glorious purpose."</p>
              <div className="flex justify-center mt-4">
                <Image
                  priority
                  src={audioSvg}
                  alt=""
                />
              </div>
            </CardBody>
          </Card>
        ))
      }
    </section>
  );
}
