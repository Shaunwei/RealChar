/**
 * src/components/AvatarView/index.jsx
 *
 * created by BennyKok on 7/30/23
 * AvatarView wrapping useAvatar hook from @avatechai/avatars/react
 * Learn more at https://avatech.ai
 */

import { useAvatar } from '@avatechai/avatars/react';
import {
  defaultAvatarLoaders,
  // defaultBlendshapesService,
  defaultBlendshapesService_2,
  defaultBlendshapesService_3,
} from '@avatechai/avatars/default-loaders';
import { ExternalVoiceSourceService } from '@avatechai/avatars/voice';

const externalAvatarVoiceService = new ExternalVoiceSourceService();

/**
 * Helper function to setup the avatar lip sync
 */
export function setupAvatarLipSync(audioContext, audioPlayer) {
  externalAvatarVoiceService.setAudioContextAndSource(
    audioContext,
    audioPlayer
  );
  // defaultBlendshapesService_2.enableBlendshapes(externalAvatarVoiceService);
  // defaultBlendshapesService_3.enableBlendshapes(externalAvatarVoiceService);
}

const useAvatarView = (avatarId, emotion) => {
  const { avatarDisplay, handleFirstInteractionAudio } = useAvatar({
    avatarId: avatarId,
    currentEmotion: emotion,
    // Loader + Plugins
    avatarLoaders: defaultAvatarLoaders,
    audioService: externalAvatarVoiceService,

    // Style Props
    scale: 4,
    style: {
      width: '400px',
      height: '400px',
    },
  });

  return { avatarDisplay, handleFirstInteractionAudio };
};

export default useAvatarView;
