import {Button}from '@nextui-org/button';
import Image from 'next/image';
import settingsSVG from '@/assets/svgs/settings.svg';

export default function SettingsButton({
  openSettings
}) {
  return (
    <Button
      isBlock
      isIconOnly
      radius="full"
      variant="light"
      className="opacity-50 hover:bg-button"
      onPress={openSettings}
    >
      <Image
        priority
        src={settingsSVG}
        alt="settings"
      />
    </Button>
  );
}
