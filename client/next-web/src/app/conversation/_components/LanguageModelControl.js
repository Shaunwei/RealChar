import {
  Select,
  SelectItem
} from '@nextui-org/select';

import { useState } from 'react';
// mock data
import { currentModel, modelList } from '@/util/data';

export default function LanguageModelControl() {
  const [model, setModel] = useState(new Set([currentModel]));

  function handleModelChange(e) {
    setModel(new Set([e.target.value]));
    // todo
  }

  return (
    <Select
      labelPlacement="outside"
      aria-label="model select"
      selectedKeys={model}
      onChange={handleModelChange}
      radius="sm"
      classNames={{
        base: 'w-36',
        trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
        value: 'font-light pl-4',
        popover: 'bg-dropdown',
      }}
    >
      {modelList.map((item) => (
        <SelectItem key={item.key} textValue={item.label}>
          <div className="font-light">{item.label}</div>
        </SelectItem>
      ))}
    </Select>
  );
}
