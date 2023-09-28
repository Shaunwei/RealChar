const user_prompt = `
Context
  ---
  {context}
  ---
  Use previous information as context to answer the following user question, Aim to keep responses super super concise and meaningful and try to express emotions.
  ALWAYS ask clarification question, when
  - user's question isn't clear
  - seems unfinished
  - seems totally irrelevant
  Remember to prefix your reply.
  ---
  {query}
`;

export const createCreateSlice = (set, get) => ({
  avatarURL: null,
  avatarFile: null,
  formData: {
    name: '',
    system_prompt: '',
    user_prompt: user_prompt,
    tts: 'ELEVEN_LABS',
    voice_id: 'EXAVITQu4vr4xnSDxMaL', // Male: ErXwobaYiN019PkySvjV Female:
    visibility: 'private',
  },
  backgroundText: '',
  backgroundFiles: [],
  errorMsg: '',
  voiceErrorMsg: '',
  voiceFiles: [],
  ttsOptions: [
    {
      value: 'ELEVEN_LABS',
      text: 'Eleven Labs'
    }, {
      value: 'GOOGLE_TTS',
      text: 'Google TTS'
    }, {
      value: 'UNREAL_SPEECH',
      text: 'Unreal Speech'
    }, {
      value: 'EDGE_TTS',
      text: 'Edge TTS'
    }
  ],
  voiceOptions: {
    ELEVEN_LABS: [
      {
        label: 'Female',
        voice_id: 'EXAVITQu4vr4xnSDxMaL'
      }, {
        label: 'Male',
        voice_id: 'ErXwobaYiN019PkySvjV'
      }
    ],
    GOOGLE_TTS: [
      {
        label: 'Female',
        voice_id: 'en-US-Studio-O'
      }, {
        label: 'Male',
        voice_id: 'en-US-Studio-M'
      }
    ]
  },
  setFormData: (newData) => {
    set((state) => ({
      formData: {
        ...state.formData,
        ...newData
      }
    }));
  },
  setBackgroundText: (value) => {
    set({ backgroundText: value });
  },
  setBackgroundFiles: (files) => {
    set({ backgroundFiles: files });
  },
  setErrorMsg: (text) => {
    set({ errorMsg: text });
  },
  setVoiceFiles: (files) => {
    set({ voiceFiles: files });
  },
  handleAvatarChange: (e) => {
    if (e.target.files && e.target.files.length > 0) {
      set({ avatarURL: URL.createObjectURL(e.target.files[0]) });
      set({ avatarFile: e.target.files[0] });
    }
  },
  handleBackgroundFiles: (e) => {
    set({ errorMsg: '' });
    const fileArray = Array.from(e.target.files);
    const typeAllowed = [
      'text/plain',
      'text/csv',
      'application/pdf'
    ];

    for (let i = 0; i < fileArray.length; i++) {
      if (!typeAllowed.includes(fileArray[i].type)) {
        set({ errorMsg: '* File types are limited to txt, csv, and pdf.' });
        return;
      }
      if (fileArray[i].size > 5000000) {
        set({ errorMsg: '* File size should be less than 5MB.' });
        return;
      }
    }
    if (get().backgroundFiles.length + fileArray.length > 5) {
      set({ errorMsg: '* Max 5 files are allowed.' });
      return;
    }
    set((state) => ({ backgroundFiles: [...state.backgroundFiles, ...fileArray] }));
  },
  handleDeleteFile: (name) => {
    set((state) => ({ backgroundFiles: state.backgroundFiles.filter(file => file.name != name) }));
  },
  handleVoiceFiles: (e) => {
    set({ voiceErrorMsg: '' });
    const fileArray = Array.from(e.target.files);
    const typeAllowed = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/x-m4a',
    ];

    for (let i = 0; i < fileArray.length; i++) {
      if (!typeAllowed.includes(fileArray[i].type)) {
        set({ voiceErrorMsg: '* Only .wav, .mp3, .m4a files are allowed'});
        return;
      }
      if (fileArray[i].size > 5000000) {
        set({ voiceErrorMsg: '* File size should be less than 5MB.' });
        return;
      }
    }
    if (get().voiceFiles.length + fileArray.length > 5) {
      set({ errorMsg: '* Max 5 files are allowed.' });
      return;
    }
    set((state) => ({ voiceFiles: [...state.voiceFiles, ...fileArray] }));
  },
  handleDeleteVoiceFile: (name) => {
    set((state) => ({ voiceFiles: state.voiceFiles.filter(file => file.name != name) }));
  },
  autoGenerate: () => {
    //TODO
  },
  cloneVoice: () => {
    //TODO
  },
  handleSubmit: () => {
    //TODO
    console.log(get().formData);
  },
})
