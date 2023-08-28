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

export default function SpeakerControl({
  isMute,
  speaker,
  speakerList,
  toggleMute,
  handleSpeakerSelect
}) {
  return (
    <div className="flex">
      <ButtonGroup radius="full" variant="light">
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
            base: "bg-dropdown p-0"
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
            selectedKeys={speaker}
            onSelectionChange={handleSpeakerSelect}
            itemClasses={{
              base: "font-light py-3 pl-2 data-[hover=true]:bg-dropdownHover"
            }}
          >
          <DropdownSection
            title="Select a speaker"
            classNames={{
              base: "p-0",
              header: "font-medium text-normal"
            }}
            items={speakerList}
          >
            {(speakerItem) => (
              <DropdownItem key={speakerItem.key}>
                {speakerItem.label}
              </DropdownItem>
            )}
          </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>
    </div>
  );
}
