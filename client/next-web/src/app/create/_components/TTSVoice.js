import {
  Button,
  Radio,
  RadioGroup
} from '@nextui-org/react';
import { TbTrash } from 'react-icons/tb';
import { useRef } from 'react';
import { useAppStore } from '@/lib/store';

export default function TTSVoice() {
  const uploaderRef = useRef(null);
  const {
    formData,
    setFormData,
    ttsOptions,
    voiceOptions,
    handleVoiceFiles,
    voiceFiles,
    cloneVoice,
    voiceErrorMsg,
    handleDeleteVoiceFile
  } = useAppStore();

  function handleClick() {
    uploaderRef.current.click();
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h4 className="font-medium">Text-to-Speech Service</h4>
        <RadioGroup
          orientation="horizontal"
          value={formData.tts}
          onValueChange={(value) =>
            setFormData({ tts: value })
          }
        >
          {ttsOptions.map(option => (
            <Radio key={option.value} value={option.value}>{option.text}</Radio>
          ))}
        </RadioGroup>
      </div>
      {voiceOptions[formData.tts] && (
        <div className="flex flex-col gap-1">
          <h4 className="font-medium">Voice</h4>
          <RadioGroup
            orientation="horizontal"
            value={formData.voice_id}
            onValueChange={(value) =>
              setFormData({ voice_id: value })
            }
          >
            {voiceOptions[formData.tts].map(voice => (
              <Radio key={voice.label} value={voice.voice_id}>{voice.label}</Radio>
            ))}
            {formData.tts === 'ELEVEN_LABS' && (
              <Radio value="placeholder">Clone a new voice</Radio>
            )}
          </RadioGroup>
          <div className={formData.voice_id === 'placeholder' ? 'flex' : 'hidden'}>
            <div className="flex flex-col">
              <div className="flex flex-row gap-10 mt-3">
                <Button
                  onPress={handleClick}
                  className="bg-real-contrastBlue"
                >
                  Choose File
                </Button>
                <Button
                  isDisabled={voiceFiles.length==0}
                  onPress={cloneVoice}
                  className="bg-real-contrastBlue"
                >
                  Clone Voice
                </Button>
              </div>
              <input
                ref={uploaderRef}
                type="file"
                multiple
                onChange={handleVoiceFiles}
                className="hidden"
              />
              <p className="text-tiny text-danger">{voiceErrorMsg}</p>
              {voiceFiles.length>0 && (
                <ul className="mt-3">
                  {voiceFiles.map(file => (
                    <li key={file.name}>
                      <p className="text-small flex flex-row gap-2">
                        <span>{file.name}</span>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleDeleteVoiceFile(file.name)}
                          className="text-danger h-fit"
                        >
                          <TbTrash size="1.4em" />
                        </Button>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
