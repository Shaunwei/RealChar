import {
  cloneVoice,
  createCharacter,
  generateSystemPrompt,
  uploadFile,
  getCharacter,
  deleteCharacter,
  editCharacter,
} from '@/util/apiClient';
import { edgeTTSVoiceIds } from '../voiceIds';

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
  ---
  {query}
`;

const constructForm = async (get) => {
  if (!get().formData.name) {
    alert('Please enter a name');
    return;
  }
  let new_formData = { ...get().formData };
  if (!new_formData.data) {
    new_formData.data = {};
  }
  if (new_formData.voice_id === 'placeholder') {
    new_formData.voice_id = await cloneVoice(get().voiceFiles, get().token);
  }
  // upload image to gcs
  if (get().avatarFile) {
    try {
      let res = await uploadFile(get().avatarFile, get().token);
      new_formData.data.avatar_filename = res.filename;
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    }
  }
  // upload background files to gcs
  if (get().backgroundFiles.length > 0) {
    for (let i = 0; i < get().backgroundFiles.length; i++) {
      try {
        let res = await uploadFile(get().backgroundFiles[i], get().token);
        new_formData.data[get().backgroundFiles[i].name] = res.filename;
      } catch (error) {
        console.error(error);
        alert('Error uploading files');
      }
    }
  }
  new_formData.background_text = get().backgroundText;
  return new_formData;
};

export const createCharacterSlice = (set, get) => ({
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
  clonedVoice: '',
  voiceFiles: [],
  ttsOptions: [
    {
      value: 'ELEVEN_LABS',
      text: 'Eleven Labs',
      selected_voice_id: 'EXAVITQu4vr4xnSDxMaL',
    },
    {
      value: 'GOOGLE_TTS',
      text: 'Google TTS',
      selected_voice_id: 'en-US-Studio-O',
    },
    {
      value: 'EDGE_TTS',
      text: 'Edge TTS',
      selected_voice_id: 'en-US-ChristopherNeural',
    },
  ],
  voiceOptions: {
    ELEVEN_LABS: [
      {
        voice_id: 'EXAVITQu4vr4xnSDxMaL',
        gender: 'Female',
        name: 'Default',
      },
      {
        voice_id: 'ErXwobaYiN019PkySvjV',
        gender: 'Male',
        name: 'Default',
      },
    ],
    GOOGLE_TTS: [
      {
        voice_id: 'en-US-Studio-O',
        gender: 'Female',
        name: 'Default',
      },
      {
        voice_id: 'en-US-Studio-M',
        gender: 'Male',
        name: 'Default',
      },
    ],
    EDGE_TTS: edgeTTSVoiceIds.map((item) => ({
      voice_id: item.voice_id,
      lang: item.lang,
      gender: item.gender,
      name: item.name + ' (' + item.from + ')',
      audio_url:
        'https://storage.googleapis.com/assistly/static/edge-tts-samples/' + item.voice_id + '.mp3',
    })),
  },
  voiceFilters: {
    ELEVEN_LABS: [
      {
        label: 'gender',
        value: 'Female',
      },
    ],
    GOOGLE_TTS: [
      {
        label: 'gender',
        value: 'Female',
      },
    ],
    EDGE_TTS: [
      {
        label: 'lang',
        value: 'English',
      },
      {
        label: 'gender',
        value: 'Male',
      },
    ],
  },
  voiceOptionsMode: 'selectVoice',
  voiceSamplePlayer: undefined,
  voiceSampleUrl: '',
  setFormData: (newData) => {
    set((state) => ({
      formData: {
        ...state.formData,
        ...newData,
      },
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
  setVoiceOptionsMode: (mode) => {
    set({ voiceOptionsMode: mode });
    if (mode === 'selectVoice') {
      get().setFormData({ voice_id: get().getCurrentVoiceOption().voice_id });
    } else if (get().isClonedVoice(get().clonedVoice) && mode === get().clonedVoice) {
      get().setFormData({ voice_id: get().clonedVoice });
    }
  },
  setVoiceSamplePlayer: (player) => {
    set({ voiceSamplePlayer: player });
  },
  getVoiceFilterOptions: (filter) => {
    // get deduplicated options for a filter
    return get()
      .voiceOptions[get().formData.tts].map((option) => option[filter.label])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  },
  getFilteredVoiceOptions: () => {
    const { voiceOptions, voiceFilters, formData } = get();
    let filteredVoiceOptions = voiceOptions[formData.tts];
    voiceFilters[formData.tts]?.forEach((element) => {
      filteredVoiceOptions = filteredVoiceOptions.filter(
        (option) => option[element.label] === element.value
      );
    });
    return filteredVoiceOptions.sort((a, b) => a.name.localeCompare(b.name));
  },
  getCurrentVoiceOption: () => {
    const filteredVoiceOptions = get().getFilteredVoiceOptions();
    const currentVoiceOption = filteredVoiceOptions.filter(
      (option) => option.voice_id === get().formData.voice_id
    )[0];
    return currentVoiceOption ? currentVoiceOption : filteredVoiceOptions[0];
  },
  addRecording: (recording) => {
    set({
      voiceFiles: [...get().voiceFiles.filter((file) => file.name !== recording.name), recording],
    });
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
    const typeAllowed = ['text/plain', 'text/csv', 'application/pdf'];

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
    set((state) => ({
      backgroundFiles: [...state.backgroundFiles, ...fileArray],
    }));
  },
  handleDeleteFile: (name) => {
    set((state) => ({
      backgroundFiles: state.backgroundFiles.filter((file) => file.name !== name),
    }));
  },
  handleVoiceFiles: (e) => {
    set({ voiceErrorMsg: '' });
    const fileArray = Array.from(e.target.files);
    const typeAllowed = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-m4a'];

    for (let i = 0; i < fileArray.length; i++) {
      if (!typeAllowed.includes(fileArray[i].type)) {
        set({ voiceErrorMsg: '* Only .wav, .mp3, .m4a files are allowed' });
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
    set((state) => ({
      voiceFiles: state.voiceFiles.filter((file) => file.name !== name),
    }));
  },
  handleTtsOptionsChange: (value) => {
    get().setFormData({
      tts: value,
      voice_id: get().ttsOptions.filter((item) => item.value === value)[0].selected_voice_id,
    });
  },
  handleVoiceFilterChange: (filter, value) => {
    set({
      voiceFilters: {
        ...get().voiceFilters,
        [get().formData.tts]: get().voiceFilters[get().formData.tts].map((item) => {
          if (item.label === filter.label) {
            return {
              ...item,
              value: value,
            };
          }
          return item;
        }),
      },
    });
    get().setFormData({ voice_id: get().getCurrentVoiceOption().voice_id });
  },
  handleVoiceSelect: (value) => {
    if (value) {
      get().setFormData({ voice_id: value });
      set({
        ttsOptions: get().ttsOptions.map((item) => {
          if (item.value === get().formData.tts) {
            return {
              ...item,
              selected_voice_id: value,
            };
          }
          return item;
        }),
      });
    }
    set({ voiceSampleUrl: get().getCurrentVoiceOption().audio_url });
    !value && get().voiceSamplePlayer.play();
  },
  handleVoiceSampleLoad: () => {
    get().voiceSamplePlayer.play();
  },
  autoGenerate: async () => {
    if (get().formData.name === '') {
      alert('Please enter a name');
      return;
    }
    let pre_prompt = get().formData.system_prompt;
    try {
      let formData = { ...get().formData, system_prompt: 'Generating...' };
      get().setFormData({ ...formData, system_prompt: 'Generating...' });
      let res = await generateSystemPrompt(get().formData.name, get().backgroundText, get().token);
      get().setFormData({ ...formData, system_prompt: res.system_prompt });
    } catch (error) {
      console.error(error);
      alert('Error generating system prompt');
      get().setFormData({ ...get().formData, system_prompt: pre_prompt });
    }
  },
  cloneVoice: () => {
    set({ clonedVoice: 'isLoading' });
    cloneVoice(get().voiceFiles, get().token).then((result) => {
      get().setFormData({ voide_id: result.voice_id });
      set({ clonedVoice: result.voice_id });
      console.log('voice files uploaded.');
    });
  },
  submitForm: async () => {
    let new_formData = await constructForm(get);
    // call api to create character
    console.log(new_formData);
    try {
      await createCharacter(new_formData, get().token);
    } catch (error) {
      console.error(error);
      alert('Error creating character');
    }
  },
  clearData: () => {
    set({
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
    });
    get().initFilters();
  },
  isClonedVoice: (voice_id) => {
    if (!voice_id || voice_id === 'isLoading') {
      return false;
    }
    const array = get().voiceOptions[get().formData.tts].map((item) => item.voice_id);
    return array.indexOf(voice_id) === -1;
  },
  getCharacterForEdit: async (character) => {
    try {
      let res = await getCharacter(character.character_id, get().token);
      set({
        avatarURL: character.image_url,
        formData: {
          name: res.name,
          system_prompt: res.system_prompt,
          user_prompt: res.user_prompt,
          tts: res.tts,
          voice_id: res.voice_id,
          visibility: res.visibility,
        },
        backgroundText: res.background_text,
        backgroundFiles: [],
        errorMsg: '',
        voiceErrorMsg: '',
        clonedVoice: '',
        voiceFiles: [],
      });
      const isCloned = get().isClonedVoice(res.voice_id);
      get().initFilters(isCloned);
      if (isCloned) {
        set({ clonedVoice: res.voice_id });
        get().setVoiceOptionsMode(res.voice_id);
      }
    } catch (err) {
      console.error(err);
      alert('Error getting character data');
    }
  },
  initFilters: (isCloned) => {
    set({
      ttsOptions: [
        {
          value: 'ELEVEN_LABS',
          text: 'Eleven Labs',
          selected_voice_id: 'EXAVITQu4vr4xnSDxMaL',
        },
        {
          value: 'GOOGLE_TTS',
          text: 'Google TTS',
          selected_voice_id: 'en-US-Studio-O',
        },
        {
          value: 'EDGE_TTS',
          text: 'Edge TTS',
          selected_voice_id: 'en-US-ChristopherNeural',
        },
      ],
    });
    if (!isCloned) {
      set({
        ttsOptions: get().ttsOptions.map((item) => {
          if (item.value === get().formData.tts) {
            return {
              ...item,
              selected_voice_id: get().formData.voice_id,
            };
          }
          return item;
        }),
      });
    }
    set({
      voiceFilters: Object.entries(get().voiceFilters).reduce((acc, [tts, filters]) => {
        acc[tts] = filters.map((filter) => ({
          ...filter,
          value: get().voiceOptions[tts].find(
            (item) =>
              item.voice_id ===
              get().ttsOptions.find((item) => item.value === tts).selected_voice_id
          )[filter.label],
        }));
        return acc;
      }, {}),
    });
  },
  submitEdit: async (character_id) => {
    const new_formData = await constructForm(get);
    new_formData.id = character_id;
    console.log(new_formData);
    try {
      await editCharacter(new_formData, get().token);
    } catch (error) {
      console.error(error);
      alert('Error creating character');
    }
  },
  deleteCharacter: async (character) => {
    try {
      let res = await deleteCharacter(character.character_id, get().token);
    } catch (err) {
      console.error(err);
      alert('Something Error, fail to delete');
    }
  },
});
