import { Button, Radio, RadioGroup, Select, SelectItem } from '@nextui-org/react';
import { TbTrash } from 'react-icons/tb';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/zustand/store';
import { BsUpload } from 'react-icons/bs';
import RecordButton from './RecordButton';

export default function TTSVoice() {
  const audioRef = useRef(null);
  const uploaderRef = useRef(null);
  const {
    setVoiceSamplePlayer,
    voiceSampleUrl,
    formData,
    ttsOptions,
    voiceFilters,
    getVoiceFilterOptions,
    getFilteredVoiceOptions,
    getCurrentVoiceOption,
    voiceOptions,
    voiceOptionsMode,
    setVoiceOptionsMode,
    handleVoiceFiles,
    voiceFiles,
    cloneVoice,
    voiceErrorMsg,
    handleDeleteVoiceFile,
    handleTtsOptionsChange,
    handleVoiceFilterChange,
    handleVoiceSelect,
    handleVoiceSampleLoad,
    clonedVoice,
  } = useAppStore();

  useEffect(() => {
    setVoiceSamplePlayer(audioRef.current);
  }, []);

  function handleClick() {
    uploaderRef.current.click();
  }

  return (
    <>
      <audio ref={audioRef} src={voiceSampleUrl} onLoadedData={handleVoiceSampleLoad} />
      <div className='flex flex-col gap-1'>
        <h4 className='font-medium'>Text-to-Speech Service</h4>
        <RadioGroup
          orientation='horizontal'
          value={formData.tts}
          onValueChange={handleTtsOptionsChange}
        >
          {ttsOptions.map((option) => (
            <Radio key={option.value} value={option.value}>
              {option.text}
            </Radio>
          ))}
        </RadioGroup>
      </div>
      {voiceOptions[formData.tts] && (
        <div className='flex flex-col gap-1'>
          <h4 className='font-medium'>Voice</h4>
          <RadioGroup
            orientation='horizontal'
            value={voiceOptionsMode}
            onValueChange={(value) => setVoiceOptionsMode(value)}
          >
            <Radio value='selectVoice'>Select Voice</Radio>
            {formData.tts === 'ELEVEN_LABS' && clonedVoice === '' && (
              <Radio value='placeholder'>Clone a new voice</Radio>
            )}
            {formData.tts === 'ELEVEN_LABS' &&
              clonedVoice !== '' &&
              clonedVoice !== 'isLoading' && (
                <Radio value={clonedVoice}>Cloned voice-{clonedVoice.substring(0, 6)}</Radio>
              )}
          </RadioGroup>
          <div className={voiceOptionsMode === 'selectVoice' ? 'flex' : 'hidden'}>
            {voiceFilters[formData.tts]?.map((filter) => (
              <Select
                className='mx-1 w-1/5'
                variant='bordered'
                size='sm'
                key={filter.label}
                aria-label='select voice'
                selectedKeys={[filter.value]}
                onSelectionChange={(value) => handleVoiceFilterChange(filter, [...value][0])}
              >
                {getVoiceFilterOptions(filter).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </Select>
            ))}
            <Select
              className='mx-1 w-1/3'
              variant='bordered'
              size='sm'
              aria-label='select voice'
              selectedKeys={[getCurrentVoiceOption()?.voice_id]}
              onSelectionChange={(value) => handleVoiceSelect([...value][0])}
            >
              {getFilteredVoiceOptions().map((option) => (
                <SelectItem key={option.voice_id} value={option.voice_id}>
                  {option.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className={voiceOptionsMode === 'placeholder' ? 'flex' : 'hidden'}>
            <div className='flex flex-col'>
              <div className='flex flex-row gap-5 mt-3 items-center'>
                <RecordButton />
                <span className='font-light'>or</span>
                <Button
                  onPress={handleClick}
                  className='bg-real-contrastBlue'
                  startContent={<BsUpload />}
                >
                  Upload
                </Button>
              </div>
              <input
                ref={uploaderRef}
                type='file'
                multiple
                onChange={handleVoiceFiles}
                className='hidden'
              />
              <p className='text-tiny text-danger'>{voiceErrorMsg}</p>
              {voiceFiles.length > 0 && (
                <ul className='mt-3'>
                  {voiceFiles.map((file) => (
                    <li key={file.name}>
                      <p className='text-small flex flex-row gap-2'>
                        <span>{file.name}</span>
                        <Button
                          isIconOnly
                          size='sm'
                          variant='light'
                          onPress={() => handleDeleteVoiceFile(file.name)}
                          className='text-danger h-fit'
                        >
                          <TbTrash size='1.4em' />
                        </Button>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {voiceFiles.length > 0 && (
                <div className='mt-2'>
                  <Button
                    isLoading={clonedVoice === 'isLoading'}
                    isDisabled={voiceFiles.length == 0}
                    onPress={cloneVoice}
                    className='bg-real-contrastBlue'
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
