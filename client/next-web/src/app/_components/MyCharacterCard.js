import {
  Card,
  CardBody,
  CardFooter,
  Avatar,
  Button,
  Link
} from '@nextui-org/react';
import NextLink from 'next/link';
import { BiEdit } from 'react-icons/bi';
import { useRouter } from 'next/navigation';
import lz from 'lz-string';

export default function CharacterCard({
  character
}) {
  const router = useRouter();

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
            <Link
              href={{
                pathname: '/edit',
                query: {character: lz.compressToEncodedURIComponent(JSON.stringify(character))}
              }}
              as={NextLink}
              underline="hover"
              className="text-real-blue-500">
              <BiEdit size="1.2em" className="mr-1"/>
              Edit details
            </Link>
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
