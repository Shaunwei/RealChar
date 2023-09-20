import Chat from './Chat';
import InputField from './InputField';

export default function TextMode({
  isDisplay,
}) {
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section className={`flex flex-col gap-6 ${display}`}>
      <div>
        <InputField />
      </div>
    </section>
  );
}
