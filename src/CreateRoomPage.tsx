import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { serverPort } from "./MacroConst";
import { User } from "./User";
import "./CreateRoomPage.css";

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const createRoom = async () => {
    // Get display name
    if (!displayName.trim()) {
      // Display popup or alert for empty nickname
      setShowPopup(true);
      return;
    }

    try {
      // Get userID and assigned roomCode from backend
      const response = await fetch(
        `${serverPort}/createRoom?name=${displayName}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const { userID, roomCode } = await response.json();

      if (userID && roomCode) {
        // Navigate to with user detail
        // Creating room is admin
        const user = new User(roomCode, userID, displayName, true, true, "");
        navigate("/WaitRoomPage", {
          state: { user },
        });
      } else {
        throw new Error(
          "Invalid response format: userID and roomID are required."
        );
      }
    } catch (error: any) {
      setMessage("Error creating room: " + error.message); // Error message
    }
  };

  return (
    <div className="create-room-page">
      <h1>Create a New Room</h1>
      <div>
        <input
          type="text"
          className="form-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display Name"
        />
      </div>
      <button onClick={createRoom} className="submit-button">
        Create Room
      </button>
      {message && <p className="error-message">{message}</p>}
      {showPopup && (
        <div className="popup">
          <p>Please enter a displayname.</p>
          <button onClick={() => setShowPopup(false)}>OK</button>
        </div>
      )}
    </div>
  );
};

export default CreateRoomPage;
