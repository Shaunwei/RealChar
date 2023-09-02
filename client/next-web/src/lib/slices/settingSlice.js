export const createSettingSlice = (set) => ({
  character: {},
  preferredLanguage: new Set(['English']),
  selectedSpeaker: new Set(['default']),
  selectedMicrophone: new Set(['default']),
  selectedModel: new Set(['gpt-3.5-turbo-16k']),
  enableGoogle: false,
  enableQuivr: false,
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
    // todo
    // need get permission
    // const res = await navigator.mediaDevices.enumerateDevices();
    // const audioInputDevices = res.filter(device =>
    //   device.kind === 'audioinput'
    // );
    // const audioOutputDevices = res.filter(device =>
    //   device.kind === 'audiooutput'
    // );
    // if (audioInputDevices.length === 0) {
    //   console.log('No audio input devices found');
    // } else {
    //   set({microphoneList: audioInputDevices});
    // }
    // if (audioOutputDevices.length === 0) {
    //   console.log('No audio output devices found');
    // } else {
    //   set({speakerList: audioOutputDevices});
    // }
    set({microphoneList: [
      {
        deviceId:"default",
        groupId:"20cecfa73f784ce0cbad9e1067696aedf2cd6da0d384d0377d7004bfa23f69e1",
        kind:"audioinput",
        label:"Default - Internal Microphone (Built-in)"
      }, {
        deviceId:"13f7d9bfe795127bb3d4e7fe0332946ce6faa4ac8ccd6213546511792b11ce27",
        groupId:"20cecfa73f784ce0cbad9e1067696aedf2cd6da0d384d0377d7004bfa23f69e1",
        kind:"audioinput",
        label:"Internal Microphone (Built-in)",
      }
    ]});
    set({speakerList: [
      {
        deviceId:"default",
        groupId:"20cecfa73f784ce0cbad9e1067696aedf2cd6da0d384d0377d7004bfa23f69e1",
        kind:"audiooutput",
        label:"Default - Internal Speakers (Built-in)",
      }, {
        deviceId:"d13602e4fe7bca71b5ee4f3fe7a7c00d87431e4e41ba8b09ac8e02a0052ac023",
        groupId:"20cecfa73f784ce0cbad9e1067696aedf2cd6da0d384d0377d7004bfa23f69e1",
        kind:"audiooutput",
        label:"Internal Speakers (Built-in)",
      }
    ]})
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
    // todo
  },
  handleMicrophoneSelect: (keys) => {
    set({ selectedMicrophone: new Set(keys)});
    // todo
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