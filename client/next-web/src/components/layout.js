import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/navbar';
import { Button } from '@nextui-org/button';
import Image from 'next/image';
import logo from '../assets/svgs/logo.svg';
import Footer from '../components/footer';

export default function Layout({ children }) {
  return (
    <>
      <Navbar>
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
      <main>{children}</main>
      <Footer></Footer>
    </>
  );
}