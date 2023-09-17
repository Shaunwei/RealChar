export const createSettingSlice = (set) => ({
  character: {},
  preferredLanguage: new Set(['English']),
  selectedSpeaker: new Set(['default']),
  selectedMicrophone: new Set(['default']),
  selectedModel: new Set(['gpt-3.5-turbo-16k']),
  enableGoogle: false,
  enableQuivr: false,
  enableMultiOn: false,
  languageList: [
    'English',
    'Spanish',
    'French',
    'German',
    'Hindi',
    'Italian',
    'Polish',
    'Portuguese',
    'Chinese',
    'Japanese',
    'Korean',
  ],
  models: [
    {
      id: 'gpt-3.5-turbo-16k',
      name: 'GPT-3.5',
      tooltip: 'Fastest model, good for most conversation',
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      tooltip: 'Medium speed, most capable model, best conversation experience',
    },
    {
      id: 'claude-2',
      name: 'Claude-2',
      tooltip: 'Slower model, longer context window for long conversation',
    },
    {
      id: 'meta-llama/Llama-2-70b-chat-hf',
      name: 'Llama-2-70b',
      tooltip: 'Open source model, good for most conversation',
    },
  ],
  speakerList: [],
  microphoneList: [],
  getAudioList: async () => {
    await navigator.mediaDevices.getUserMedia({audio: true, video: false});
    const res = await navigator.mediaDevices.enumerateDevices();
    const audioInputDevices = res.filter(device =>
      device.kind === 'audioinput'
    );
    const audioOutputDevices = res.filter(device =>
      device.kind === 'audiooutput'
    );
    if (audioInputDevices.length === 0) {
      console.log('No audio input devices found');
    } else {
      set({microphoneList: audioInputDevices});
    }
    if (audioOutputDevices.length === 0) {
      console.log('No audio output devices found');
    } else {
      set({speakerList: audioOutputDevices});
    }
  },
  setCharacter: (obj) => {
    set({ character: obj});
  },
  handleLanguageChange: (e) => {
    set({ preferredLanguage: new Set([e.target.value])});
    // to do
  },
  handleSpeakerSelect: (keys) => {
    set({ selectedSpeaker: new Set(keys)});
  },
  handleMicrophoneSelect: (keys) => {
    set({ selectedMicrophone: new Set(keys)});
  },
  handleModelChange: (e) => {
    set({ selectedModel: new Set([e.target.value])});
  },
  handleGoogle: (value) => {
    set({ enableGoogle: value });
    // todo
  },
  handleQuivr: (value) => {
    set({ enableQuivr: value })
  }
})
