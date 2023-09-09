import {
  Select,
  SelectItem,
  Button,
  Progress,
} from '@nextui-org/react';
import {
  MdOutlineVolumeMute,
  MdOutlineVolumeUp,
} from 'react-icons/md';
import Slider from '@/components/Slider';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';

export default function AudioPanel() {
  const {
    speakerList,
    microphoneList,
    selectedSpeaker,
    selectedMicrophone,
    handleSpeakerSelect,
    handleMicrophoneSelect,
   } = useAppStore();

// get/set volume
// testing audio
  const currentOutputVolume = 30;
  const currentInputVolume = 50;

  const [testSpeaker, setTestSpeaker] = useState(false);
  const [testMic, setTestMic] = useState(false);
  const [outputVolume, setOutputVolume] = useState(currentOutputVolume);
  const [inputVolume, setInputVolume] = useState(currentInputVolume);

  function handleTestSpeaker() {
    setTestSpeaker(true);
    // todo
  }

  function stopTestSpeaker() {
    setTestSpeaker(false);
    // todo
  }

  function handleTestMic() {
    setTestMic(true);
    // todo
  }

  function stopTestMic() {
    setTestMic(false);
    // todo
  }

  function handleOutputVolume(e) {
    setOutputVolume(e.target.value);
    // todo
  }

  function handleInputVolume(e) {
    setInputVolume(e.target.value);
    // todo
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <header>Speaker</header>
        <div className="grid grid-cols-3 gap-4">
          <Select
            labelPlacement="outside"
            aria-label="speaker select"
            selectedKeys={selectedSpeaker}
            onSelectionChange={handleSpeakerSelect}
            radius="sm"
            size="lg"
            classNames={{
              base: "col-span-2",
              trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
              value: 'text-lg font-light pl-4',
              popover: 'bg-dropdown',
            }}
          >
            {speakerList.map((item) => (
              <SelectItem key={item.deviceId} textValue={item.label}>
                <div className="text-lg font-light">{item.label}</div>
              </SelectItem>
            ))}
          </Select>
          {testSpeaker ? (
            <Button
              radius="sm"
              className="font-light text-lg bg-real-contrastBlue h-12"
              onPress={stopTestSpeaker}
            >Stop</Button>
          ) : (
            <Button
              radius="sm"
              className="font-light text-lg bg-real-contrastBlue h-12"
              onPress={handleTestSpeaker}
            >Test speaker</Button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3 text-base lg:text-lg text-white/50">
          <span>Output level</span>
          <div className="col-span-3">
            <Progress color="success" aria-label="output level" value={60} className="max-w-md"
              classNames={{
                track: "rounded-none h-5",
                indicator: "rounded-none h-5 bg-success"
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 text-base lg:text-lg text-white/50">
          <span>Output volume</span>
          <div className="col-span-3 flex flex-row gap-2 items-center">
            <span className="text-real-navy/60"><MdOutlineVolumeMute size="1.25em"/></span>
            <Slider
              value={outputVolume}
              onValueChange={handleOutputVolume}
            />
            <span className="text-real-navy/60"><MdOutlineVolumeUp size="1.25em"/></span>
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-4 mt-10">
        <header>Microphone</header>
        <div className="grid grid-cols-3 gap-4">
          <Select
            labelPlacement="outside"
            aria-label="microphone select"
            selectedKeys={selectedMicrophone}
            onSelectionChange={handleMicrophoneSelect}
            radius="sm"
            size="lg"
            classNames={{
              base: "col-span-2",
              trigger: 'bg-white/10 data-[hover=true]:bg-white/20',
              value: 'text-lg font-light pl-4',
              popover: 'bg-dropdown',
            }}
          >
            {microphoneList.map((item) => (
              <SelectItem key={item.deviceId} textValue={item.label}>
                <div className="text-lg font-light">{item.label}</div>
              </SelectItem>
            ))}
          </Select>
          {testMic ? (
            <Button
              radius="sm"
              className="font-light text-lg bg-real-contrastBlue h-12"
              onPress={stopTestMic}
            >Stop</Button>
          ) : (
            <Button
              radius="sm"
              className="font-light text-lg bg-real-contrastBlue h-12"
              onPress={handleTestMic}
            >Test mic</Button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3 text-base lg:text-lg text-white/50">
          <span>Input level</span>
          <div className="col-span-3">
            <Progress color="success" aria-label="input level" value={10} className="max-w-md"
              classNames={{
                track: "rounded-none h-5",
                indicator: "rounded-none h-5 bg-success"
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 text-base lg:text-lg text-white/50">
          <span>Input volume</span>
          <div className="col-span-3 flex flex-row gap-2 items-center">
            <span className="text-real-navy/60"><MdOutlineVolumeMute size="1.25em"/></span>
            <Slider
              value={inputVolume}
              onValueChange={handleInputVolume}
            />
            <span className="text-real-navy/60"><MdOutlineVolumeUp size="1.25em"/></span>
          </div>
        </div>
      </section>
    </>
  )
}
