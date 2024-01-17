import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CreateRoomPage.css';

function CreateRoomPage() {
  const navigate = useNavigate();
  const [joinLink, setJoinLink] = useState('');
  const [message, setMessage] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  
  const createRoom = async () => {
    try {
      const response = await fetch('http://ljthey.co.uk:8080/createRoom', {
        method: 'POST',
        // Additional headers or body might be needed depending on API requirements
      });

      const data = await response.text();

      if (data.includes("Room Created!!!")) {
        setJoinLink(data); // Assuming data is the success message with room number
        setIsRoomCreated(true); // Disable the button as room is created successfully
      } else {
        setMessage(data); // Assuming data is the error message
        setIsRoomCreated(false); // Keep the button active as creation failed
      }
    } catch (error: any) {
      setMessage('Error creating room: ' + error.message);
      setIsRoomCreated(false); // Keep the button active as creation failed
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
