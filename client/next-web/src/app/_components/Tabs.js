'use client'
import ExploreTab from './ExploreTab';
import MyTab from './MyTab';
import TabButton from '@/components/TabButton';

import { useAuthContext } from '@/context/AuthContext';
import { useState } from 'react';

export default function Tabs({ defaultCharacters }) {
  const { user } = useAuthContext();
  const [ tabNow, setTabNow ] = useState('explore');

  let exploreTabDisplay = true;
  let myTabDisplay = false;

  if (user == null || tabNow === 'explore') {
    exploreTabDisplay = true;
    myTabDisplay = false;
  } else {
    exploreTabDisplay = false;
    myTabDisplay = true;
  }

  return (
    <>
      <div className="grid grid-cols-3 mt-10">
        <div className="col-start-2 grid grid-cols-2 gap-5">
          <TabButton
            isSelected={exploreTabDisplay}
            handlePress={() => setTabNow('explore')}
          >
            Explore
          </TabButton>
          <TabButton
            isSelected={myTabDisplay}
            isDisabled={user==null}
            handlePress={() => setTabNow('myCharacter')}
          >
            My Characters
          </TabButton>
        </div>
      </div>
      <ExploreTab 
        characters={defaultCharacters} 
        isDisplay={exploreTabDisplay}/>
      {user != null && (
        <MyTab isDisplay={myTabDisplay} />
      )}
    </>
  );
}
