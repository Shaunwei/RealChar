/**
 * src/components/AvatarView/index.jsx
 *
 * created by BennyKok on 7/30/23
 * AvatarView wrapping useAvatar hook from @avatechai/avatars/react
 * Learn more at https://avatech.ai
 */

import { useAvatar } from '@avatechai/avatars/react';
import { defaultAvatarLoaders } from '@avatechai/avatars/default-loaders';

const useAvatarView = (avatarId, emotion) => {
  const { avatarDisplay, playAudioFromNode } = useAvatar({
    avatarId: avatarId,
    currentEmotion: emotion,
    // Loader + Plugins
    avatarLoaders: defaultAvatarLoaders,
    // Style Props
    style: {
      width: '400px',
      height: '400px',
    },
  });

  return { avatarDisplay, playAudioFromNode };
};

export default useAvatarView;
