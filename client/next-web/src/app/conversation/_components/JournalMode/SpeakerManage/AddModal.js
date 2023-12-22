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
import { TbTrash } from 'react-icons/tb';
import Recorder from '@/components/Recorder';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/zustand/store';

export default function SpeakerEditModal({ colors, onClose }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(new Set());
  const [voiceFile, setVoiceFile] = useState(null);
  const { addSpeaker } = useAppStore();
  function handleAdd() {
    addSpeaker(name, Array.from(selectedColor)[0], voiceFile);
    onClose();
  }
  function handleConfirm(file) {
    console.log(file);
    setVoiceFile(file);
  }

  useEffect(() => {
    setName('');
    setSelectedColor(new Set([]));
    setVoiceFile(null);
  }, []);

  return (
    <ModalContent>
      <ModalHeader>
        <h1>Add speaker</h1>
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
        <div>
          <p className="text-base font-medium">Voice File</p>
          {voiceFile ? (
            <p className="text-small flex flex-row gap-2">
              <span>{voiceFile.name}</span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setVoiceFile(null)}
                className="text-danger h-fit"
              >
                <TbTrash size="1.4em" />
              </Button>
            </p>
          ) : (
            <div className="pt-1">
              <p className="text-small">
                Record your voice by reading the paragraph below.
              </p>
              <div className="bg-white/10 p-3 rounded-lg">
                The bright sun shines over the calm blue sea.
              </div>
              <div className="mb-4 h-24 pt-2">
                <Recorder handleConfirm={handleConfirm} />
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="justify-between">
        <Button
          onPress={handleAdd}
          className="bg-real-contrastBlue w-full"
          isDisabled={
            name === '' || Array.from(selectedColor).length === 0 || !voiceFile
          }
        >
          Confirm
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}
