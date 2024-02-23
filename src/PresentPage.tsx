import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile } from "./type/UserProfile";
import { serverPort } from "./macro/MacroServer";
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import { refreshTime } from "./macro/MacroConst";
import { GameType } from "./type/GameType";
import { RoomStatus } from "./type/RoomStatus";
import { User } from "./type/User";
import { checkRoomStatus } from "./utils/RoomOperation";
import { updatePresentRoomInfo } from "./utils/RoomOperation";
import "./css/PresentPage.css";
import blackBoard from "./assets/BlackBoard.png";
import { disableScroll } from "./utils/CssOperation";

const PresentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user: UserProfile = location.state?.user;
  const userID: string = user.userID;
  const roomCode: string = user.roomCode;
  // const presenter: User = location.state?.presenter;
  const admin: User = location.state?.admin;
  const guests: UserProfile[] = location.state?.guests;
  const [presenterInfo, setPresenterInfo] = useState<UserProfile | null>(null);
  const [presentRoomInfo, setPresentRoomInfo] = useState<PresentRoomInfo>({
    firstName: false,
    lastName: false,
    country: false,
    city: false,
    feeling: false,
    favFood: false,
    favActivity: false,
  });
  // const isPresenter: boolean = user.userID === presenter.userID;
  const [availableGamesForField, setAvailableGamesForField] = useState({
    firstName: [],
    lastName: [],
    country: [],
    city: [],
    feeling: [],
    favFood: [],
    favActivity: [],
  });
  // state to track gameSelector
  const [activeGameSelector, setActiveGameSelector] = useState(null);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>(
    RoomStatus.PRESENTING
  );
  const [selectedField, setSelectedField] = useState<keyof PresentRoomInfo>();
  const [presenter, setPresenter] = useState<UserProfile | null>(null);
  const [isPresenter, setIsPresenter] = useState(false);
  const [render, setRender] = useState(false);
  const [allPresented, setAllPresented] = useState<boolean>(false);

  // disable scroll for this page
  useEffect(disableScroll, []);

  // Fetch the presenter info
  useEffect(() => {
    // Define an IIFE to handle async operation
    (async () => {
      try {
        const response = await fetch(
          `${serverPort}/getPresenter?roomCode=${roomCode}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.presenter) {
          setPresenter(data.presenter);
          setIsPresenter(data.presenter.userID === userID);
        }
      } catch (error) {
        console.error("Failed to fetch presenter's info:", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (presenter !== null) {
      setRender(true);
    }
  }, [presenter]);

  // Fetch the presenter info
  useEffect(() => {
    // Define an IIFE to handle async operation
    (async () => {
      try {
        const response = await fetch(
          `${serverPort}/getPresenter?roomCode=${roomCode}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.presenter) {
          setPresenter(data.presenter);
          setIsPresenter(data.presenter.userID === userID);
        }
      } catch (error) {
        console.error("Failed to fetch presenter's info:", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (presenter !== null) {
      setRender(true);
    }
  }, [presenter]);

  // Update the RoomStatus every interval
  useEffect(() => {
    // Define an IIFE to handle async operation
    (async () => {
      try {
        const data = await checkRoomStatus({ roomCode });
        if (data && data.roomStatus) {
          setRoomStatus(data.roomStatus);
        }
      } catch (error) {
        console.error("Error fetching getPlayers:", error);
      }
    })();

    // Setup the interval for refreshing the data
    const intervalId = setInterval(async () => {
      try {
        const data = await checkRoomStatus({ roomCode });
        if (data && data.roomStatus) {
          setRoomStatus(data.roomStatus);
        }
      } catch (error) {
        console.error("Error fetching getPlayers on interval:", error);
      }

      // check if all fields submitted
      try {
        const response = await fetch(
          `${serverPort}/getPresentRoomInfo?roomCode=${roomCode}`,
          {
            method: "GET",
          }
        );

        const data = await response.json();
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
    }, refreshTime);
    // Clear timer and count again
    return () => clearInterval(intervalId);
  }, []);

  // Navigate based on RoomStatus
  useEffect(() => {
    // Navigate to ShareBoard
    if (roomStatus === RoomStatus.SHAREBOARD) {
      navigate("/PictionaryRoomPage", {
        state: {
          user,
          isPresenter: isPresenter,
          admin,
          presenter,
          guests,
          presentRoomInfo,
          selectedField,
        },
      });
    }
    // Navigate to Geoguesser
    if (roomStatus === RoomStatus.GEO_GUESSING) {
      navigate("/GeoguesserPage", {
        state: {
          user,
          isPresenter: isPresenter,
          admin,
          presenter,
          guests,
          presentRoomInfo,
          selectedField,
        },
      });
    }
    // Navigate to Pictionary
    else if (roomStatus === RoomStatus.PICTURING) {
      navigate("/PictionaryRoomPage", {
        state: {
          user,
          isPresenter: isPresenter,
          admin,
          presenter,
          guests,
          presentRoomInfo,
          selectedField,
        },
      });
    }
    // Navigate to Wordle
    else if (roomStatus === RoomStatus.WORDLING) {
      navigate("/WordlePage", {
        state: {
          user,
          admin,
          presenter,
          guests,
          presentRoomInfo,
          selectedField,
        },
      });
    }
    // Navigate to Hangman
    if (roomStatus === RoomStatus.HANGMAN) {
      navigate("/HangmanPage", {
        state: {
          user,
          admin,
          presenter,
          guests,
          presentRoomInfo,
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
        state: { user, admin },
      });
    }
  }, [roomStatus, user, presenter, allPresented]);

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
  }, [presenter?.userID]);

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
                className="button small-common-button"
                style={{ margin: "0px" }}
                onClick={() => toggleGameSelector(fieldName)}
              >
                Select Game
              </button>
              {activeGameSelector === fieldName && (
                <div id="game-selector">
                  {games.map((gameType) => (
                    <button
                      className="button small-common-button"
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
    }
    setActiveGameSelector(null);
  };

  useEffect(() => {
    // Check what fields of presentRoomInfo are revealed every interval
    const intervalId = setInterval(() => {
      checkPresentRoomInfo();
    }, refreshTime);
    return () => clearInterval(intervalId);
  }, []);

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
    } catch (error) {
      console.error("Error fetching presentRoomInfo:", error);
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
        {userID === admin.userID && (
          <button
            className="button admin-only-button"
            onClick={() => handleBackToWaitRoom()}
            disabled={!allPresented}
          >
            Back to WaitRoom
          </button>
        )}
        {userID === admin.userID && (
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
