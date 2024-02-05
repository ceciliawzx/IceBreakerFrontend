import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./css/WordlePage.css";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { serverPort, websocketPort } from "./macro/MacroServer";
import { LetterStatus, WordleLetter } from "./type/WordleLetter";
import { connect, sendMsg } from "./utils/ChatService";

interface WordleMsg {
  currentAttempt: number;
  totalAttempt: number;
  isCheck: boolean;
  letters: WordleLetter[][];
  roomCode: string;
  isCorrect: boolean;
  allLetterStat: LetterStatus[];
}

const Wordle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const isAdmin = user.isAdmin;
  const admin = location.state?.admin;
  const presenter = location.state?.presenter;
  const guests: User[] = location.state?.guests;

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
  const [correct, setCorrect] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // totalAttempts: rowNum; targeteCharNum: coluNum
  const [currentGuess, setCurrentGuess] = useState<WordleLetter[][]>([]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const [allLetterStatus, setAllLetterStatus] = useState<WordleLetter[]>(
    Array.from(alphabet).map(
      (letter) => new WordleLetter(letter, LetterStatus.UNCHECKED)
    )
  );

  /*
      TODO:
      1. alphabet change color accordingly
      2. only selected user can type
      3. give answer after total attempts reached
      4. return to present room after finish
      5. change field linked into wordle room
      6. add admin avatar
      7. Ensure input after web socket connected
      8. test
      9. can delete first column with value
  */

  // Initialize web socket and fetch word
  useEffect(() => {
    // Initialize web socket
    connect(socketUrl, websocketUrl, topic, (msg: WordleMsg) => {
      receiveWordleMessage(msg);
    });

    // fetch target word length
    fetchWordLength();
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

  // Set focus
  useEffect(() => {
    document.getElementById("input-0-0")?.focus();
  }, [initialized]);

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
        setTargetCharNum(wordLength);
      } else {
        console.error("Game cannot be found.");
      }
    } catch (error) {
      console.error("Error fetching wordle length:", error);
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
  const receiveWordleMessage = (msg: WordleMsg) => {
    try {
      // Update guess
      setCurrentGuess(msg.letters);

      // Check if is correct
      if (msg.isCheck) {
        setCorrect(msg.isCorrect);
      }

      // Change alphabet status
      const resultLetterStatus: LetterStatus[] = msg.allLetterStat;
      const updatedLetterStatus = allLetterStatus.map(
        (original, index) =>
          new WordleLetter(original.letter, resultLetterStatus[index])
      );
      setAllLetterStatus(updatedLetterStatus);
    } catch (error) {
      console.error("Error parsing:", error);
    }
  };

  const handleInputChange = (row: number, col: number, value: string) => {
    // Can only modify the current row and should input character
    // If already correct, disable input
    if (row !== currentAttempt || !/^[a-zA-Z]$/.test(value) || correct) {
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
    // first column, cannot delete
    if (col <= 0) {
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

    // Move cursor to the first grid next row
    document.getElementById(`input-${currentAttempt + 1}-0`)?.focus();

    // Change next guesser
    setCurrentGuesser(guests[(currentAttempt + 1) % guests.length]);

    setCurrentAttempt(currentAttempt + 1);

    // sendMessage
    sendWordleMessage(true, currentGuess);
  };

  const handleBack = async () => {
    const response = await fetch(
      `${serverPort}/backToWaitRoom?roomCode=${roomCode}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    navigate("/WaitRoomPage", {
      state: { user, admin, presenter, guests },
    });
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

  const getStatusStyle = (status: LetterStatus) => {
    switch (status) {
      case LetterStatus.UNCHECKED:
        return { backgroundColor: "transparent" };
      case LetterStatus.GREY:
        return { backgroundColor: "#b8b8b8" };
      case LetterStatus.YELLOW:
        return { backgroundColor: "#ffe479" };
      case LetterStatus.GREEN:
        return { backgroundColor: "#7ed78c" };
      default:
        return {};
    }
  };

  return (
    <div className="wordle-container">
      <div className="left-column">
        <div className="presenter">
          <h2>Presenter:</h2>
          <img
            src={`${presenter?.profileImage}`}
            alt="Presenter's Image"
            className="presenter-avatar"
          />
          <p>{presenter?.displayName}</p>
        </div>
      </div>
      <div className="main-column" onKeyDown={handleKeyPress}>
        <h1>Welcome to Wordle, {user.displayName}!</h1>
        <p>Current guesser is: {currentGuesser?.displayName}</p>
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
                />
              ))}
            </div>
          ))}
        </div>
        {correct && <h2> You guessed the word! </h2>}
        {reachMaxAttempt() && <h2> Finished. You failed. </h2>}
        <div className="alphabet-list">
          {Array.from(alphabet).map((letter, index) => (
            <div
              key={index}
              className={`alphabet-block row-${Math.floor(index / 9) + 1}`}
            >
              {/* You can customize the styling or add other elements as needed */}
              {letter}
            </div>
          ))}
        </div>
        <button className="common-button" onClick={handleGuess}>
          Guess
        </button>
        <button className="common-button" onClick={handleBack}>
          Back
        </button>
      </div>
      <div className="right-column">
        <div className="guest-list">
          <h2>Joined Guests:</h2>
          <div className="column-guest-container">
            {guests.map((guest, index) => (
              <div key={index} className="guest-row">
                <div className="guest">
                  {guest.userID == currentGuesser.userID && (
                    <div className="arrow-indicator"></div>
                  )}

                  <img
                    src={`${guest.profileImage}`}
                    alt={`${guest}'s avatar`}
                    className="guest-avatar"
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
