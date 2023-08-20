import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/navbar';
import { Button } from '@nextui-org/button';
import Image from 'next/image';
import logo from '../assets/svgs/logo.svg';

export default function Header() {
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
          <Button>Sign in</Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}
