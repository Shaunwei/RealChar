import { Link } from '@nextui-org/link';
import { Card, CardBody } from '@nextui-org/card'; 
import { Avatar } from '@nextui-org/avatar';
import Image from 'next/image';
import audioImg from '../assets/svgs/audio.svg';

import { getDefaultCharacters } from '../util/apiSsr';

export default async function Page() {
  const characterGroup = await getDefaultCharacters();

  const tabClassName = 'w-48 font-medium text-lg justify-center rounded-xl py-4 text-foreground';

  return (
      <>
        <h1 className="text-center font-light text-3xl pt-10">Real-time communication with your AI character assistant</h1>
        <div className="flex justify-center mt-10 gap-5">
          <Link
            isBlock
            href="/"
            className={`${tabClassName} bg-tab`}>
            Explore
          </Link>
          <Link
            isBlock
            href="/"
            className={`${tabClassName} bg-transparent pointer-events-none`}>
            My Characters
          </Link>
        </div>
        <section className="flex flex-row flex-wrap justify-center mt-10">
          {
            characterGroup.map(character => (
              <Card
                key={character.character_id}
                className="basis-48 mr-5 mb-5 p-2.5">
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
                      src={audioImg}
                      alt=""
                    />
                  </div>
                </CardBody>
              </Card>
            ))
          }
        </section>
      </>
  )
}
