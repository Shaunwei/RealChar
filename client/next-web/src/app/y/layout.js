import Navigation from './_components/Navigation';

export default function Layout({children}) {
  return (
    <div className="flex flex-row justify-center relative">
      <div className="flex justify-end relative">
        <Navigation/>
      </div>
      <div className="flex flex-row lg:w-[920px] xl:w-[990px] gap-6">
        {children}
      </div>
    </div>
  );
}
