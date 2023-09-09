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
} from '@nextui-org/button';
import { Tooltip } from '@nextui-org/tooltip';
import Image from 'next/image';
import speakerSVG from '@/assets/svgs/speaker.svg';
import muteSVG from '@/assets/svgs/mute.svg';
import arrowSVG from '@/assets/svgs/arrowdown.svg';

import { useAppStore } from '@/lib/store';

export default function SpeakerControl({
  isMute,
  toggleMute,
}) {
  const {
    speakerList,
    selectedSpeaker,
    handleSpeakerSelect,
  } = useAppStore();

  return (
    <>
    <div className="flex md:hidden">
      <Button
        isIconOnly
        variant="light"
        onPress={toggleMute}
      >
        {
          isMute ? (
            <Image
            priority
            src={muteSVG}
            alt="mute"
          />
          ) : (
            <Image
              priority
              src={speakerSVG}
              alt="speaker settings"
            />
          )
        }
      </Button>
    </div>
    <div className="hidden md:flex">
      <ButtonGroup
        radius="full"
        variant="light"
      >
        <Tooltip content="Speaker">
          <Button
            isIconOnly
            className="hover:bg-button"
            onPress={toggleMute}
          >
            {isMute ? (
              <Image
                priority
                src={muteSVG}
                alt="mute"
              />
            ) : (
              <Image
                priority
                src={speakerSVG}
                alt="speaker settings"
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
            aria-label="Speaker Actions"
            variant="flat"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={selectedSpeaker}
            onSelectionChange={handleSpeakerSelect}
            itemClasses={{
              base: "font-light"
            }}
          >
          <DropdownSection
            title="Select a speaker"
            classNames={{
              base: "p-0",
              header: "text-normal font-light"
            }}
            items={speakerList}
          >
            {(device) => (
              <DropdownItem key={device.deviceId} textValue={device.label}>
                {device.label}
              </DropdownItem>
            )}
          </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>
    </div>
    </>
  );
}
