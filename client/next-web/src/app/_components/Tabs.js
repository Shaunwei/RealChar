'use client'
import { Button } from '@nextui-org/react';
import ExploreTab from './ExploreTab';
import MyTab from './MyTab';

import { useAuthContext } from '@/context/AuthContext';
import { useState } from 'react';

export default function Tabs({ defaultCharacters }) {
  const { user } = useAuthContext();
  const [ tabNow, setTabNow ] = useState('explore');
  let exploreButtonClass = '';
  let myCharacterButtonClass = '';
  let exploreTabDisplay = '';
  let myTabDisplay = '';
  
  switch(tabNow) {
    case 'explore':
      exploreButtonClass = 'bg-tab';
      myCharacterButtonClass = 'bg-transparent';
      exploreTabDisplay = 'flex';
      myTabDisplay = 'hidden';
      break;
    case 'myCharacter':
      exploreButtonClass = 'bg-transparent';
      myCharacterButtonClass = 'bg-tab';
      exploreTabDisplay = 'hidden';
      myTabDisplay = 'flex';
      break;
  }

  if (user == null) {
    exploreButtonClass = 'bg-tab';
    myCharacterButtonClass = 'bg-transparent';
    exploreTabDisplay = 'flex';
    myTabDisplay = 'hidden';
  }

  return (
    <>
      <div className="flex justify-center mt-10 gap-5">
        <Button
          isBlock
          href="/"
          className={`w-48 h-14 font-medium text-lg justify-center rounded-xl py-4 text-foreground ${exploreButtonClass}`}
          onClick={() => setTabNow('explore')}>
          Explore
        </Button>
        <Button
          isBlock
          isDisabled={user==null}
          href="/"
          className={`w-48 h-14 font-medium text-lg justify-center rounded-xl py-4 text-foreground ${myCharacterButtonClass}`}
          onClick={() => setTabNow('myCharacter')}>
          My Characters
        </Button>
      </div>
      <ExploreTab characters={defaultCharacters} display={exploreTabDisplay}/>
      {user != null && (
        <MyTab display={myTabDisplay} />
      )}
    </>
  );
}
