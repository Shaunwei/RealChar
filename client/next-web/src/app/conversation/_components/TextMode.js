import Chat from './Chat';
import InputField from './InputField';
import { useAppStore } from '@/lib/store';

export default function TextMode({
  isDisplay,
}) {
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section
      className={`flex flex-col gap-6 ${display}`}
    >
      <Chat/>
      <div>
        <InputField />
      </div>
    </section>
  );
}
