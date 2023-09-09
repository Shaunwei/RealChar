import React from 'react';
import { Avatar } from './ui/avatar';
import { AvatarFallback } from '@radix-ui/react-avatar';

const UserAvatar = ({ user }) => {
  return (
    <Avatar>
      {user.image ? (
        <div className='relative w-full h-full aspect-square'>
          <img
            src={user.image}
            alt='profile image'
            referrerPolicy='no-referrer'
          />
        </div>
      ) : (
        <AvatarFallback>
          <span className='sr-only'>{user?.name}</span>
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default UserAvatar;
