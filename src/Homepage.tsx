import React, { useState } from 'react';
import './Homepage.css';

const Homepage: React.FC = () => {
  const [log, setLog] = useState<string | null>(null);

  const handleCreateRoom = () => {
    setLog('Create Room clicked');
    const holderName = 'John Doe';
    navigate('/CreateRoomPage');
  };

  const handleJoinRoom = () => {
    setLog('Join Room clicked');
    navigate('/JoinRoomPage');
  };

>>>>>>> src/Homepage.tsx
  return (
    <div className="home-page">
      <h1>Welcome to the Room Page</h1>
      <div className="button-container"
        <button className="button" onClick={handleCreateRoom} data-testid="create-room-button">
          Create Room
        </button>
        <button className="button" onClick={handleJoinRoom} data-testid="join-room-button">
          Join Room
        </button>
      </div>
      {log && <p data-testid="log-message">{log}</p>}
    </div>
  );
};
>>>>>>> src/Homepage.tsx

export default Homepage;
