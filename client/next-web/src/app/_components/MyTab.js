import { Card, CardBody, CardFooter } from '@nextui-org/card';
import { BsPlusLg } from 'react-icons/bs';
import { Avatar } from '@nextui-org/avatar';
import Image from 'next/image';
import audioSvg from '@/assets/svgs/audio.svg';
import Link from 'next/link';

import { useMyCharacters } from '@/util/apiClient';

export default function MyTab({ isDisplay }) {
  const { characters } = useMyCharacters();
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section
      className={`flex flex-row flex-wrap justify-center mt-10 gap-5 ${display}`}
    >
      <Card className='hidden md:flex md:basis-52'>
        <CardBody className='flex justify-center'>
          <Link href='/'>
            <BsPlusLg className='w-7 h-7 block my-2.5 mx-auto fill-real-silver-500' />
            <p className='text-xs leading-5 text-center text-real-silver-500 font-light'>
              Create a character
            </p>
          </Link>
        </CardBody>
      </Card>
      {characters?.map(character => (
        <Card
          key={character.character_id}
          className='md:basis-52 p-2.5'
        >
          <CardBody className="p-0 text-center flex-row md:flex-col">
            <Avatar
              radius="sm"
              src={character.image_url}
              className="w-20 h-20 md:w-44 md:h-44 mx-auto mt-2"
            />
            <div className="ml-4 md:ml-0">
              <p className="name text-base text-center mt-2 font-medium">{character.name}</p>
              <p className="intro text-xs text-center mt-2 font-light">
                &quot;I am burdened with glorious purpose.&quot;
              </p>
              <div className='flex justify-center mt-4'>
                <Image priority src={audioSvg} alt='' />
              </div>
            </div>
          </CardBody>
          <CardFooter className="pt-4 mt-4 pb-2 border-t-2 border-real-silver-500/30 justify-center">
            <Link href='/' className='text-xs leading-5 text-real-silver-500'>
              View detail
            </Link>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
}
