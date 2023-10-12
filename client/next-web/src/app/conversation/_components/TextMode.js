import InputField from './InputField';

export default function TextMode({ isDisplay }) {
  const display = isDisplay ? 'flex' : 'hidden';

  return (
    <section className={`flex flex-col gap-6 ${display}`}>
      <div className="border-x-[1px] border-t-[1px] md:border-b-[1px] rounded-lg border-white/30 -mx-4 md:mx-0 relative mb-2">
        <InputField />
      </div>
    </section>
  );
}
