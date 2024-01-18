import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './WaitRoomPage.css';

function WaitRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const joinLink = location.state?.joinLink || 'No join link available';
  const nickname = location.state?.nickname || 'Creator';
  const [guests, setGuests] = useState<string[]>([]);

  const handleStartRoom = () => {
    
    console.log('Room started!');
    navigate('/UserProfilePage');
  };

  return (
    <div className="wait-room-page">
      <h1>Welcome, {nickname}!</h1>
      <div className="room-code">
        <p>Room Code: {joinLink}</p>
      </div>
      <div className="guest-list">
        <h2>Joined Guests:</h2>
        <ul>
          {guests.map((guest, index) => (
            <li key={index}>{guest}</li>
          ))}
        </ul>
      </div>
      <button className="start-room-button" onClick={handleStartRoom}>
        Start Room
      </button>
    </div>
  );
}

export default WaitRoomPage;
