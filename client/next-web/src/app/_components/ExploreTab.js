import { Card, CardBody, CardFooter } from '@nextui-org/card';
import { Avatar } from '@nextui-org/avatar';
import { Button } from '@nextui-org/button';
import Image from 'next/image';
import audioSvg from '@/assets/svgs/audio.svg';
import { useRouter } from 'next/navigation';
import lz from 'lz-string';

export default function ExploreTab({ characters, isDisplay }) {
  const display = isDisplay ? 'flex' : 'hidden';
  const router = useRouter();

  return (
    <section className={`flex flex-row flex-wrap justify-center mt-10 gap-5 ${display}`}>
      {
        characters?.map(character => (
          <Card
            key={character.character_id}
            className="basis-52 p-2.5">
            <CardBody className="p-0 text-center">
              <Avatar
                radius="sm"
                src={character.image_url}
                className="w-full h-full"
              />
              <p className="name text-base text-center mt-2 font-medium">{character.name}</p>
              <p className="intro text-xs text-center mt-2 font-light">
                &quot;I am burdened with glorious purpose.&quot;
              </p>
              <div className="flex justify-center mt-4">
                <Image
                  priority
                  src={audioSvg}
                  alt=""
                />
              </div>
            </CardBody>
            <CardFooter>
              <Button
                className="w-full font-light"
                onPress={() => {
                  const compressedCharacter = lz.compressToEncodedURIComponent(
                    JSON.stringify(character)
                  );
                  router.push(`/conversation?character=${compressedCharacter}`);
                }}
              >Chat with me</Button>
            </CardFooter>
          </Card>
        ))
      }
    </section>
  );
}
