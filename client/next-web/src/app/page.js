import Tabs from './_components/Tabs';
import Header from './_components/header';
import Footer from './_components/footer';

import { getDefaultCharacters } from '../util/apiSsr';

export default async function Page() {
  const characterGroup = await getDefaultCharacters();

  return (
      <>
      <Header />
      <div className="py-10 px-14">
        <h1 className="text-center font-light text-3xl">Real-time communication with your AI character assistant</h1>
        <Tabs defaultCharacters={characterGroup} />
      </div>
      <Footer />
      </>
  )
}
