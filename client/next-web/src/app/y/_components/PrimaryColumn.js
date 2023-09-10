import { Divider } from '@nextui-org/divider';
import { Spacer } from '@nextui-org/spacer';
import Editer from './Editer';
import Posts from './Posts';

export default function PrimaryColumn() {
  return (
    <>
      <header>Home</header>
      <Spacer/>
      <Divider/>
      <Editer />
      <Divider />
      <Posts />
    </>
  );
}
