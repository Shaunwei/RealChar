import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSettingSlice } from './slices/settingSlice';
import { createChatSlice } from './slices/chatSlice';
import { createYSlice } from './slices/ySlice';

export const useAppStore = create((...a) => ({
  ...createSettingSlice(...a),
  ...createChatSlice(...a),
  ...createYSlice(...a),
}));
