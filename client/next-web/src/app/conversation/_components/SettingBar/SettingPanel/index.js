import LanguagePanel from './LanguagePanel';
import EnhancePanel from './EnhancePanel';

export default function SettingPanel() {
  return (
    <div className="flex flex-col gap-12 min-h-[400px]">
      <section>
        <header className="pb-5">Preferred Language</header>
        <LanguagePanel />
      </section>
      <section>
        <header className="pb-5">Advanced options</header>
        <EnhancePanel />
      </section>
    </div>
  );
}
