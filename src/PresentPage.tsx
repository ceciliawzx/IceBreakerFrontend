import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile } from "./type/UserProfile";
import { serverPort } from "./macro/MacroServer";
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import { GameType } from "./type/GameType";
import { RoomStatus } from "./type/RoomStatus";
import { User } from "./type/User";
import { updatePresentRoomInfo } from "./utils/RoomOperation";
import "./css/PresentPage.css";
import blackBoard from "./assets/BlackBoard.png";
import { disableScroll } from "./utils/CssOperation";
import { isSameUser } from "./utils/CommonCompare";
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "./utils/WebSocketService";

const PresentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user: User = location.state?.user;
  const userID: string = user.userID;
  const roomCode: string = user.roomCode;

  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);
  const [isPresenter, setIsPresenter] = useState(false);
  const [presenterInfo, setPresenterInfo] = useState<UserProfile | null>(null);

  // state to track gameSelector
  const [activeGameSelector, setActiveGameSelector] = useState(null);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>(
    RoomStatus.PRESENTING
  );
  const [selectedField, setSelectedField] = useState<keyof PresentRoomInfo>();
  const [allPresented, setAllPresented] = useState<boolean>(false);

  const [render, setRender] = useState(false);

  const [presentRoomInfo, setPresentRoomInfo] = useState<PresentRoomInfo>({
    firstName: false,
    lastName: false,
    country: false,
    city: false,
    feeling: false,
    favFood: false,
    favActivity: false,
  });

  const [availableGamesForField, setAvailableGamesForField] = useState({
    firstName: [],
    lastName: [],
    country: [],
    city: [],
    feeling: [],
    favFood: [],
    favActivity: [],
  });

  // fetch users info and roomStatus
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
        setIsPresenter(data.presenter.userID === userID);
      }
      if (data && data.roomStatus) {
        setRoomStatus(data.roomStatus);
      }
    } catch (error) {
      console.error("Failed to fetch presenter's info:", error);
    }
  };

  const onMessageReceived = (msg: any) => {
    checkPlayers();
    checkPresentRoomInfo();
  };

  // disable scroll for this page
  useEffect(disableScroll, []);

  // Initial pull
  useEffect(() => {
    checkPresentRoomInfo();
    checkPlayers();
  }, [render]);

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

  // Connect to refetch websokect
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

  // Fetch presenterInfo
  useEffect(() => {
    // fetch detailed information of presenter when entering the room
    if (presenter?.userID) {
      fetchPresenterInfo();
      // Refetch available games for each field when the component mounts
      Object.keys(presentRoomInfo).forEach((fieldName) => {
        fetchAvailableGames(fieldName);
      });
    }
  }, [presenter]);

  // Set render
  useEffect(() => {
    if (presenter !== null) {
      setRender(true);
    }
  }, [presenter]);

  // Navigate based on RoomStatus
  useEffect(() => {
    // Navigate to ShareBoard
    if (roomStatus === RoomStatus.SHAREBOARD) {
      navigate("/PictionaryRoomPage", {
        state: {
          user,
          selectedField,
        },
      });
    }
    // Navigate to Geoguesser
    if (roomStatus === RoomStatus.GEO_GUESSING) {
      navigate("/GeoguesserPage", {
        state: {
          user,
          presenter,
          selectedField,
        },
      });
    }
    // Navigate to Pictionary
    else if (roomStatus === RoomStatus.PICTURING) {
      navigate("/PictionaryRoomPage", {
        state: {
          user,
          selectedField,
        },
      });
    }
    // Navigate to Wordle
    else if (roomStatus === RoomStatus.WORDLING) {
      navigate("/WordlePage", {
        state: {
          user,
          selectedField,
        },
      });
    }
    // Navigate to Hangman
    if (roomStatus === RoomStatus.HANGMAN) {
      navigate("/HangmanPage", {
        state: {
          user,
          selectedField,
        },
      });
    }
    // Back to WaitRoom
    else if (
      roomStatus === RoomStatus.WAITING ||
      roomStatus === RoomStatus.All_PRESENTED
    ) {
      navigate("/WaitRoomPage", {
        state: { user },
      });
    }
  }, [roomStatus, user, presenter, allPresented]);

  // Function to toggle the game selector submenu
  const toggleGameSelector = (fieldName: any) => {
    setActiveGameSelector(activeGameSelector === fieldName ? null : fieldName);
  };

  // Render GameSelector or Information
  const renderInfoOrGameSelector = (fieldName: keyof PresentRoomInfo) => {
    const info = presenterInfo?.[fieldName];
    const games = availableGamesForField[fieldName] || [];
    const isRevealed = presentRoomInfo[fieldName];

    if (isPresenter) {
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
                      key={gameType}
                      onClick={() => handleGameSelection(gameType, fieldName)}
                    >
                      {gameType}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      );
    } else {
      return isRevealed ? info : "********";
    }
  };

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

  const handleGameSelection = (
    gameType: GameType,
    fieldName: keyof PresentRoomInfo
  ) => {
    setSelectedField(fieldName);
    if (gameType === GameType.REVEAL) {
      // Directly reveal the information for this field
      handleToggleReveal(fieldName);
    } else {
      // for Pictionary
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
      } else {
        // TODO: for other games
      }
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

  const handleToggleReveal = (field: keyof PresentRoomInfo) => {
    if (!isPresenter) return;
    // Reveal the field directly
    updatePresentRoomInfo({ roomCode, field });
  };

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

  return render ? (
    <div className="page" style={{ marginBottom: "0" }}>
      <div className="present-blackboard-container" style={{ color: "white" }}>
        <img src={blackBoard} alt="BlackBoard" className="blackBoard" />
        <div className="row-container presenter-on-blackboard">
          <div className="presenter-avatar-position">
            <img
              src={presenter?.profileImage}
              alt={presenter?.displayName}
              className="avatar"
            />
            <h2>{presenter?.displayName}</h2>
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
            Back to WaitRoom
          </button>
        )}
        {isSameUser(user, admin) && (
          <button
            className="button admin-only-button"
            onClick={() => handleRevealAll()}
          >
            Reveal All
          </button>
        )}
      </div>
    </div>
  ) : (
    <></>
  );
};

export default PresentPage;
