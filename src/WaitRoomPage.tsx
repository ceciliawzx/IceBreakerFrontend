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
  const [showDismissPopup, setShowDismissPopup] = useState(false);
  const [showKickPopup, setShowKickPopup] = useState(false);

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
      state: { user },
    });
  };

  const handleUserInformation = () => {
    navigate("/UserProfilePage", {
      state: { user },
    });
  };

  const handleKickUser = async (userID: string) => {
    // kick this user
    const response = await fetch(
      `${serverPort}/kickPerson?roomCode=${roomCode}&userID=${userID}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // TODO: send http request to that user and popup
  };

  const handleLeaveRoom = async () => {
    // If admin leaves, send http request to delete room and all user should be kicked out
    if (isAdmin) {
      // TODO: send http request

      // Destroy room
      const response = await fetch(
        `${serverPort}/destroyRoom?roomCode=${roomCode}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      } else {
        setShowDismissPopup(true);
      }
    } else {
      // kick this user
      const response = await fetch(
        `${serverPort}/kickPerson?roomCode=${roomCode}&userID=${userID}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      } else {
        navigate("/");
      }
    }
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
            roomCode,
            data.admin.userID,
            data.admin.displayName,
            true,
            data.admin.profileImage
          )
        );
      }
      if (data.otherPlayers) {
        setGuests(
          data.otherPlayers.map(
            (player: any) =>
              new User(
                roomCode,
                player.userID,
                player.displayName,
                false,
                player.profileImage
              )
          )
        );
      }

      // If start present, into present page
      // if (data.gameStatus == START_PRESENT) {
      //   navigate("/PresentPage", {
      //     state: { user },
      //   });
      // }

      // If room destroyed, should pop up and kick out
      // if (data.gameStatuss == ROOM_DISMISSED) {
      // setShowPopup(true);
      // }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  // Periodically check room status
  useEffect(() => {
    checkAdminStatus();
    checkRoomStatus();

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
          src={admin?.profileImage ? `${admin.profileImage}` : "/pic.jpg"}
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
                src={guest?.profileImage ? `${guest.profileImage}` : "/pic.jpg"}
                alt={`${guest}'s avatar`}
                className="guest-avatar"
              />
              <p>{guest.displayName}</p>
              {isAdmin && (
                <button
                  className="kick-button"
                  onClick={() => handleKickUser(guest.userID)}
                >
                  Kick
                </button>
              )}
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
      {
        <button className="start-room-button" onClick={handleUserInformation}>
          Enter your information
        </button>
      }
      {
        <button className="leave-room-button" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      }
      {showDismissPopup && (
        <div className="popup">
          <p>
            Room {roomCode} dismissed by moderator.
            <br />
            Returning to homepage.
          </p>
          <button onClick={() => navigate("/")}>OK</button>
        </div>
      )}
      {showKickPopup && (
        <div className="popup">
          <p>
            You are kicked out by moderator.
            <br />
            Returning to homepage.
          </p>
          <button onClick={() => navigate("/")}>OK</button>
        </div>
      )}
    </div>
  );
};

export default WaitRoomPage;
