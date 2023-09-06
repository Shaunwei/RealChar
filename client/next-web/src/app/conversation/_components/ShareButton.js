import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@nextui-org/modal';
import { Button } from '@nextui-org/button';
import { useDisclosure } from '@nextui-org/react';
import Image from 'next/image';
import shareSVG from '@/assets/svgs/share.svg';
import { AiOutlineLink } from 'react-icons/ai';
import { BsCheckLg } from 'react-icons/bs';
import ChatPreview from './ChatPreview';

import { useState } from 'react';

export default function ShareButton() {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [shareContent, setShareContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  async function handleOpen(key) {
    setShareContent(key);
    setIsCopied(false);
    onOpen();
  }

  function copyLink(keyword) {
    switch(keyword) {
      case 'character':
        navigator.clipboard.writeText(window.location.href);
        break;
      case 'chat':
        // todo
        break;
      default:
        break;
    }
    setIsCopied(true);
    // todo
  }

  return (
    <>
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
          onAction={handleOpen}
          itemClasses={{
            base:"font-light py-3 pl-5 data-[hover=true]:bg-dropdownHover"
          }}
        >
          <DropdownItem key="character">Share character</DropdownItem>
          <DropdownItem key="chat">Share chat</DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        radius="none"
        size="xl"
        classNames={{
          base: 'rounded-none font-light border-modalBorder bg-modalBG border-2 md:max-w-3xl md:py-16 md:px-28',
          header: 'text-center font-light justify-center md:text-3xl',
          body: 'md:text-xl py-6',
          footer: 'justify-center'
        }}
      >
        <ModalContent>
          {shareContent === 'character' && (
            <>
            <ModalHeader>
              Share Character
            </ModalHeader>
            <ModalBody>
              Invite your friends to chat with this character as well! Sharing the character won&apos;t reveal your conversation history.
            </ModalBody>
            <ModalFooter>
              {!isCopied ? (
                <Button
                  radius="none"
                  className="w-full bg-real-contrastBlue"
                  onPress={() => copyLink('character')}
                >
                  <AiOutlineLink/>Copy link
                </Button>
              ) : (
                <p className="flex flex-row text-success"><BsCheckLg size="1.5em"/>Copied shared conversation URL to clipboard!</p>
              )}
            </ModalFooter>
            </>
          )}
          {shareContent === 'chat' && (
            <>
            <ModalHeader>
              Share Chat
            </ModalHeader>
            <ModalBody>
              <ChatPreview/>
            </ModalBody>
            <ModalFooter>
              {!isCopied ? (
                <Button
                  radius="none"
                  className="w-full bg-real-contrastBlue"
                  onPress={() => copyLink('chat')}
                >
                  <AiOutlineLink />Copy link
                </Button>
              ) : (
                <p className="flex flex-row text-success gap-2"><BsCheckLg size="1.5em"/>Copied shared conversation URL to clipboard!</p>
              )}
            </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
