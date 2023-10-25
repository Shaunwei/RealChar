import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useDisclosure,
  Textarea,
} from '@nextui-org/react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/zustand/store';

export default function EditableText({ line, color }) {
  const [value, setValue] = useState(null);
  const { updateTranscriptContent } = useAppStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const handlePress = value => {
    setValue(value);
    onClose();
  };
  const handleOnEnterPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClose();
      updateTranscriptContent(line.id, value);
    }
  };
  const handleOpenChange = isOpen => {
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
          base: 'bg-dropdown gap-2 p-3 pb-2 items-start max-w-full',
        }}
      >
        <PopoverTrigger>
          <Button
            onPress={onOpen}
            isDisabled={line.alternatives.length === 1}
            radius="none"
            variant="light"
            className="p-0 h-fit bg-real-blue-500/20 z-0 min-w-fit data-[hover=true]:bg-real-blue-500 whitespace-normal text-left"
          >
            <span className={`${color}`}>
              {value === '' ? (
                <span className="line-through decoration-2">
                  {line.alternatives[0]}
                </span>
              ) : (
                value
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-row gap-2 max-w-xs flex-wrap">
            {[...new Set(line.alternatives)].map((alter, idx) => {
              if (alter) {
                return (
                  <Button
                    key={idx}
                    onPress={() => handlePress(alter)}
                    className="py-1 px-2 h-fit z-0 min-w-fit whitespace-normal max-w-[200px] text-left bg-white/20 md:max-w-fit"
                  >
                    {alter}
                  </Button>
                );
              }
            })}
          </div>
          <Textarea
            label=""
            placeholder="Enter your own"
            labelPlacement="outside"
            size="sm"
            variant="bordered"
            minRows={1}
            value={value}
            onValueChange={setValue}
            onKeyDown={handleOnEnterPress}
            classNames={{
              base: 'w-full',
              inputWrapper: 'border-white/20',
              input: 'text-base py-0',
              label: 'hidden',
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
