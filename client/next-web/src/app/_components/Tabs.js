'use client'
import ExploreTab from './ExploreTab';
import MyTab from './MyTab';
import TabButton from '@/components/TabButton';

import { useAuthContext } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Tabs({
  defaultCharacters,
}) {
  const { user } = useAuthContext();
  const [ tabNow, setTabNow ] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setTabNow(tab);
    } else {
      setTabNow('explore');
    }
  }, []);

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
      <div className="flex flex-row justify-center mt-10">
        <div className="w-[420px] grid grid-cols-2 gap-5 border-2 rounded-full p-1 border-tab">
          <TabButton
            isSelected={exploreTabDisplay}
            handlePress={() => setTabNow('explore')}
          >
            Explore
          </TabButton>
          <TabButton
            isSelected={myTabDisplay}
            isDisabled={user==null}
            handlePress={() => setTabNow('myCharacters')}
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
