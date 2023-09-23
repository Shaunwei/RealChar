import Chat from './Chat';
import { useAppStore } from '@/lib/store'
import {
  motion,
  AnimatePresence
} from 'framer-motion';

export default function HandsFreeMode({
  isDisplay
}) {
  const { character, isRecording, speechInterim } = useAppStore();
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section className={`flex flex-col gap-6 justify-center ${display}`}>
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="font-light sm:text-lg text-center py-5"
          >
              {speechInterim?  speechInterim: 'Listening...'}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
