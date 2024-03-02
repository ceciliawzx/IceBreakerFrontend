import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./css/JoinRoomPage.css";
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";
import joinPenguin from "./assets/JoinPenguin.png";

const JoinMockRoomPage = () => {
  const navigate = useNavigate();
  const [userID, setUserID] = useState("");
  // const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const roomCode = "TEST";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Prevent default form submission behavior
    event.preventDefault();

    // Get display name
    if (!userID.trim()) {
      // Display popup or alert for empty nickname
      setShowPopup(true);
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

      if (userInfoData) {
        const responseIsAdmin = await fetch(
          `${serverPort}/isAdmin?userID=${userID}&roomCode=${roomCode}`,
          { method: "GET" }
        );

        if (!responseIsAdmin.ok) {
          throw new Error(`HTTP error! Status: ${responseIsAdmin.status}`); // Error message
        }

        const userIsAdminData = await responseIsAdmin.json();
        const isAdmin = userIsAdminData === true;

        const responseIsPresenter = await fetch(
          `${serverPort}/isPresenter?userID=${userID}&roomCode=${roomCode}`,
          { method: "GET" }
        );

        if (!responseIsPresenter.ok) {
          throw new Error(`HTTP error! Status: ${responseIsPresenter.status}`); // Error message
        }

        const userIsPresenterData = await responseIsPresenter.json();
        const isPresenter = userIsPresenterData === true;

        // Joining room cannot be admin
        const user = new User(
          roomCode,
          userID,
          userInfoData.userInfo.displayName,
          isAdmin,
          isPresenter,
          "",
          true
        );
        // const user = new User(roomCode, userID, userID, false, false, "", false);

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

  const handleResetMockServer = async () => {
    const responseResetRoom = await fetch(`${serverPort}/restartMockRoom`, {
      method: "POST",
    });

    if (!responseResetRoom.ok) {
      throw new Error(`HTTP error! Status: ${responseResetRoom.status}`); // Error message
    }
    console.log("Success");

    const userIsAdminData = await responseResetRoom.json();
  };

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
          {message && <p className="message">{message}</p>}
        </form>
        <button
          className="button admin-only-button"
          onClick={handleResetMockServer}
        >
          Reset mock room
        </button>
      </div>

      {showPopup && (
        <div className="popup">
          <p>Please enter userID.</p>
          <button
            className="button common-button"
            onClick={() => setShowPopup(false)}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};

export default JoinMockRoomPage;
