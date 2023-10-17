import {generateHighlight} from "@/util/apiClient";

const demoActions = [
  {
    type: 'highlight',
    timestamp: 1,
    detected:
      'Schedule a meeting with the payment gateway provtimestamper for clarification.',
    suggested: ['calender', 'meeting'],
  },
  {
    type: 'user',
    timestamp: 7,
    content: 'show me some tips',
  },
  {
    type: 'highlight',
    timestamp: 2,
    detected:
      'Reassign some developers to focus primarily on the payment gateway integration.',
    suggested: ['meeting'],
  },
  {
    type: 'character',
    timestamp: 9,
    content: 'bla bla bla just for demo :P',
  },
  {
    type: 'highlight',
    timestamp: 3,
    detected:
      "Keep the client updated on the project's progress and the plan to introduce some features post-launch.",
    suggested: ['email'],
  },
  {
    type: 'highlight',
    timestamp: 4,
    detected: "Provide daily updates to Alex on the project's status.",
    suggested: ['calendar'],
  },
];

export const createJournalSlice = (set, get) => ({
  speakersList: [],
  resetSpeakersList: () => {
    set({ speakersList: [] });
  },
  addSpeaker: (name, color_id, voiceFile) => {
    const speaker_id = self.crypto.randomUUID();
    set({
      speakersList: [
        ...get().speakersList,
        {
          id: speaker_id,
          name: name,
          color_id: color_id,
          alive: true,
        },
      ],
    });
    get().sendOverSocket('[!ADD_SPEAKER]' + speaker_id);
    get().sendOverSocket(voiceFile);
  },
  deleteSpeaker: (speaker_id) => {
    set({
      speakersList: get().speakersList.map((speaker) =>
        speaker.id === speaker_id ? { ...speaker, alive: false } : speaker
      ),
    });
    get().sendOverSocket('[!DELETE_SPEAKER]' + speaker_id);
  },
  updateSpeaker: (speaker_id, new_name, new_color_id) => {
    set({
      speakersList: get().speakersList.map((speaker) => {
        if (speaker.id === speaker_id) {
          return {
            id: speaker_id,
            name: new_name,
            color_id: new_color_id,
            alive: true,
          };
        } else {
          return speaker;
        }
      }),
    });
  },
  getSpeakerName: (speaker_id) => {
    const target = get().speakersList.find(
      (speaker) => speaker.id === speaker_id
    );
    if (!target) return 'Unknown Speaker';
    return target.name;
  },
  getSpeakerColor: (speaker_id) => {
    const target = get().speakersList.find(
      (speaker) => speaker.id === speaker_id
    );
    if (!target) return -1;
    return target.color_id;
  },
  transcriptContent: [],
  resetTranscript: () => {
    set({ transcriptContent: [] });
  },
  delayedSendHighlightTimeoutID: null,
  appendTranscriptContent: (speaker_id, text) => {
    const speaker = get().speakersList.find(
      (speaker) => speaker.id === speaker_id
    );
    const known_speaker_id = speaker ? speaker.id : null;
    const length = get().transcriptContent.length;
    if (
      length > 0 &&
      get().transcriptContent[length - 1].speaker_id === known_speaker_id &&
      Date.now() - get().transcriptContent[length - 1].timestamp < 5000
    ) {
      let final_content = ''
      set({
        transcriptContent: get().transcriptContent.map((item, index) => {
          if (index === get().transcriptContent.length - 1) {
            final_content = item.content + ' ' + text;
            return {
              ...item,
              content: item.content + ' ' + text,
              timestamp: Date.now(),
            };
          } else {
            return item;
          }
        }),
      });
      if (get().delayedSendHighlightTimeoutID) {
        clearTimeout(get().delayedSendHighlightTimeoutID);
      }
      const task = setTimeout(() => {
        const text = known_speaker_id + ": " + final_content;
        if (text.length > 100) {
          get().generateNewHighlight(text, null, (data) => {
            let bullet_point_list = data['highlight'].split('-');
            bullet_point_list.shift();
            const bullet_points = '-' + bullet_point_list.join('\n- ');
            console.log(bullet_points);
            get().appendCharacterResponse(bullet_points)
          });
        }
      }, 5000);
      set({delayedSendHighlightTimeoutID: task});
    } else {
      set({
        transcriptContent: [
          ...get().transcriptContent,
          {
            speaker_id: known_speaker_id,
            content: text,
            timestamp: Date.now(),
          },
        ],
      });
    }
  },
  actionContent: [],
  generateNewHighlight: (text, prompt, callback) => {
    let generateHighlightRequest = {
      context: text,
    }
    if(prompt) {
      generateHighlightRequest['prompt'] = prompt
    }
    generateHighlight(generateHighlightRequest, get().token).then(callback);
  },
  appendUserRequest: (text) => {
    set({
      actionContent: [
        ...get().actionContent,
        {
          type: 'user',
          timestamp: `${Date.now()}`,
          content: text,
        },
      ],
    });
    // Generate all transcriptions.
    let all_context = ''
    get().transcriptContent.map((content) => {
      all_context = all_context + content.speaker_id + ': ' + content.content + '\n';
    });
    const generateHighlightRequest = {
      'context': all_context,
      'prompt': text
    }
    generateHighlight(generateHighlightRequest, get().token).then((data) => {
      get().appendCharacterResponse(data['highlight'])
    });
  },
  appendCharacterResponse: (text) => {
    set({
      actionContent: [
        ...get().actionContent,
        {
          type: 'character',
          timestamp: `${Date.now()}`,
          content: text,
        },
      ],
    });
  },
});
