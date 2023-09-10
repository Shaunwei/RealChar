/**
 * src/components/Auth/SignOut.jsx
 * sign out
 *
 * created by Lynchee on 7/20/23
 */

import React from 'react';
import auth from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import UserAvatar from '../UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const SignOut = ({ isLoggedIn, user, handleDisconnect }) => {
  const navigate = useNavigate();
  const signout = async () => {
    signOut(auth)
      .then(() => {
        console.log('Sign-out successful.');
        isLoggedIn.current = false;
      })
      .catch(error => {
        console.log(`Sign-out failed: ${error.message}`);
      });

    handleDisconnect();
  };

  const handleSignout = async () => {
    await signout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar
          className='w-10 h-10'
          user={{
            name: user.displayName || null,
            image: user.photoURL || null,
          }}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        <div className='flex items-center justify-start gap-2 p-2'>
          <div className='flex flex-col space-y-1 leading-none'>
            {user.email && (
              <p className='w-[200px] truncate text-sm dark:text-white text-zinc-700'>
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={event => {
            event.preventDefault();
            handleSignout().catch(console.error);
          }}
          className='text-red-600 cursor-pointer'
        >
          Sign out
          <LogOut className='w-4 h-4 ml-2 ' />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SignOut;
