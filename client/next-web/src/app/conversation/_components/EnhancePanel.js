import {
  Switch,
  Tooltip,
  Button,
} from '@nextui-org/react';
import { MdInfoOutline } from 'react-icons/md';
import { useAppStore } from '@/lib/store';

export default function EnhancePanel() {
  const {
    enableGoogle,
    enableQuivr,
    handleGoogle,
    handleQuivr
  } = useAppStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-6">
        <div className="flex flex-row gap-2 items-center">
          <p className="text-lg">Enable google search</p>
          <Tooltip content={
            <div className="w-80 h-20 text-sm py-3 px-2">Enable the character to access the latest information and online events, but may lead to a slight delay in response time.</div>
            }
          >
            <Button isIconOnly size="sm" variant="light" className="p-0 min-w-unit-5 w-5 min-h-unit-5 h-5">
              <MdInfoOutline size="1.5em"/>
            </Button>
          </Tooltip>
        </div>
        <Switch
          isSelected={enableGoogle}
          onValueChange={handleGoogle}
          aria-label="google search"
        />
      </div>
      <div className="flex flex-row gap-6">
        <div className="flex flex-row gap-2 items-center">
          <p className="text-lg">Enable Quivr Second Brain</p>
          <Tooltip content="need content">
            <Button isIconOnly size="sm" variant="light" className="p-0 min-w-unit-5 w-5 min-h-unit-5 h-5">
              <MdInfoOutline size="1.5em" />
            </Button>
          </Tooltip>
        </div>
        <Switch
          isSelected={enableQuivr}
          onValueChange={handleQuivr}
          aria-label="google search"
        />
      </div>
    </div>
  );
}
