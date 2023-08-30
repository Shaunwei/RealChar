import {
  Select,
  SelectItem,
} from '@nextui-org/react';
import { MdInfo } from 'react-icons/md';
import { useState } from 'react';
//mock data
import {currentLanguage} from '@/util/data';

export default function LanguagePanel() {
  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Hindi',
    'Italian',
    'Polish',
    'Portuguese',
    'Chinese',
    'Japanese',
    'Korean',
  ];
  // todo
  const [language, setLanguage] = useState(new Set(['English']));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center gap-2">
        <div className="text-warning">
          <MdInfo/>
        </div>
        <p className="text-base">Switching languages will initiate a new conversation.</p>
      </div>
      <div>
        <Select
          labelPlacement="outside"
          aria-label="language select"
          selectedKeys={language}
          onSelectionChange={setLanguage}
          radius="sm"
          size="lg"
          classNames={{
            trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
            value: 'text-lg font-light pl-4',
            popover: 'bg-dropdown',
          }}
        >
          {languages.map((item) => (
            <SelectItem key={item} textValue={item}>
              <div className="text-lg font-light">{item}</div>
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
