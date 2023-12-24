import { generateHighlight } from '@/util/apiClient';

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
  resetJournal: () => {
    set({
      transcriptContent: [],
      transcriptParagraph: [],
      actionContent: [],
      lineIdToBulletPointId: {},
      bulletPointIdToSliceId: {},
    });
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
      get().updateTranscriptParagraph();
      console.log(get().transcriptContent);
    } else {
      // Append to alternatives
      set({
        transcriptContent: [
          ...get().transcriptContent.slice(0, index),
          {
            ...get().transcriptContent[index],
            content: text,
            // alternatives elements are unique
            alternatives: [
              ...get().transcriptContent[index].alternatives,
              text,
            ],
          },
          ...get().transcriptContent.slice(index + 1),
        ],
      });
      get().updateTranscriptParagraph();
      const affected = get().lineIdToBulletPointId[id];
      if (affected) {
        Array.from(affected).map((bullet_point_id) => {
          get().updateBulletPoint(bullet_point_id);
        });
      }
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
            get().appendBulletPoint(get().highlightedTranscriptIndex + 1, get().transcriptContent.length);
          }
        }, 5000),
        delayedSendLastHighLightTimeoutID: setTimeout(() => {
          const slice = get().transcriptContent.slice(
            get().highlightedTranscriptIndex + 1
          );
          if (slice.length > 0) {
            get().appendBulletPoint(get().highlightedTranscriptIndex + 1, get().transcriptContent.length);
          }
        }, 60000),
      });
    }
  },
  updateTranscriptContent: (id, new_content) => {
    set({
      transcriptContent: get().transcriptContent.map(line => {
        if (line.id === id) {
          return {
            ...line,
            content: new_content,
          };
        } else {
          return line;
        }
      }),
    });
    get().updateTranscriptParagraph();
    // Get bullet points that are affected by update.
    const affected = get().lineIdToBulletPointId[id];
    if (affected) {
      Array.from(affected).map((bullet_point_id) => {
        get().updateBulletPoint(bullet_point_id);
      });
    }
  },
  // temporary use for showing
  /**
   * id: id of lines[0]
   * speaker_id
   * lines: [] - array of lines
   */
  transcriptParagraph: [],
  updateTranscriptParagraph: () => {
    console.log('rendered updateTranscriptParagraph');
    const paragraphs = [];
    get().transcriptContent.forEach(line => {
      const lastParagraph = paragraphs[paragraphs.length - 1];
      if (
        paragraphs.length &&
        line.speaker_id === lastParagraph.speaker_id &&
        line.timestamp - lastParagraph.timestamp - lastParagraph.duration < 5
      ) {
        lastParagraph.lines.push(line);
        lastParagraph.duration =
          line.timestamp + line.duration - lastParagraph.lines[0].timestamp;
      } else {
        paragraphs.push({
          id: line.id,
          speaker_id: line.speaker_id,
          timestamp: line.timestamp,
          duration: line.duration,
          lines: [line],
        });
      }
    });
    console.log('transcriptParagraph:', paragraphs);
    set({ transcriptParagraph: paragraphs });
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
  lineIdToBulletPointId: {},
  bulletPointIdToSliceId: {},
  bulletPointIdToDebouncedUpdateId: {},
  updateBulletPoint: (bullet_point_id) => {
    const sliceId = get().bulletPointIdToSliceId[bullet_point_id];
    const slice = get().transcriptContent.slice(sliceId.start, sliceId.end);
    const text = get().generateTranscriptContext(slice);
    // Find existing bullet point.
    const target = get().actionContent.find(
        action => action.id === bullet_point_id && action.type === 'highlight'
    );
    if (!target) {
      console.log("No corresponding bullet point found for update");
      return;
    }
    if (get().bulletPointIdToDebouncedUpdateId.hasOwnProperty(bullet_point_id) && get().bulletPointIdToDebouncedUpdateId[bullet_point_id] != null) {
      clearTimeout(get().bulletPointIdToDebouncedUpdateId[bullet_point_id]);
    }
    const timeoutId = setTimeout(()=>{
      // Get updated highlight.
      get().generateNewHighlight(text, null, data => {
        console.log('context: ' + text);
        console.log('highlight: ' + data['highlight']);
        let bullet_point_list = data['highlight'].split('- ');
        bullet_point_list = bullet_point_list.map(line => line.trim());
        bullet_point_list.shift();
        // Update the bullet point.
        set({
          actionContent: get().actionContent.map((action) => {
            if (action.id === bullet_point_id) {
              return {
                type: 'highlight',
                id: action.id,
                timestamp: action.timestamp,
                detected: bullet_point_list,
                suggested: [],
              }
            } else {
              return action;
            }
          })
        });
      });
      set({
        bulletPointIdToDebouncedUpdateId: {
          ...get().bulletPointIdToDebouncedUpdateId,
          [bullet_point_id]: null
        }
      });
    }, 30000);
    set({
      bulletPointIdToDebouncedUpdateId: {
        ...get().bulletPointIdToDebouncedUpdateId,
        [bullet_point_id]: timeoutId
      }
    });
  },
  appendBulletPoint: (start, end) => {
    const slice = get().transcriptContent.slice(start, end);
    const text = get().generateTranscriptContext(slice);
    get().generateNewHighlight(text, null, data => {
      console.log('context: ' + text);
      console.log('highlight: ' + data['highlight']);
      let bullet_point_list = data['highlight'].split('- ');
      bullet_point_list = bullet_point_list.map(line => line.trim());
      bullet_point_list.shift();
      const highlight_id = self.crypto.randomUUID();
      set({
        actionContent: [
          ...get().actionContent,
          {
            type: 'highlight',
            id: highlight_id,
            timestamp: `${Date.now()}`,
            detected: bullet_point_list,
            suggested: [],
          },
        ],
      });
      set({ highlightedTranscriptIndex: get().transcriptContent.length - 1 });
      let current_mapping = get().lineIdToBulletPointId;
      // Map every line id to affecting highlight.
      get().transcriptContent.map(item=> {
        if (current_mapping.hasOwnProperty(item.id)) {
          current_mapping[item.id].add(highlight_id);
        } else {
          current_mapping[item.id] = new Set([highlight_id]);
        }
      });
      set({
        lineIdToBulletPointId: current_mapping
      });
      set({
        bulletPointIdToSliceId: {
          ...get().bulletPointIdToSliceId,
          [highlight_id]: {
            start: start,
            end: end,
          }
        }
      });
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
