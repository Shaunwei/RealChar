import { useAppStore } from '@/zustand/store';
import { useRef, useEffect, useState } from 'react';
import SpeakerManage from './SpeakerManage';
import EditableText from './EditableText';

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
  const containerRef = useRef();
  const { transcriptParagraph, getSpeakerName, getSpeakerColor } =
    useAppStore();

  useEffect(() => {
    const { top } = msgEndRef.current.getBoundingClientRect();
    const { bottom } = containerRef.current.getBoundingClientRect();
    if (top > 0 && top <= bottom + 20) {
      // auto scroll
      msgEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [transcriptParagraph]);

  return (
    <>
      <h2 className="py-1 pl-4 bg-real-blue-500/90 text-small md:text-base font-medium sticky top-24 flex flex-row justify-between z-[1]">
        Transcript
        <SpeakerManage colors={transcriptColors} />
      </h2>
      <div
        className="grow overflow-y-auto"
        ref={containerRef}
      >
        <div className="h-[90px]"></div>
        <ul className="flex flex-col gap-3 p-4">
          {transcriptParagraph.map(paragraph => (
            <li key={paragraph.id}>
              <div
                className={`${
                  getSpeakerColor(paragraph.speaker_id) !== -1
                    ? transcriptColors[getSpeakerColor(paragraph.speaker_id)]
                    : 'text-white-300'
                } flex flex-row gap-2 gap-y-1 flex-wrap`}
              >
                <span className="inline-block">
                  {getSpeakerName(paragraph.speaker_id)}:
                </span>
                {/* <p className='inline-flex flex-row gap-1'> */}
                {paragraph.lines.map(line => (
                  <EditableText
                    key={line.id}
                    line={line}
                    color={
                      getSpeakerColor(paragraph.speaker_id) !== -1
                        ? transcriptColors[
                            getSpeakerColor(paragraph.speaker_id)
                          ]
                        : 'text-white-300'
                    }
                  />
                ))}
                {/* </p> */}
              </div>
            </li>
          ))}
          <li ref={msgEndRef}></li>
        </ul>
      </div>
    </>
  );
}
