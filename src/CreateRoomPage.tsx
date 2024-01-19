import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateRoomPage.css";

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("");
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const createRoom = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!displayName.trim()) {
      // Display popup or alert for empty nickname
      setShowPopup(true);
      return;
    }

    try {
      const response = await fetch("http://ljthey.co.uk:8080/createRoom", {
        method: "POST",
      });
      const data = await response.text();

      if (data.includes("Room Created!!!")) {
        setIsRoomCreated(true);

        // Parse roomCode
        const roomNumberPattern = /Room Number is (\d+)/;
        const match = data.match(roomNumberPattern);
        // Check if there is a match and extract the room number
        if (match && match[1]) {
          const trimmedRoomCode = match[1].trim();
          setRoomCode(trimmedRoomCode);

          // Navigate to WaitRoomPage with joinLink as a parameter
          navigate("/WaitRoomPage", {
            state: { roomCode: trimmedRoomCode, displayName },
          });
        } else {
          throw new Error("No room number found in the sentence.");
        }
      } else {
        setMessage(data);
        setIsRoomCreated(false);
      }
    } catch (error: any) {
      setMessage("Error creating room: " + error.message);
      setIsRoomCreated(false);
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
        disabled={isRoomCreated}
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
