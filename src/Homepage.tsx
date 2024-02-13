import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Homepage.css";
import titleImage from "./assets/title.png";
import iceHouse from "./assets/iceHouse.png";

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const [log, setLog] = useState<string | null>(null);

  const handleCreateRoom = () => {
    setLog("Create Room clicked");
    navigate("/CreateRoomPage");
  };

  const handleJoinRoom = () => {
    setLog("Join Room clicked");
    navigate("/JoinRoomPage");
  };

  const handleJoinMockRoom = () => {
    setLog("Join Mock Room clicked");
    navigate("/JoinMockRoomPage");
  };

  return (
    <div className="page">
      <img src={titleImage} className="title-image" />
      
      <div className="column-container">
        <button
          className="home-button"
          onClick={handleCreateRoom}
          data-testid="create-room-button"
        >
          Create Room
        </button>
        <button
          className="home-button"
          onClick={handleJoinRoom}
          data-testid="join-room-button"
        >
          Join Room
        </button>
        <button
          className="home-button"
          onClick={handleJoinMockRoom}
          data-testid="join-mockroom-button"
        >
          Join Mock Room
        </button>
      </div>
      {log && <p data-testid="log-message">{log}</p>}
      <img src={iceHouse} alt="ice house" className="ice-house-image" />
    </div>
  );
};

export default Homepage;
