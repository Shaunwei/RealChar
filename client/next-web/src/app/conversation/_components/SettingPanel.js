import { Button } from '@nextui-org/button';
import { RiHeadphoneLine } from 'react-icons/ri';
import { MdOutlineLanguage, MdOutlineAutoAwesomeMosaic } from 'react-icons/md';
import { useState } from 'react';
import AudioPanel from './AudioPanel';
import LanguagePanel from './LanguagePanel';
import EnhancePanel from './EnhancePanel';

export default function SettingPanel({
  microphone,
  microphoneList,
  handleMicrophoneSelect,
  speaker,
  speakerList,
  handleSpeakerSelect,
}) {
  const [openedPanel, setOpenedPanel] = useState('audio');

  return (
    <div className="flex flex-row min-h-[400px]">
      <div className="flex flex-col gap-4 pr-10 border-r-2 border-white/10">
        <Button
          size="lg"
          radius="sm"
          className={`justify-start text-lg font-light ${openedPanel==='audio'?'bg-white/10':'bg-transparent'}`}
          onPress={() => setOpenedPanel('audio')}
        >
          <RiHeadphoneLine/>Audio
        </Button>
        <Button
          size="lg"
          radius="sm"
          className={`justify-start text-lg font-light ${openedPanel==='language'?'bg-white/10':'bg-transparent'}`}
          onPress={() => setOpenedPanel('language')}
        >
          <MdOutlineLanguage/>Language
        </Button>
        <Button
          size="lg"
          radius="sm"
          className={`justify-start text-lg font-light ${openedPanel==='enhance'?'bg-white/10':'bg-transparent'}`}
          onPress={() => setOpenedPanel('enhance')}
        >
          <MdOutlineAutoAwesomeMosaic/>Enhancements
        </Button>
      </div>
      <div className="pl-10 w-full">
      {openedPanel === 'audio' && (
        <AudioPanel
          microphone={microphone}
          microphoneList={microphoneList}
          handleMicrophoneSelect={handleMicrophoneSelect}
          speaker={speaker}
          speakerList={speakerList}
          handleSpeakerSelect={handleSpeakerSelect}
        />
      )}
      {openedPanel === 'language' && (
        <LanguagePanel/>
      )}
      {openedPanel === 'enhance' && (
        <EnhancePanel/>
      )}
      </div>
    </div>
  );
}
