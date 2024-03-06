import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { LetterStatus } from "./type/WordleLetter";
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import { RoomStatus } from "./type/RoomStatus";

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
import { ModalMessage } from "./type/ModalMessage";
import { TimerMessage } from "./type/Timer";
import { BackMessage } from "./type/BackMessage";

/* Image used */
import hangmanStages from "./HangmanStage";

/* Timer */
import { Timer } from "./timer/Timer";

/* Modal */
import { Modal } from "./utils/Modal";

/* Instruction */
import Instructions from "./Instructions";
import hangmanInstructionPic from "./instructions/HangmanInstruction.png";

/* CSS */
import "./css/HangmanPage.css";

/* Instructions */
const hangmanInstructions = [
  {
    img: hangmanInstructionPic,
    text: "",
  },
];

/* Web socket message interface */
interface HangmanMsg {
  guessLetter: string;
  isCorrect: boolean;
  correctPositions: number[];
  currentStages: string[];
  allLetterStat: LetterStatus[];
  isFinished: boolean;
  roomCode: string;
  currentWrongGuesses: number;
  currentGuesses: number;
}

const HangmanPage = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  const navigate = useNavigate();
  const location = useLocation();

  /* Location passed field */
  const user = location.state?.user;
  const userID = user.userID;
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
  const topic = `/topic/room/${roomCode}/hangman`;
  const destination = `/app/room/${roomCode}/hangman`;

  /* Target word */
  const [selectedField, setSelectedField] = useState<keyof PresentRoomInfo>();
  const [targetWord, setTargetWord] = useState<string>("");

  /* Hangman related */
  const [mistakes, setMistakes] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [currentGuesses, setCurrentGuesses] = useState(0);
  const [currentGuesser, setCurrentGuesser] = useState<User | null>(null);
  const [currentPositions, setCurrentPositions] = useState<number[]>([]);
  const [currentStages, setCurrentStages] = useState<string[]>([]);

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

  /* -------- Use Effect ---------- */

  /* When launch, Connet to web socket and initialize*/
  useEffect(() => {
    const onMessageReceived = (
      msg: HangmanMsg | BackMessage | ModalMessage | TimerMessage
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
    const pageVisited = localStorage.getItem("hangmanVisited");

    if (pageVisited !== "true") {
      setShowInstructionPopup(true);

      // Mark the user as visited to prevent showing the popup again
      localStorage.setItem("hangmanVisited", "true");
    }
  }, []);

  /* When submit guess, change player */
  useEffect(() => {
    changeGuesser();
  }, [guests, currentGuesses]);

  const changeGuesser = () => {
    const nextGuesser = guests[currentGuesses % guests.length];

    console.log(nextGuesser?.displayName, " is next guesser");
    // Change to next guesser
    setCurrentGuesser(nextGuesser);
  };

  /* When game finished, show modal */
  useEffect(() => {
    if (isFinished) {
      receiveModalMessage();
    }
  }, [isFinished]);

  /* When key down, send guess */
  useEffect(() => {
    const handleKeyDown = (event: any) => {
      const pressedKey = event.key.toUpperCase();

      if (
        alphabet.includes(pressedKey) &&
        allLetterStatus[alphabet.indexOf(pressedKey)] ===
          LetterStatus.UNCHECKED &&
        !isFinished &&
        isTimerStarted &&
        isSameUser(user, currentGuesser)
      ) {
        sendHangmanMessage(pressedKey);
      }
    };

    // Attach the event listener when the component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Detach the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTimerStarted, allLetterStatus, isFinished, currentGuesser]);

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
    await checkPlayers();
    await checkNotPresented();
    await checkHangmanStatus();

    // fetch target word
    await fetchWordLength();
    await fetchTargetWord();
  };

  /* Fetch target word length */
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

      const data = await response.json();

      const characterArray = Array.from(data as string[]);
      setCurrentStages(characterArray);
    } catch (error) {
      console.error("Error fetching wordle length:", error);
    }
  };

  /* Fetch target word */
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

  /* -------- Web Socket ---------- */

  /* Send message via websocket */
  const sendHangmanMessage = (letter: string) => {
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

  /* When receive message from websocket */
  const receiveMessage = useCallback(
    (msg: HangmanMsg | BackMessage | ModalMessage | TimerMessage) => {
      try {
        console.log("receive msg, ", msg);
        if ("guessLetter" in msg) {
          // If contain letters field, it's WordleMsg
          receiveHangmanMessage(msg as HangmanMsg);
        } else if ("show" in msg) {
          // show modal and update PresentRoomInfo
          receiveModalMessage();
        } // Handle Timer started message
        else if ("started" in msg && msg.started) {
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

  /* When receive hangman message, update hangman status */
  const receiveHangmanMessage = (msg: HangmanMsg) => {
    try {
      // Update guess
      setCurrentStages(msg.currentStages);
      setCorrect(msg.isCorrect);
      setIsFinished(msg.isFinished);
      setCurrentPositions(msg.correctPositions);
      setAllLetterStatus(msg.allLetterStat);
      setMistakes(msg.currentWrongGuesses);
      setCurrentGuesses(msg.currentGuesses);
    } catch (error) {
      console.error("Error parsing:", error);
    }
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

  /* -------- Button Handler ---------- */

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
  const checkHangmanStatus = async () => {
    const url = `${serverPort}/getHangmanGameStatus?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.json();

      const message = data.hangmanmessage;

      // If not first launch, fetch status and update
      if (data != null) {
        setCurrentGuesses(message.currentGuesses);
        setCurrentStages(message.currentStages);
        setAllLetterStatus(message.allLetterStat);
        setMistakes(message.currentWrongGuesses);
      }
    } catch (error) {
      console.error("Error fetching hangman status:", error);
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
      console.log("check who has not presenter", notPresented);

      if (!response.ok) {
        throw new Error("Room cannot be found");
      }
    } catch (error) {
      console.error("Error checking notPresented:", error);
    }
  };

  /* -------- Helper function ---------- */

  /* Display current guess */
  const displayWord = currentStages
    .map((letter) =>
      letter
        ? letter === " "
          ? "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"
          : letter
        : "_"
    )
    .join("\u00A0");

  /* Auto set color of grid */
  const getStatusStyle = (status: LetterStatus) => {
    const baseStyle = {
      fontSize: "1rem",
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
          <Instructions instructionPics={hangmanInstructions} />
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
                  !isSameUser(presenter, user)
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

      <div className="main-column">
        <h1>
          We are guessing: {presenter?.displayName}'s {selectedField}!
        </h1>
        <h2>Current guesser is: {currentGuesser?.displayName}{isSameUser(user, currentGuesser)? " (YOU)" : ""}</h2>
        <div className="column-container">
          <pre id="hangman-ascii" style={{ fontSize: "20px" }}>
            <p>{`Chances: ${6 - mistakes}`}</p>
            <div>{hangmanStages[mistakes]}</div>
          </pre>
        </div>
        <div className="hangman-input">
          <h3>{displayWord}</h3>
        </div>
        <div className="alphabet-list">
          {Array.from(alphabetRows).map((row, rowIndex) => (
            <div key={rowIndex}>
              {row.split("").map((letter, columnIndex) => {
                const letterIndex = alphabet.indexOf(letter);
                return (
                  <button
                    key={columnIndex}
                    className={`alphabet-block`}
                    style={getStatusStyle(allLetterStatus[letterIndex])}
                    onClick={() => sendHangmanMessage(letter)} // Assuming sendWordleMessage is your function to handle guesses
                    disabled={
                      !isSameUser(user, currentGuesser) ||
                      allLetterStatus[letterIndex] !== LetterStatus.UNCHECKED ||
                      isFinished
                    }
                  >
                    {alphabet[letterIndex]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {isAdmin && (
          <button
            className="button admin-only-button"
            onClick={handleBackButton}
            style={{ zIndex: "var(--above-timer-layer)" }}
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
          instructionPics={hangmanInstructions}
          onlyShowPopup={true}
          closeButtonFunction={() => setShowInstructionPopup(false)}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default HangmanPage;
