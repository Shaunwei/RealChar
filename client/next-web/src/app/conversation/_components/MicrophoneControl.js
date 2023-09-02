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

export default function MicrophoneControl({
  isDisabled,
  microphone,
  microphoneList,
  handleMicrophoneSelect
}) {
  return (
    <div className="flex">
      <ButtonGroup radius="full" variant="light">
        <Tooltip content="Microphone">
          <Button
            isIconOnly
            isDisabled={isDisabled}
            className="hover:bg-button"
          >
            {isDisabled ? (
              <Image
                priority
                src={micOffSVG}
                alt="microphone off"
              />
            ) : (
              <Image
                priority
                src={microphoneSVG}
                alt="microphone"
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
              isDisabled={isDisabled}
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
            selectedKeys={microphone}
            onSelectionChange={handleMicrophoneSelect}
            itemClasses={{
              base: "font-light py-3 pl-2 data-[hover=true]:bg-dropdownHover"
            }}
          >
            <DropdownSection
              title="Select a microphone"
              classNames={{
                base: "p-0",
                header: "font-medium text-normal"
              }}
              items={microphoneList}
            >
              {(microphoneItem) => (
                <DropdownItem key={microphoneItem.key}>
                  {microphoneItem.label}
                </DropdownItem>
              )}
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>
    </div>
  )
}
