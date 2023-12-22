import { Button } from '@nextui-org/react';
import { useAppStore } from '@/zustand/store';
import { useRef, useEffect } from 'react';

export default function ActionPanel() {
  const msgEndRef = useRef();
  const { actionContent } = useAppStore();

  useEffect(() => {
    msgEndRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [actionContent]);

  return (
    <>
      <h2 className="py-1 px-4 bg-real-blue-500/90 text-small md:text-base font-medium sticky top-0 lg:top-24 z-[1]">
        Highlights and Actions
      </h2>
      <div className="grow overflow-y-auto">
        <div className="hidden h-[90px] lg:flex"></div>
        <ul className="flex flex-col gap-2 p-4 text-tiny">
          {actionContent?.map((action) => {
            if (
              action &&
              action.hasOwnProperty('type') &&
              action.type === 'highlight'
            ) {
              return (
                <li
                  key={action.timestamp}
                  className="p-4 bg-white/10 rounded-lg max-w-[450px]"
                >
                  <div className="quote bg-white/10 p-2 mb-2">
                    <ul className="flex flex-col">
                      {action.detected.map((line, idx) => (
                        <li
                          key={idx}
                          className="before:content-['-'] before:mr-1"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {action.suggested.length > 0 && (
                    <div className="flex flex-row gap-3 items-center">
                      <span>Do you want: </span>
                      <ul className="flex flex-row gap-3">
                        {action.suggested.map((suggestion) => (
                          <li key={suggestion}>
                            <Button
                              size="sm"
                              className="bg-real-contrastBlue"
                            >
                              {suggestion}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            } else if (
              action &&
              action.hasOwnProperty('type') &&
              action.type === 'user'
            ) {
              return (
                <li
                  key={action.timestamp}
                  className="self-end text-base"
                >
                  <p className="w-fit max-w-[450px] py-2 px-5 font-light flex-none rounded-3xl rounded-br-none bg-real-blue-500/50">
                    {action.content}
                  </p>
                </li>
              );
            } else if (
              action &&
              action.hasOwnProperty('type') &&
              action.type === 'character'
            ) {
              return (
                <li
                  key={
                    action.hasOwnProperty('timestamp') ? action.timestamp : 0
                  }
                  className="flex flex-col md:flex-row self-start items-start md:items-stretch text-base"
                >
                  <p className="w-fit max-w-[450px] py-2 px-5 font-light flex-none rounded-3xl md:mr-3 rounded-bl-none bg-real-blue-500/20">
                    {action.content}
                  </p>
                </li>
              );
            }
          })}
          <li ref={msgEndRef}></li>
        </ul>
      </div>
    </>
  );
}
