import {
  Select,
  SelectItem,
  SelectSection
} from '@nextui-org/select';
import { BiSolidLockAlt } from 'react-icons/bi';

import { useAppStore } from '@/lib/store';
import { useAuthContext } from '@/context/AuthContext';

export default function LanguageModelControl() {
  const { models, selectedModel, handleModelChange } = useAppStore();
  const { user } = useAuthContext();

  return (
    <>
    {user == null ? (
      <Select
        labelPlacement="outside"
        aria-label="model select"
        selectedKeys={selectedModel}
        disabledKeys={['locked', models[0].id]}
        onChange={handleModelChange}
        radius="sm"
        classNames={{
          base: 'w-40',
          trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
          value: 'font-light pl-4',
          popover: 'bg-dropdown',
        }}
      >
        <SelectSection>
          <SelectItem key={models[0].id} textValue={models[0].name}
            classNames={{
              base: 'data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40'
            }}
          >
            <div className="font-light flex flex-col">
              <span>{models[0].name}</span>
              <span className="text-tiny whitespace-normal text-white/50">{models[0].tooltip}</span>
            </div>
          </SelectItem>
        </SelectSection>
        <SelectSection>
          <SelectItem
            key="locked"
            classNames={{
              selectedIcon: 'hidden'
            }}
          >
            <span className="text-small flex flex-row items-center gap-1"><BiSolidLockAlt/>Sign in needed</span>
          </SelectItem>
        </SelectSection>
          {/* <SelectSection title="Sign in to unlock more">
          <SelectItem classNames={{
            base: 'data-[hover=true]:bg-transparent data-[selectable=true]:focus:bg-transparent justify-center',
            selectedIcon: 'hidden'
          }}>
            <SignIn className="w-full"/>
          </SelectItem>
        </SelectSection> */}
      </Select>
    ) : (
      <Select
        labelPlacement="outside"
        aria-label="model select"
        selectedKeys={selectedModel}
        onChange={handleModelChange}
        radius="sm"
        classNames={{
          base: 'w-40',
          trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
          value: 'font-light pl-4',
          popover: 'bg-dropdown',
        }}
      >
        <SelectSection>
        {models.map((item) => (
          <SelectItem key={item.id} textValue={item.name}
            classNames={{
              base: 'data-[hover=true]:bg-default/40 data-[selectable=true]:focus:bg-default/40 data-[selected=true]:pointer-events-none'
            }}
          >
            <div className="font-light flex flex-col">
              <span>{item.name}</span>
              <span className="text-tiny whitespace-normal text-white/50">{item.tooltip}</span>
            </div>
          </SelectItem>
        ))}
        </SelectSection>
      </Select>
    )}
    </>
  );
}
