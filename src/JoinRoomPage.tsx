import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinRoomPage.css";
import { serverPort } from "./MacroConst";

const JoinRoomPage = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      // Display popup or alert for empty nickname
      setShowPopup(true);
      return;
    }

    try {
      const response = await fetch(
        serverPort + `/joinRoom?roomCode=${roomCode}&name=${displayName}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const {userID} = await response.json();

      if (userID) {
        navigate("/WaitRoomPage", {
          state: { userID, roomCode, displayName },
        });
      } else {
        setMessage("Wrong room code"); // Error message
      }
    } catch (error) {
      setMessage("Join Room Failed"); // Error message
    }
  };

  return (
    <div className="join-room-page">
      <h1>Join a New Room</h1>
      <div className="form-container">
        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            className="form-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
          />
          <input
            type="text"
            className="form-input"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Room Code"
          />
          <button type="submit" className="submit-button">
            Join Room
          </button>
          {message && <p className="message">{message}</p>}
        </form>
      </div>
      {showPopup && (
        <div className="popup">
          <p>Please enter a displayname.</p>
          <button onClick={() => setShowPopup(false)}>OK</button>
        </div>
      )}
    </div>
  );
};

export default JoinRoomPage;
