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
      const response = await fetch("http://ljthey.co.uk:8080/createRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Specify the content type as JSON
        },
        body: JSON.stringify({
          name: displayName,
        }),
      });
      const data = await response.json();

      console.log(data)

      if (data.includes("Room Created!!!")) {

        // Parse roomCode
        const roomNumberPattern = /Room Number is (.+)/;
        const match = data.match(roomNumberPattern);
        // Check if there is a match and extract the room number
        if (match && match[1]) {
          const trimmedRoomCode = match[1].trim();

          // Navigate to WaitRoomPage with joinLink as a parameter
          navigate("/WaitRoomPage", {
            state: { roomCode: trimmedRoomCode, displayName },
          });
        } else {
          throw new Error("No room number found in the sentence.");
        }
      } else {
        setMessage(data);
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
