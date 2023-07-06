import { useState, useEffect } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import MicRecorder from 'mic-recorder-to-mp3';

const recorder = new MicRecorder({ bitRate: 128 });

function App() {
  const [client, setClient] = useState(null);
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    const clientId = Math.floor(Math.random() * 1000);
    setClientId(clientId);
  }, []);

  useEffect(() => {
    if (clientId === null) return;

    const client = new W3CWebSocket(`ws://localhost:8000/ws/${clientId}`);
    
    client.onopen = () => {
      setClient(client);
    };

    client.onmessage = (message) => {
      let dataFromServer;

      try {
        dataFromServer = JSON.parse(message.data);
      } catch (error) {
        dataFromServer = { msg: message.data };
      }

      setMessages((messages) => [...messages, dataFromServer]);
    };

    client.onclose = () => {
      console.log('WebSocket Client Closed');
    };

    return () => {
      client.close();
    };
  }, [clientId]);

  useEffect(() => {
    if (recording) {
      recorder
        .start()
        .then(() => {
          console.log('Recording Started');
        })
        .catch((err) => console.error('Error in recording: ', err));
    } else {
      if (recorder.isRecording) {
        recorder
          .stop()
          .getMp3()
          .then(([buffer, blob]) => {
            const blobURL = URL.createObjectURL(blob);

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function() {
              const base64data = reader.result;
              client.send(JSON.stringify({ type: 'audio', msg: base64data }));
            }
          })
          .catch((err) => console.log('Error in stopping the recorder: ', err));
      }
    }
  }, [recording, client]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      // client.send(JSON.stringify({ type: 'text', msg: text }));
      client.send(text);
      setText("");
    }
  };

  const startRecording = () => {
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recording}>Start Recording</button>
      <button onClick={stopRecording} disabled={!recording}>Stop Recording</button>
      <div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div>
      {messages.map((message, index) => {
        if (typeof message.msg === 'string') {
          return <div key={index}>{message.msg}</div>
        } else if (message.msg instanceof Blob) {
          const url = URL.createObjectURL(message.msg);
          return (
            <audio key={index} controls autoPlay>
              <source src={url} type="audio/mpeg" />
              Your browser does not support the audio tag.
            </audio>
          );
        } else {
          return null;
        }
      })}
      </div>
    </div>
  );
}

export default App;
