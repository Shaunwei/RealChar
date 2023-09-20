import Chat from './Chat';
import { useAppStore } from '@/lib/store';

export default function HandsFreeMode({ isDisplay }) {
  const { character } = useAppStore();
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section className={`flex flex-col gap-6 justify-center ${display}`}>
      <div className='font-light sm:text-lg text-center md:py-5'>
        Start your conversation by talking to {character.name}
      </div>
    </section>
  );
}
