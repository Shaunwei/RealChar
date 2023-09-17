import {
  RiThumbUpLine,
  RiThumbDownLine
} from 'react-icons/ri';
import { Button } from '@nextui-org/button';
import { useAppStore } from '@/lib/store';

export default function Chat({
  size
}) {
  const { chatContent, interimChat } = useAppStore();

  let height = '';
  switch (size) {
    case 'sm':
      height = 'h-[20vh]';
      break;
    case 'lg':
      height = 'h-[50vh]';
      break;
  }

  return (
    <div className={`flex flex-col gap-5 md:mt-4 overflow-y-scroll ${height}`}>
      {
        [...chatContent, interimChat].sort((a, b) => {
          if (!a) {
            return 1;
          } else if (!b) {
            return -1;
          } else {
            return a.timestamp > b.timestamp ? 1 : -1;
          }
        })?.map((line) => {
          if (line && line.hasOwnProperty('from') && line.from === 'character') {
            return (
              <div
                key={line.hasOwnProperty('timestamp') ? line.timestamp: 0}
                className="flex flex-col md:flex-row self-start items-start md:items-stretch"
              >
                <p className="w-60 md:w-fit md:text-lg py-2 px-5 font-light flex-none rounded-full md:mr-3 rounded-bl-none bg-real-navy/20">{line.content}</p>
                <div><Button
                  isIconOnly
                  radius="full"
                  variant="light"
                  className="text-white/50 hover:text-white hover:bg-button min-w-fit md:min-w-10 md:h-10"
                >
                  <RiThumbUpLine size="1.5em"/>
                </Button>
                <Button
                  isIconOnly
                  radius="full"
                  variant="light"
                  className="text-white/50 hover:text-white hover:bg-button min-w-fit md:min-w-10 md:h-10"
                >
                  <RiThumbDownLine size="1.5em"/>
                </Button>
                </div>
              </div>
            );
          } else if (line && line.hasOwnProperty('from') && line.from === 'user') {
            return (
              <div
                key={line.timestamp}
                className="self-end"
              >
                <p className="w-60 md:w-fit md:text-lg py-2 px-5 font-light flex-none rounded-full rounded-br-none bg-real-navy/50">{line.content}</p>
              </div>
            )
          }
        })
      }
    </div>
  );
}
