import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./WaitRoomPage.css";
import { refreshTime, serverPort } from "./MacroConst";
import { User } from "./User";

const WaitRoomPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;
  const [guests, setGuests] = useState<User[]>([]);
  const [admin, setAdmin] = useState<User | null>(null);
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
        setAdmin(
          new User(
            data.admin.displayName,
            roomCode,
            data.admin.userID,
            true,
            data.admin.profileImage,
          )
        );
        console.log(admin);
        console.log(admin?.userID);
        console.log(admin?.profileImage);
      }
      if (data.otherPlayers) {
        setGuests(
          data.otherPlayers.map(
            (player: any) =>
              new User(
                player.displayName,
                roomCode,
                player.userID,
                false,
                player.profileImage
              )
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
      <h1>Your ID is {userID}</h1>
      <div className="moderator">
        <h2>Moderator:</h2>
        <img
          src={
            admin?.profileImage
              ? `data:image/jpeg;base64,${admin.profileImage}`
              : "/pic.jpg"
          }
          alt="Moderator's Image"
          className="moderator-avatar"
        />
        <p>{admin?.displayName}</p>
      </div>
      <div className="guest-list">
        <h2>Joined Guests:</h2>
        <div className="guest-container">
          {guests.map((guest, index) => (
            <div key={index} className="guest">
              <img
                src={
                  guest?.profileImage
                    ? `data:image/jpeg;base64,${guest.profileImage}`
                    : "/pic.jpg"
                }
                alt={`${guest}'s avatar`}
                className="guest-avatar"
              />
              <p>{guest.displayName}</p>
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
