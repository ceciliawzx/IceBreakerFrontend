import React, { useEffect, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";
import {
  DrawingData,
  DrawingMessage,
  PasteImgData,
  PasteImgMessage,
} from "./type/DrawingCanvas";
import { RoomStatus } from "./type/RoomStatus";
import { PresentRoomInfo } from "./type/PresentRoomInfo";

/* General function */
import { isSameUser } from "./utils/CommonCompare";
import { disableScroll } from "./utils/CssOperation";
import { updatePresentRoomInfo } from "./utils/RoomOperation";
import DrawingCanvas from "./pictionary/DrawingCanvas";
import ChatRoom from "./ChatRoomPage";

/* Web socket */
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "./utils/WebSocketService";
import { BackMessage } from "./type/BackMessage";
import { ModalMessage } from "./type/ModalMessage";

/* Timer */
import { Timer } from "./timer/Timer";

/* Modal */
import { Modal } from "./utils/Modal";

/* Instruction */
import Instructions from "./Instructions";
import PictionaryInstructionPic from "./instructions/PictionaryInstruction.png";
import ShareboardInstructionPic from "./instructions/ShareboardInstruction.png";

/* CSS */
import "./css/PictionaryPage.css";

/* Instructions */
const pictionaryInstructions = [
  {
    img: PictionaryInstructionPic,
    text: "Pictionary",
  },
];

const shareBoardInstructions = [
  {
    img: ShareboardInstructionPic,
    text: "Shareboard",
  },
];

const PictionaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* Location passed field */
  const user: User = location.state?.user;
  const userID = user?.userID;
  const roomCode = user?.roomCode;
  const fieldName = location.state?.selectedField;

  /* Users in room */
  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);

  /* User status */
  const [isDrawer, setIsDrawer] = useState(false);

  /* Web socket url */
  const topic = `/topic/room/${roomCode}/drawing`;
  const destination = `/app/room/${roomCode}/sendDrawing`;

  /* Target word */
  const [seletedField, setSelectedField] = useState<
    keyof PresentRoomInfo | null
  >(null);
  const [targetWord, setTargetWord] = useState("");

  /* Canvas related */
  const [externalDrawing, setExternalDrawing] = useState<DrawingMessage>();
  const [externalPasteImg, setExternalPasteImg] = useState<PasteImgMessage>();

  /* Modal */
  const [showModal, setShowModal] = useState(false);

  /* Popup */
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);

  /* UI render */
  const [render, setRender] = useState(false);
  const [wordFetched, setWordFetched] = useState(false);

  /* -------- Use Effect ---------- */

  /* Disable scroll for this page */
  useEffect(disableScroll, []);

  /* Initial pull */
  useEffect(() => {
    // get player status
    checkPlayers();
  }, []);

  /* When mount, fetch target word and connect websocket */
  useEffect(() => {
    // set target word
    fetchTargetWord();

    // connect to drawing websocket
    const cleanup = connect(
      socketUrl,
      websocketUrl,
      topic,
      receiveMessage,
      setRender
    );

    // Return the cleanup function from useEffect
    return cleanup; // This will be called when the component unmounts
  }, []);

  /* If first time to this page, pop up instruction */
  useEffect(() => {
    // Check after fetched target word, to distinguish between pictionary and shareboard
    if (!wordFetched) return;

    const pageItemName = isPictionary()
      ? "pictionaryVisited"
      : "shareboardVisited";

    const pageVisited = localStorage.getItem(pageItemName);

    if (pageVisited !== "true") {
      setShowInstructionPopup(true);

      // Mark the user as visited to prevent showing the popup again
      localStorage.setItem(pageItemName, "true");
    }
  }, [wordFetched]);

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

  /* Fetch targetWord */
  const fetchTargetWord = async () => {
    const response = await fetch(
      `${serverPort}/getTarget?roomCode=${roomCode}`
    );
    const data = await response.json();
    if (data) {
      console.log("target received ", data);
      setSelectedField(data.target.fieldName);
      setTargetWord(data.target.targetWord);
      setWordFetched(true);
    } else {
      // throw new Error(`HTTP error when getTarget! Status: ${response.status}`);
      console.log("data ", data);
    }
  };

  /* -------- Web Socket ---------- */

  /* Send drawed lines via websocket */
  const sendDraw = useCallback(
    (drawingData: DrawingData) => {
      const drawingMessage: DrawingMessage = {
        roomCode,
        drawingData,
        timestamp: new Date().toISOString(),
        drawer: userID,
      };
      sendMsg(destination, drawingMessage);
    },
    [roomCode]
  );

  /* Send pasted image via websocket */
  const sendPaste = useCallback(
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

  /* When receive message from websocket */
  const receiveMessage = useCallback(
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
          receiveModalMessage();
        } else {
          receiveBackMessage();
        }
      } catch (error) {
        console.error("Error parsing:", error);
      }
    },
    []
  );

  /* When receive modal message, show modal */
  const receiveModalMessage = () => {
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
  };

  /* When receive wordle message, back to present page */
  const receiveBackMessage = async () => {
    navigate("/PresentPage", {
      state: { user },
    });
  };

  /* -------- Button Handler ---------- */

  /* When click ChangeAnotherGame button */
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

  /* -------- Check status ---------- */

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

      // If I am presenter, set isDrawer
      setIsDrawer(isSameUser(data.presenter, user));
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  /* -------- Helper function ---------- */

  /* Check if this game is pictionary or shareboard */
  const isPictionary = () => {
    return targetWord !== "";
  };

  /* -------- UI Component ---------- */

  /* Target display component */
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

  /* Modal message */
  const modalContent = () => {
    return targetWord !== "" ? (
      <>
        <h2>Target Word Revealed!</h2>
        <p>
          The target word was: <strong>{targetWord}</strong>
        </p>
      </>
    ) : (
      <h2>Back to PresentRoom</h2>
    );
  };

  /* Main renderer */
  return render ? (
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
        <div className="column-container down-row">
          <div className="chat-room-container">
            <ChatRoom isPresenter={isSameUser(presenter, user)} />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="drawing-canvas-container">
        <DrawingCanvas
          isDrawer={isDrawer}
          onDraw={sendDraw}
          onPaste={sendPaste}
          externalDrawing={externalDrawing}
          externalPasteImg={externalPasteImg}
          target={target}
        />
        <div>
          {isSameUser(user, admin) && (
            <button
              id="back-to-presentroom-button"
              className="button admin-only-button"
              onClick={() => handleBackToPresentRoom()}
            >
              Choose Another Game
            </button>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          onClose={() => {
            setShowModal(false);
            handleBackToPresentRoom();
          }}
          isAdmin={isSameUser(user, admin)}
          modalContent={modalContent()}
        />
      )}

      {/* First time instruction popup */}
      {showInstructionPopup && (
        <Instructions
          instructionPics={
            isPictionary() ? pictionaryInstructions : shareBoardInstructions
          }
          onlyShowPopup={true}
          closeButtonFunction={() => setShowInstructionPopup(false)}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default PictionaryPage;
