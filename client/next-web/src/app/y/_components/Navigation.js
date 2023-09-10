'use client';

import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  User,
} from '@nextui-org/react';
import { CgProfile } from 'react-icons/cg';
import { PiDotsThreeBold } from 'react-icons/pi';
import { FiMail, FiHome } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import LogoSvg from '@/assets/svgs/realchar.svg';

import { usePathname } from 'next/navigation';

import { useAuthContext } from '@/context/AuthContext';

export default function Navigation() {
  const currentRoute = usePathname();
  const { user } = useAuthContext();

  return (
    <nav className="md:h-full md:justify-between md:w-[88px] xl:w-[275px]">
      <div className="fixed md:top-0 md:h-full">
        <div className="flex flex-col justify-between h-full px-2.5 md:w-[88px] xl:w-[275px]">
          <div className="">
            <Link href="/">
              <Image
                priority
                src={LogoSvg}
                alt="realchar."
                className="w-12 h-12 mb-6 p-1"
              />
            </Link>
            <ul className="flex flex-col gap-y-4">
              <li>
                <Button
                  variant="flat"
                  size="lg"
                  radius="md"
                  className={`justify-start text-lg font-semibold xl:w-52 ${currentRoute==="/y"?"bg-white/10":"bg-transparent"}`}
                >
                  <FiHome size="1.25em"/><span className="hidden xl:inline">Home</span>
                </Button>
              </li>
              <li>
                <Button
                  variant="flat"
                  size="lg"
                  radius="md"
                  className={`justify-start text-lg font-semibold xl:w-52 ${currentRoute==="/y/profile"?"bg-white/10":"bg-transparent"}`}
                >
                  <CgProfile size="1.25em"/><span className="hidden xl:inline">Profile</span>
                </Button>
              </li>
              <li>
                <Button
                  variant="flat"
                  size="lg"
                  radius="md"
                  className={`justify-start text-lg font-semibold xl:w-52 ${currentRoute==="/y/messages"?"bg-white/10":"bg-transparent"}`}
                >
                  <FiMail size="1.2em"/><span className="hidden xl:inline">Messages</span>
                </Button>
              </li>
            </ul>
          </div>
          <div className="pt-2.5 pb-4">
            <Dropdown placement="top">
              <DropdownTrigger>
                <div className="flex flex-row items-center justify-between">
                  <User
                    as="button"
                    avatarProps={{
                      src: user.photoURL
                    }}
                    className="transition-transform"
                    description=""
                    name={user.displayName}
                    classNames={{
                      name: "hidden xl:block text-base font-semibold",
                      description: "text-base"
                    }}
                  />
                  <PiDotsThreeBold size="1.25em"/>
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label="User Actions" variant="flat">
                <DropdownItem>item1</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    </nav>
  );
}
