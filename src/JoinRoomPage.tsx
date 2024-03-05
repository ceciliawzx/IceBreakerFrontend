import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";

/* Image used */
import joinPenguin from "./assets/JoinPenguin.png";

/* CSS */
import "./css/CreateRoomPage.css";

const JoinRoomPage = () => {
  const navigate = useNavigate();

  /* Field */
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* Popup */
  const [showEmptyNamePopup, setShowEmptyNamePopup] = useState(false);

  /* -------- Button Handler ---------- */

  /* When click Submit button */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Prevent default form submission behavior
    event.preventDefault();

    // If empty display name, show alert
    if (!displayName.trim()) {
      setShowEmptyNamePopup(true);
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

      // Create normal user
      if (userID) {
        const user = new User(
          roomCode,
          userID,
          displayName,
          false,
          false,
          "",
          false
        );

        // Naviage with user info
        navigate("/WaitRoomPage", {
          state: { user },
        });
      } else {
        // Error message
        setErrorMessage("Wrong room code");
      }
    } catch (error: any) {
      // Error message
      setErrorMessage("Join Room Failed");
    }
  };

  /* -------- UI Component ---------- */

  /* Main rendereer */
  return (
    <div className="center-page">
      <img
        src={joinPenguin}
        alt="Joining Penguin"
        className="joining-penguin"
      />
      <h1 className="create-room-heading">Join a New Room</h1>
      <div>
        <form onSubmit={handleSubmit} className="column-container">
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
          <button type="submit" className="button common-button">
            Join Room
          </button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </form>
      </div>

      {/* Show empty name error popup */}
      {showEmptyNamePopup && (
        <div className="popup">
          <p>Please enter a displayname.</p>
          <button
            className="button common-button"
            onClick={() => setShowEmptyNamePopup(false)}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};

export default JoinRoomPage;
