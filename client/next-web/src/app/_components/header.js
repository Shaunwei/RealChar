'use client'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/navbar';
import { Button } from '@nextui-org/button';
import Image from 'next/image';
import logo from '@/assets/svgs/logo.svg';
import { useState } from 'react';
import signIn from '@/firebase/auth/signin';
import signout from '@/firebase/auth/signout';
import { useAuthContext } from '@/context/AuthContext';

export default function Header() {
  const { user } = useAuthContext();

  console.log(user);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function handleSignIn() {
    const { result, error } = await signIn();
    if (error) {
      console.log(error);
      return;
    }
    console.log(result);
    setIsLoggedIn(true);
  }
  async function handleSignOut() {
    const { result, error } = await signout();
    if (error) {
      console.log(error);
      return;
    }
    console.log(result);
    setIsLoggedIn(false);
  }
  return (
    <Navbar className="h-20 bg-header">
      <NavbarBrand>
        <Image
          priority
          src={logo}
          alt="RealChar.ai"
        />
      </NavbarBrand>
      <NavbarContent justify="end">
        <NavbarItem>
          {!isLoggedIn ? (
            <Button onClick={handleSignIn}>Sign in</Button>
          ) : (
            <Button onClick={handleSignOut}>Sign out</Button>
          )
          }
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}
