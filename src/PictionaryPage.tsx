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
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import { Timer } from "./timer/Timer";
import { BackMessage } from "./type/BackMessage";
import { ModalMessage } from "./type/ModalMessage";
import { Modal } from './utils/Modal';

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
  const [targetWord, setTargetWord] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Fetch targetWord
  const fetchTargetWord = async () => {
    const response = await fetch(
      `${serverPort}/getTarget?roomCode=${roomCode}`
    );
    const data = await response.text();
    if (data) {
      console.log("data ", data);
      setTargetWord(data.toString());
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
    // Update PresentRoomInfo
    updatePresentRoomInfo({ roomCode, field: fieldName });
    // Show the modal
    setShowModal(true);
  };

  const handleReceivedDrawing = useCallback(
    (msg: DrawingMessage | BackMessage | ModalMessage) => {
      console.log("Pictionary receives message ", msg);
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
    connect(socketUrl, websocketUrl, topic, handleReceivedDrawing);
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
    console.log("pictionary sending backToPresentRoom");
    const url = `${serverPort}/backToPresentRoom?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error returning to WaitRoom:", error);
    }
  };

  return (
    <div className="row-page">
      <div className="chat-room-container">
        <ChatRoom />
      </div>
      <div className="drawing-canvas-container">
        <DrawingCanvas
          isDrawer={isDrawer}
          onDraw={handleDraw}
          externalDrawing={externalDrawing}
        />
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
        {targetWord !== "" && (
          <div className="word-display">
            {isPresenter || (admin && userID === admin.userID) ? (
              <span>Target Word: {targetWord}</span> // Show the target word to the presenter and admin
            ) : (
              <span className="underscore-display">
                {"_ ".repeat(targetWord.length).trim()}
              </span>
            )}
          </div>
        )}
        <div>
          {(isPresenter || userID === admin.userID) && (
            <button
              id="back-to-presentroom-button"
              className="admin-only-button"
              onClick={() => handleBackToPresentRoom()}
            >
              Back to PresentRoom
            </button>
          )}
        </div>
        <div>
          <Timer
            user={user}
            roomCode={roomCode}
            roomStatus={RoomStatus.PRESENTING}
            defaultTime={40}
          />
        </div>
      </div>
    </div>
  );
};

export default PictionaryPage;
