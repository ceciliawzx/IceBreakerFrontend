import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";

/* Image used */
import joinPenguin from "./assets/JoinPenguin.png";

/* CSS */
import "./css/CreateRoomPage.css";

const JoinMockRoomPage = () => {
  const navigate = useNavigate();

  /* Field */
  const [userID, setUserID] = useState("");
  const roomCode = "TEST";
  const [errorMessage, setErrorMessage] = useState("");

  /* Popup */
  const [showEmptyNamePopup, setShowEmptyNamePopup] = useState(false);

  /* -------- Button Handler ---------- */

  /* When click submit button */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Prevent default form submission behavior
    event.preventDefault();

    // If empty userId, show alert
    if (!userID.trim()) {
      setShowEmptyNamePopup(true);
      return;
    }

    try {
      // Get userID from backend
      const responseUserInfo = await fetch(
        `${serverPort}/getPlayer?userID=${userID}&roomCode=${roomCode}`,
        { method: "GET" }
      );

      if (!responseUserInfo.ok) {
        throw new Error(`HTTP error! Status: ${responseUserInfo.status}`); // Error message
      }

      const userInfoData = await responseUserInfo.json();

      // Fetch the according user info
      if (userInfoData) {
        // Check if this user is admin
        const responseIsAdmin = await fetch(
          `${serverPort}/isAdmin?userID=${userID}&roomCode=${roomCode}`,
          { method: "GET" }
        );

        if (!responseIsAdmin.ok) {
          throw new Error(`HTTP error! Status: ${responseIsAdmin.status}`); // Error message
        }

        const isAdmin = await responseIsAdmin.json();

        // Check if this user is presenter
        const responseIsPresenter = await fetch(
          `${serverPort}/isPresenter?userID=${userID}&roomCode=${roomCode}`,
          { method: "GET" }
        );

        if (!responseIsPresenter.ok) {
          throw new Error(`HTTP error! Status: ${responseIsPresenter.status}`); // Error message
        }

        const isPresenter = await responseIsPresenter.json();

        const user = new User(
          roomCode,
          userID,
          userInfoData.userInfo.displayName,
          isAdmin,
          isPresenter,
          "",
          true
        );

        navigate("/WaitRoomPage", {
          state: { user },
        });
      } else {
        setErrorMessage("Wrong room code"); // Error message
      }
    } catch (error) {
      setErrorMessage("Join Room Failed"); // Error message
    }
  };

  /* When click ResetMockRoom button */
  const handleResetMockServer = async () => {
    const responseResetRoom = await fetch(`${serverPort}/restartMockRoom`, {
      method: "POST",
    });

    if (!responseResetRoom.ok) {
      throw new Error(`HTTP error! Status: ${responseResetRoom.status}`); // Error message
    }
    console.log("Success");
  };

  /* -------- UI Component ---------- */

  /* Main renderer */
  return (
    <div className="center-page">
      <img
        src={joinPenguin}
        alt="Joining Penguin"
        className="joining-penguin"
      />
      <h1>Join a New Room</h1>
      <div>
        <form onSubmit={handleSubmit} className="column-container">
          <input
            type="text"
            className="form-input"
            value={userID}
            onChange={(e) => setUserID(e.target.value)}
            placeholder="User ID"
          />
          Use id = 1 to log as admin
          <button type="submit" className="button common-button">
            Join Room
          </button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </form>
        <button
          className="button admin-only-button"
          onClick={handleResetMockServer}
        >
          Reset mock room
        </button>
      </div>

      {/* Show empty name error popup */}
      {showEmptyNamePopup && (
        <div className="popup">
          <p>Please enter userID.</p>
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

export default JoinMockRoomPage;
