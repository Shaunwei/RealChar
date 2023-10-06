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
import AvatarUploader from '../create/_components/AvatarUploader';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import lz from 'lz-string';

export default function EditCharacter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterRef = useRef({});
  const {
    formData,
    setFormData,
    getCharacterForEdit,
    backgroundText,
    setBackgroundText,
    deleteCharacter,
    submitEdit,
  } = useAppStore();

  useEffect(() => {
    const characterString = searchParams.get('character');
    characterRef.current = JSON.parse(lz.decompressFromEncodedURIComponent(characterString));
    getCharacterForEdit(characterRef.current);
  }, []);

  function handleEdit() {
    submitEdit(characterRef.current.character_id).then(() => {
      console.log('submit the changes');
      router.push('/');
    });
  }

  function handleDelete() {
    deleteCharacter(characterRef.current).then(() => {
      console.log('delete the character');
      router.push('/');
    });
  }

  return (
    <>
      <Header />
      <form
        className="py-5 px-4 flex flex-col justify-center gap-5 md:w-unit-9xl md:mx-auto lg:w-[892px] lg:gap-8"
      >
        <h1 className="text-center text-2xl font-medium">{formData.name}</h1>
        <AvatarUploader />
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
        <div>
          <Textarea
            label="Background"
            labelPlacement="outside"
            placeholder="Provide some background information about your character"
            classNames={{
              label: "text-base",
              inputWrapper: [
                'bg-white/10',
                'data-[hover=true]:bg-white/10',
                'group-data-[focus=true]:bg-white/10'
              ]
            }}
            value={backgroundText}
            onValueChange={setBackgroundText}
          />
        </div>
        <div>
          <Textarea
            label="System Prompt(required)"
            labelPlacement="outside"
            placeholder="Write your own prompt"
            classNames={{
              label: "text-base",
              inputWrapper: [
                'bg-white/10',
                'data-[hover=true]:bg-white/10',
                'group-data-[focus=true]:bg-white/10'
              ]
            }}
            value={formData.system_prompt}
            onValueChange={(value) =>
              setFormData({
                system_prompt: value
              })
            }
          />
        </div>
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
        <div className="flex flex-row gap-5">
          <Button
            onPress={handleEdit}
            className="bg-real-contrastBlue grow"
          >
            Confirm
          </Button>
          <Button
            onPress={handleDelete}
            color="danger"
            className="grow"
          >
            Delete
          </Button>
        </div>
        <p className="text-tiny text-warning">*It may take 30 seconds to see the changes.</p>
      </form>
      <Footer />
    </>
  );
}
