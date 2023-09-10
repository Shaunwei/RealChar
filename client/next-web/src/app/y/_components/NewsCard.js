'use client';

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Image,
} from '@nextui-org/react';

import Link from 'next/link';

import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';

export default function NewsCard() {
  const { news, getNews } = useAppStore();

  useEffect(() => {
    getNews();
  }, []);

  return (
    <Card className="bg-real-dark-trending/50">
      <CardHeader className="font-semibold text-lg px-4">
        What's happening
      </CardHeader>
      <Divider/>
      <CardBody className="p-0">
        <ul className="">
        {news.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="grid grid-cols-4 px-4 py-2.5 hover:bg-real-dark-trending/40">
              <section className="text-sm col-span-3">
                <header className="text-real-dark-6">{item.topic}&nbsp;·&nbsp;{item.pubtime}</header>
                <p className="font-semibold">{item.title}</p>
                <footer className="text-real-dark-6">Trending with <span className="text-real-blue-300">#{item.trendingTag}</span></footer>
              </section>
              <aside>
                <Image alt="thumbnail" src={item.thumbnail}/>
              </aside>
            </Link>
          </li>
        ))}
        </ul>
      </CardBody>
      <CardFooter className="p-4 text-sm font-medium text-real-blue-300">
        <Link href="/y">show more</Link>
      </CardFooter>
    </Card>
  );
}
