import { useMyCharacters } from '@/util/apiClient';
import MyCharacterCard from "@/app/_components/MyCharacterCard";
import {Card, CardBody} from "@nextui-org/react";
import Link from "next/link";
import {BsPlusLg} from "react-icons/bs";

export default function MyTab({ isDisplay }) {
  const { characters } = useMyCharacters();
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section
      className={`flex flex-row flex-wrap justify-center mt-10 gap-5 ${display}`}
    >
      <Card className='md:basis-52'>
        <CardBody className='flex justify-center'>
          <Link href='/create'>
            <BsPlusLg className='w-7 h-7 block my-2.5 mx-auto fill-real-silver-500' />
            <p className='text-xs leading-5 text-center text-real-silver-500 font-light'>
              Create a character
            </p>
          </Link>
        </CardBody>
      </Card>
      {characters?.map(character => {
            return character.source === 'community' && character.is_author ? (
                <MyCharacterCard
                    character={character}
                    playingId={''}
                    handlePlay={()=>{}}
                />
            ) : null;
          }
      )}
    </section>
  );
}
