import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSettingSlice } from './slices/settingSlice';
import { createChatSlice } from './slices/chatSlice';

export const useAppStore = create((...a) => ({
  ...createSettingSlice(...a),
  ...createChatSlice(...a),
}));
