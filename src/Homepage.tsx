import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';

function Homepage() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    console.log('Create Room clicked');
    const holderName = 'John Doe';
    navigate('/CreateRoomPage');
  };

  const handleJoinRoom = () => {
    console.log('Join Room clicked');
    navigate('/JoinRoomPage');
  };

  return (
    <div className="home-page">
      <h1>Welcome to the Room Page</h1>
      <div className="button-container">
        <button className="button" onClick={handleCreateRoom}>
          Create Room
        </button>
        <button className="button" onClick={handleJoinRoom}>
          Join Room
        </button>
      </div>
    </div>
  );
}

export default Homepage;
