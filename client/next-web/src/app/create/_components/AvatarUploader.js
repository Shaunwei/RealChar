import { Avatar, Button } from '@nextui-org/react';
import { useRef } from 'react';
import { useAppStore } from '@/lib/store';

export default function AvatarUploader() {
  const uploaderRef = useRef(null);
  const { avatarURL, handleAvatarChange } = useAppStore();

  function handleClick() {
    uploaderRef.current.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar src={avatarURL} alt="avatar" size="lg" classNames={{ base: 'w-24 h-24 bg-white/20' }} />
      <Button
        onPress={handleClick}
        className="bg-real-contrastBlue"
      >
        Upload avatar
      </Button>
      <input
        ref={uploaderRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />
    </div>
  );
}
