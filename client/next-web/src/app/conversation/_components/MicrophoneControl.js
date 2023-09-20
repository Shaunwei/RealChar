import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem
} from '@nextui-org/dropdown';
import {
  Button,
  ButtonGroup
} from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip';
import Image from 'next/image';
import microphoneSVG from '@/assets/svgs/microphone.svg';
import arrowSVG from '@/assets/svgs/arrowdown.svg';
import micOffSVG from '@/assets/svgs/mic_off.svg';

import { useAppStore } from '@/lib/store';

export default function MicrophoneControl({
  isDisabled,
  handleMic
}) {
  const {
    microphoneList,
    selectedMicrophone,
    handleMicrophoneSelect,
  } = useAppStore();

  return (
    <>
    <div className="flex md:hidden">
      <Button
        isIconOnly
        variant="light"
        onPress={handleMic}
      >
      {!isDisabled ? (
        <Image
          priority
          src={microphoneSVG}
          alt="microphone"
        />
      ) : (
        <Image
          priority
          src={micOffSVG}
          alt="disabled mic"
        />
      )}
      </Button>
    </div>
    <div className="hidden md:flex">
      <ButtonGroup radius="full" variant="light">
        <Tooltip content="Microphone">
          <Button
            isIconOnly
            className="hover:bg-button"
            onPress={handleMic}
          >
          {!isDisabled ? (
            <Image
              priority
              src={microphoneSVG}
              alt="microphone"
            />
          ) : (
            <Image
              priority
              src={micOffSVG}
              alt="disabled mic"
            />
          )}
          </Button>
        </Tooltip>
        <Dropdown
          placement="bottom"
          classNames={{
            base: "bg-dropdown"
          }}
        >
          <DropdownTrigger aria-label="Dropdown trigger">
            <Button
              isIconOnly
              className="min-w-[20px] w-5"
            >
              <Image
                priority
                src={arrowSVG}
                alt="arrow"
                className="w-5 px-1"
              />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Microphone Actions"
            variant="flat"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={selectedMicrophone}
            onSelectionChange={handleMicrophoneSelect}
            itemClasses={{
              base: "font-light"
            }}
          >
            <DropdownSection
              title="Select a microphone"
              classNames={{
                base: "p-0",
                header: "text-normal font-light"
              }}
              items={microphoneList}
            >
              {(microphoneItem) => (
                <DropdownItem key={microphoneItem.deviceId}>
                  {microphoneItem.label}
                </DropdownItem>
              )}
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>
    </div>
    </>
  )
}
