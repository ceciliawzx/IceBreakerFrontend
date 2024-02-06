import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./css/WordlePage.css";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { serverPort, websocketPort } from "./macro/MacroServer";
import { LetterStatus, WordleLetter } from "./type/WordleLetter";
import { connect, sendMsg } from "./utils/WebSocketService";
import { updatePresentRoomInfo } from "./utils/RoomOperation";
import { PresentRoomInfo } from "./type/PresentRoomInfo";

interface WordleMsg {
  currentAttempt: number;
  totalAttempt: number;
  isCheck: boolean;
  letters: WordleLetter[][];
  roomCode: string;
  isCorrect: boolean;
  allLetterStat: LetterStatus[];
}

interface BackMsg {
  roomCode: string;
}

const Wordle = () => {
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

  /* Pop up */
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  /* Web socket url */
  const socketUrl = `${serverPort}/chat`;
  const websocketUrl = `${websocketPort}/chat`;
  const topic = `/topic/room/${roomCode}/wordle`;
  const destination = `/app/room/${roomCode}/wordle`;

  /* Wordle related */
  const totalAttempts = Math.max(6, guests.length);

  const [currentGuesser, setCurrentGuesser] = useState<User>(guests[0]);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [targetCharNum, setTargetCharNum] = useState<number>(0);
  const [targetWord, setTargetWord] = useState<string>("");
  const [correct, setCorrect] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // totalAttempts: rowNum; targeteCharNum: coluNum
  const [currentGuess, setCurrentGuess] = useState<WordleLetter[][]>([]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const [allLetterStatus, setAllLetterStatus] = useState<LetterStatus[]>(
    Array.from(alphabet).map((_) => LetterStatus.UNCHECKED)
  );

  /*
      TODO:
      Ensure input after web socket connected
  */

  // Initialize web socket and fetch word
  useEffect(() => {
    const onMessageReceived = (msg: WordleMsg | BackMsg) => {
      receiveMessage(msg);
    };

    // Initialize web socket
    connect(socketUrl, websocketUrl, topic, onMessageReceived);

    // fetch target word
    fetchWordLength();
    fetchTargetWord();
  }, []);

  // Initialize grid
  useEffect(() => {
    if (targetCharNum > 0) {
      // Initialize currentGuess
      const initialGuess = Array.from({ length: totalAttempts }, () =>
        Array(targetCharNum).fill(new WordleLetter("", LetterStatus.UNCHECKED))
      );
      setCurrentGuess(initialGuess);
      setInitialized(true);
    }
  }, [targetCharNum]);

  // When grid initialized
  useEffect(() => {
    if (isSameUser(user, currentGuesser)) {
      document.getElementById("input-0-0")?.focus();
    }
  }, [initialized]);

  // When submit
  useEffect(() => {
    const nextGuesser = guests[currentAttempt % guests.length];

    // Change to next guesser
    setCurrentGuesser(nextGuesser);

    // Move cursor to the first grid next row
    if (isSameUser(user, nextGuesser)) {
      document.getElementById(`input-${currentAttempt}-0`)?.focus();
    }
  }, [currentAttempt]);

  // Fetch target word length
  const fetchWordLength = async () => {
    try {
      const response = await fetch(
        `${serverPort}/getWordleInfo?roomCode=${roomCode}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const wordLength = await response.json();

      if (wordLength > 0) {
        console.log(wordLength);
        setTargetCharNum(wordLength);
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
        `${serverPort}/getWordleAnswer?roomCode=${roomCode}`,
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

  // send message via websocket
  const sendWordleMessage = (
    icCheck: boolean,
    updatedGuess: WordleLetter[][]
  ) => {
    sendMsg(destination, {
      currentAttempt: currentAttempt,
      totalAttempt: totalAttempts,
      isCheck: icCheck,
      letters: updatedGuess,
      roomCode: roomCode,
      isCorrect: null,
      allLetterStat: null,
    });
  };

  // receive and parse message from websocket
  const receiveMessage = (msg: WordleMsg | BackMsg) => {
    try {
      // If contain letters field, is WordleMsg
      if ("letters" in msg) {
        handleWordleMessage(msg as WordleMsg);
      } else {
        handleBackMessage();
      }
    } catch (error) {
      console.error("Error parsing:", error);
    }
  };

  // Update wordle page
  const handleWordleMessage = (msg: WordleMsg) => {
    setCurrentGuess(msg.letters);

    if (msg.isCheck) {
      setCorrect(msg.isCorrect);
      setCurrentAttempt((prevAttempt) => prevAttempt + 1);
    }

    setAllLetterStatus(msg.allLetterStat);
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

  const handleInputChange = (row: number, col: number, value: string) => {
    /* Disable input when:
       1. User is not current guesser
       2. Input is not alphabet
       3. Has got the correct answer
    */
    if (
      // !isSameUser(user, currentGuesser) ||
      !/^[a-zA-Z]$/.test(value) ||
      correct
    ) {
      return;
    }

    // make deep copy
    const updatedGuess = currentGuess.map((row) =>
      row.map((letter) => new WordleLetter(letter.letter, letter.state))
    );

    // set value
    updatedGuess[row][col].setLetter(value.toUpperCase());

    // Cursor auto move
    if (col < updatedGuess[row].length - 1) {
      // Move the cursor to the next column
      document.getElementById(`input-${row}-${col + 1}`)?.focus();
    }

    // sendMessage
    sendWordleMessage(false, updatedGuess);
  };

  const handleBackspace = (row: number, col: number) => {
    // If empty first column, cannot delete
    if (col <= 0 && currentGuess[row][col].letter === "") {
      return;
    }

    // make deep copy
    const updatedGuess = currentGuess.map((row) =>
      row.map((letter) => new WordleLetter(letter.letter, letter.state))
    );

    // if delete already occupied grid
    if (currentGuess[row][col].letter != "") {
      updatedGuess[row][col].setLetter("");
    } else {
      // Move the cursor back
      document.getElementById(`input-${row}-${col - 1}`)?.focus();

      // Clear the previous input field
      updatedGuess[row][col - 1].setLetter("");
    }

    // sendMessage
    sendWordleMessage(false, updatedGuess);
  };

  // Press "Enter" = Press gues
  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleGuess();
    }
  };

  const handleGuess = () => {
    if (reachMaxAttempt()) {
      console.log("Reach max attempt");
      return;
    }

    // If still have empty grid, do not submit guess
    if (currentGuess[currentAttempt].some((letter) => letter.letter === "")) {
      return;
    }

    // sendMessage
    sendWordleMessage(true, currentGuess);
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

  const reachMaxAttempt = () => currentAttempt >= totalAttempts;

  const isSameUser = (self: User, other: User) => self.userID === other.userID;

  const getStatusStyle = (status: LetterStatus) => {
    switch (status) {
      case LetterStatus.GREY:
        return {
          backgroundColor: rootStyles.getPropertyValue("--wordle-unchecked"),
        };
      case LetterStatus.YELLOW:
        return {
          backgroundColor: rootStyles.getPropertyValue("--wordle-yellow"),
        };
      case LetterStatus.GREEN:
        return {
          backgroundColor: rootStyles.getPropertyValue("--wordle-green"),
        };
      default:
        return {
          backgroundColor: "transparent",
        };
    }
  };

  return (
    <div className="row-page">
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
      <div className="main-column" onKeyDown={handleKeyPress}>
        <h1>Welcome to Wordle, {user.displayName}!</h1>
        <h2>Current guesser is: {currentGuesser?.displayName}</h2>
        <div className="wordle-input">
          {currentGuess.map((_, rowIndex) => (
            <div key={rowIndex} className="wordle-input-row">
              {currentGuess[rowIndex].map((letter, columnIndex) => (
                <input
                  key={columnIndex}
                  id={`input-${rowIndex}-${columnIndex}`}
                  type="text"
                  maxLength={1}
                  // value={letter.getLetter()}
                  value={letter.letter}
                  onChange={(e) =>
                    handleInputChange(rowIndex, columnIndex, e.target.value)
                  }
                  // Handle delete
                  onKeyDown={(e) => {
                    if (e.key === "Backspace") {
                      e.preventDefault(); // Prevent browser navigation
                      handleBackspace(rowIndex, columnIndex);
                    }
                  }}
                  style={getStatusStyle(letter.state)}
                  disabled={rowIndex !== currentAttempt}
                />
              ))}
            </div>
          ))}
        </div>

        {correct && <h2> You guessed the word! </h2>}
        {reachMaxAttempt() && !correct && (
          <h2>The correct answer is: {targetWord}</h2>
        )}
        <div className="alphabet-list">
          {Array.from(alphabet).map((letter, index) => (
            <div
              key={index}
              className={`alphabet-block row-${Math.floor(index / 9) + 1}`}
              style={getStatusStyle(allLetterStatus[index])}
            >
              {/* You can customize the styling or add other elements as needed */}
              {letter}
            </div>
          ))}
        </div>
        <button className="common-button" onClick={handleGuess}>
          Guess
        </button>
        {isAdmin && (
          <button className="common-button" onClick={handleBack}>
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
          <button onClick={() => setShowProfilePopup(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default Wordle;
