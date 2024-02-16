import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Homepage.css";
import titleImage from "./assets/Title.png";
import createRoomImage from "./assets/CreateRoom.png";
import joinRoomImage from "./assets/JoinRoom.png";
import joinMockRoomImage from "./assets/MockRoom.png";

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

      <button
        onClick={handleCreateRoom}
        className="create-room-button"
        data-testid="create-room-button"
      >
        <img src={createRoomImage} alt="Create Room" />
      </button>
      <button
        onClick={handleJoinRoom}
        className="join-room-button create-room-button"
        data-testid="join-room-button"
      >
        <img src={joinRoomImage} alt="Join Room" />
      </button>
      <button
        onClick={handleJoinMockRoom}
        className="join-mock-room-button create-room-button"
        data-testid="join-mock-room-button"
      >
        <img src={joinMockRoomImage} alt="Join Mock Room" />
      </button>

      {log && <p data-testid="log-message">{log}</p>}
    </div>
  );
};

export default Homepage;
