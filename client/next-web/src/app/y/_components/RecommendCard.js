'use client';

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  User,
  Button,
} from '@nextui-org/react';
import Link from 'next/link';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function NewsCard() {
  const { recommends, getRecommends, handleFollow } = useAppStore();

  useEffect(() => {
    getRecommends();
  }, []);

  return (
    <Card className="bg-real-dark-trending/50">
      <CardHeader className="font-semibold text-lg px-4">
        Who to follow
      </CardHeader>
      <Divider/>
      <CardBody className="p-4">
        <ul className="flex flex-col gap-5">
        {recommends.map((user) => (
          <li key={user.userId} className="flex flex-row justify-between">
            <User
              name={user.username}
              description={user.description}
              avatarProps={{
                src: user.photoURL,
                className: "w-12 h-12"
              }}
              classNames={{
                name: "font-semibold text-base",
                description: "text-base text-real-dark-6"
              }}
            />
            <Button
              variant="bordered"
              className="border-real-blue-300 text-real-blue-300 h-8 w-20 font-semibold"
              onPress={() => handleFollow(user)}
            >Follow</Button>
          </li>
        ))}
        </ul>
      </CardBody>
      <CardFooter className="p-4 text-sm font-semibold text-real-blue-300">
        <Link href="/y">show more</Link>
      </CardFooter>
    </Card>
  );
}
