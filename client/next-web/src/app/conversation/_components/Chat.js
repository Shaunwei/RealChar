import {
  RiThumbUpLine,
  RiThumbDownLine
} from 'react-icons/ri';
import { Button } from '@nextui-org/button';
import { useAppStore } from '@/lib/store';

export default function Chat() {
  const { chatContent } = useAppStore();

  return (
    <div className="flex flex-col gap-5 mt-4">
      {
        chatContent?.map((line) => {
          if (line.from === 'character') {
            return (
              <div
                key={line.timeStamp}
                className="flex flex-row self-start"
              >
                <p className="w-fit text-lg py-2 px-5 font-light flex-none rounded-full mr-3 rounded-bl-none bg-real-navy/20">{line.content}</p>
                <Button
                  isIconOnly
                  radius="full"
                  variant="light"
                  className="text-white/50 hover:text-white hover:bg-button"
                >
                  <RiThumbUpLine size="1.5em"/>
                </Button>
                <Button
                  isIconOnly
                  radius="full"
                  variant="light"
                  className="text-white/50 hover:text-white hover:bg-button"
                >
                  <RiThumbDownLine size="1.5em"/>
                </Button>
              </div>
            );
          } else {
            return (
              <div
                key={line.timeStamp}
                className="self-end"
              >
                <p className="w-fit text-lg py-2 px-5 font-light flex-none rounded-full rounded-br-none bg-real-navy/50">{line.content}</p>
              </div>
            )
          }
        })
      }
    </div>
  );
}
