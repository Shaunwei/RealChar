import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown';
import { Button } from '@nextui-org/button';
import Image from 'next/image';
import shareSVG from '@/assets/svgs/share.svg';

export default function ShareButton({
  handleShare
}) {
  return (
    <Dropdown 
      placement="bottom"
      classNames={{
        base: "bg-dropdown p-0"
      }}
    >
      <DropdownTrigger aria-label="Dropdown trigger">
        <Button
          isIconOnly
          radius="full"
          variant="light"
          className="opacity-50 hover:bg-button"
        >
          <Image
            priority
            src={shareSVG}
            alt="share"
          />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Share Actions"
        variant="flat"
        onAction={handleShare}
        itemClasses={{
          base:"font-light py-3 pl-5 data-[hover=true]:bg-dropdownHover"
        }}
      >
        <DropdownItem key="character">Share character</DropdownItem>
        <DropdownItem key="chat">Share chat</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
