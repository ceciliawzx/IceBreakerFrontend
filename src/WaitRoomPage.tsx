import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import './WaitRoomPage.css';

function WaitRoomPage() {
  const { roomCode } = useParams();
  const [guests, setGuests] = useState<string[]>([]);

  const handleStartRoom = () => {
    // Handle logic to start the room
    console.log('Room started!');
  };

  return (
    <div className="wait-room-page">
      <h1>Wait Room</h1>
      <div className="room-code">
        <p>Room Code: {roomCode}</p>
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
