import { makeTwilioCall } from '@/util/apiClient';

export const createCommandSlice = (set, get) => ({
  callOutgoing: (number, vad_threshold) => {
    makeTwilioCall(number, vad_threshold, get().character.character_id);
  },
});
