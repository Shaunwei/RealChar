/**
 * src/components/AvatarView/index.jsx
 *
 * created by BennyKok on 7/30/23
 * AvatarView wrapping useAvatar hook from @avatechai/avatars/react
 * Learn more at https://avatech.ai
 */

import { useAvatar } from '@avatechai/avatars/react';
import { defaultAvatarLoaders } from '@avatechai/avatars/default-loaders';
import { ExternalVoiceSourceService } from '@avatechai/avatars/voice';

const externalAvatarVoiceService = new ExternalVoiceSourceService();

export function setAnalyser(audioContext) {
  externalAvatarVoiceService.setAnalyser(audioContext);
}

/**
 * Helper function to setup the avatar lip sync
 */
export function setupAvatarLipSync(audioContext, audioPlayer) {
  externalAvatarVoiceService.setAudioSourceNode(audioContext, audioPlayer);
}

const useAvatarView = (avatarId, emotion) => {
  const { avatarDisplay, handleFirstInteractionAudio } = useAvatar({
    avatarId: avatarId,
    currentEmotion: emotion,
    // Loader + Plugins
    avatarLoaders: defaultAvatarLoaders,
    audioService: externalAvatarVoiceService,
    // Style Props
    style: {
      width: '400px',
      height: '400px',
    },
  });

  return { avatarDisplay, handleFirstInteractionAudio };
};

export default useAvatarView;
