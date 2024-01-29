import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./css/WaitRoomPage.css";
import { serverPort } from "./macro/MacroServer";
import { refreshTime } from "./macro/MacroConst";
import { User } from "./type/User";

const WaitRoomPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;
  const [guests, setGuests] = useState<User[]>([]);
  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDismissPopup, setShowDismissPopup] = useState(false);
  const [showKickPopup, setShowKickPopup] = useState(false);
  const [showChangePresenterPopup, setShowChangePresenterPopup] =
    useState(false);
  const [selectedPresenterUserID, setSelectedPresenterUserID] = useState<
    string | null
  >(null);
  const [allGuestsCompleted, setAllGuestsCompleted] = useState(false);

  const handleStartRoom = async () => {
    // Tell server that to start room
    const response = await fetch(
      `${serverPort}/startInput?roomCode=${roomCode}`,
      {
        method: "POST",
      }
    );
    console.log("start room");
    console.log(response)
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
    const preID = presenter?.userID;
    navigate("/UserProfilePage", {
      state: { user, preID},
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
      // user leave room
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

  const handleChangePresenter = () => {
    setShowChangePresenterPopup(true);
    setSelectedPresenterUserID(null);
  };

  const handleSelectPresenter = (userID: string) => {
    setSelectedPresenterUserID(userID);
  };

  const confirmChangePresenter = () => {
    var newPresenter;
    if (selectedPresenterUserID) {
      if (selectedPresenterUserID == admin?.userID) {
        newPresenter = admin;
      } else {
        newPresenter = guests.find(
          (guest) => guest.userID === selectedPresenterUserID
        );
      }

      if (newPresenter) {
        fetch(
          `${serverPort}/changePresenter?roomCode=${roomCode}&userID=${newPresenter.userID}`,
          {
            method: "POST",
          }
        );
      }
    }
    setShowChangePresenterPopup(false); // Close the popup
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

      // Check if room dismissed
      Object.values(data).some((value) => {
        if (
          typeof value === "string" &&
          value.includes("Room cannot be found")
        ) {
          setShowDismissPopup(true);
          return;
        }
      });

      if (data.admin) {
        setAdmin(
          new User(
            roomCode,
            data.admin.userID,
            data.admin.displayName,
            true,
            data.admin.profileImage,
            data.admin.completed
          )
        );
      }
      if (data.presenter) {
        setPresenter(
          new User(
            roomCode,
            data.presenter.userID,
            data.presenter.displayName,
            data.presenter.admin,
            data.presenter.profileImage,
            data.presenter.completed
          )
        );
      }
      if (data.otherPlayers) {
        const updatedGuests = data.otherPlayers.map(
          (guest: User) =>
            new User(
              roomCode,
              guest.userID,
              guest.displayName,
              false,
              guest.profileImage,
              guest.completed
            )
        );

        setGuests(updatedGuests);

        // Check if all guests have completed
        const allCompleted = updatedGuests.every(
          (guest: User) => guest.completed
        );
        setAllGuestsCompleted(allCompleted);
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

  const checkKickOut = async () => {
    const url = `${serverPort}/getPlayer?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.text();
      if (data == "Person Not Found") {
        setShowKickPopup(true);
      }
    } catch (error) {
      console.error("Error fetching player:", error);
    }
  };

  // Periodically check room status
  useEffect(() => {
    checkAdminStatus();
    checkRoomStatus();

    // Update the player list every interval
    const intervalId = setInterval(() => {
      checkRoomStatus();
      checkKickOut();
    }, refreshTime);

    // Clear timer and count again
    return () => clearInterval(intervalId);
  }, [userID, roomCode]);

  // main render
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
            src={`${admin?.profileImage}`} // {admin.profileImage}
            alt="Moderator's Image"
            className="moderator-avatar"
          />
          <p>{admin?.displayName}</p>
        </div>

        {/* Presenter */}
        <div className="presenter">
          <h2>Presenter:</h2>
          <img
            src={`${presenter?.profileImage}`} // {presenter.profileImage}
            alt="Presenter 's Image"
            className="presenter-avatar"
          />
          <p>{presenter?.displayName}</p>
          {isAdmin && (
            <button
              className="change-presenter-button"
              onClick={handleChangePresenter}
            >
              Change Presenter
            </button>
          )}
        </div>
      </div>

      <div className="guest-list">
        <h2>Joined Guests:</h2>
        <div className="guest-container">
          {guests.map((guest, index) => (
            <div key={index} className="guest">
              <div className="avatar-container">
                <img
                  src={`${guest.profileImage}`}
                  alt={`${guest}'s avatar`}
                  className="guest-avatar"
                />
                {guest.completed && (
                  <div className="input-status-indicator">✓</div>
                )}
              </div>
              <p>{guest.displayName}</p>
              {isAdmin && (
                <button
                  className="kick-button"
                  onClick={() => handleKickUser(guest.userID)}
                ></button>
              )}
            </div>
          ))}
        </div>
        <div className="river"></div>
      </div>
      {isAdmin && (
        <button
          className="start-room-button"
          onClick={handleStartRoom}
          disabled={!allGuestsCompleted}
        >
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
      {/* dimmiss popup */}
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
      {/* kickout popup */}
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
      {/* change presenter popup */}
      {showChangePresenterPopup && (
        <div className="change-presenter-popup">
          <h3>Select New Presenter:</h3>
          <ul>
            {guests.concat(admin || []).map((user) => (
              <li
                key={user.userID}
                onClick={() => handleSelectPresenter(user.userID)}
                className={
                  selectedPresenterUserID === user.userID ? "selected" : ""
                }
              >
                {user.displayName}
              </li>
            ))}
          </ul>
          <div className="button-container">
            <button onClick={confirmChangePresenter}>Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitRoomPage;
