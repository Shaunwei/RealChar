import { generateHighlight } from '@/util/apiClient';
import { RiTodoFill } from 'react-icons/ri';

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
  deleteSpeaker: speaker_id => {
    set({
      speakersList: get().speakersList.map(speaker =>
        speaker.id === speaker_id ? { ...speaker, alive: false } : speaker
      ),
    });
    get().sendOverSocket('[!DELETE_SPEAKER]' + speaker_id);
  },
  updateSpeaker: (speaker_id, new_name, new_color_id) => {
    set({
      speakersList: get().speakersList.map(speaker => {
        if (speaker.id === speaker_id) {
          return {
            ...speaker,
            name: new_name,
            color_id: new_color_id,
          };
        } else {
          return speaker;
        }
      }),
    });
  },
  getSpeakerName: speaker_id => {
    const target = get().speakersList.find(
      speaker => speaker.id === speaker_id
    );
    if (!target) return 'Unknown Speaker';
    return target.name;
  },
  getSpeakerColor: speaker_id => {
    const target = get().speakersList.find(
      speaker => speaker.id === speaker_id
    );
    if (!target) return -1;
    return target.color_id;
  },
  transcriptContent: [],
  resetTranscript: () => {
    set({ transcriptContent: [] });
  },
  delayedSendHighlightTimeoutID: null,
  delayedSendLastHighLightTimeoutID: null,
  highlightedTranscriptIndex: -1,
  appendTranscriptContent: (id, speaker_id, text, timestamp, duration) => {
    const speaker = get().speakersList.find(
      speaker => speaker.id === speaker_id
    );
    const known_speaker_id = speaker ? speaker.id : null;
    const index = get().transcriptContent.findIndex(item => item.id === id);
    if (index === -1) {
      // New transcript slice
      set({
        transcriptContent: [
          ...get().transcriptContent,
          {
            id: id,
            speaker_id: known_speaker_id,
            content: text,
            timestamp: Number(timestamp),
            duration: Number(duration),
            alternatives: [text],
          },
        ],
      });
      get().updateMergedTranscriptContent();
      console.log(get().transcriptContent);
    } else {
      // Append to alternatives
      set({
        transcriptContent: [
          ...get().transcriptContent.slice(0, index),
          {
            ...get().transcriptContent[index],
            alternatives: [
              ...get().transcriptContent[index].alternatives,
              text,
            ],
          },
          ...get().transcriptContent.slice(index + 1),
        ],
      });
    }
    // Auto bullet points
    if (index === -1) {
      if (get().delayedSendHighlightTimeoutID) {
        clearTimeout(get().delayedSendHighlightTimeoutID);
      }
      if (get().delayedSendLastHighLightTimeoutID) {
        clearTimeout(get().delayedSendLastHighLightTimeoutID);
      }
      set({
        delayedSendHighlightTimeoutID: setTimeout(() => {
          const slice = get().transcriptContent.slice(
            get().highlightedTranscriptIndex + 1
          );
          const duration = slice.reduce((acc, item) => acc + item.duration, 0);
          console.log(
            'duration check before generating bullet point:',
            duration,
            'sec'
          );
          if (duration > 60) {
            get().appendBulletPoint(slice);
          }
        }, 5000),
        delayedSendLastHighLightTimeoutID: setTimeout(() => {
          const slice = get().transcriptContent.slice(
            get().highlightedTranscriptIndex + 1
          );
          if (slice.length > 0) {
            get().appendBulletPoint(slice);
          }
        }, 60000),
      });
    }
  },
  // temporary use
  mergedTranscriptContent: [],
  updateMergedTranscriptContent: () => {
    console.log('rendered updateMergedTranscriptContent');
    const merged = [];
    get().transcriptContent.forEach(line => {
      const lastLine = merged[merged.length - 1];
      if (
        merged.length &&
        line.speaker_id === lastLine.speaker_id &&
        line.timestamp - lastLine.timestamp - lastLine.duration < 5
      ) {
        lastLine.content += ' ' + line.content;
      } else {
        merged.push({
          ...line,
          alternatives: [...line.alternatives],
        });
      }
    });
    console.log('mergedTranscriptContent:', merged);
    set({ mergedTranscriptContent: merged });
  },
  generateTranscriptContext: transcriptContent => {
    let context = '';
    let lastSpeakerId = null;
    transcriptContent.map(item => {
      if (item.speaker_id === lastSpeakerId) {
        context += ' ' + item.content;
      } else {
        lastSpeakerId = item.speaker_id;
        const speakerName = get().getSpeakerName(item.speaker_id);
        context += '\n' + speakerName + ' said: ' + item.content;
      }
    });
    return context;
  },
  generateNewHighlight: (text, prompt, callback) => {
    let generateHighlightRequest = {
      context: text,
    };
    if (prompt) {
      generateHighlightRequest['prompt'] = prompt;
    }
    generateHighlight(generateHighlightRequest, get().token).then(callback);
  },
  actionContent: [],
  appendBulletPoint: transcriptContent => {
    const text = get().generateTranscriptContext(transcriptContent);
    get().generateNewHighlight(text, null, data => {
      console.log('context: ' + text);
      console.log('highlight: ' + data['highlight']);
      let bullet_point_list = data['highlight'].split('- ');
      bullet_point_list = bullet_point_list.map(line => line.trim());
      bullet_point_list.shift();
      set({
        actionContent: [
          ...get().actionContent,
          {
            type: 'highlight',
            timestamp: `${Date.now()}`,
            detected: bullet_point_list,
            suggested: [],
          },
        ],
      });
      set({ highlightedTranscriptIndex: get().transcriptContent.length - 1 });
    });
  },
  appendUserRequest: text => {
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
    const generateHighlightRequest = {
      context: get().generateTranscriptContext(get().transcriptContent),
      prompt: text,
    };
    generateHighlight(generateHighlightRequest, get().token).then(data => {
      get().appendCharacterResponse(data['highlight']);
    });
  },
  appendCharacterResponse: text => {
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
