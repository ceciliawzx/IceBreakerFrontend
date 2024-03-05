import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* General function */
import { disableScroll } from "./utils/CssOperation";

/* Image used */
import titleImage from "./assets/Title.png";
import createRoomImage from "./assets/CreateRoom.png";
import joinRoomImage from "./assets/JoinRoom.png";
import joinMockRoomImage from "./assets/MockRoom.png";

/* CSS */
import "./css/Homepage.css";

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const [log, setLog] = useState<string | null>(null);

  /* -------- Use Effect ---------- */

  /* Disable scroll for this page */
  useEffect(disableScroll, []);

  /* Clear local storage */
  useEffect(() => {
    localStorage.setItem("waitRoomVisited", "false");
    localStorage.setItem("presentRoomVisited", "false");
    localStorage.setItem("wordleVisited", "false");
    localStorage.setItem("hangmanVisited", "false");
    localStorage.setItem("pictionaryVisited", "false");
    localStorage.setItem("shareboardVisited", "false");
    localStorage.setItem("geoguesserVisited", "false");
  }, []);

  /* -------- Button Handler ---------- */

  /* When click CreateRoom button */
  const handleCreateRoom = () => {
    setLog("Create Room clicked");
    navigate("/CreateRoomPage");
  };

  /* When click JoinRoom button */
  const handleJoinRoom = () => {
    setLog("Join Room clicked");
    navigate("/JoinRoomPage");
  };

  /* When click JoinMockRoom button */
  const handleJoinMockRoom = () => {
    setLog("Join Mock Room clicked");
    navigate("/JoinMockRoomPage");
  };

  /* -------- UI Component ---------- */

  /* Main renderer */
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
