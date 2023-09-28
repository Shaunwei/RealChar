import { Button, Textarea } from '@nextui-org/react';
import { TbTrash } from 'react-icons/tb';
import { useRef } from 'react';
import { useAppStore } from '@/lib/store';

export default function BackgroundArea() {
  const uploaderRef = useRef(null);
  const {
    backgroundText,
    setBackgroundText,
    backgroundFiles,
    errorMsg,
    handleBackgroundFiles,
    handleDeleteFile,
  } = useAppStore();

  function handleClick() {
    uploaderRef.current.click();
  }

  return (
    <div className="flex flex-col gap-3">
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
      <p className="text-small">Choose up to 5 files related to your character. Only txt, cvs and pdf types are allowed.</p>
      <div>
        <Button
          onPress={handleClick}
          className="bg-real-contrastBlue"
        >
          Choose file to upload (Optional)
        </Button>
        <input
          ref={uploaderRef}
          type="file"
          multiple
          onChange={handleBackgroundFiles}
          className="hidden"
        />
        <p className="text-tiny text-danger">{errorMsg}</p>
        {backgroundFiles.length > 0 && (
          <ul className="flex flex-col gap-2 pt-3">
            {backgroundFiles.map(file => (
              <li key={file.lastModified}>
                <p className="text-small flex flex-row gap-2">
                  <span>{file.name}</span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleDeleteFile(file.name)}
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
  );
}
