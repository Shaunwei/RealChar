import {
  Select,
  SelectItem,
  SelectSection
} from '@nextui-org/react';
import { MdInfo } from 'react-icons/md';

import { useAppStore } from '@/lib/store';

export default function LanguagePanel() {
  const {
    preferredLanguage,
    languageList,
    handleLanguageChange
  } = useAppStore();

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
          selectedKeys={preferredLanguage}
          onChange={handleLanguageChange}
          radius="sm"
          size="lg"
          classNames={{
            trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
            value: 'text-lg font-light pl-4',
            popover: 'bg-dropdown',
          }}
        >
          <SelectSection>
          {languageList.map((item) => (
            <SelectItem key={item} textValue={item}
              classNames={{
                base: 'data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40 data-[selected=true]:pointer-events-none'
              }}
            >
              <div className="text-lg font-light">{item}</div>
            </SelectItem>
          ))}
          </SelectSection>
        </Select>
      </div>
    </div>
  );
}
