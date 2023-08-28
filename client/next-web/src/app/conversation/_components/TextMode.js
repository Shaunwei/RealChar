import Chat from './Chat';
import InputField from './InputField';

export default function TextMode({
  isDisplay,
  chatContent
}) {
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section
      className={`flex flex-col gap-6 ${display}`}
    >
      <Chat chatContent={chatContent} />
      <div>
        <InputField />
      </div>
    </section>
  );
}
