import React, { useEffect, useCallback, useState } from "react";
import DrawingCanvas from "./pictionary/DrawingCanvas";
import ChatRoom from "./ChatRoomPage";
import { useLocation, useNavigate } from "react-router-dom";
import { DrawingData, DrawingMessage } from "./type/DrawingCanvas";
import { connect, sendMsg } from "./utils/WebSocketService";
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

const pictionaryInstructions = [
  {
    img: Inst1,
    text: "In this game the presenter will draw their answer for you, and you can compete to guess the correct word. Have fun!",
  },
];

const PictionaryPage = () => {
  const location = useLocation();
  const [externalDrawing, setExternalDrawing] = useState<DrawingMessage>();
  const user: User = location.state?.user;
  const userID = user?.userID;
  // const isDrawer = user?.isPresenter;
  const isDrawer = location.state?.isPresenter;
  const roomCode = user?.roomCode;
  const admin = location.state?.admin;
  const presenter: User = location.state?.presenter;
  const guests = location.state?.guests;
  const isPresenter = location.state?.isPresenter;
  const fieldName = location.state?.selectedField;
  const [seletedField, setSelectedField] = useState<
    keyof PresentRoomInfo | null
  >(null);
  const [targetWord, setTargetWord] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [render, setRender] = useState(false);

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
    } else {
      // throw new Error(`HTTP error when getTarget! Status: ${response.status}`);
      console.log("data ", data);
    }
  };

  // Only when the timer stops naturally can the field be revealed, if navigated by the button, field should not be revealed

  // Back to present page directly without revealing the field
  const handleBackMessage = async () => {
    navigate("/PresentPage", {
      state: { user, admin, presenter, guests },
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
    (msg: DrawingMessage | BackMessage | ModalMessage) => {
      console.log(
        "Pictionary receives message ",
        msg,
        " filedName ",
        fieldName
      );
      try {
        // If contain drawer field, is DrawingMessage
        if ("drawer" in msg) {
          setExternalDrawing(msg as DrawingMessage);
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

  useEffect(() => {
    // set target word
    fetchTargetWord();
    // connect to drawing websocket
    const socketUrl = `${serverPort}/chat?userId=${userID}`;
    const websocketUrl = `${websocketPort}/chat?userId=${userID}`;
    const topic = `/topic/room/${roomCode}/drawing`;

    // Store the cleanup function returned by connect
    const cleanup = connect(
      socketUrl,
      websocketUrl,
      topic,
      handleReceivedDrawing,
      setRender
    );

    // Return the cleanup function from useEffect
    return cleanup; // This will be called when the component unmounts
  }, []);

  // Send DrawingMessage to server
  const handleDraw = useCallback(
    (drawingData: DrawingData) => {
      const destination = `/app/room/${roomCode}/sendDrawing`;
      const drawingMessage = {
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

  const target: JSX.Element | null =
    targetWord !== "" ? (
      <div className="word-display">
        {isPresenter || (admin && userID === admin.userID) ? (
          <span>Target Word: {targetWord}</span> // Show the target word to the presenter and admin
        ) : (
          <div>
            <div>
              We are guessing {presenter.displayName}'s {seletedField}: {"  "}
            </div>
            <span className="underscore-display">
              {"_ ".repeat(targetWord.length).trim()}
            </span>
          </div>
        )}
      </div>
    ) : null;

  return render ? (
    <div className="row-page">
      <div className="left-column">
        <div className="row-container up-row">
          {/* Timer */}
          <div>
            <Timer
              user={user}
              roomCode={roomCode}
              roomStatus={RoomStatus.PRESENTING}
              defaultTime={60}
            />
          </div>
          <Instructions instructionPics={pictionaryInstructions} />
        </div>
        <div className="column-container down-row">
          <div className="chat-room-container">
            <ChatRoom />
          </div>
        </div>
      </div>
      <div className="drawing-canvas-container">
        <DrawingCanvas
          isDrawer={isDrawer}
          onDraw={handleDraw}
          externalDrawing={externalDrawing}
          target={target}
        />
        <div>
          {(isPresenter || userID === admin.userID) && (
            <button
              id="back-to-presentroom-button"
              className="button admin-only-button"
              onClick={() => handleBackToPresentRoom()}
            >
              Back to PresentRoom
            </button>
          )}
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
          adminID={admin.userID}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default PictionaryPage;
