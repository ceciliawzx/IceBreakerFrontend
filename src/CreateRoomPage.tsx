import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateRoomPage.css";

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const createRoom = async () => {

    if (!displayName.trim()) {
      // Display popup or alert for empty nickname
      setShowPopup(true);
      return;
    }

    try {

      const response = await fetch("http://ljthey.co.uk:8080/createRoom?name=" + displayName, {
        method: "POST"
      });
    
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const jsonResponse = await response.json();

      const { userID, roomID } = jsonResponse;

      if (userID && roomID) {
        // Navigate to WaitRoomPage with userID, roomID, and displayName as parameters
        navigate("/WaitRoomPage", {
          state: { userID, roomID, displayName },
        });
      } else {
        throw new Error("Invalid response format: userID and roomID are required.");
      }
    } catch (error: any) {
      setMessage("Error creating room: " + error.message);
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
      <button
        onClick={createRoom}
        className="submit-button"
      >
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
