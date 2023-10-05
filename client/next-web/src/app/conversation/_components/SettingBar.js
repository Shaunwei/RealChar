import SpeakerControl from './SpeakerControl';
import MicrophoneControl from './MicrophoneControl';
import LanguageModelControl from './LanguageModelControl';
import ShareButton from './ShareButton';
import SettingsButton from './SettingsButton';
import { Avatar } from '@nextui-org/avatar';
import { useAppStore } from '@/lib/store';

export default function SettingBar({
  isTextMode,
  isMute,
  toggleMute,
  disableMic,
  handleMic
}) {
  const { character } = useAppStore();

  return (
    <>
    <div className={`flex flex-row px-4 ${isTextMode?"justify-center":"justify-end"} md:hidden`}>
      {isTextMode && (
      <div className="flex gap-1 items-center">
        <Avatar
          name={character.name}
          src={character.image_url}
        />
        <span className="pl-2">{character.name}</span>
        <div>
          <SpeakerControl
            isMute={isMute}
            toggleMute={toggleMute}
          />
        </div>
      </div>
      )}
    </div>
    <div className="hidden md:flex flex-row-reverse justify-between">
      <div className="flex gap-8">
        <LanguageModelControl />
        <ShareButton />
        <SettingsButton />
      </div>
      {isTextMode && (
      <div className="flex gap-2">
        <div className="flex gap-1 items-center">
          <Avatar
            name={character.name}
            src={character.image_url}
          />
          <span className="lg:text-2xl">{character.name}</span>
        </div>
        <SpeakerControl
          isMute={isMute}
          toggleMute={toggleMute}
        />
        {!isTextMode && (
          <MicrophoneControl
            isDisabled={disableMic}
            handleMic={handleMic}
          />
        )}
      </div>
      )}
      {!isTextMode && (<p className="text-center text-2xl">{character.name}</p>)}
    </div>
    {!isTextMode && (
    <div>
          <p className="block md:hidden text-center text-2xl mt-4">{character.name}</p>
      <div className="mt-4 flex flex-row gap-4 md:gap-8 justify-center">
        <div>
          <Avatar
            name={character.name}
            src={character.image_url}
            classNames={{
              base: "block w-56 h-56 mx-auto"
            }}
          />
        </div>
        <div className="flex flex-col gap-8 justify-end">
            <SpeakerControl
              isMute={isMute}
              toggleMute={toggleMute}
            />
            <MicrophoneControl
              isDisabled={disableMic}
              handleMic={handleMic}
            />
        </div>
      </div>

    </div>
    )}
    </>
  );
}
