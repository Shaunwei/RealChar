import {
  Avatar,
  Button,
} from '@nextui-org/react';
import Link from 'next/link';
import Image from 'next/image';
import commentSVG from '@/assets/svgs/comment.svg';
import likeSVG from '@/assets/svgs/like.svg';

import { useState } from 'react';

export default function Post({
  post
}) {
  const [ open, setOpen ] = useState(false);

  return (
    <section className="flex flex-row py-2 px-4 gap-2.5">
      <aside>
        <Avatar src={post.photoURL} alt="avatar" className="w-12 h-12"/>
      </aside>
      <article>
        <header className="font-semibold">{post.username}&nbsp;·&nbsp;<span className="font-normal text-real-dark-6">{post.pubtime}</span></header>
        <p>{post.content.text}</p>
        <div className="my-2.5 border-2 border-divider rounded-2xl overflow-hidden">
          <img src={post.content.photosURL[0]} alt="photo"/>
        </div>
        <div className="flex flex-row gap-16">
          <Button
            radius="full"
            onPress={() => setOpen(!open)}
            variant="light"
            className="px-2"
          >
            <Image src={commentSVG} alt="comments"/><span className="ml-2">{post.comments?.length}</span>
          </Button>
          <Button
            radius="full"
            variant="light"
            className="px-2"
          >
            <Image src={likeSVG} alt="like"/><span className="ml-2">{post.liked}</span>
          </Button>
        </div>
        <ul className={`my-2 py-2 rounded-small bg-real-dark-trending/50 ${open ? 'flex' : 'hidden'}`}>
        {post.comments.map(comment => (
          <li key={comment.pubtime} className="flex flex-row gap-2 text-sm w-full px-2">
            <Avatar src={comment.photoURL} alt="user avatar"/>
            <div className="grow">
              <div className="flex flex-row justify-between">
                <Link href="/y" className="font-medium">{comment.username}</Link>
                <span className="text-real-dark-6">{comment.pubtime}</span>
              </div>
              <p>{comment.comment}</p>
            </div>
          </li>
        ))}
        </ul>
      </article>
    </section>
  );
}
