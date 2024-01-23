import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./WaitRoomPage.css";
import { refreshTime, serverPort } from "./MacroConst";

const WaitRoomPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;
  const [guests, setGuests] = useState<string[]>([]);
  const [admin, setAdmin] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  const handleStartRoom = async () => {
    // Tell server that to start room
    const response = await fetch(
      `${serverPort}/startInput?roomCode=${roomCode}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  };

  const handleChatRoom = () => {
    navigate("/ChatRoomPage", {
      state: { userID, roomCode, displayName },
    });
  };

  // Check if the user is the admin
  const checkAdminStatus = async () => {
    const url = `${serverPort}/isAdmin?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setIsAdmin(data === true);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  // Fetch the players & check if room start from the backend
  const checkRoomStatus = async () => {
    const url = `${serverPort}/getPlayers?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.json();
      if (data.admin) {
        setAdmin(data.admin.displayName);
      }
      if (data.otherPlayers) {
        setGuests(
          data.otherPlayers.map(
            (player: { displayName: any }) => player.displayName
          )
        );
      }
      // if moderator starts game, navigate to input phase
      if (data.gameStatus) {
        navigate("/UserProfilePage", {
          state: { user },
        });
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  // Periodically check room status
  useEffect(() => {
    checkAdminStatus();

    // Update the player list every interval
    const intervalId = setInterval(checkRoomStatus, refreshTime);

    // Clear timer and count again
    return () => clearInterval(intervalId);
  }, [userID, roomCode]);

  return (
    <div className="wait-room-page">
      <h1>
        Welcome to Wait Room {roomCode}, {displayName}!
      </h1>
      <div className="first-row-container">
        {/* Moderator */}
        <div className="moderator">
          <h2>Moderator:</h2>
          <img
            src="/pic.jpg" // {admin.profileImage}
            alt="Moderator's Image"
            className="moderator-avatar"
          />
          <p>{admin}</p>
        </div>

        {/* Presenter */}
        <div className="presenter">
          <h2>Presenter:</h2>
          <img
            src="/pic.jpg" // {presenter.profileImage}
            alt="Presenter 's Image"
            className="presenter-avatar"
          />
          <p>{admin}</p>
        </div>
      </div>
      <div className="guest-list">
        <h2>Joined Guests:</h2>
        <div className="guest-container">
          {guests.map((guest, index) => (
            <div key={index} className="guest">
              <img
                src="/pic.jpg"
                alt={`${guest}'s avatar`}
                className="guest-avatar"
              />
              <p>{guest}</p>
            </div>
          ))}
        </div>
        <div className="river"></div>
      </div>
      {isAdmin && (
        <button className="start-room-button" onClick={handleStartRoom}>
          Start Room
        </button>
      )}
      {
        <button className="start-room-button" onClick={handleChatRoom}>
          Chat Room
        </button>
      }
    </div>
  );
};

export default WaitRoomPage;
