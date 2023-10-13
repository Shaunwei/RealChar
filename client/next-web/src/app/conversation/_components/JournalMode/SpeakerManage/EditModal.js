import {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Select,
  SelectItem,
} from '@nextui-org/react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/zustand/store';

export default function SpeakerEditModal({ speakerContent, colors, onClose }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(new Set());
  const { updateSpeaker, deleteSpeaker } = useAppStore();
  function handleUpdate() {
    updateSpeaker(speakerContent.id, name, Array.from(selectedColor)[0]);
    onClose();
  }

  function handleDelete() {
    deleteSpeaker(speakerContent.id);
    onClose();
  }

  useEffect(() => {
    if (!speakerContent) return;

    setName(speakerContent.name);
    setSelectedColor(new Set([speakerContent.color_id.toString()]));
  }, [speakerContent]);

  return (
    <ModalContent>
      <ModalHeader>
        <h1>Edit speaker</h1>
      </ModalHeader>
      <ModalBody>
        <Input
          label="Name"
          labelPlacement="outside"
          placeholder="Name"
          value={name}
          onValueChange={setName}
          classNames={{
            label: 'text-base',
            inputWrapper: [
              'bg-white/10',
              'data-[hover=true]:bg-white/10',
              'group-data-[focus=true]:bg-white/10',
            ],
            input: 'text-base',
          }}
        />
        <Select
          labelPlacement="outside"
          label="Transcript color"
          placeholder="Select a color"
          selectedKeys={selectedColor}
          onSelectionChange={setSelectedColor}
          classNames={{
            label: 'text-base',
            trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
            value: `text-base font-normal ${
              colors[Array.from(selectedColor)[0]]
            }`,
            popover: 'bg-dropdown',
          }}
        >
          {colors.map((color, idx) => (
            <SelectItem
              key={idx}
              className={color}
            >
              {color.split('-')[1]}
            </SelectItem>
          ))}
        </Select>
      </ModalBody>
      <ModalFooter className="justify-between">
        <Button
          onPress={handleDelete}
          className="bg-danger"
        >
          Delete
        </Button>
        <Button
          onPress={handleUpdate}
          className="bg-real-contrastBlue"
        >
          Confirm
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}
