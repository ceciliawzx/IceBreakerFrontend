import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";

/* Image used */
import buildingPenguin from "./assets/BuildingPenguin.png";

/* CSS */
import "./css/CreateRoomPage.css";

const CreateRoomPage = () => {
  const navigate = useNavigate();

  /* Field */
  const [errorMessage, setErrorMessage] = useState("");
  const [displayName, setDisplayName] = useState("");

  /* Popup */
  const [showEmptyNamePopup, setShowEmptyNamePopup] = useState(false);

  /* -------- Button Handler ---------- */

  /* When click CreateRoom button */
  const handleCreateRoom = async () => {
    // If empty display name, show alert
    if (!displayName.trim()) {
      setShowEmptyNamePopup(true);
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
        // Create Admin User
        const user = new User(
          roomCode,
          userID,
          displayName,
          true,
          true,
          "",
          false
        );

        // Navigate to with user detail
        navigate("/WaitRoomPage", {
          state: { user },
        });
      } else {
        throw new Error(
          "Invalid response format: userID and roomID are required."
        );
      }
    } catch (error: any) {
      setErrorMessage("Error creating room: " + error.message); // Error message
    }
  };

  /* -------- UI Component ---------- */

  /* Main renderer */
  return (
    <div className="center-page">
      <img
        src={buildingPenguin}
        alt="Building Penguin"
        className="building-penguin"
      />
      <h1 className="create-room-heading">Create a New Room</h1>
      <div>
        <input
          type="text"
          className="form-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter Your Display Name"
        />
      </div>
      <button
        onClick={handleCreateRoom}
        className="button common-button"
        style={{ fontSize: "1rem" }}
      >
        Create Room
      </button>
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* Empty name error popup */}
      {showEmptyNamePopup && (
        <div className="popup">
          <p>Please enter a display name.</p>
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

export default CreateRoomPage;
