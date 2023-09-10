import {Button}from '@nextui-org/button';
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader
} from '@nextui-org/modal';
import {useDisclosure} from '@nextui-org/react';
import Image from 'next/image';
import settingsSVG from '@/assets/svgs/settings.svg';
import SettingPanel from './SettingPanel';

export default function SettingsButton({
  microphone,
  microphoneList,
  handleMicrophoneSelect,
  speaker,
  speakerList,
  handleSpeakerSelect,
}) {
  const {isOpen, onOpen, onClose} = useDisclosure();

  return (
    <>
    <Button
      isBlock
      isIconOnly
      radius="full"
      variant="light"
      className="opacity-50 hover:bg-button"
      onPress={onOpen}
    >
      <Image
        priority
        src={settingsSVG}
        alt="settings"
      />
    </Button>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      classNames={{
        base: 'rounded-none font-light border-real-blue-300/30 bg-modalBG border-2 max-w-5xl lg:py-16 lg:pl-10 lg:pr-10',
        header: 'text-center font-light justify-center text-3xl',
        body: 'text-xl py-6',
      }}
    >
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalBody>
          <SettingPanel
            microphone={microphone}
            microphoneList={microphoneList}
            handleMicrophoneSelect={handleMicrophoneSelect}
            speaker={speaker}
            speakerList={speakerList}
            handleSpeakerSelect={handleSpeakerSelect}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
    </>
  );
}
