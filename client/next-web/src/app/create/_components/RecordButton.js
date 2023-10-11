import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  useDisclosure,
} from '@nextui-org/react';
import { BsRecordCircle } from 'react-icons/bs';
import WsRecord from './WsRecord';
import WsPlayer from './WsPlayer';
import { useState, useEffect } from 'react';

export default function RecordButton() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showRecorder, setShowRecorder] = useState(true);
  const [blob, setBlob] = useState(null);

  function handleRetry() {
    setShowRecorder(true);
  }

  useEffect(() => {
    setShowRecorder(true);
  }, [isOpen]);

  return (
    <>
      <Button
        onPress={onOpen}
        className="bg-real-contrastBlue"
        startContent={<BsRecordCircle />}
      >
        Record
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        classNames={{
          base: 'rounded-none font-light border-modalBorder bg-modalBG border-2 md:max-w-3xl md:py-16 md:px-28',
          header: 'text-center font-light justify-center md:text-3xl',
          body: 'text-sm md:text-lg py-0',
          footer: 'justify-center',
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h1>Record Voice</h1>
          </ModalHeader>
          <ModalBody>
            <p>Record your voice by reading the paragraph below.</p>
            <div className="bg-white/10 p-3 rounded-lg">
              The sun was setting, turning the sky pink and orange. Everywhere
              you looked, the world seemed to be covered in a warm, glowing
              light. Leaves on the trees moved softly in the wind, making a
              gentle rustling sound. Birds were chirping loudly, happy to be
              heading home.
            </div>
            <div className="mb-4 h-24">
              {showRecorder ? (
                <WsRecord
                  setBlob={setBlob}
                  setShowRecorder={setShowRecorder}
                />
              ) : (
                <WsPlayer
                  blob={blob}
                  handleRetry={handleRetry}
                  onClose={onClose}
                />
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
