import Navigation from './_components/Navigation';

export default function Layout({children}) {
  return (
    <div className="flex flex-row justify-center">
    <div className="flex justify-end">
      <Navigation/>
    </div>
    <div className="flex flex-row">
      {children}
    </div>
  </div>
  );
}
