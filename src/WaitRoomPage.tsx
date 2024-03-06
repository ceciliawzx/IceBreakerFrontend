import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { RoomStatus } from "./type/RoomStatus";

/* General function */
import { exportUserProfileAsPDF } from "./utils/ExportPDF";
import { isSameUser } from "./utils/CommonCompare";

/* Image used */
import blackBoard from "./assets/BlackBoard.png";

/* Web socket */
import { connect, socketUrl, websocketUrl } from "./utils/WebSocketService";

/* Instruction */
import Instructions from "./Instructions";
import waitRoomAdminInstructionPic from "./instructions/WaitRoomAdminInstruction.png";
import waitRoomNormalInstructionPic from "./instructions/WaitRoomNormalInstruction.png";

/* CSS */
import "./css/WaitRoomPage.css";

/* Instructions */
const waitRoomAdminInstructions = [
  {
    img: waitRoomAdminInstructionPic,
    text: "",
  },
];

const waitRoomNormalInstructions = [
  {
    img: waitRoomNormalInstructionPic,
    text: "",
  },
];

const WaitRoomPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* Location passed field */
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;

  /* Room status */
  const [roomStatus, setRoomStatus] = useState<RoomStatus>(RoomStatus.WAITING);

  /* Users in room */
  const [guests, setGuests] = useState<User[]>([]);
  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);

  /* User status */
  const [isAdmin, setIsAdmin] = useState(false);
  const [notPresented, setNotPresented] = useState<User[]>([]);
  const [hasPresented, setHasPresented] = useState(false);
  const [allGuestsCompleted, setAllGuestsCompleted] = useState(false);

  const [selectedPresenter, setSelectedPresenter] = useState<User | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);

  /* Popup */
  const [showKickPopup, setShowKickPopup] = useState(false);
  const [showDismissPopup, setShowDismissPopup] = useState(false);
  const [showChangePresenterPopup, setShowChangePresenterPopup] =
    useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showRingPopup, setShowRingPopup] = useState(false);
  const [showFinishPopup, setShowFinishPopup] = useState(false);
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);

  /* UI render */
  const [render, setRender] = useState(false);

  /* -------- Use Effect ---------- */

  /* When mount, connect websokect */
  useEffect(() => {
    const topic = `/topic/room/${roomCode}/wait`;
    const cleanup = connect(
      socketUrl,
      websocketUrl,
      topic,
      onMessageReceived,
      setRender
    );
    return cleanup;
  }, []);

  /* If first time in this page, pop up instruction */
  useEffect(() => {
    // Check if the user has visited the page before
    const pageVisited = localStorage.getItem("waitRoomVisited");

    if (pageVisited !== "true") {
      setShowInstructionPopup(true);

      // Mark the user as visited to prevent showing the popup again
      localStorage.setItem("waitRoomVisited", "true");
    }
  }, []);

  /* When rendered, check all status */
  useEffect(() => {
    checkPlayers();
    checkKickOut();
    checkNotPresented();
    checkRing();
  }, [render]);

  /* When user changed, check user status */
  useEffect(() => {
    // Check whether the user is admin
    checkAdminStatus();

    // Check if all guests and presenter have completed
    const allCompleted =
      (guests.every((guest: User) => guest?.completed) &&
        presenter?.completed) ||
      false;
    setAllGuestsCompleted(allCompleted);

    // If the RoomStatus is PRESENTING, navigate all users to the PresentPage
    if (roomStatus === RoomStatus.PRESENTING) {
      navigate("/PresentPage", {
        state: { user },
      });
    }

    // If the RoomStatus is ALL_FINISHED, navigate all users to the AllPresentedPage
    if (roomStatus === RoomStatus.All_PRESENTED) {
      navigate("/AllPresentedPage", {
        state: { user },
      });
    }
  }, [roomStatus, user, admin, presenter, guests]);

  /* When current presenter finished presentation, change to a new one */
  useEffect(() => {
    if (
      presenter &&
      !notPresented.some((user) => isSameUser(user, presenter))
    ) {
      changeToNextPresenter();
    }
  }, [presenter, notPresented]);

  /* -------- Refresh Management ---------- */

  useEffect(() => {
    if (admin?.userID && presenter?.userID) {
      if (isSameUser(presenter, user)) {
        const notifyServerOnUnload = () => {
          changePresenterAfterQuitting(admin!.userID);
        };

        window.addEventListener("unload", notifyServerOnUnload);

        return () => {
          window.removeEventListener("unload", notifyServerOnUnload);
        };
      }
    }
  }, [admin, presenter]);

  useEffect(() => {
    if (admin?.userID) {
      if (isSameUser(admin, user)) {
        const notifyServerOnUnload = () => {
          handleLeaveRoom();
        };

        window.addEventListener("unload", notifyServerOnUnload);

        return () => {
          window.removeEventListener("unload", notifyServerOnUnload);
        };
      }
    }
  }, [admin]);

  useEffect(() => {
    const notifyServerOnUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";

      const confirmationMessage = "Are you sure you want to leave?";
      event.returnValue = confirmationMessage;
      return confirmationMessage;
    };

    window.addEventListener("beforeunload", notifyServerOnUnload);

    return () => {
      window.removeEventListener("beforeunload", notifyServerOnUnload);
    };
  }, []);

  useEffect(() => {
    const notifyServerOnUnload = () => {
      handleKickUser(userID);
    };

    window.addEventListener("unload", notifyServerOnUnload);

    return () => {
      window.removeEventListener("unload", notifyServerOnUnload);
    };
  }, []);

  useEffect(() => {
    if (admin?.userID && presenter?.userID) {
      if (isSameUser(presenter, user)) {
        const notifyServerOnUnload = () => {
          changePresenterAfterQuitting(admin!.userID);
        };

        window.addEventListener("unload", notifyServerOnUnload);

        return () => {
          window.removeEventListener("unload", notifyServerOnUnload);
        };
      }
    }
  }, [admin, presenter]);

  useEffect(() => {
    if (admin?.userID) {
      if (isSameUser(admin, user)) {
        const notifyServerOnUnload = () => {
          handleLeaveRoom();
        };

        window.addEventListener("unload", notifyServerOnUnload);

        return () => {
          window.removeEventListener("unload", notifyServerOnUnload);
        };
      }
    }
  }, [admin]);

  /* -------- Web Socket ---------- */

  /* When receive web socket message, check all status */
  const onMessageReceived = (msg: any) => {
    checkPlayers();
    checkKickOut();
    checkNotPresented();
    checkRing();
  };

  /* -------- Button Handler ---------- */

  /* When click StartPresenting button */
  const handleStartRoom = async () => {
    // Tell server that to start room
    const response = await fetch(
      `${serverPort}/startPresenting?roomCode=${roomCode}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  };

  /* When click EnterYourInfomation button */
  const handleUserInformation = () => {
    navigate("/UserProfilePage", {
      state: { user },
    });
  };

  /* When click ViewProfile button */
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

  /* When click LeaveRoom button */
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

  /* When admin click Kick button */
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

  /* When admin click FinishPresenting button */
  const handleFinishPresent = () => {
    setShowFinishPopup(true);
  };

  /* When admin click SureToForceFinish button */
  const handleForceFinish = async () => {
    const response = await fetch(
      `${serverPort}/forceBackToAllPresentedRoom?roomCode=${roomCode}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  };

  /* When admin click ChangePresenter button */
  const handleChangePresenter = () => {
    setShowChangePresenterPopup(true);
    setSelectedPresenter(null);
  };

  /* When admin click username in ChoosePresent box */
  const handleSelectPresenter = (selectedUser: User) => {
    setSelectedPresenter(selectedUser);
  };

  /* When admin click Confirm button in ChoosePresent box */
  const confirmChangePresenter = () => {
    var newPresenter;
    if (selectedPresenter) {
      if (isSameUser(selectedPresenter, admin)) {
        newPresenter = admin;
      } else {
        newPresenter = guests.find((guest) =>
          isSameUser(selectedPresenter, guest)
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

  /* When admin click Ring button */
  const handleRingUser = async (userID: string) => {
    // notify this user to hurry up
    const response = await fetch(
      `${serverPort}/pushNotification?roomCode=${roomCode}&userID=${userID}`,
      {
        method: "POST",
      }
    );
  };

  /* When click Response button for Ring popup */
  const handleReceiveNotification = async () => {
    setShowRingPopup(false);
  };

  /* -------- Check status ---------- */

  /* Check if the user is the admin */
  const checkAdminStatus = async () => {
    const url = `${serverPort}/isAdmin?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setIsAdmin(data);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  /* Fetch all player information and room status */
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
        setAdmin(data.admin);
      }
      if (data.presenter) {
        setPresenter(data.presenter);
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

  /* Check if the user is ringed by admin */
  const checkRing = async () => {
    const url = `${serverPort}/isNotified?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }
      if (data) {
        setShowRingPopup(true);
      }
    } catch (error) {
      console.error("Error fetching ring:", error);
    }
  };

  /* Check if the user is kicked out by admin */
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

  /* Check which users has not presented */
  const checkNotPresented = async () => {
    try {
      const response = await fetch(
        `${serverPort}/notPresentedPeople?roomCode=${roomCode}`
      );
      const data = await response.json();
      setNotPresented(data.notPresentedPeople || []);
      setHasPresented(
        !data.notPresentedPeople.some((npUser: any) => isSameUser(npUser, user))
      );

      if (!response.ok) {
        throw new Error("Room cannot be found");
      }
    } catch (error) {
      console.error("Error checking notPresented:", error);
    }
  };

  /* -------- Helper function ---------- */

  /* Change presenter to a not presented user */
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
    } else {
      console.log("No more users to present");
    }
  };

  /* If current presenter exit room, change presenter back to admin  */
  const changePresenterAfterQuitting = async (userID: string) => {
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

  /* -------- UI Component ---------- */

  /* Main renderer */
  return render ? (
    <div className="page">
      <h1>
        Welcome to Wait Room {roomCode}, {displayName}!
      </h1>
      <div className="instruction-button-container">
        {isSameUser(user, admin) ? (
          <Instructions instructionPics={waitRoomAdminInstructions} />
        ) : (
          <Instructions instructionPics={waitRoomNormalInstructions} />
        )}
      </div>

      <div className="blackboard-container">
        <img src={blackBoard} alt="BlackBoard" className="blackBoard" />
        <div className="row-container presenter-on-blackboard">
          {/* Moderator */}

          <div className="column-container">
            <div className="row-container">
              <div className="avatar-container" style={{ color: "white" }}>
                <h2>Moderator:</h2>
                <img
                  src={`${admin?.profileImage}`} // {admin.profileImage}
                  alt="Moderator's Image"
                  className="avatar"
                />
              </div>
              <div className="column-container" style={{ gap: "10px" }}>
                {admin?.completed && (
                  <div className="indicator input-status-indicator"></div>
                )}
                {!notPresented.some((npUser) => isSameUser(npUser, admin)) && (
                  <div className="indicator presented-status-indicator"></div>
                )}
              </div>
            </div>

            <div style={{ color: "white" }}>
              <p>{admin?.displayName}{isSameUser(user, admin)? " (YOU)" : ""}</p>
            </div>

            {
              <button
                className="button common-button"
                onClick={() => handleViewProfile(admin)}
                // If not admin; and admin not presented; cannot view
                disabled={
                  !isAdmin &&
                  notPresented.some((npUser) => isSameUser(npUser, admin))
                }
              >
                View Profile
              </button>
            }
          </div>

          {/* Presenter */}
          <div className="column-container">
            <div className="row-container">
              <div className="avatar-container" style={{ color: "white" }}>
                <h2>Presenter:</h2>
                <img
                  src={`${presenter?.profileImage}`}
                  alt={`${presenter?.displayName}'s avatar`}
                  className="avatar"
                />
              </div>
              <div className="column-container">
                {presenter?.completed && (
                  <div className="indicator input-status-indicator"></div>
                )}
                {!notPresented.some((npUser) =>
                  isSameUser(npUser, presenter)
                ) && (
                  <div className="indicator presented-status-indicator"></div>
                )}
              </div>
            </div>

            <div style={{ color: "white" }}>
              <p>{presenter?.displayName}{isSameUser(user, presenter)? " (YOU)" : ""}</p>
            </div>

            {
              <button
                className="button common-button"
                onClick={() => handleViewProfile(presenter)}
                // If not admin; and not presented; and not me
                disabled={
                  !isAdmin &&
                  notPresented.some((npUser) =>
                    isSameUser(npUser, presenter)
                  ) &&
                  !isSameUser(presenter, user)
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
                  </div>
                  <p>{guest.displayName}{isSameUser(user, guest)? " (YOU)" : ""}</p>
                </div>

                <div
                  className="column-container"
                  style={{ paddingBottom: "30px" }}
                >
                  {isAdmin && !guest.completed && (
                    <button
                      className="button red-button"
                      onClick={() => handleRingUser(guest.userID)}
                    >
                      Ring
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      className="button red-button "
                      onClick={() => handleKickUser(guest.userID)}
                    >
                      Kick
                    </button>
                  )}

                  <button
                    className="button common-button"
                    onClick={() => handleViewProfile(guest)}
                    // If not admin and not presented and not me
                    disabled={
                      !isAdmin &&
                      notPresented.some((npUser) =>
                        isSameUser(npUser, guest)
                      ) &&
                      !isSameUser(guest, user)
                    }
                  >
                    View Profile
                  </button>

                  <div className="indicators-container">
                    {guest.completed && (
                      <div className="indicator input-status-indicator"></div>
                    )}
                    {!notPresented.some((npUser) =>
                      isSameUser(npUser, guest)
                    ) && (
                      <div className="indicator presented-status-indicator"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasPresented && (
        <button
          className="button common-button"
          onClick={handleUserInformation}
        >
          Enter your information
        </button>
      )}

      {isAdmin && (
        <button
          className="button admin-only-button"
          onClick={handleStartRoom}
          disabled={!allGuestsCompleted || guests.length == 0}
        >
          Start Presenting
        </button>
      )}

      {isAdmin && (
        <button
          className="button admin-only-button"
          onClick={handleFinishPresent}
        >
          Finish Presenting
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

      {/* Dimmiss popup */}
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

      {/* Kickout popup */}
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
      {showRingPopup && (
        <div className="overlay-popup">
          <div className="popup">
            <p>Please wrap it up.</p>
            <button
              className="button common-button"
              onClick={() => handleReceiveNotification()}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Change presenter popup */}
      {showChangePresenterPopup && (
        <div className="change-presenter-popup">
          <h3>Select New Presenter:</h3>
          <ul>
            {notPresented
              .filter((user) => !isSameUser(user, presenter))
              .map((user) => (
                <li
                  key={user.userID}
                  onClick={() => handleSelectPresenter(user)}
                  className={
                    isSameUser(selectedPresenter, user) ? "selected" : ""
                  }
                >
                  {user.displayName} {isSameUser(user, admin) ? "(admin)" : ""}
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

      {/* Show profile popup */}
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

      {/* Finish presenting popup */}
      {showFinishPopup && (
        <div className="overlay-popup">
          <div className="popup">
            <div>
              <p>Do you really want to finish presenting?</p>
              <p>The rest people have not presented:</p>
              {notPresented.map((user: any) => (
                <p key={user.userID}>{user.displayName}</p>
              ))}
            </div>

            <div className="column-container">
              <button
                className="button admin-only-button"
                onClick={() => setShowFinishPopup(false)}
              >
                Continue Presenting
              </button>

              <button
                className="button red-button"
                onClick={() => handleForceFinish()}
              >
                Finish Presenting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First time instruction popup */}
      {showInstructionPopup &&
        (isSameUser(user, admin) ? (
          <Instructions
            instructionPics={waitRoomAdminInstructions}
            onlyShowPopup={true}
            closeButtonFunction={() => setShowInstructionPopup(false)}
          />
        ) : (
          <Instructions
            instructionPics={waitRoomNormalInstructions}
            onlyShowPopup={true}
            closeButtonFunction={() => setShowInstructionPopup(false)}
          />
        ))}
    </div>
  ) : (
    <></>
  );
};

export default WaitRoomPage;
