import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown';
import { Button } from '@nextui-org/button';
import Image from 'next/image';
import arrowSVG from '@/assets/svgs/arrowdown.svg';
import { useMemo } from 'react';

export default function LanguageModelControl({
  model,
  modelList,
  handleLanguageModel
}) {
  const selectedModel = useMemo(
    () => Array.from(model).join(','),
    [model]
  );

  return (
    <Dropdown
      placement="bottom"
      classNames={{
        base: "bg-dropdown p-0"
      }}
    >
      <DropdownTrigger aria-label="Dropdown trigger">
        <Button
          radius="full"
          variant="bordered"
          className="hover:bg-button"
        >
          {selectedModel}
          <Image
            priority
            src={arrowSVG}
            alt="arrow"
          />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language Model Actions"
        variant="flat"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={model}
        onSelectionChange={handleLanguageModel}
        itemClasses={{
          base: "font-light py-3 pl-5 data-[hover=true]:bg-dropdownHover"
        }}
        items={modelList}
      >
        {(model) => (
          <DropdownItem key={model.key}>
            {model.label}
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
