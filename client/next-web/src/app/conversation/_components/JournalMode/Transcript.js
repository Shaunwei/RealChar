import { useAppStore } from '@/zustand/store';
import { useRef, useEffect, useState } from 'react';
import SpeakerManage from './SpeakerManage';

const transcriptColors = [
  'text-blue-300',
  'text-purple-300',
  'text-green-300',
  'text-red-300',
  'text-pink-300',
  'text-yellow-300',
  'text-cyan-300',
];

export default function Transcript() {
  const msgEndRef = useRef();
  const { mergedTranscriptContent, getSpeakerName, getSpeakerColor } =
    useAppStore();

  useEffect(() => {
    msgEndRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [mergedTranscriptContent]);

  return (
    <>
      <h2 className='py-1 pl-4 bg-real-blue-500/90 text-small md:text-base font-medium sticky top-24 flex flex-row justify-between'>
        Transcript
        <SpeakerManage colors={transcriptColors} />
      </h2>
      <div className='grow overflow-y-auto'>
        <div className='h-[90px]'></div>
        <ul className='flex flex-col gap-3 p-4'>
          {mergedTranscriptContent.map(line => (
            <li key={line.id}>
              <span
                className={`${
                  getSpeakerColor(line.speaker_id) !== -1
                    ? transcriptColors[getSpeakerColor(line.speaker_id)]
                    : 'text-white-300'
                }`}
              >
                {getSpeakerName(line.speaker_id)}: {line.content}
              </span>
            </li>
          ))}
          <li ref={msgEndRef}></li>
        </ul>
      </div>
    </>
  );
}
