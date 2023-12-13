import {
  Switch,
  Tooltip,
  Button,
} from '@nextui-org/react';
import { MdInfoOutline } from 'react-icons/md';
import { useAppStore } from '@/zustand/store';

export default function EnhancePanel() {
  const {
    isJournalMode,
    setIsJournalMode,
  } = useAppStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-6">
        <div className="flex flex-row gap-2 items-center">
          <p className="text-lg">Journal Mode</p>
          {/* <Tooltip content="need content">
            <Button isIconOnly size="sm" variant="light" className="p-0 min-w-unit-5 w-5 min-h-unit-5 h-5">
              <MdInfoOutline size="1.5em" />
            </Button>
          </Tooltip> */}
        </div>
        <Switch
          isSelected={isJournalMode}
          onValueChange={setIsJournalMode}
          aria-label="journal mode"
        />
      </div>
    </div>
  );
}
