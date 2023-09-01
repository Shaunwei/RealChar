import SpeakerControl from './SpeakerControl';
import MicrophoneControl from './MicrophoneControl';
import LanguageModelControl from './LanguageModelControl';
import ShareButton from './ShareButton';
import SettingsButton from './SettingsButton';
import { Avatar } from '@nextui-org/avatar';

export default function SettingBar({
  mode,
  character,
  isMute,
  speaker,
  speakerList,
  toggleMute,
  handleSpeakerSelect,
  microphone,
  microphoneList,
  handleMicrophoneSelect,
  chatContent
}) {
  return (
    <div className="flex justify-between">
      <div className="flex gap-6">
        <SpeakerControl
          isMute={isMute}
          speaker={speaker}
          speakerList={speakerList}
          toggleMute={toggleMute}
          handleSpeakerSelect={handleSpeakerSelect}
        />
        {mode==="handsFree" && (
          <MicrophoneControl
            microphone={microphone}
            microphoneList={microphoneList}
            handleMicrophoneSelect={handleMicrophoneSelect}
          />
        )}
      </div>
      { mode==="text" && (
        <div className="flex gap-1 items-center">
          <Avatar
            name={character.name}
            src={character.image_url}
          />
          <span className="lg:text-3xl">{character.name}</span>
        </div>
        )
      }
      <div className="flex gap-8">
        <LanguageModelControl/>
        <ShareButton
          character={character}
          chatContent={chatContent}
        />
        <SettingsButton
          microphone={microphone}
          microphoneList={microphoneList}
          handleMicrophoneSelect={handleMicrophoneSelect}
          speaker={speaker}
          speakerList={speakerList}
          handleSpeakerSelect={handleSpeakerSelect}
        />
      </div>
    </div>
  );
}
