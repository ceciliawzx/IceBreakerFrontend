import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import { GameType } from "./type/GameType";
import { RoomStatus } from "./type/RoomStatus";

/* General function */
import { disableScroll } from "./utils/CssOperation";
import { updatePresentRoomInfo } from "./utils/RoomOperation";
import { isSameUser } from "./utils/CommonCompare";

/* Image used */
import blackBoard from "./assets/BlackBoard.png";

/* Web socket */
import { connect, socketUrl, websocketUrl } from "./utils/WebSocketService";

/* Instruction */
import Instructions from "./Instructions";
import presentRoomInstructionPic from "./instructions/PresentRoomInstruction.png";

/* CSS */
import "./css/PresentPage.css";

/* Instructions */
const presentRoomInstructions = [
  {
    img: presentRoomInstructionPic,
    text: "",
  },
];

/* Name alias for game */
const getGameName = (gameType: GameType) => {
  switch (gameType) {
    case GameType.PICTIONARY:
      return "DRAW&GUESS";
    default:
      return gameType;
  }
};

const PresentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* Location passed field */
  const user: User = location.state?.user;
  const userID: string = user.userID;
  const roomCode: string = user.roomCode;

  /* Room status */
  const [roomStatus, setRoomStatus] = useState<RoomStatus>(
    RoomStatus.PRESENTING
  );
  const [presentRoomInfo, setPresentRoomInfo] = useState<PresentRoomInfo>({
    firstName: false,
    lastName: false,
    country: false,
    city: false,
    feeling: false,
    favFood: false,
    favActivity: false,
  });

  /* Users in room */
  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);
  const [presenterInfo, setPresenterInfo] = useState<UserProfile | null>(null);

  /* User status */
  const [allPresented, setAllPresented] = useState<boolean>(false);

  /* GameSelector related */
  const [activeGameSelector, setActiveGameSelector] = useState(null);
  const [selectedField, setSelectedField] = useState<keyof PresentRoomInfo>();
  const [availableGamesForField, setAvailableGamesForField] = useState({
    firstName: [],
    lastName: [],
    country: [],
    city: [],
    feeling: [],
    favFood: [],
    favActivity: [],
  });

  /* Popup */
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);

  /* UI render */
  const [render, setRender] = useState(false);

  /* -------- Use Effect ---------- */

  /* disable scroll for this page */
  useEffect(disableScroll, []);

  /* If first time to this page, pop up instruction */
  useEffect(() => {
    const pageVisited = localStorage.getItem("presentRoomVisited");

    if (pageVisited !== "true") {
      setShowInstructionPopup(true);

      // Mark the user as visited to prevent showing the popup again
      localStorage.setItem("presentRoomVisited", "true");
    }
  }, []);

  /* Connect to refetch websokect */
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

  /* Initial pull */
  useEffect(() => {
    checkPresentRoomInfo();
    checkPlayers();
  }, [render]);

  /* When presenter loaded, fetch presenterInfo */
  useEffect(() => {
    if (presenter?.userID) {
      fetchPresenterInfo();
      // Refetch available games for each field when the component mounts
      Object.keys(presentRoomInfo).forEach((fieldName) => {
        fetchAvailableGames(fieldName);
      });
    }
  }, [presenter]);

  /* When presenter loaded, start render */
  useEffect(() => {
    if (presenter !== null) {
      setRender(true);
    }
  }, [presenter]);

  /* Navigate based on RoomStatus */
  useEffect(() => {
    switch (roomStatus) {
      case RoomStatus.SHAREBOARD:
        navigate("/PictionaryRoomPage", { state: { user, selectedField } });
        break;

      case RoomStatus.PICTURING:
        navigate("/PictionaryRoomPage", { state: { user, selectedField } });
        break;

      case RoomStatus.GEO_GUESSING:
        navigate("/GeoguesserPage", {
          state: { user, presenter, selectedField },
        });
        break;

      case RoomStatus.WORDLING:
        navigate("/WordlePage", { state: { user, selectedField } });
        break;

      case RoomStatus.HANGMAN:
        navigate("/HangmanPage", { state: { user, selectedField } });
        break;

      case RoomStatus.WAITING:
      case RoomStatus.All_PRESENTED:
        navigate("/WaitRoomPage", { state: { user } });
        break;

      default:
        break;
    }
  }, [roomStatus, user, presenter, allPresented]);

  /* -------- Refresh Management ---------- */

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

  /* -------- Web Socket ---------- */

  const onMessageReceived = (msg: any) => {
    checkPlayers();
    checkPresentRoomInfo();
  };

  /* -------- Button Handler ---------- */

  /* When presenter or admin click Reveal button */
  const handleReveal = (field: keyof PresentRoomInfo) => {
    if (isSameUser(user, presenter) || isSameUser(user, admin)) {
      // Reveal the field directly
      updatePresentRoomInfo({ roomCode, field });
    }
  };

  /* When admin click RevealAll button */
  const handleRevealAll = async () => {
    const url = `${serverPort}/revealAllPresentRoomInfo?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error returning to WaitRoom:", error);
    }
  };

  /* When admin click BackToWaitRoom button */
  const handleBackToWaitRoom = async () => {
    const url = `${serverPort}/backToWaitRoom?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error returning to WaitRoom:", error);
    }
  };

  /* When presenter choose game from gamebox */
  const handleGameSelection = (
    gameType: GameType,
    fieldName: keyof PresentRoomInfo
  ) => {
    setSelectedField(fieldName);
    if (gameType === GameType.REVEAL) {
      // Directly reveal the information for this field
      handleReveal(fieldName);
    } else {
      // Pictionary
      const handlePictionaryRoom = async (fieldName: keyof PresentRoomInfo) => {
        const target = presenterInfo ? presenterInfo[fieldName] : "";
        const response = await fetch(
          `${serverPort}/startDrawAndGuess?roomCode=${roomCode}&fieldName=${fieldName}&targetWord=${target}`,
          {
            method: "POST",
          }
        );
        if (!response.ok) {
          throw new Error(
            `HTTP error when startDrawAndGuess! Status: ${response.status}`
          );
        }
      };
      if (gameType === GameType.PICTIONARY) {
        handlePictionaryRoom(fieldName);
      }

      // Shareboard
      const handleShareBoard = async (fieldName: keyof PresentRoomInfo) => {
        const target = presenterInfo ? presenterInfo[fieldName] : "";
        const response = await fetch(
          `${serverPort}/startShareBoard?roomCode=${roomCode}&fieldName=${fieldName}`,
          {
            method: "POST",
          }
        );
        if (!response.ok) {
          throw new Error(
            `HTTP error when startShareBoard! Status: ${response.status}`
          );
        }
      };
      if (gameType === GameType.SHAREBOARD) {
        handleShareBoard(fieldName);
      }

      // Wordle
      const handleWordle = async () => {
        const response = await fetch(
          `${serverPort}/startWordle?roomCode=${roomCode}&userID=${presenter?.userID}&field=${fieldName}`,
          {
            method: "POST",
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      };
      if (gameType === GameType.WORDLE) {
        handleWordle();
      }

      // Hangman
      const handleHangman = async () => {
        const response = await fetch(
          `${serverPort}/startHangman?roomCode=${roomCode}&userID=${presenter?.userID}&field=${fieldName}`,
          {
            method: "POST",
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      };
      if (gameType === GameType.HANGMAN) {
        handleHangman();
      }

      // Geoguesser
      const handleGeoguesser = async () => {
        const response = await fetch(
          `${serverPort}/startGeoguesser?roomCode=${roomCode}&fieldName=${fieldName}`,
          {
            method: "POST",
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      };
      if (gameType === GameType.GEOGUESSER) {
        handleGeoguesser();
      }
    }
    setActiveGameSelector(null);
  };

  /* -------- Game Selector ---------- */

  /* Render game selector submenu */
  const toggleGameSelector = (fieldName: any) => {
    setActiveGameSelector(activeGameSelector === fieldName ? null : fieldName);
  };

  /* Render information on blackboard according to user's identity */
  const renderInfoOrGameSelector = (fieldName: keyof PresentRoomInfo) => {
    const info = presenterInfo?.[fieldName];
    const games = availableGamesForField[fieldName] || [];
    const isRevealed = presentRoomInfo[fieldName];

    // If is presenter, render select game button
    if (isSameUser(presenter, user)) {
      return (
        <>
          {isRevealed ? (
            info
          ) : (
            <>
              <button
                className="button small-button common-button"
                style={{ margin: "0px" }}
                onClick={() => toggleGameSelector(fieldName)}
              >
                Select Game
              </button>
              {activeGameSelector === fieldName && (
                <div id="game-selector">
                  {games.map((gameType) => (
                    <button
                      className="button small-button common-button"
                      key={getGameName(gameType)}
                      onClick={() => handleGameSelection(gameType, fieldName)}
                    >
                      {getGameName(gameType)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      );
    } else if (isSameUser(admin, user)) {
      // If admin, render reveal button
      return (
        <>
          {isRevealed ? (
            info
          ) : (
            <>
              <button
                className="button small-button admin-only-button"
                style={{ margin: "0px", textAlign: "center" }}
                onClick={() => handleReveal(fieldName)}
              >
                Reveal
              </button>
            </>
          )}
        </>
      );
    } else {
      // If normal user, render blind info
      return isRevealed ? info : "********";
    }
  };

  /* Get available game for the selected field */
  const fetchAvailableGames = async (fieldName: any) => {
    const url = `${serverPort}/availableGames?roomCode=${roomCode}&userID=${userID}&fieldName=${fieldName}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch available games");
      }
      const availableGames = await response.json();
      setAvailableGamesForField((prevGames) => ({
        ...prevGames,
        [fieldName]: availableGames,
      }));
    } catch (error) {
      console.error(`Error fetching available games for ${fieldName}:`, error);
    }
  };

  /* -------- Check status ---------- */

  /* Fetch users info and roomStatus */
  const checkPlayers = async () => {
    try {
      const response = await fetch(
        `${serverPort}/getPlayers?roomCode=${roomCode}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.admin) {
        setAdmin(data.admin);
      }
      if (data && data.presenter) {
        setPresenter(data.presenter);
      }
      if (data && data.roomStatus) {
        setRoomStatus(data.roomStatus);
      }
    } catch (error) {
      console.error("Failed to fetch presenter's info:", error);
    }
  };

  /* Fetch presenter profile info and roomStatus */
  const fetchPresenterInfo = async () => {
    try {
      if (presenter) {
        const url = `${serverPort}/getPlayer?roomCode=${roomCode}&userID=${presenter.userID}`;
        const response = await fetch(url);
        const data = await response.json();
        setPresenterInfo(data.userInfo);
      } else {
        console.error("Presenter undefined: ", presenter);
      }
    } catch (error) {
      console.error("Error fetching presenterInfo:", error);
    }
  };

  /* Check which fields have been presented */
  const checkPresentRoomInfo = async () => {
    const url = `${serverPort}/getPresentRoomInfo?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      setPresentRoomInfo(data.presentRoomInfo);

      const fieldList = Object.values(data.presentRoomInfo);
      const fieldsToCheck = fieldList.slice(2);
      const allFieldsPresented = fieldsToCheck.every((value: any) => value);
      setAllPresented(allFieldsPresented);

      if (!response.ok) {
        throw new Error("Failed to get allPresented info");
      }
    } catch (error) {
      console.error("Error checking notPresented:", error);
    }
  };

  /* -------- UI Component ---------- */

  /* Main renderer */
  return render ? (
    <div className="page" style={{ marginBottom: "0" }}>
      <div className="instruction-button-container">
        <Instructions instructionPics={presentRoomInstructions} />
      </div>

      <div
        className="present-page-blackboard-container"
        style={{ color: "white" }}
      >
        <img src={blackBoard} alt="BlackBoard" className="blackBoard" />
        <div className="row-container present-page-presenter-on-blackboard">
          <div className="presenter-avatar-position">
            <img
              src={presenter?.profileImage}
              alt={presenter?.displayName}
              className="avatar"
            />
            <h2>{presenter?.displayName}{isSameUser(user, presenter)? " (YOU)" : ""}</h2>
          </div>

          <div className="presenter-info-container">
            <div className="presenter-name">
              <p>
                {presenterInfo?.firstName} {presenterInfo?.lastName}
              </p>
            </div>

            <div className="info-columns">
              <div className="info-item">
                <p>City:</p>
              </div>
              <div className="info-item">
                <p>{renderInfoOrGameSelector("city")}</p>
              </div>

              <div className="info-item">
                <p>Country:</p>
              </div>
              <div className="info-item">
                <p>{renderInfoOrGameSelector("country")}</p>
              </div>

              <div className="info-item">
                <p>Feeling:</p>
              </div>
              <div className="info-item">
                <p>{renderInfoOrGameSelector("feeling")}</p>
              </div>

              <div className="info-item">
                <p>Favourite Food:</p>
              </div>
              <div className="info-item">
                <p>{renderInfoOrGameSelector("favFood")}</p>
              </div>

              <div className="info-item">
                <p>Favorite Activity:</p>
              </div>
              <div className="info-item">
                <p>{renderInfoOrGameSelector("favActivity")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row-container">
        {isSameUser(user, admin) && (
          <button
            className="button admin-only-button"
            onClick={() => handleBackToWaitRoom()}
            disabled={!allPresented}
          >
            Back to Wait Room
          </button>
        )}
        {isSameUser(user, admin) && (
          <button
            className="button admin-only-button"
            onClick={() => handleRevealAll()}
          >
            Reveal All Fields
          </button>
        )}
      </div>

      {/* First time instruction popup */}
      {showInstructionPopup && (
        <Instructions
          instructionPics={presentRoomInstructions}
          onlyShowPopup={true}
          closeButtonFunction={() => setShowInstructionPopup(false)}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default PresentPage;
