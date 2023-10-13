import {
  Button,
  Listbox,
  ListboxItem,
  Modal,
  useDisclosure,
} from '@nextui-org/react';
import { FiSettings, FiPlus } from 'react-icons/fi';
import { TiMicrophone } from 'react-icons/ti';
import { useAppStore } from '@/zustand/store';
import { useState } from 'react';
import EditModal from './EditModal';
import AddModal from './AddModal';

export default function SpeakerManage({ colors }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { speakersList } = useAppStore();
  const [showList, setShowList] = useState(false);
  const [speakerContent, setSpeakerContent] = useState({
    id: null,
    name: '',
    color_id: '',
  });
  const [modalType, setModalType] = useState('');

  function handleEditModal(speaker) {
    setSpeakerContent(speaker);
    setModalType('edit');
    setShowList(false);
    onOpen();
  }

  function handleAddModal() {
    setModalType('add');
    setShowList(false);
    onOpen();
  }

  return (
    <>
      <Button
        onPress={() => setShowList(!showList)}
        isIconOnly
        variant='light'
        aria-label='speaker setting'
        size='sm'
        className='h-5 w-10 data-[hover=true]:opacity-60 data-[hover=true]:bg-transparent'
      >
        <FiSettings size='1.75em' />
      </Button>
      {showList && (
        <div
          className='flex flex-col items-start bg-real-blue-700 rounded-md px-2 py-3 w-36 absolute right-0 top-7'
          aria-label='popover content'
        >
          <div>
            <Button
              onPress={handleAddModal}
              isIconOnly
              variant='light'
              aria-label='add speaker'
              className='h-8 data-[hover=true]:bg-white/20'
            >
              <FiPlus size='1.5em' />
            </Button>
          </div>
          <Listbox variant='flat' aria-label='speaker list'>
            {speakersList?.map(speaker => (
              <ListboxItem
                onPress={() => handleEditModal(speaker)}
                aria-label='speaker'
                key={speaker.id}
                startContent={
                  <span className={`${colors[speaker.color_id]}`}>
                    <TiMicrophone size='1.2em' />
                  </span>
                }
                className='data-[hover=true]:bg-white/20'
              >
                {speaker.name}
              </ListboxItem>
            ))}
          </Listbox>
        </div>
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size='xl'
        classNames={{
          base: 'rounded-none font-light border-modalBorder bg-modalBG border-2 md:max-w-3xl md:py-16 md:px-28',
          header: 'text-center font-light justify-center md:text-3xl',
          body: 'text-sm md:text-lg py-0',
          footer: 'justify-center',
        }}
      >
        {modalType === 'edit' ? (
          <EditModal
            speakerContent={speakerContent}
            colors={colors}
            onClose={onClose}
          />
        ) : (
          <AddModal colors={colors} onClose={onClose} />
        )}
      </Modal>
    </>
  );
}
