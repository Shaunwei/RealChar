import { Divider } from '@nextui-org/divider';
import { Spacer } from '@nextui-org/spacer';
import Editer from './Editer';
import Posts from './Posts';

export default function PrimaryColumn() {
  return (
    <>
      <header className="font-semibold text-lg px-4 pt-4 pb-2.5">Home</header>
      <Spacer/>
      <Divider/>
      <Editer />
      <Divider />
      <Posts />
    </>
  );
}
