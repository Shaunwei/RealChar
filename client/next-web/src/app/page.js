import Tabs from './_components/Tabs';
import Ctabox from './_components/ctabox';

import { getDefaultCharacters } from '../util/apiSsr';



export default async function Page() {
  const characterGroup = await getDefaultCharacters();

  return (
      <>
        <Ctabox/>
        <h1 className="text-center font-light text-3xl pt-10">Real-time communication with your AI character assistant</h1>
        <Tabs defaultCharacters={characterGroup} />
      </>
  )
}
