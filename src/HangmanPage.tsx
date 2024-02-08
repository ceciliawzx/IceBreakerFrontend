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
import "./css/HangmanPage.css";
import { finished } from "stream/promises";

interface HangmanMsg {
  guessLetter: string;
  isCorrect: boolean;
  correctPositions: number[];
  currentStages: string[];
  allLetterStat: LetterStatus[];
  isFinished: boolean;
  roomCode: string;
  currentWrongGuesses: number;
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
  const [mistakes, setMistakes] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [currentGuesserId, setCurrentGuesserId] = useState(0);
  const [currentGuesser, setCurrentGuesser] = useState<User>(guests[0]);
  const [targetCharNum, setTargetCharNum] = useState<number>(0);
  const [targetWord, setTargetWord] = useState<string>("");

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

    // fetch target word
    fetchWordLength();
    fetchTargetWord();
  }, []);

  useEffect(() => {
    const nextGuesser = guests[currentGuesserId % guests.length];

    // Change to next guesser
    setCurrentGuesser(nextGuesser);
  }, [currentGuesserId]);

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
      setMistakes(msg.currentWrongGuesses);

      setCurrentGuesserId((currentGuesserId) => currentGuesserId + 1);

      console.log("correct: " + msg.isCorrect);
      console.log("finish: " + msg.isFinished);
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

  // Fetch target word
  const fetchTargetWord = async () => {
    try {
      const response = await fetch(
        `${serverPort}/getHangmanAnswer?roomCode=${roomCode}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const targetWord = await response.text();

      if (targetWord != "ERROR") {
        setTargetWord(targetWord);
      } else {
        console.error("Game cannot be found.");
      }
    } catch (error) {
      console.error("Error fetching wordle answer:", error);
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
      currentWrongGuesses: mistakes,
    });
  };

  // Back to present page
  const handleBackMessage = async () => {
    navigate("/PresentPage", {
      state: { user, admin, presenter, guests },
    });
  };

  const handleBackButton = async () => {
    // Update PresentRoomInfo
    const newPresentRoomInfo: PresentRoomInfo = {
      ...presentRoomInfo,
      [fieldName]: true,
    };
    updatePresentRoomInfo({ roomCode, newPresentRoomInfo });

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

  const getStatusStyle = (status: LetterStatus) => {
    const baseStyle = {
      color: "black", // Keeping font color the same
      fontSize: "16px", // Keeping font size the same
    };
    switch (status) {
      case LetterStatus.GREY:
        return {
          ...baseStyle,
          backgroundColor: rootStyles.getPropertyValue("--hangman-red"),
        };

      case LetterStatus.GREEN:
        return {
          ...baseStyle,
          backgroundColor: rootStyles.getPropertyValue("--wordle-green"),
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: rootStyles.getPropertyValue(
            "--light-grey-background"
          ),
        };
    }
  };

  const isSameUser = (self: User, other: User) => self.userID === other.userID;
  return (
    <div className="row-container">
      <div className="left-column">
        <div className="presenter" style={{ marginBottom: "30%" }}>
          <h2>Presenter:</h2>
          <img
            src={`${presenter?.profileImage}`}
            alt="Presenter's Image"
            className="avatar"
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
            className="avatar"
          />
          <p>{admin?.displayName}</p>
        </div>
      </div>

      <div className="main-column">
        <h1>Welcome to Hangman, {user.displayName}!</h1>
        <h2>Current guesser is: {currentGuesser?.displayName}</h2>
        <div className="column-container">
          <pre id="hangman-ascii">
            <p>{`Chances: ${6 - mistakes}`}</p>
            <p>{hangmanStages[mistakes]}</p>
          </pre>
        </div>

        <div className="hangman-input">
          <p>{displayWord}</p>
        </div>

        <div className="alphabet-list">
          {Array.from(alphabet).map((letter, index) => (
            <button
              key={index}
              className={`hangman-alphabet-block row-${
                Math.floor(index / 9) + 1
              }`}
              style={getStatusStyle(allLetterStatus[index])}
              onClick={() => sendHangmanMessage(letter)} // Assuming sendWordleMessage is your function to handle guesses
              // 114514
              // disabled={!isSameUser(user, currentGuesser) || allLetterStatus[index] !== LetterStatus.UNCHECKED || isFinished}
              disabled={
                allLetterStatus[index] !== LetterStatus.UNCHECKED || isFinished
              }
            >
              {letter}
            </button>
          ))}
        </div>

        {correct && <h2> You guessed the word! </h2>}
        {isFinished && !correct && (
          <h2>The correct answer is: {targetWord} </h2>
        )}

        {isAdmin && (
          <button className="admin-only-button" onClick={handleBackButton}>
            Back
          </button>
        )}
      </div>

      <div className="right-column">
        <div>
          <h2>Joined Guests:</h2>
          <div className="column-container">
            {guests.map((guest, index) => (
              <div key={index} className="row-container">
                <div className="guest">
                  {isSameUser(guest, currentGuesser) && (
                    <div className="arrow-indicator"></div>
                  )}

                  <img
                    src={`${guest.profileImage}`}
                    alt={`${guest}'s avatar`}
                    className="avatar"
                  />
                  <p>{guest.displayName}</p>
                </div>
                {isAdmin && (
                  <button
                    className="admin-only-button"
                    onClick={() => handleViewProfile(guest)}
                  >
                    View Profile
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HangmanPage;
