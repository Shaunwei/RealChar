import React from 'react';
import './style.css';
import SignIn from '../Auth/SignIn';
import SignOut from '../Auth/SignOut';
import { ThemeToggle } from '../ThemeToggle';

const Header = ({ user, isLoggedIn, setToken, handleDisconnect }) => (
  <div className='w-full bg-white dark:bg-gray-950 h-fit border-b border-zinc-300 py-2'>
    <div className='flex items-center justify-between gap-2 px-8  max-w-7xl mx-auto'>
      <div>
        <a href={'/'} className='flex items-center gap-2'>
          <p className='rounded-lg border-2 border-b-4 border-r-4 border-black px-2 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block dark:border-white'>
            Temus
          </p>
        </a>
      </div>
      <div className='flex items-center'>
        <ThemeToggle className='mr-3' />
        <div className='flex items-center'>
          {user ? (
            <SignOut
              isLoggedIn={isLoggedIn}
              user={user}
              handleDisconnect={handleDisconnect}
            />
          ) : (
            <SignIn isLoggedIn={isLoggedIn} setToken={setToken} />
          )}
        </div>
      </div>
    </div>
  </div>
);

export default Header;
