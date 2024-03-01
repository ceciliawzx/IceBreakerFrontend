import React, { useState, useEffect, useCallback } from "react";
import { serverPort, websocketPort } from "./macro/MacroServer";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "./utils/WebSocketService";
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
import { isSameUser } from "./utils/CommonCompare";
import Instructions from "./Instructions";
import hangmanInstruction from "./instructions/hangman/HangmanInstruction.png";

const hangmanInstructions = [
  {
    img: hangmanInstruction,
    text: "",
  },
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
  currentGuesses: number;
}

const HangmanPage = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const isAdmin = user.isAdmin;

  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);
  const [guests, setGuests] = useState<User[]>([]);
  const fieldName = location.state?.selectedField;
  const [selectedField, setSelectedField] = useState<keyof PresentRoomInfo>();

  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [notPresented, setNotPresented] = useState<User[]>([]);

  /* Modal */
  const [showModal, setShowModal] = useState(false);

  /* Web socket url */
  const topic = `/topic/room/${roomCode}/hangman`;
  const destination = `/app/room/${roomCode}/hangman`;

  // Hangman game states
  const [mistakes, setMistakes] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [currentGuesses, setCurrentGuesses] = useState(0);
  const [currentGuesser, setCurrentGuesser] = useState<User | null>(null);
  const [targetWord, setTargetWord] = useState<string>("");

  const [currentPositions, setCurrentPositions] = useState<number[]>([]);
  const [currentStages, setCurrentStages] = useState<string[]>([]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alphabetRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const [allLetterStatus, setAllLetterStatus] = useState<LetterStatus[]>(
    Array.from(alphabet).map((_) => LetterStatus.UNCHECKED)
  );

  const [render, setRender] = useState(false);

  // When launch
  useEffect(() => {
    initializeGame();
  }, []);

  // When submit, change player
  useEffect(() => {
    changeGuesser();
  }, [guests, currentGuesses]);

  const changeGuesser = () => {
    const nextGuesser = guests[currentGuesses % guests.length];

    console.log(nextGuesser?.displayName, " is next guesser");
    // Change to next guesser
    setCurrentGuesser(nextGuesser);
  };

  // Show modal when guessed correct
  useEffect(() => {
    if (isFinished) {
      handleModalMessage();
    }
  }, [isFinished]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: any) => {
      const pressedKey = event.key.toUpperCase();
      if (
        alphabet.includes(pressedKey) &&
        allLetterStatus[alphabet.indexOf(pressedKey)] ===
          LetterStatus.UNCHECKED &&
        !isFinished &&
        isSameUser(user, currentGuesser)
      ) {
        // Assuming sendHangmanMessage is your function to handle guesses
        sendHangmanMessage(pressedKey);
      }
    };

    // Attach the event listener when the component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Detach the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [allLetterStatus, isFinished, currentGuesser]);

  // When receive message from web socket
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

  // Receive and parse message from websocket
  const handleHangmanMessage = (msg: HangmanMsg) => {
    try {
      // Update guess
      setCurrentStages(msg.currentStages);
      const displayWord = msg.currentStages
        .map((letter) =>
          letter
            ? letter === " "
              ? "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"
              : letter
            : "_"
        )
        .join("\u00A0");

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

  const initializeGame = async () => {
    const onMessageReceived = (
      msg: HangmanMsg | BackMessage | ModalMessage
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

    // get player status
    await checkPlayers();
    await checkNotPresented();
    await getHangmanStatus();

    // fetch target word
    await fetchWordLength();
    await fetchTargetWord();

    return cleanup;
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

      const data = await response.json();

      const characterArray = Array.from(data as string[]);
      setCurrentStages(characterArray);
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

  // Show modal
  const handleModalMessage = () => {
    // Update PresentRoomInfo
    if (fieldName) {
      updatePresentRoomInfo({ roomCode, field: fieldName });
    }
    // Show the modal
    setShowModal(true);
  };

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

  // Send message via web socket
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

  // Back to present page
  const handleBackMessage = async () => {
    navigate("/PresentPage", {
      state: { user, admin, presenter, guests },
    });
  };

  // When click back to presenta page button
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

  // Display current guess
  const displayWord = currentStages
    .map((letter) =>
      letter
        ? letter === " "
          ? "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"
          : letter
        : "_"
    )
    .join("\u00A0");

  // When click view profile button
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

  // Auto set grid color
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

  // Get player info when start
  const getHangmanStatus = async () => {
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

  // Get player info when start
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
            <p>{presenter?.displayName}</p>
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
            <p>{admin?.displayName}</p>

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
        useFloatTimer={true}
      />

      <div className="main-column">
        <h1>
          We are guessing: {presenter?.displayName}'s {selectedField}!
        </h1>
        <h2>Current guesser is: {currentGuesser?.displayName}</h2>
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
            style={{ zIndex: "var(--above-overlay-index)" }}
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
                  <p>{guest.displayName}</p>
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
      {/* show profile popup */}
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
          targetWord={targetWord}
          userID={userID}
          adminID={admin?.userID || "Cannot find admin"}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default HangmanPage;
