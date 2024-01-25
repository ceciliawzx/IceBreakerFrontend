import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinRoomPage.css";
import { serverPort } from "./MacroConst";
import { User } from "./User";

const JoinRoomPage = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Prevent default form submission behavior
    event.preventDefault(); 

    // Get display name
    if (!displayName.trim()) {
      // Display popup or alert for empty nickname
      setShowPopup(true);
      return;
    }

    try {
      // Get userID from backend
      const response = await fetch(
        `${serverPort}/joinRoom?roomCode=${roomCode}&name=${displayName}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`); // Error message
      }
      
      const { userID } = await response.json();
      
      if (userID) {
        // Joining room cannot be admin
        const user = new User(roomCode, userID, displayName, false, "", false);
        navigate("/WaitRoomPage", {
          state: { user },
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
