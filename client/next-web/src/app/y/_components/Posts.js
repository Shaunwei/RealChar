'use client';
import Post from './Post';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function Posts() {
  const { posts, getPosts } = useAppStore();

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <ul>
    {posts.map((post) => (
      <li key={post.id}>
        <Post post={post}/>
      </li>
    ))}
    </ul>
  );
}
