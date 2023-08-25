import Chat from './Chat';

export default function TextMode({
  isDisplay
}) {
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section
      className={`flex flex-col gap-6 ${display}`}
    >
      <Chat chatContent='chat here' />
      <div>input field</div>
    </section>
  );
}
