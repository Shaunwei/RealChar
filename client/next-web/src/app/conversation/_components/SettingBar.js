import SpeakerControl from './SpeakerControl';
import MicrophoneControl from './MicrophoneControl';
import LanguageModelControl from './LanguageModelControl';
import ShareButton from './ShareButton';
import SettingsButton from './SettingsButton';
import { Avatar } from '@nextui-org/avatar';

export default function SettingBar({
  mode,
  inputMode,
  character,
  isMute,
  speaker,
  speakerList,
  toggleMute,
  handleSpeakerSelect,
  microphone,
  microphoneList,
  handleMicrophoneSelect,
  model,
  modelList,
  handleLanguageModel,
  chatContent,
  openSettings
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
        <MicrophoneControl
          isDisabled={mode==='text'&&inputMode==='keyboard'}
          microphone={microphone}
          microphoneList={microphoneList}
          handleMicrophoneSelect={handleMicrophoneSelect}
        />
      </div>
      { mode==="text" && (
        <div className="flex gap-1">
          <Avatar
            name={character.name}
            src={character.image_url}
          />
          <span className="text-3xl">{character.name}</span>
        </div>
        )
      }
      <div className="flex gap-8">
        <LanguageModelControl
          model={model}
          modelList={modelList}
          handleLanguageModel={handleLanguageModel}
        />
        <ShareButton
          character={character}
          chatContent={chatContent}
        />
        <SettingsButton
          openSettings={openSettings}
        />
      </div>
    </div>
  );
}
