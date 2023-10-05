'use client'

import {
  Button,
  Input,
  Textarea,
  Radio,
  RadioGroup,
  Tooltip,
} from '@nextui-org/react';
import { MdInfoOutline } from 'react-icons/md';
import Header from '../_components/Header';
import Footer from '../_components/Footer';
import AvatarUploader from './_components/AvatarUploader';
import BackgroundArea from './_components/BackgroundArea';
import SystemPrompt from './_components/SystemPrompt';
import TTSVoice from './_components/TTSVoice';

import { useAppStore } from '@/lib/store';
import {useRouter} from "next/navigation";

export default function Create() {
  const {
    formData,
    setFormData,
    submitForm,
  } = useAppStore();
  const router = useRouter();

  const handleSubmit = ()=> {
    submitForm().then(() => {
      console.log("createCharacter form submitted.");
      router.push('/');
    })
  };

  return (
    <>
      <Header/>
      <form
        className="py-5 px-4 flex flex-col justify-center gap-5 md:w-unit-9xl md:mx-auto lg:w-[892px] lg:gap-8"
      >
        <h1 className="text-center text-2xl font-medium">Create a character</h1>
        <AvatarUploader/>
        <div>
          <Input
            type="text"
            label="Name"
            labelPlacement="outside"
            placeholder="Name your character"
            value={formData.name}
            onValueChange={(value) =>
              setFormData({
                name: value
              })
            }
            classNames={{
              label: "text-base",
              inputWrapper: [
                'bg-white/10',
                'data-[hover=true]:bg-white/10',
                'group-data-[focus=true]:bg-white/10'
              ]
            }}
          />
        </div>
        <BackgroundArea/>
        <SystemPrompt/>
        <div>
          <Textarea
            label="User Prompt"
            labelPlacement="outside"
            placeholder=""
            classNames={{
              label: "text-base",
              inputWrapper: [
                'bg-white/10',
                'data-[hover=true]:bg-white/10',
                'group-data-[focus=true]:bg-white/10'
              ]
            }}
            value={formData.user_prompt}
            onValueChange={(value) =>
              setFormData({
                user_prompt: value
              })
            }
          />
        </div>
        <TTSVoice/>
        <div className="flex flex-col gap-1">
          <h4 className="font-medium flex flex-row gap-1 items-center">
            Visibility
              <Tooltip content={
                <div className="w-fit h-fit text-tiny py-1 px-1">If set to public, the character will be visible to everyone after review.</div>
              }
              >
                <Button isIconOnly size="sm" variant="light" className="p-0 min-w-unit-5 w-5 min-h-unit-5 h-5">
                  <MdInfoOutline size="1.5em" />
                </Button>
            </Tooltip>
          </h4>
          <RadioGroup
            orientation="horizontal"
            value={formData.visibility}
            onValueChange={(value) =>
              setFormData({ visibility: value })
            }
          >
            <Radio value="public">Public</Radio>
            <Radio value="private">Private</Radio>
          </RadioGroup>
        </div>
        <div>
          <Button
            onPress={handleSubmit}
            className="bg-real-contrastBlue w-full"
          >
            Submit
          </Button>
          <p className="text-tiny text-warning">*It may take 30 seconds for the new character to be available.</p>
        </div>
      </form>
      <Footer/>
    </>
  );
}
