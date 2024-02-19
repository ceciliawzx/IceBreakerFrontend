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
import blackBoard from "./assets/BlackBoard.png";

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
  const [notPresented, setNotPresented] = useState<User[]>([]);
  const [hasPresented, setHasPresented] = useState(false);
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
  const [showRingPopUp, setShowRingPopUp] = useState(false);

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



  const handleChangePresenterAfterQuitting = async (userID: string) => {
    const response = await fetch(
      `${serverPort}/changePresenter?roomCode=${roomCode}&userID=${userID}`,
      {
        method: "POST",
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

  const handleRingUser = async (userID: string) => {
    // notify this user to hurry up
    const response = await fetch(
      `${serverPort}/pushNotification?roomCode=${roomCode}&userID=${userID}`,
      {
        method: "POST",
      }
    );
  };

  const handleReceiveNotification = async () => {
    const response = await fetch(
      `${serverPort}/acknowledgeNotification?roomCode=${roomCode}&userID=${userID}`,
      {
        method: "POST",
      }
    );

    setShowRingPopUp(false);
    
  }

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

  const changeToNextPresenter = async () => {
    // Ensure there are users who haven't presented
    if (notPresented.length > 0) {
      // Select the next presenter (e.g., the first in the list)
      const nextPresenterID = notPresented[0].userID;

      // Make an API call or update state to change the presenter
      const response = await fetch(
        `${serverPort}/changePresenter?roomCode=${roomCode}&userID=${nextPresenterID}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        return;
      }

      // Update local state if necessary (e.g., set new presenter, update notPresented list)
      setPresenter(notPresented[0]);
    } else {
      console.log("No more users to present");
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
      console.log("roome status:", roomStatus);
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  const checkRing = async () => {
    const url = `${serverPort}/isNotified?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }
      if (data) {
        console.log("Notification received!");
        setShowRingPopUp(true);
      }
      
    } catch (error) {
      console.error("Error fetching ring:", error);
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

  const checkNotPresented = async () => {
    try {
      const response = await fetch(
        `${serverPort}/notPresentedPeople?roomCode=${roomCode}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      setNotPresented(data.notPresentedPeople || []);
      setHasPresented(!(notPresented.some((npUser) => npUser.userID === userID)));
      console.log("check who has not presenter", notPresented);
      console.log("current user presented?", hasPresented);

      if (!response.ok) {
        throw new Error("Room cannot be found");
      }
    } catch (error) {
      console.error("Error checking notPresented:", error);
    }
  };

  // check if current presenter finished presentation, if so change to a new one
  useEffect(() => {
    // Example check to see if presenter has finished
    if (
      presenter &&
      !notPresented.some((user) => user.userID === presenter.userID)
    ) {
      changeToNextPresenter();
    }
  }, [presenter, notPresented]);

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

    // If the RoomStatus is ALL_FINISHED, navigate all users to the AllPresentedPage
    if (roomStatus === RoomStatus.All_PRESENTED) {
      navigate("/AllPresentedPage", {
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
      checkNotPresented();
    }, refreshTime);

    // Clear timer and count again
    return () => clearInterval(intervalId);
  }, [notPresented]);

  useEffect(() => {
    const notifyServerOnUnload = () => {
      handleKickUser(userID);
    };

    window.addEventListener("beforeunload", notifyServerOnUnload);

    return () => {
      window.removeEventListener("beforeunload", notifyServerOnUnload);
    };
  }, []);

  useEffect(() => {
    if (admin?.userID && presenter?.userID) {
      if (presenter.userID === userID) {
        const notifyServerOnUnload = () => {
          handleChangePresenterAfterQuitting(admin!.userID);
        };

        window.addEventListener("beforeunload", notifyServerOnUnload);

        return () => {
          window.removeEventListener("beforeunload", notifyServerOnUnload);
        };
      }
    }
  }, [admin, presenter]);

  useEffect(() => {
    checkRing()

    const intervalId = setInterval(() => {
      checkRing()
    }, refreshTime);

    return () => clearInterval(intervalId);
    
  }, [showRingPopUp]);

  // main render
  return (
    <div className="page">
      <h1>
        Welcome to Wait Room {roomCode}, {displayName}!
      </h1>
      <div className="blackboard-container">
        <img src={blackBoard} alt="BlackBoard" className="blackBoard" />
        <div className="row-container presenter-on-blackboard">
          {/* Moderator */}
          <div className="avatar-container" style={{ color: "white" }}>
            <h2>Moderator:</h2>
            <img
              src={`${admin?.profileImage}`} // {admin.profileImage}
              alt="Moderator's Image"
              className="avatar"
            />
            <p>{admin?.displayName}</p>
          </div>

          <div className="column-container">
            <div className="avatar-container">
              <h2>Presenter:</h2>
              <img
                src={`${presenter?.profileImage}`}
                alt={`${presenter?.displayName}'s avatar`}
                className="avatar"
              />

              {presenter?.completed && (
                <div className="input-status-indicator">✓</div>
              )}

              {/* Show presented indicator */}
              {!notPresented.some(
                (npUser) => npUser.userID === presenter?.userID
              ) && <div className="presented-status-indicator">6</div>}
            </div>

            <div style={{ color: "white" }}>
              <p>{presenter?.displayName}</p>
            </div>

            {
              <button
                className="button common-button"
                onClick={() => handleViewProfile(presenter)}
                disabled={
                  !isAdmin &&
                  notPresented.some(
                    (npUser) => npUser.userID === presenter?.userID
                  )
                }
              >
                View Profile
              </button>
            }

            {isAdmin && (
              <button
                className="button admin-only-button"
                onClick={handleChangePresenter}
              >
                Change Presenter
              </button>
            )}
          </div>
          {/* Presenter on the blackboard */}
        </div>
      </div>

      <div className="guest-list">
        <h2>Joined Guests:</h2>
        <div className="row-container">
          {guests.map((guest, index) => (
            <div key={index} className="guest-card">
              <div className="row-container">
                <div className="column-container">
                  <div className="avatar-container">
                    <img
                      src={`${guest.profileImage}`}
                      alt={`${guest}'s avatar`}
                      className="avatar"
                    />
                    {guest.completed && (
                      <div className="input-status-indicator">✓</div>
                    )}

                    {/* Show presented indicator */}
                    {!notPresented.some(
                      (npUser) => npUser.userID === guest.userID
                    ) && <div className="presented-status-indicator">6</div>}
                  </div>
                  <p>{guest.displayName}</p>
                </div>

                <div
                  className="column-container"
                  style={{ paddingBottom: "30px" }}
                >
                  {isAdmin && (
                    <button
                      className="button red-button "
                      onClick={() => handleKickUser(guest.userID)}
                    >
                      Kick
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      className="button red-button "
                      onClick={() => handleRingUser(guest.userID)}
                    >
                      Ring
                    </button>
                  )}

                  <button
                    className="button common-button"
                    onClick={() => handleViewProfile(guest)}
                    disabled={
                      !isAdmin &&
                      notPresented.some(
                        (npUser) => npUser.userID === guest.userID
                      )
                    }
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {isAdmin && (
        <button
          className="button admin-only-button"
          onClick={handleStartRoom}
          disabled={!allGuestsCompleted || guests.length == 0}
        >
          Start Presenting
        </button>
      )}
      {!hasPresented && (
        <button
        className="button common-button"
        onClick={handleUserInformation}
      >
        Enter your information
      </button>

      )}

      {
        <button
          className="button red-button leave-room-button"
          onClick={handleLeaveRoom}
        >
          Leave Room
        </button>
      }
      {/* dimmiss popup */}
      {showDismissPopup && (
        <div className="overlay-popup">
          <div className="popup">
            <p>
              Room {roomCode} dismissed by moderator.
              <br />
              Returning to homepage.
            </p>
            <button
              className="button common-button"
              onClick={() => navigate("/")}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* kickout popup */}
      {showKickPopup && (
        <div className="overlay-popup">
          <div className="popup">
            <p>
              You are kicked out by moderator.
              <br />
              Returning to homepage.
            </p>
            <button
              className="button common-button"
              onClick={() => navigate("/")}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Ring popup */}
      {showRingPopUp && (
        <div className="overlay-popup">
          <div className="popup">
            <p>
              Please wrap it up.
            </p>
            <button
              className="button common-button"
              onClick={() => handleReceiveNotification()}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* change presenter popup */}
      {showChangePresenterPopup && (
        <div className="change-presenter-popup">
          <h3>Select New Presenter:</h3>
          <ul>
            {notPresented
              .filter((user) => user.userID !== presenter?.userID)
              .map((user) => (
                <li
                  key={user.userID}
                  onClick={() => handleSelectPresenter(user.userID)}
                  className={
                    selectedPresenterUserID === user.userID ? "selected" : ""
                  }
                >
                  {user.displayName}{" "}
                  {user.userID === admin?.userID ? "(admin)" : ""}
                </li>
              ))}
          </ul>
          <div>
            <button
              className="button admin-only-button"
              onClick={confirmChangePresenter}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* show profile popup */}
      {showProfilePopup && selectedUserProfile && (
        <div className="outside-popup">
          <p>First name: {selectedUserProfile.firstName}</p>
          <p>Last name: {selectedUserProfile.lastName}</p>
          <p>Country: {selectedUserProfile.country}</p>
          <p>City: {selectedUserProfile.city}</p>
          <p>Feeling: {selectedUserProfile.feeling}</p>
          <p>Favourite food: {selectedUserProfile.favFood}</p>
          <p>Favourite activity: {selectedUserProfile.favActivity}</p>
          <button
            className="button common-button"
            onClick={() => setShowProfilePopup(false)}
          >
            Close
          </button>
          <div>
            <button
              className="button common-button"
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
