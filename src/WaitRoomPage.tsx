import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./css/WaitRoomPage.css";
import { serverPort } from "./macro/MacroServer";
import { refreshTime } from "./macro/MacroConst";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { RoomStatus } from "./type/RoomStatus";
import exportUserProfileAsPDF from "./utils/ExportPDF";

const WaitRoomPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;
  const [isPresenter, setIsPresenter] = useState(false);
  const [guests, setGuests] = useState<User[]>([]);
  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showKickPopup, setShowKickPopup] = useState(false);
  const [showDismissPopup, setShowDismissPopup] = useState(false);
  const [showChangePresenterPopup, setShowChangePresenterPopup] =
    useState(false);
  const [selectedPresenterUserID, setSelectedPresenterUserID] = useState<
    string | null
  >(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [allGuestsCompleted, setAllGuestsCompleted] = useState(false);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>(RoomStatus.WAITING);

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

  const handleUserInformation = () => {
    const preID = presenter?.userID;

    navigate("/UserProfilePage", {
      state: { user, preID },
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
      // Destroy room
      const response = await fetch(
        `${serverPort}/destroyRoom?roomCode=${roomCode}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
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

  const handleViewProfile = async (user: User | null) => {
    if (user) {
      const url = `${serverPort}/getPlayer?userID=${user.userID}&roomCode=${roomCode}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        setSelectedUserProfile(
          new UserProfile(
            data.userInfo.displayName,
            data.userInfo.roomCode,
            data.userInfo.userID,
            data.userInfo.profileImage,
            data.userInfo.firstName,
            data.userInfo.lastName,
            data.userInfo.country,
            data.userInfo.city,
            data.userInfo.feeling,
            data.userInfo.favFood,
            data.userInfo.favActivity
          )
        );

        setShowProfilePopup(true);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
  };

  const confirmChangePresenter = () => {
    var newPresenter;
    if (selectedPresenterUserID) {
      if (selectedPresenterUserID === admin?.userID) {
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

  const checkPresenterStatus = async () => {
    const url = `${serverPort}/isPresenter?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setIsPresenter(data === true);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  // Fetch the players & check if room start from the backend
  const checkPlayers = async () => {
    const url = `${serverPort}/getPlayers?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.json();

      // Check if room dismissed
      Object.values(data).some((value) => {
        if (typeof value === "string" && value.includes("Room Not Found")) {
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
            // need to change after present room is completed
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
            false,
            true,
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
              false,
              guest.profileImage,
              guest.completed
            )
        );
        setGuests(updatedGuests);
      }
      if (data.roomStatus) {
        setRoomStatus(data.roomStatus);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  const checkKickOut = async () => {
    const url = `${serverPort}/getPlayer?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }
      if (data.error === "Person Not Found") {
        setShowKickPopup(true);
      }
    } catch (error) {
      console.error("Error fetching player:", error);
    }
  };

  useEffect(() => {
    // Check whether the user is admin
    checkAdminStatus();
    // Check whether the user is presenter
    checkPresenterStatus();

    // Check if all guests and presenter have completed
    const allCompleted =
      (guests.every((guest: User) => guest?.completed) &&
        presenter?.completed) ||
      false;
    setAllGuestsCompleted(allCompleted);

    // If the RoomStatus is PRESENTING, navigate all users to the PresentPage
    if (roomStatus === RoomStatus.PRESENTING) {
      navigate("/PresentPage", {
        state: { user, admin, presenter, guests },
      });
    }
  }, [roomStatus, user, admin, presenter, guests]);

  // Every refreshtime
  useEffect(() => {
    // Update the player list every interval
    const intervalId = setInterval(() => {
      checkPlayers();
      checkKickOut();
    }, refreshTime);

    // Clear timer and count again
    return () => clearInterval(intervalId);
  }, []);

  // main render
  return (
    <div className="page">
      <h1>
        Welcome to Wait Room {roomCode}, {displayName}!
      </h1>
      <div className="row-container">
        {/* Moderator */}
        <div className="moderator">
          <h2>Moderator:</h2>
          <img
            src={`${admin?.profileImage}`} // {admin.profileImage}
            alt="Moderator's Image"
            className="avatar"
          />
          <p>{admin?.displayName}</p>
        </div>

        {/* Presenter */}
        <div className="presenter">
          <h2>Presenter:</h2>

          <div className="avatar-container">
            <img
              src={`${presenter?.profileImage}`}
              alt={`${presenter}'s avatar`}
              className="avatar"
            />
            {presenter?.completed && (
              <div className="input-status-indicator">✓</div>
            )}
          </div>
          <p>{presenter?.displayName}</p>
          {isAdmin && (
            <div className="button-container">
              <button
                className="admin-only-button"
                onClick={() => handleViewProfile(presenter)}
              >
                View Profile
              </button>

              <button
                className="admin-only-button"
                onClick={handleChangePresenter}
              >
                Change Presenter
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="guest-list">
        <h2>Joined Guests:</h2>
        <div className="row-container">
          {guests.map((guest, index) => (
            <div key={index} className="guest">
              <div className="avatar-container">
                <img
                  src={`${guest.profileImage}`}
                  alt={`${guest}'s avatar`}
                  className="avatar"
                />
                {guest.completed && (
                  <div className="input-status-indicator">✓</div>
                )}
              </div>
              <p>{guest.displayName}</p>
              {isAdmin && (
                <button
                  className="admin-only-button"
                  onClick={() => handleViewProfile(guest)}
                >
                  View Profile
                </button>
              )}
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
          className="admin-only-button"
          onClick={handleStartRoom}
          disabled={!allGuestsCompleted || guests.length == 0}
        >
          Start Room
        </button>
      )}
      {
        <button className="common-button" onClick={handleUserInformation}>
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

      {/* show profile popup */}
      {isAdmin && showProfilePopup && selectedUserProfile && (
        <div className="popup">
          <p>First name: {selectedUserProfile.firstName}</p>
          <p>Last name: {selectedUserProfile.lastName}</p>
          <p>Country: {selectedUserProfile.country}</p>
          <p>City: {selectedUserProfile.city}</p>
          <p>Feeling: {selectedUserProfile.feeling}</p>
          <p>Favourite food: {selectedUserProfile.favFood}</p>
          <p>Favourite activity: {selectedUserProfile.favActivity}</p>
          <button
            className="common-button"
            onClick={() => setShowProfilePopup(false)}
          >
            Close
          </button>
          <div>
            <button
              className="common-button"
              onClick={() => exportUserProfileAsPDF(selectedUserProfile)}
            >
              Export as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitRoomPage;
