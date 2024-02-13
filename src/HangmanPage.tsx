import React, { useState, useEffect, useCallback } from "react";
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
import { BackMessage } from "./type/BackMessage";
import { Modal } from "./utils/Modal";
import { Timer } from "./timer/Timer";
import { RoomStatus } from "./type/RoomStatus";
import { ModalMessage } from "./type/ModalMessage";
import Instructions from './Instructions';
import Inst1 from './instructions/hangman/1.png'
import Inst2 from './instructions/hangman/2.png'
import Inst3 from './instructions/hangman/3.png'
import Inst4 from './instructions/hangman/4.png'
import Inst5 from './instructions/hangman/5.png'


const hangmanInstructions = [
  { img: Inst1, text: 'In this game, you will try to guess the letters in the answer word.' },
  { img: Inst2, text: 'If you guess the correct letter, it will be shown in green.' },
  { img: Inst3, text: 'If you guess a wrong letter, you will lose one chance, and it will be marked grey.' },
  { img: Inst4, text: 'If you use all your chances, you will be hanged!' },
  { img: Inst5, text: 'If you guess the correct word, you will be set free! Good luck, have fun!' },
];

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
  const [selectedField, setSelectedField] = useState<keyof PresentRoomInfo>();

  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  /* Modal */
  const [showModal, setShowModal] = useState(false);

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
    const onMessageReceived = (
      msg: HangmanMsg | BackMessage | ModalMessage
    ) => {
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

  // show modal
  const handleModalMessage = () => {
    // Update PresentRoomInfo
    updatePresentRoomInfo({ roomCode, field: fieldName });
    // Show the modal
    setShowModal(true);
  };

  const receiveMessage = useCallback(
    (msg: HangmanMsg | BackMessage | ModalMessage) => {
      try {
        // If contain letters field, it's WordleMsg
        if ("guessLetter" in msg) {
          handleHangmanMessage(msg as HangmanMsg);
        } else if ("show" in msg) {
          // show modal and update PresentRoomInfo
          handleModalMessage();
        } else {
          handleBackMessage();
        }
      } catch (error) {
        console.error("Error parsing:", error);
      }
    },
    []
  );

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
      const data = await response.json();

      if (data != "Error") {
        setSelectedField(data.target.fieldName);
        setTargetWord(data.target.targetWord);
      } else {
        console.error("Game cannot be found.");
      }
    } catch (error) {
      console.error("Error fetching hangman answer:", error);
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
        <h1>
          We are guessing: {presenter.displayName}'s {selectedField}!
        </h1>
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
      {/* Modal */}
      {showModal && (
        <Modal
          onClose={() => {
            setShowModal(false);
            handleBackButton();
          }}
          targetWord={targetWord}
          userID={userID}
          adminID={admin.userID}
        />
      )}
      {/* Timer */}
      <div>
        <Timer
          user={user}
          roomCode={roomCode}
          roomStatus={RoomStatus.PRESENTING}
          defaultTime={40}
        />
      </div>
      {/* Instructions*/}
      <Instructions instructionPics={hangmanInstructions} />
    </div>
  );
};

export default HangmanPage;
