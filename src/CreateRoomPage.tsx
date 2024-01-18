import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useParams } from 'react-router-dom';
import './CreateRoomPage.css';

function CreateRoomPage() {
  const navigate = useNavigate();
  const [joinLink, setJoinLink] = useState('');
  const [message, setMessage] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  
  const createRoom = async () => {
    try {
      const response = await fetch('http://ljthey.co.uk:8080/createRoom', {method: 'POST'});
      const data = await response.text();

      if (data.includes("Room Created!!!")) {
        setJoinLink(data);
        setIsRoomCreated(true);

        // Navigate to WaitRoomPage with joinLink as a parameter
        navigate('/WaitRoomPage', { state: { joinLink: data } });

      } else {
        setMessage(data);
        setIsRoomCreated(false);
      }
    } catch (error: any) {
      setMessage('Error creating room: ' + error.message);
      setIsRoomCreated(false);
    }
  };


  return (
    <div className="create-room-page">
      <h1>Create a New Room</h1>
      <button onClick={createRoom} disabled={isRoomCreated}>Create Room</button>
      {joinLink && <p>{joinLink}</p>}
      {message && <p className="error-message">{message}</p>}
      {/* Rest of your component */}
    </div>
  );
}

export default CreateRoomPage;
