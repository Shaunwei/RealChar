'use client';

import { Divider } from '@nextui-org/react';
import Post from './Post';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function Posts() {
  const { posts, getPosts } = useAppStore();

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <ul className="mt-2.5">
    {posts.map((post) => (
      <li key={post.id}>
        <Divider />
        <Post post={post}/>
      </li>
    ))}
    </ul>
  );
}
