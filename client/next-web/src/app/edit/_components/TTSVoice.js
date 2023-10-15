import { Button, Radio, RadioGroup } from '@nextui-org/react';
import { TbTrash } from 'react-icons/tb';
import { useRef } from 'react';
import { useAppStore } from '@/zustand/store';
import { BsUpload } from 'react-icons/bs';
import RecordButton from '@/app/create/_components/RecordButton';

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
    handleDeleteVoiceFile,
    clonedVoice,
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
          onValueChange={(value) => setFormData({ tts: value })}
        >
          {ttsOptions.map((option) => (
            <Radio
              key={option.value}
              value={option.value}
            >
              {option.text}
            </Radio>
          ))}
        </RadioGroup>
      </div>
      {voiceOptions[formData.tts] && (
        <div className="flex flex-col gap-1">
          <h4 className="font-medium">Voice</h4>
          <RadioGroup
            orientation="horizontal"
            value={formData.voice_id}
            onValueChange={(value) => setFormData({ voice_id: value })}
          >
            {voiceOptions[formData.tts].map((voice) => (
              <Radio
                key={voice.label}
                value={voice.voice_id}
              >
                {voice.label}
              </Radio>
            ))}
            {formData.tts === 'ELEVEN_LABS' &&
              clonedVoice !== '' &&
              clonedVoice !== 'isLoading' && (
                <Radio value={clonedVoice}>
                  Cloned voice-{clonedVoice.substring(0, 6)}
                </Radio>
              )}
            {formData.tts === 'ELEVEN_LABS' && (
              <Radio value="placeholder">
                {clonedVoice === '' ? (
                  <span>Clone a new voice</span>
                ) : (
                  <span>Update cloned voice</span>
                )}
              </Radio>
            )}
          </RadioGroup>
          <div
            className={formData.voice_id === 'placeholder' ? 'flex' : 'hidden'}
          >
            <div className="flex flex-col">
              <div className="flex flex-row gap-5 mt-3 items-center">
                <RecordButton />
                <span className="font-light">or</span>
                <Button
                  onPress={handleClick}
                  className="bg-real-contrastBlue"
                  startContent={<BsUpload />}
                >
                  Upload
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
              {voiceFiles.length > 0 && (
                <ul className="mt-3">
                  {voiceFiles.map((file) => (
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
              {voiceFiles.length > 0 && (
                <div className="mt-2">
                  <Button
                    isLoading={clonedVoice === 'isLoading'}
                    isDisabled={voiceFiles.length == 0}
                    onPress={cloneVoice}
                    className="bg-real-contrastBlue"
                  >
                    Clone voice
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
