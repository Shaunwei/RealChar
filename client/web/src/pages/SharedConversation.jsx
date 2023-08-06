/**
 * src/pages/SharedConversation.jsx
 * 
 * created by ZongZiWang on 8/5/23
 */

import React, {useEffect, useState} from 'react';
import {isIP} from 'is-ip';
import Avatar from '@mui/material/Avatar';
import AvatarView from '../components/AvatarView';

const SharedConversation = ({
}) => {

  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Get characters
  useEffect(() => {
    if (sessionId === null) {
        return;
    }

    setLoading(true);

    // Get host
    const scheme = window.location.protocol;
    var currentHost = window.location.host;
    var parts = currentHost.split(':');
    var hostname = parts[0];
    // Local deployment uses 8000 port by default.
    var newPort = '8000';

    if (!(hostname === 'localhost' || isIP(hostname))) {
        hostname = 'api.' + hostname;
        newPort = window.location.protocol === "https:" ? 443 : 80;
    }
    var newCharactersHost = hostname + ':' + newPort + '/characters';
    var newSessionHistoryHost = hostname + ':' + newPort + '/session_history?session_id=' + sessionId;
    const url = scheme + '//' + newCharactersHost;
    const sessionHistoryUrl = scheme + '//' + newSessionHistoryHost;

    const fetchData = async () => {
      try {
        const charactersResponse = await fetch(url);
        const charactersData = await charactersResponse.json();
    
        const sessionHistoryResponse = await fetch(sessionHistoryUrl);
        const sessionHistoryData = await sessionHistoryResponse.json();
        setHistory(sessionHistoryData);

        if (sessionHistoryData.length === 0) {
          setLoading(false);
          return;
        }

        // sessionHistoryData will look like this:
        // [{"id":162,"client_id":null,"user_id":"0F26CEA0936441F0813969145CAD47CD","session_id":"bcf1181fef5a4cc6bfbe84ec0e72821f","client_message":null,"server_message":null,"client_message_unicode":"Check the weather for San Francisco","server_message_unicode":"Elon> Ah, San Francisco, a beautiful city indeed! The weather there can be quite unpredictable at times. Could you please clarify if you would like the current weather or a forecast for San Francisco?","timestamp":"2023-08-06T01:10:46.847131","platform":"mobile","action_type":"text","character_id":"elon_musk","tools":"search","language":"en-US","message_id":"e1b0aaafae5445d8","llm_config":{"model":"gpt-3.5-turbo-16k","temperature":0.5,"streaming":true}}]
        const selectedCharacterId = sessionHistoryData[0].character_id;
        setSelectedCharacter(charactersData.find(character => character.character_id === selectedCharacterId));

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [sessionId, setLoading, setSelectedCharacter, setHistory])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdParam = urlParams.get('session_id');
    setSessionId(sessionIdParam);
  }, [window.location.search]);

  return (
    <div className='shared-conversation-page'>
      {
        loading
          ? (<h2>Loading...</h2>)
          : selectedCharacter !== null && (
            <div className={'avatar-wrapper'}>
            {
                selectedCharacter?.avatar_id ?
                <AvatarView avatarId={
                    selectedCharacter?.avatar_id
                }/> 
                :
                <Avatar
                    alt={selectedCharacter.name}
                    src={selectedCharacter.image_url}
                    sx={{ width: 76, height: 76 }}
                />
            }
            </div>
        )
      }
      {
        history.length > 0
          ? (<div className="main-screen" style={{ display: "flex"}}>
            <div className="text-screen">
                <textarea class="chat-window" style={{ width: "50vw"}} readonly="" draggable="false">
                    {
                        history.map((message, index) => { 
                            return (
                                'User> ' + message.client_message_unicode + '\n\n' + message.server_message_unicode + '\n\n'
                            )
                        }).join('\n')
                    }
                </textarea>
            </div>
          </div>)
          : !loading && (<h2>No conversation history found.</h2>)
      }
    </div>);
};

export default SharedConversation;
