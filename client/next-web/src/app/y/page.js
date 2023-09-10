import PrimaryColumn from './_components/PrimaryColumn';
import SideColumn from './_components/SideColumn';
export default function Y() {
  return (
  <>
    <div className="max-w-[600px] w-full">
      <PrimaryColumn/>
    </div>
    <aside className="hidden lg:flex flex-col py-2 gap-3 lg:w-[290px] xl:w-[350px]">
      <SideColumn/>
    </aside>
  </>

  );
}
