import {
  Select,
  SelectItem
} from '@nextui-org/select';

import { useAppStore } from '@/lib/store';

export default function LanguageModelControl() {
  const { models, selectedModel, handleModelChange } = useAppStore();

  return (
    <Select
      labelPlacement="outside"
      aria-label="model select"
      selectedKeys={selectedModel}
      onChange={handleModelChange}
      radius="sm"
      classNames={{
        base: 'w-36',
        trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
        value: 'font-light pl-4',
        popover: 'bg-dropdown',
      }}
    >
      {models.map((item) => (
        <SelectItem key={item.id} textValue={item.name}>
          <div className="font-light flex flex-col">
            <span>{item.name}</span>
            <span className="text-tiny whitespace-normal text-white/50">{item.tooltip}</span>
          </div>
        </SelectItem>
      ))}
    </Select>
  );
}
