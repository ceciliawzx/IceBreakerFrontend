import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile } from "./type/UserProfile";
import { serverPort } from "./macro/MacroServer";
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import { refreshTime } from "./macro/MacroConst";
import { GameType } from "./type/GameType";
import { RoomStatus } from "./type/RoomStatus";
import { User } from "./type/User";
import { checkRoomStatus } from "./utils/CheckRoomStatus";
import "./css/PresentPage.css";

const PresentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user: UserProfile = location.state?.user;
  const userID: string = user.userID;
  const roomCode: string = user.roomCode;
  const presenter: UserProfile = location.state?.presenter;
  const admin: User = location.state?.admin;
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
  const isPresenter: boolean = user.userID === presenter.userID;
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

  // Update the RoomStatus list every interval
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
    }, refreshTime);

    // Navigate to Pictionary
    if (roomStatus === RoomStatus.PICTURING) {
      navigate("/PictionaryRoomPage", {
        state: { user, isPresenter: isPresenter, admin, presenter, presentRoomInfo, selectedField },
      });
    }
    // Back to WaitRoom
    if (roomStatus === RoomStatus.WAITING) {
      navigate("/WaitRoomPage", {
        state: { user, admin },
      });
    }
    // Clear timer and count again
    return () => clearInterval(intervalId);
    // Add other navigation conditions if needed
  }, [roomStatus, user, presenter]);

  // Fetch presenterInfo
  useEffect(() => {
    // fetch detailed information of presenter when entering the room
    fetchPresenterInfo();
    // Refetch available games for each field when the component mounts
    Object.keys(presentRoomInfo).forEach((fieldName) => {
      fetchAvailableGames(fieldName);
    });
  }, []);

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
              <button onClick={() => toggleGameSelector(fieldName)}>
                Select a Game
              </button>
              {activeGameSelector === fieldName && (
                <div id="game-selector">
                  {games.map((gameType) => (
                    <button
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
      console.log(fieldName, availableGames); // Log to see the fetched data
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
          `${serverPort}/startDrawAndGuess?roomCode=${roomCode}&target=${target}`,
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
      } else {
        // TODO: for other games
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
    // Add other navigation conditions if needed
  }, [user, presenter]);

  const fetchPresenterInfo = async () => {
    const url = `${serverPort}/getPlayer?roomCode=${roomCode}&userID=${presenter.userID}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setPresenterInfo(data.userInfo);
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

  const updatePresentRoomInfo = async (newPresentRoomInfo: PresentRoomInfo) => {
    const url = `${serverPort}/setPresentRoomInfo?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPresentRoomInfo),
      });
      if (response) {
        // Re-fetch the updated state after a successful update
        checkPresentRoomInfo();
      }
    } catch (error) {
      console.error("Error setting presentRoomInfo in backend: ", error);
    }
  };

  const handleToggleReveal = (field: keyof PresentRoomInfo) => {
    if (!isPresenter) return;
    const newPresentRoomInfo: PresentRoomInfo = {
      ...presentRoomInfo,
      [field]: true,
    };
    updatePresentRoomInfo(newPresentRoomInfo);
  };

  const handleBackToWaitRoom = async () => {
    const url = `${serverPort}/backToWaitRoom?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
      });
      // if (response.ok) {
      //   setRoomStatus(RoomStatus.WAITING);
      // }
    } catch (error) {
      console.error("Error returning to WaitRoom:", error);
    }
  };

  return (
    <div className="present-page-container">
      <div className="presenter-container">
        <img
          src={presenter?.profileImage}
          alt={presenter?.displayName}
          className="presenter-avatar"
        />
        <h2>{presenter?.displayName}</h2>
      </div>
      <div className="presenter-info">
        <p>First Name: {renderInfoOrGameSelector("firstName")}</p>
        <p>Last Name: {renderInfoOrGameSelector("lastName")}</p>
        <p>City: {renderInfoOrGameSelector("city")}</p>
        <p>Country: {renderInfoOrGameSelector("country")}</p>
        <p>Feeling: {renderInfoOrGameSelector("feeling")}</p>
        <p>Favourite Food: {renderInfoOrGameSelector("favFood")}</p>
        <p>Favorite Activity: {renderInfoOrGameSelector("favActivity")}</p>
      </div>
      <div>
        {userID === admin.userID && (
          <button
            className="admin-only-button"
            onClick={() => handleBackToWaitRoom()}
          >
            Back to WaitRoom
          </button>
        )}
      </div>
    </div>
  );
};

export default PresentPage;
