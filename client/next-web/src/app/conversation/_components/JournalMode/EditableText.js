import {
  Input,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useDisclosure,
} from '@nextui-org/react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/zustand/store';

export default function EditableText({ line, color }) {
  const [value, setValue] = useState(null);
  const { updateTranscriptContent } = useAppStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const handlePress = (value) => {
    setValue(value);
    onClose();
  };
  const handleOnEnterPress = (e) => {
    if (e.key === 'Enter') {
      onClose();
    }
  };
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      updateTranscriptContent(line.id, value);
    }
  };

  useEffect(() => {
    if (line) {
      setValue(line.content);
    }
  }, [line]);

  if (!line) return;

  return (
    <>
      <Popover
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        onClose={onClose}
        placement="top"
        classNames={{
          base: 'bg-dropdown gap-2',
        }}
      >
        <PopoverTrigger>
          <Button
            onPress={onOpen}
            radius="none"
            variant="light"
            className="p-0 h-fit underline underline-offset-2 decoration-real-blue-500 decoration-dashed z-0 min-w-fit data-[hover=true]:bg-real-blue-500"
          >
            <span className={color}>{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-row gap-2 max-w-xs flex-wrap">
            {line.alternatives.map((alter, idx) => (
              <Button
                key={idx}
                variant="flat"
                onPress={() => handlePress(alter)}
                className="p-0 px-2 h-fit z-0 min-w-fit whitespace-normal max-w-[200px] text-left"
              >
                {alter}
              </Button>
            ))}
          </div>
          <Input
            label=""
            placeholder="Enter your transcipt"
            labelPlacement="outside-left"
            size="sm"
            variant="bordered"
            value={value}
            onValueChange={setValue}
            onKeyDown={handleOnEnterPress}
            classNames={{
              base: 'w-full min-w-full',
              mainWrapper: 'w-full',
              input: 'text-base',
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
