import Chat from './Chat';

export default function HandsFreeMode({
  isDisplay
}) {
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section className={`flex flex-col gap-6 justify-center ${display}`}>
      <Chat size="sm"/>
      <div className="font-light text-lg text-center my-10">
        Start your conversation by talking to Steve Jobs
      </div>
    </section>
  );
}
