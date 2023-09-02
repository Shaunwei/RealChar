'use client';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@nextui-org/navbar';
import Image from 'next/image';
import logo from '@/assets/svgs/logo.svg';
import SignIn from './SignIn';
import UserDropdown from './UserDropdown';

import { useAuthContext } from '@/context/AuthContext';

export default function Header() {
  const { user } = useAuthContext();

  return (
    <Navbar className='h-20 bg-header'>
      <NavbarBrand>
        <Image priority src={logo} alt='RealChar.ai' />
      </NavbarBrand>
      <NavbarContent justify='end'>
        <NavbarItem>
          {user == null ? <SignIn /> : <UserDropdown user={user} />}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
