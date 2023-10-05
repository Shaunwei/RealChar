import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSettingSlice } from './slices/settingSlice';
import { createChatSlice } from './slices/chatSlice';
import {createWebsocketSlice} from "@/lib/slices/websocketSlice";
import {createRecorderSlice} from "@/lib/slices/recorderSlice";
import {createWebRTCSlice} from "@/lib/slices/webrtcSlice";
import { createCreateSlice } from '@/lib/slices/createSlice';

export const useAppStore = create((...a) => ({
  ...createSettingSlice(...a),
  ...createChatSlice(...a),
  ...createWebsocketSlice(...a),
  ...createRecorderSlice(...a),
  ...createWebRTCSlice(...a),
  ...createCreateSlice(...a),
}));
