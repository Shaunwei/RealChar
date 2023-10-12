import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import { AiOutlinePlusCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import { FiPhoneCall } from 'react-icons/fi';
import { useAppStore } from "@/zustand/store";

export default function InputAddition({
  setText
}) {
  const { sendOverSocket, appendUserChat } = useAppStore();
  async function handleMenuClick(key) {
    switch(key) {
      case 'call':
        setText('/call number:');
        return;
      default:
        return;
    }
  }

  return (
    <div className="">
      <Dropdown
        placement="top-start"
        classNames={{
          base: "bg-dropdown"
        }}
      >
        <DropdownTrigger>
          <Button
            isIconOnly
            aria-label="more actions"
            variant="light"
            radius="full"
            className="text-neutral-500 group aria-[expanded=true]:bg-default/40"
          >
            <AiOutlinePlusCircle size="2em" className="group-aria-[expanded=true]:hidden"/>
            <AiOutlineCloseCircle size="2em" className="group-aria-[expanded=false]:hidden"/>
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="dropdown menu"
          variant="flat"
          onAction={handleMenuClick}
        >
          <DropdownSection title="Actions">
            <DropdownItem
              key="call"
              description="Make a outgoing call"
              startContent={<FiPhoneCall size="1.5em"/>}
            >
              Make a call
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
