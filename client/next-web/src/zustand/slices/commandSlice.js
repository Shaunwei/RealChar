import { makeTwilioCall } from '@/util/apiClient';

export const createCommandSlice = (set, get) => ({
  callOutgoing: number => {
    makeTwilioCall(number);
  },
});
