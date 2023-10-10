import { useAppStore } from '@/zustand/store';
import { useRef, useEffect } from 'react';

const transcriptColors = [
  'text-blue-300',
  'text-purple-300',
  'text-green-300',
  'text-red-300',
  'text-pink-300',
  'text-yellow-300',
  'text-cyan-300'
];

export default function Transcript() {
  const msgEndRef = useRef();
  const {
    transcriptContent
  } = useAppStore();

  useEffect(() => {
    msgEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: 'center',
      inline: 'nearest'
    })
  }, [transcriptContent])

  return (
    <>
    <h2 className="py-1 px-4 bg-real-blue-500/90 text-small md:text-base font-medium sticky top-24">Transcript</h2>
      <div className="grow overflow-y-auto">
      <div className="h-[90px]"></div>
      <ul className="flex flex-col gap-3 p-4">
        {transcriptContent.map(line => (
          <li key={line.timestamp}>
              <span className={`${transcriptColors[line.color_id]}`}>{line.name}: {line.content}</span>
          </li>
        ))}
        <li ref={msgEndRef}></li>
      </ul>
    </div>
    </>
  );
}
