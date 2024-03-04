import React, { useEffect, useCallback, useState } from "react";
import DrawingCanvas from "./pictionary/DrawingCanvas";
import ChatRoom from "./ChatRoomPage";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DrawingData,
  DrawingMessage,
  PasteImgData,
  PasteImgMessage,
} from "./type/DrawingCanvas";
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "./utils/WebSocketService";
import { serverPort, websocketPort } from "./macro/MacroServer";
import "./css/PictionaryPage.css";
import { User } from "./type/User";
import { updatePresentRoomInfo } from "./utils/RoomOperation";
import { RoomStatus } from "./type/RoomStatus";
import { Timer } from "./timer/Timer";
import { BackMessage } from "./type/BackMessage";
import { ModalMessage } from "./type/ModalMessage";
import { Modal } from "./utils/Modal";
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import Instructions from "./Instructions";
import Inst1 from "./instructions/draw&guess/1.png";
import Inst2 from "./instructions/hangman/HangmanInstruction.png";
import { isSameUser } from "./utils/CommonCompare";
import { disableScroll } from "./utils/CssOperation";

const pictionaryInstructions = [
  {
    img: Inst1,
    text: "Pictionary",
  },
];

const shareBoardInstructions = [
  {
    img: Inst2,
    text: "Shareboard",
  },
];

const PictionaryPage = () => {
  const location = useLocation();
  const [externalDrawing, setExternalDrawing] = useState<DrawingMessage>();
  const [externalPasteImg, setExternalPasteImg] = useState<PasteImgMessage>();
  const user: User = location.state?.user;
  const userID = user?.userID;
  const roomCode = user?.roomCode;
  const fieldName = location.state?.selectedField;

  const [isDrawer, setIsDrawer] = useState(false);
  const [seletedField, setSelectedField] = useState<
    keyof PresentRoomInfo | null
  >(null);

  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);

  const [targetWord, setTargetWord] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [render, setRender] = useState(false);
  const [wordFetched, setWordFetched] = useState(false);
  const [instructionPopup, setInstructionPopup] = useState(false);

  // disable scroll for this page
  useEffect(disableScroll, []);

  useEffect(() => {
    // get player status
    checkPlayers();
  }, []);

  // useEffect(() => {
  //   // set target word
  //   fetchTargetWord();
  //   // connect to drawing websocket
  //   const topic = `/topic/room/${roomCode}/drawing`;

  //   // Store the cleanup function returned by connect
  //   const cleanup = connect(
  //     socketUrl,
  //     websocketUrl,
  //     topic,
  //     handleReceivedDrawing,
  //     setRender
  //   );

  //   // Return the cleanup function from useEffect
  //   return cleanup; // This will be called when the component unmounts
  // }, []);

  // If first time to this page, pop up instruction
  useEffect(() => {
    // Check after fetched target word, to distinguish between pictionary and shareboard
    if (!wordFetched) return;

    const pageItemName = isPictionary()
      ? "pictionaryVisited"
      : "shareboardVisited";

    const pageVisited = localStorage.getItem(pageItemName);

    if (pageVisited !== "true") {
      setInstructionPopup(true);

      // Mark the user as visited to prevent showing the popup again
      localStorage.setItem(pageItemName, "true");
    }
  }, [wordFetched]);

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

  // Fetch targetWord
  const fetchTargetWord = async () => {
    const response = await fetch(
      `${serverPort}/getTarget?roomCode=${roomCode}`
    );
    const data = await response.json();
    if (data) {
      console.log("target received ", data);
      // setTargetWord(data.toString());
      setSelectedField(data.target.fieldName);
      setTargetWord(data.target.targetWord);
      setWordFetched(true);
    } else {
      // throw new Error(`HTTP error when getTarget! Status: ${response.status}`);
      console.log("data ", data);
    }
  };

  // Only when the timer stops naturally can the field be revealed, if navigated by the button, field should not be revealed

  // Back to present page directly without revealing the field
  const handleBackMessage = async () => {
    navigate("/PresentPage", {
      state: { user },
    });
  };

  const handleModalMessage = () => {
    if (fieldName) {
      // Update PresentRoomInfo
      console.log("updating presentRoomInfo ", {
        roomCode,
        field: fieldName,
      });
      updatePresentRoomInfo({ roomCode, field: fieldName });
    }
    // Show the modal
    setShowModal(true);
  }; // Add fieldName and any other relevant state to the dependency array

  const handleReceivedDrawing = useCallback(
    (msg: DrawingMessage | PasteImgMessage | BackMessage | ModalMessage) => {
      console.log(
        "Pictionary receives message ",
        msg,
        " filedName ",
        fieldName
      );
      try {
        // If contain drawingData field, is DrawingMessage
        if ("drawer" in msg) {
          setExternalDrawing(msg as DrawingMessage);
        } else if ("paster" in msg) {
          setExternalPasteImg(msg as PasteImgMessage);
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

  // Send DrawingMessage to server
  const handleDraw = useCallback(
    (drawingData: DrawingData) => {
      const destination = `/app/room/${roomCode}/sendDrawing`;
      const drawingMessage: DrawingMessage = {
        roomCode,
        drawingData,
        timestamp: new Date().toISOString(),
        drawer: userID,
      };
      // console.log('Sending drawing data', drawingData);
      sendMsg(destination, drawingMessage);
    },
    [roomCode]
  );

  const handlePaste = useCallback(
    (pasteImgData: PasteImgData) => {
      const destination = `/app/room/${roomCode}/sendPasteImg`;

      const pasteImgMessage: PasteImgMessage = {
        roomCode,
        pasteImgData,
        timestamp: new Date().toISOString(),
        paster: userID,
      };
      console.log("Sending pasteImgMessage ", pasteImgMessage);
      sendMsg(destination, pasteImgMessage);
    },
    [roomCode]
  );

  // navigate back to presentRoom
  const handleBackToPresentRoom = async () => {
    const url = `${serverPort}/backToPresentRoom?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error returning to WaitRoom:", error);
    }
  };

  const isPictionary = () => {
    return targetWord !== "";
  };

  const target: JSX.Element | null = isPictionary() ? (
    <div className="word-display">
      {isSameUser(presenter, user) || isSameUser(user, admin) ? (
        <span>Target Word: {targetWord}</span> // Show the target word to the presenter and admin
      ) : (
        <div>
          <div>
            We are guessing {presenter?.displayName}'s {seletedField}: {"  "}
          </div>
          <span className="underscore-display">
            {targetWord
              .split("")
              .map((char) => (/[a-zA-Z]/.test(char) ? "_" : `${char + " "}`))
              .join("")
              .trim()}
          </span>
        </div>
      )}
    </div>
  ) : (
    <div>
      Showing {presenter?.displayName}'s {seletedField}
    </div>
  );

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

      // If I am presenter, set isDrawer
      setIsDrawer(isSameUser(data.presenter, user));
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  return true ? (
    <div className="row-page">
      <div className="left-column">
        <div className="row-container up-row">
          {isPictionary() ? (
            <Instructions instructionPics={pictionaryInstructions} />
          ) : (
            <Instructions instructionPics={shareBoardInstructions} />
          )}

          {/* Timer */}
          <div>
            <Timer
              user={user}
              roomCode={roomCode}
              roomStatus={RoomStatus.PRESENTING}
              defaultTime={60}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <Modal
          onClose={() => {
            setShowModal(false);
            handleBackToPresentRoom();
          }}
          targetWord={targetWord}
          userID={userID}
          adminID={admin?.userID || "Cannot find admin"}
        />
      )}

      {/* First time instruction popup */}
      {instructionPopup && (
        <Instructions
          instructionPics={
            isPictionary() ? pictionaryInstructions : shareBoardInstructions
          }
          onlyShowPopup={true}
          closeButtonFunction={() => setInstructionPopup(false)}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default PictionaryPage;
