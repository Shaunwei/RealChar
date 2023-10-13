const demoMeeting = [
  {
    speaker_id: '2',
    name: 'Alex',
    color_id: 1,
    content:
      'Good morning, Emma. Thanks for meeting with me today. How are you doing?',
    timestamp: 1695965752196,
  },
  {
    speaker_id: '1',
    name: 'Emma',
    color_id: 3,
    content:
      'Morning, Alex.I’m good, thank you.Ready to dive into our web project details.How about you ?',
    timestamp: 1695965752197,
  },
  {
    speaker_id: '2',
    name: 'Alex',
    color_id: 1,
    content:
      'I’m well, thanks.Let’s get started.Can you give me a brief update on where we currently stand with the web project ?',
    timestamp: 1695965752199,
  },
  {
    speaker_id: '1',
    name: 'Emma',
    color_id: 3,
    content:
      'Certainly.We’ve finished the design phase, and the development team is now working on implementing the features.The homepage, contact page, and the product pages are almost done, but we’re facing a slight delay with the integration of the payment gateway.',
    timestamp: 1695965752299,
  },
  {
    speaker_id: '2',
    name: 'Alex',
    color_id: 1,
    content: 'I see.Are there any major blockers causing the delay ?',
    timestamp: 1695965752399,
  },
  {
    speaker_id: '1',
    name: 'Emma',
    color_id: 3,
    content:
      'The main challenge is that the payment gateway’s API has changed since we last integrated it in another project.We need to adapt our code to these changes, which is taking a bit longer than expected.However, the team is actively working on it, and I’ve scheduled a meeting with the payment gateway provider for clarification.',
    timestamp: 1695965752499,
  },
  {
    speaker_id: '2',
    name: 'Alex',
    color_id: 1,
    content:
      'Alright.My main concern is our deadline.As you know, the client wants the website to go live in two weeks.Do you think we’ll make it ?',
    timestamp: 1695965752599,
  },
  {
    speaker_id: '1',
    name: 'Emma',
    color_id: 3,
    content:
      'Given the current situation, it will be tight, but I believe if we prioritize the payment gateway integration and postpone some of the less crucial features to post - launch, we should be able to meet the deadline.',
    timestamp: 1695965752699,
  },
  {
    speaker_id: '2',
    name: 'Alex',
    color_id: 1,
    content:
      'I agree.Let’s ensure that the essential features, especially the ones related to user transactions, are up and running.We can roll out additional features as part of phase two post - launch.',
    timestamp: 1695965752799,
  },
  {
    speaker_id: '1',
    name: 'Emma',
    color_id: 3,
    content:
      ' Sounds like a plan.I’ll reassign some of our developers to focus primarily on the payment gateway so that we can expedite that process.I’ll also keep the client updated on our progress and our plan to introduce some features post - launch.',
    timestamp: 1695965752899,
  },
  {
    speaker_id: '2',
    name: 'Alex',
    color_id: 1,
    content:
      'Perfect.And please keep me in the loop as well.I want to make sure we deliver a functional product on time while maintaining quality.',
    timestamp: 1695965752999,
  },
  {
    speaker_id: '1',
    name: 'Emma',
    color_id: 3,
    content:
      ' Absolutely, Alex.I’ll make sure you get daily updates.And rest assured, even with the tight deadline, we won’t compromise on quality.',
    timestamp: 1695965753399,
  },
  {
    speaker_id: '2',
    name: 'Alex',
    color_id: 1,
    content:
      'Thanks, Emma.I appreciate your dedication and hard work.Let’s touch base again at the end of this week to see where we are.',
    timestamp: 1695965754399,
  },
  {
    speaker_id: '1',
    name: 'Emma',
    color_id: 3,
    content:
      ' Will do.Thanks for your understanding and support, Alex.I’m confident we’ll deliver a great product to the client.',
    timestamp: 1695965755399,
  },
  {
    speaker_id: '2',
    name: 'Alex',
    color_id: 1,
    content: 'I have no doubts.Let’s get to work!',
    timestamp: 1695965762399,
  },
];

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

const demoSpeakersList = [
  {
    id: '1',
    name: 'Emma',
    color_id: 3,
  },
  {
    id: '2',
    name: 'Alex',
    color_id: 1,
  },
];

export const createJournalSlice = (set, get) => ({
  speakersList: demoSpeakersList,
  addSpeaker: (name, color_id, voiceFile) => {
    const speaker_id = self.crypto.randomUUID();
    set({
      speakersList: [
        ...get().speakersList,
        {
          id: speaker_id,
          name: name,
          color_id: color_id,
        },
      ],
    });
    get().sendOverSocket('[!ADD_SPEAKER]' + speaker_id);
    get().sendOverSocket(voiceFile);
  },
  deleteSpeaker: speaker_id => {
    set({
      speakersList: get().speakersList.filter(
        speaker => speaker.id !== speaker_id
      ),
    });
    get().sendOverSocket('[!DELETE_SPEAKER]' + speaker_id);
  },
  updateSpeaker: (speaker_id, new_name, new_color_id) => {
    set({
      speakersList: get().speakersList.map(speaker => {
        if (speaker.id === speaker_id) {
          return {
            id: speaker_id,
            name: new_name,
            color_id: new_color_id,
          };
        } else {
          return speaker;
        }
      }),
    });
  },
  transcriptContent: demoMeeting,
  appendTranscriptContent: (speaker_id, text) => {
    const speaker = get().speakersList.find(
      speaker => speaker.id === speaker_id
    );
    const length = get().transcriptContent.length;
    if (
      length > 0 &&
      get().transcriptContent[length - 1].speaker_id === speaker_id
    ) {
      set({
        transcriptContent: get().transcriptContent.map((item, index) => {
          if (index === get().transcriptContent.length - 1) {
            return {
              ...item,
              content: item.content + ' ' + text,
            };
          } else {
            return item;
          }
        }),
      });
    } else {
      set({
        transcriptContent: [
          ...get().transcriptContent,
          {
            speaker_id: speaker ? speaker.id : null,
            name: speaker ? speaker.name : 'Unknown Speaker',
            color_id: speaker ? speaker.color_id : 0,
            content: text,
            timestamp: Date.now(),
          },
        ],
      });
    }
  },
  actionContent: demoActions,
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
