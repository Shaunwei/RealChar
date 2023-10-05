export const createChatSlice = (set, get) => ({
  // interimChat = null means not in text streaming.
  interimChat: null,
  setSender: (sender) => {
      set((state)=>({
          interimChat: state.interimChat ? {...state.interimChat, from: sender} : {from: sender, timestamp: `${Date.now()}`}
      }));
  },
  appendInterimChatContent: (content) => {
      set((state)=> ({
          interimChat: state.interimChat ? {...state.interimChat, content: `${'content' in state.interimChat ? state.interimChat.content : ''}` + content} : {content: content, timestamp: `${Date.now()}`}
      }));
  },

  messageId: '',
  setMessageId: (id) => {
    set({messageId: id});
  },

  chatContent: [],

  appendChatContent: () =>{
    set((state) => ({
        interimChat: null,
        chatContent: [...state.chatContent, {...state.interimChat}]}));
  },
  appendUserChat: (chat) => {
      set((state) => ({
          chatContent: [...state.chatContent, {timestamp: `${Date.now()}`, from: 'user', content: chat}]
      }));
  },
  clearChatContent: () => {
      set({chatContent: [], interimChat: null});
  },

  speechInterim: '',
  appendSpeechInterim: (str) => {
    set({speechInterim: get().speechInterim + str});
  },
    clearSpeechInterim: (str) => {
      set({speechInterim: ''});
    }
})
