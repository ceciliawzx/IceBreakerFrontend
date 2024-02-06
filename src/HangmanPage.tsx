import React, { useState, useEffect } from "react";
import { serverPort, websocketPort } from "./macro/MacroServer";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { connect, sendMsg } from "./utils/WebSocketService";
import hangmanStages from "./HangmanStage";
import { LetterStatus } from "./type/WordleLetter";
import { updatePresentRoomInfo } from "./utils/RoomOperation";
import { PresentRoomInfo } from "./type/PresentRoomInfo";

interface HangmanMsg {
  guessLetter: string;
  isCorrect: boolean;
  correctPositions: number[];
  currentStages: string[];
  allLetterStat: LetterStatus[];
  isFinished: boolean;
  roomCode: string;
}

interface BackMsg {
  roomCode: string;
}

const HangmanPage = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const isAdmin = user.isAdmin;
  const admin = location.state?.admin;
  const presenter = location.state?.presenter;
  const guests: User[] = location.state?.guests;
  const presentRoomInfo = location.state?.presentRoomInfo;
  const fieldName = location.state?.selectedField;

  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  /* Web socket url */
  const socketUrl = `${serverPort}/chat`;
  const websocketUrl = `${websocketPort}/chat`;
  const topic = `/topic/room/${roomCode}/hangman`;
  const destination = `/app/room/${roomCode}/hangman`;

  // Hangman game states
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [currentGuesser, setCurrentGuesser] = useState<User>(guests[0]);
  const [targetCharNum, setTargetCharNum] = useState<number>(0);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const [currentPositions, setCurrentPositions] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const [currentStages, setCurrentStages] = useState<string[]>([]);
  const [allLetterStatus, setAllLetterStatus] = useState<LetterStatus[]>(
    Array.from(alphabet).map((_) => LetterStatus.UNCHECKED)
  );

  // Initialize web socket and fetch word
  useEffect(() => {
    // Initialize web socket
    const onMessageReceived = (msg: HangmanMsg | BackMsg) => {
      receiveMessage(msg);
    };

    // Initialize web socket
    connect(socketUrl, websocketUrl, topic, onMessageReceived);

    // fetch target word length
    fetchWordLength();
  }, []);

    // receive and parse message from websocket
    const receiveMessage = (msg: HangmanMsg | BackMsg) => {
      try {
        // If contain letters field, is WordleMsg
        if ("guessLetter" in msg) {
          handleHangmanMessage(msg as HangmanMsg);
        } else {
          console.log("Back to PresentRoom");
          handleBackMessage();
        }
      } catch (error) {
        console.error("Error parsing:", error);
      }
    };

  // receive and parse message from websocket
  const handleHangmanMessage = (msg: HangmanMsg) => {
    try {
      // Update guess
      setCurrentStages(msg.currentStages);
      setCorrect(msg.isCorrect);
      setIsFinished(msg.isFinished);
      setCurrentPositions(msg.correctPositions);
      setAllLetterStatus(msg.allLetterStat);
      console.log(msg);
      console.log(mistakes);
      if (!msg.isCorrect) {
        setMistakes((currentMistakes) => currentMistakes + 1);
      }

      setAllLetterStatus(msg.allLetterStat);
    } catch (error) {
      console.error("Error parsing:", error);
    }
  };

  // Fetch target word length
  const fetchWordLength = async () => {
    try {
      const response = await fetch(
        `${serverPort}/getHangmanInfo?roomCode=${roomCode}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const wordLength = await response.json();

      if (wordLength > 0) {
        setTargetCharNum(wordLength);
        setCurrentStages(Array.from({ length: wordLength }, () => "_"));
      } else {
        console.error("Game cannot be found.");
      }
    } catch (error) {
      console.error("Error fetching wordle length:", error);
    }
  };

  const sendHangmanMessage = (letter: string) => {
    console.log(letter);
    sendMsg(destination, {
      guessLetter: letter,
      isCorrect: correct,
      correctPositions: currentPositions,
      currentStages: currentStages,
      allLetterStat: allLetterStatus,
      isFinished: isFinished,
      roomCode: roomCode,
    });
  };

  // Back to present page
  const handleBackMessage = async () => {
    // Update PresentRoomInfo
    const newPresentRoomInfo: PresentRoomInfo = {
      ...presentRoomInfo,
      [fieldName]: true,
    };
    updatePresentRoomInfo({ roomCode, newPresentRoomInfo });
    navigate("/PresentPage", {
      state: { user, admin, presenter, guests },
    });
  };

  const handleBack = async () => {
    // Change room status
    const url = `${serverPort}/backToPresentRoom?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
      });
      if (!response.ok) {
        console.log(`HTTP error! Status: ${response.status}`);
      }
      

    } catch (error) {
      console.error("Error returning to PresentRoom:", error);
    }
  };

  // const guessLetter = (letter: string) => {
  //   if (!guessedLetters.includes(letter)) {
  //     setGuessedLetters([...guessedLetters, letter]);
  //     if (!word.includes(letter)) {
  //       setMistakes(mistakes + 1);
  //     }
  //   }
  // };

  const displayWord = currentStages
    .map((letter) => (letter ? letter : "_"))
    .join(" ");



    const handleViewProfile = async (user: User | null) => {
      if (user) {
        const url = `${serverPort}/getPlayer?userID=${userID}&roomCode=${roomCode}`;
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
  return (
    <div className="wordle-container">
      <div className="left-column">
        <div className="presenter" style={{ marginBottom: "60%" }}>
          <h2>Presenter:</h2>
          <img
            src={`${presenter?.profileImage}`}
            alt="Presenter's Image"
            className="presenter-avatar"
          />
          <p>{presenter?.displayName}</p>
          {isAdmin && (
            <button
              className="admin-only-button"
              onClick={() => handleViewProfile(presenter)}
            >
              View Profile
            </button>
          )}
        </div>

        <div className="presenter">
          <h2>Admin:</h2>
          <img
            src={`${admin?.profileImage}`}
            alt="Admin's Image"
            className="presenter-avatar"
          />
          <p>{admin?.displayName}</p>
        </div>

        <div className="presenter">
          <h2>Admin:</h2>
          <img
            src={`${admin?.profileImage}`}
            alt="Admin's Image"
            className="presenter-avatar"
          />
          <p>{admin?.displayName}</p>
        </div>
      </div>
      <div id="hangman-container">
        <pre id="hangman-ascii">
          <p>{`Chances: ${6 - mistakes}`}</p>
          <p>{hangmanStages[mistakes]}</p>
        </pre>
      </div>

      <p>{displayWord}</p>
      <div>
        {alphabet.split("").map((letter) => (
          <button
            key={letter}
            onClick={() => sendHangmanMessage(letter)}
            disabled={guessedLetters.includes(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
      {isAdmin && (
          <button className="common-button" onClick={handleBack}>
            Back
          </button>
        )}
    </div>
  );
};

export default HangmanPage;
