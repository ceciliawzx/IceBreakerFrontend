import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { LetterStatus, WordleLetter } from "./type/WordleLetter";
import { RoomStatus } from "./type/RoomStatus";
import { PresentRoomInfo } from "./type/PresentRoomInfo";

/* General function */
import { updatePresentRoomInfo } from "./utils/RoomOperation";
import { isSameUser } from "./utils/CommonCompare";

/* Web socket */
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "./utils/WebSocketService";
import { TimerMessage } from "./type/Timer";
import { ModalMessage } from "./type/ModalMessage";
import { BackMessage } from "./type/BackMessage";

/* Timer */
import { Timer } from "./timer/Timer";

/* Modal */
import { Modal } from "./utils/Modal";

/* Instruction */
import Instructions from "./Instructions";
import wordleInstructionPic from "./instructions/WordleInstruction.png";

/* CSS */
import "./css/WordlePage.css";

/* Instructions */
const wordleInstructions = [
  {
    img: wordleInstructionPic,
    text: "",
  },
];

/* Web socket message interface */
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
  const rootStyles = getComputedStyle(document.documentElement);
  const navigate = useNavigate();
  const location = useLocation();

  /* Location passed field */
  const user = location.state?.user;
  const roomCode = user.roomCode;
  const isAdmin = user.isAdmin;
  const fieldName = location.state?.selectedField;

  /* Users in room */
  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);
  const [guests, setGuests] = useState<User[]>([]);

  /* User status */
  const [notPresented, setNotPresented] = useState<User[]>([]);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);

  /* Web socket url */
  const topic = `/topic/room/${roomCode}/wordle`;
  const destination = `/app/room/${roomCode}/wordle`;

  /* Target word */
  const [selectedField, setSelectedField] = useState<keyof PresentRoomInfo>();
  const [targetCharNum, setTargetCharNum] = useState<number>(0);
  const [targetWord, setTargetWord] = useState<string>("");

  /* Wordle related */
  const totalAttempts = Math.max(6, guests.length);
  const [currentGuesser, setCurrentGuesser] = useState<User | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [correct, setCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // totalAttempts: rowNum; targeteCharNum: columnNum
  const [currentGuess, setCurrentGuess] = useState<WordleLetter[][]>([]);

  /* Alphabet */
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alphabetRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const [allLetterStatus, setAllLetterStatus] = useState<LetterStatus[]>(
    Array.from(alphabet).map((_) => LetterStatus.UNCHECKED)
  );

  /* Timer */
  const [isTimerStarted, setIsTimerStarted] = useState(false);

  /* Modal */
  const [showModal, setShowModal] = useState(false);

  /* Popup */
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);

  /* UI render */
  const [render, setRender] = useState(false);
  const [initialized, setInitialized] = useState(false);

  /* -------- Use Effect ---------- */

  /* When launch, Connet to web socket and initialize*/
  useEffect(() => {
    const onMessageReceived = (
      msg: WordleMsg | BackMessage | ModalMessage | TimerMessage
    ) => {
      receiveMessage(msg);
    };

    // Initialize web socket
    const cleanup = connect(
      socketUrl,
      websocketUrl,
      topic,
      onMessageReceived,
      setRender
    );

    initializeGame();

    return cleanup;
  }, []);

  /* If first time to this page, pop up instruction */
  useEffect(() => {
    const pageVisited = localStorage.getItem("wordleVisited");

    if (pageVisited !== "true") {
      setShowInstructionPopup(true);

      // Mark the user as visited to prevent showing the popup again
      localStorage.setItem("wordleVisited", "true");
    }
  }, []);

  /* When got target word, render grid */
  useEffect(() => {
    if (targetCharNum > 0) {
      // If first launch, set intial guess; if refresh page, does not change
      if (currentGuess.length == 0) {
        // Initialize currentGuess
        const initialGuess = Array.from({ length: totalAttempts }, () =>
          Array(targetCharNum).fill(
            new WordleLetter("", LetterStatus.UNCHECKED)
          )
        );
        setCurrentGuess(initialGuess);
      }

      setInitialized(true);
    }
  }, [targetCharNum]);

  /* When grid initialized, select guesser and change cursor */
  useEffect(() => {
    changeGuesser();
  }, [initialized]);

  /* When submit guess, change guesser and check finished */
  useEffect(() => {
    // Change guesser
    changeGuesser();
    // Set is finished
    setIsFinished(currentAttempt >= totalAttempts || correct);
  }, [currentAttempt]);

  /* When finished, show modal */
  useEffect(() => {
    if (isFinished) {
      receiveModalMessage();
    }
  }, [isFinished]);

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

  /* -------- Use Effect helper ---------- */

  /* Initialize game in order, execute line by line */
  const initializeGame = async () => {
    // get player status
    await checkWordleStatus();
    await checkPlayers();
    await checkNotPresented();

    // fetch target word
    await fetchWordLength();
    await fetchTargetWord();
  };

  /* Fetch target word length */
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

  /* Fetch target word */
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

      const data = await response.json();

      if (data !== "Error") {
        setSelectedField(data.target.fieldName);
        setTargetWord(data.target.targetWord);
      } else {
        console.error("Game cannot be found.");
      }
    } catch (error) {
      console.error("Error fetching wordle answer:", error);
    }
  };

  /* -------- Web Socket ---------- */

  /* Send message via websocket */
  const sendWordleMessage = (
    isCheck: boolean,
    updatedGuess: WordleLetter[][]
  ) => {
    sendMsg(destination, {
      currentAttempt: currentAttempt,
      totalAttempt: totalAttempts,
      isCheck: isCheck,
      letters: updatedGuess,
      roomCode: roomCode,
      isCorrect: null,
      allLetterStat: null,
    });
  };

  /* When receive message from websocket */
  const receiveMessage = useCallback(
    (msg: WordleMsg | BackMessage | ModalMessage | TimerMessage) => {
      try {
        // If contain letters field, it's WordleMsg
        if ("letters" in msg) {
          receiveWordleMessage(msg as WordleMsg);
        } else if ("show" in msg) {
          // show modal and update PresentRoomInfo
          receiveModalMessage();
        } else if ("started" in msg && msg.started) {
          console.log("receive TimerMessage in wordle: ", msg);
          setIsTimerStarted(true);
        } else {
          receiveBackMessage();
        }
      } catch (error) {
        console.error("Error parsing:", error);
      }
    },
    []
  );

  /* When receive wordle message, update wordle status */
  const receiveWordleMessage = (msg: WordleMsg) => {
    setCurrentGuess(msg.letters);

    if (msg.isCheck) {
      setCorrect(msg.isCorrect);
      setCurrentAttempt(msg.currentAttempt + 1);
    }

    setAllLetterStatus(msg.allLetterStat);
  };

  /* When receive modal message, show modal */
  const receiveModalMessage = () => {
    // Update PresentRoomInfo
    if (fieldName) {
      updatePresentRoomInfo({ roomCode, field: fieldName });
    }
    // Show the modal
    setShowModal(true);
  };

  /* When receive back message, back to present page */
  const receiveBackMessage = async () => {
    navigate("/PresentPage", {
      state: { user },
    });
  };

  /* -------- Button, Keyboard Handler ---------- */

  /* When click button to input guess, update cell */
  const handleInputChangeByButton = (value: string) => {
    /* Disable button when:
     1. User is not the current guesser
     2. Has got the correct answer
  */
    if (isFinished) {
      return;
    }

    // Find the first empty cell in the current attempt
    const emptyCell = currentGuess[currentAttempt].findIndex(
      (letter) => letter.letter === ""
    );

    if (emptyCell !== -1) {
      // make a deep copy
      const updatedGuess = currentGuess.map((row) =>
        row.map((letter) => new WordleLetter(letter.letter, letter.state))
      );

      // set value in the first empty cell
      updatedGuess[currentAttempt][emptyCell].setLetter(value.toUpperCase());

      // Move the cursor to the next empty cell
      if (emptyCell < updatedGuess[currentAttempt].length - 1) {
        document
          .getElementById(`input-${currentAttempt}-${emptyCell + 1}`)
          ?.focus();
      }

      // sendMessage
      sendWordleMessage(false, updatedGuess);
    }
  };

  /* When use keyboard to input guess, update cell */
  const handleInputChange = (row: number, col: number, value: string) => {
    /* Disable input when:
       1. User is not current guesser
       2. Input is not alphabet
       3. Has got the correct answer
    */
    if (
      !isSameUser(user, currentGuesser) ||
      !/^[a-zA-Z]$/.test(value) ||
      isFinished ||
      !isTimerStarted
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

  /* When click button to delete letter, update cell */
  const handleBackspaceButton = () => {
    const currentRow = currentGuess[currentAttempt];

    // Find the index of the last non-empty cell in the current attempt
    let lastNonEmptyCol = -1;
    for (let i = currentRow.length - 1; i >= 0; i--) {
      if (currentRow[i].letter !== "") {
        lastNonEmptyCol = i;
        break;
      }
    }

    // If there's a non-empty cell, call handleBackspace for that cell
    if (lastNonEmptyCol !== -1) {
      handleBackspace(currentAttempt, lastNonEmptyCol);
    }
  };

  /* When use Keyboard BACKSPACE to delete letter, update cell */
  const handleBackspace = (row: number, col: number) => {
    // If not your turn, cannot delete
    if (!isSameUser(user, currentGuesser) || isFinished || !isTimerStarted) {
      return;
    }

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
      document.getElementById(`input-${row}-${col}`)?.focus();
    } else {
      // Move the cursor back
      document.getElementById(`input-${row}-${col - 1}`)?.focus();

      // Clear the previous input field
      updatedGuess[row][col - 1].setLetter("");
    }

    // sendMessage
    sendWordleMessage(false, updatedGuess);
  };

  /* When click Guess button*/
  const handleGuessButton = () => {
    if (isFinished) {
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

  /* When click Keyboard ENTER, submit guess  */
  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleGuessButton();
    }
  };

  /* When click ChangeAnotherGame button */
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

  /* -------- Check status ---------- */

  /* Get game info when start, so that it can synchronize when refresh page */
  const checkWordleStatus = async () => {
    const url = `${serverPort}/getWordleGameStatus?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.json();
      const message = data.wordlemessage;

      // If not first launch, fetch status and update
      if (data != null) {
        setCurrentAttempt(
          message.isCheck ? message.currentAttempt + 1 : message.currentAttempt
        );
        setCurrentGuess(message.letters);
        setAllLetterStatus(message.allLetterStat);
      }
    } catch (error) {
      console.error("Error fetching wordle status:", error);
    }
  };

  /* Check player information in room */
  const checkPlayers = async () => {
    const url = `${serverPort}/getPlayers?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.json();

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
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  /* Check who has not presented, so can not view their proile */
  const checkNotPresented = async () => {
    try {
      const response = await fetch(
        `${serverPort}/notPresentedPeople?roomCode=${roomCode}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      setNotPresented(data.notPresentedPeople || []);

      if (!response.ok) {
        throw new Error("Room cannot be found");
      }
    } catch (error) {
      console.error("Error checking notPresented:", error);
    }
  };

  /* -------- Helper function ---------- */

  /* Change guesser according to currentAttempt */
  const changeGuesser = () => {
    const nextGuesser = guests[currentAttempt % guests.length];

    // Change to next guesser
    setCurrentGuesser(nextGuesser);

    // Move cursor to the first grid next row
    if (isSameUser(user, nextGuesser)) {
      document.getElementById(`input-${currentAttempt}-0`)?.focus();
    }
  };

  /* Auto set color of grid */
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
          backgroundColor: rootStyles.getPropertyValue(
            "--light-grey-background"
          ),
        };
    }
  };

  /* -------- UI Component ---------- */

  /* Modal message */
  const modalContent = () => {
    return (
      <>
        <h2>Target Word Revealed!</h2>
        <p>
          The target word was: <strong>{targetWord}</strong>
        </p>
      </>
    );
  };

  /* Main renderer */
  return render ? (
    <div className="row-page">
      <div className="left-column">
        <div className="row-container up-row">
          <Instructions instructionPics={wordleInstructions} />
        </div>

        <div className="column-container down-row">
          <div className="guest" style={{ marginBottom: "30%" }}>
            <h2>Presenter:</h2>
            <img
              src={`${presenter?.profileImage}`}
              alt="Presenter's Image"
              className="avatar"
            />
            <p>{presenter?.displayName}{isSameUser(user, presenter)? " (YOU)" : ""}</p>
            {
              <button
                className="button common-button"
                onClick={() => handleViewProfile(presenter)}
                disabled={
                  !isAdmin &&
                  notPresented.some((npUser) =>
                    isSameUser(npUser, presenter)
                  ) &&
                  !isSameUser(user, presenter)
                }
              >
                View Profile
              </button>
            }
          </div>

          <div className="guest">
            <h2>Admin:</h2>
            <img
              src={`${admin?.profileImage}`}
              alt="Admin's Image"
              className="avatar"
            />
            <p>{admin?.displayName}{isSameUser(user, admin)? " (YOU)" : ""}</p>

            <button
              className="button common-button"
              onClick={() => handleViewProfile(admin)}
              // If not admin and not presented and not me
              disabled={
                !isAdmin &&
                notPresented.some((npUser) => isSameUser(npUser, admin))
              }
            >
              View Profile
            </button>
          </div>
        </div>
      </div>

      <Timer
        user={user}
        roomCode={roomCode}
        roomStatus={RoomStatus.PRESENTING}
        defaultTime={60}
        timerClassName={"wordle-timer"}
      />

      <div className="main-column" onKeyDown={handleKeyPress}>
        <h1>
          We are guessing: {presenter?.displayName}'s {selectedField}!
        </h1>

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

        <div className="alphabet-list">
          {alphabetRows.map((row, rowIndex) => (
            <div key={rowIndex}>
              {row.split("").map((letter, columnIndex) => {
                const letterIndex = alphabet.indexOf(letter);
                return (
                  <button
                    key={columnIndex}
                    className={`alphabet-block`}
                    style={getStatusStyle(allLetterStatus[letterIndex])}
                    onClick={() => handleInputChangeByButton(letter)}
                    disabled={!isSameUser(user, currentGuesser)}
                  >
                    {alphabet[letterIndex]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="row-container">
          <button
            className="button common-button"
            onClick={handleGuessButton}
            disabled={!isSameUser(user, currentGuesser)}
          >
            Guess
          </button>

          <button
            className="button common-button"
            onClick={handleBackspaceButton}
            disabled={!isSameUser(user, currentGuesser)}
          >
            Backspace
          </button>
        </div>

        {isAdmin && (
          <button
            className="button admin-only-button"
            style={{ zIndex: "var(--above-timer-layer)" }}
            onClick={handleBackButton}
          >
            Choose Another Game
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
                  <p>{guest.displayName}{isSameUser(user, guest)? " (YOU)" : ""}</p>
                </div>
                {
                  <button
                    className="button common-button"
                    onClick={() => handleViewProfile(guest)}
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
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Show profile popup */}
      {showProfilePopup && selectedUserProfile && (
        <div className="popup">
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
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          onClose={() => {
            setShowModal(false);
            handleBackButton();
          }}
          isAdmin={isSameUser(user, admin)}
          modalContent={modalContent()}
        />
      )}

      {/* First time instruction popup */}
      {showInstructionPopup && (
        <Instructions
          instructionPics={wordleInstructions}
          onlyShowPopup={true}
          closeButtonFunction={() => setShowInstructionPopup(false)}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default Wordle;
