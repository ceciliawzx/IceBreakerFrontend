import React, { useEffect, useCallback, useState } from "react";
import DrawingCanvas from "./pictionary/DrawingCanvas";
import ChatRoom from "./ChatRoomPage";
import { useLocation, useNavigate } from "react-router-dom";
import { DrawingData, DrawingMessage } from "./type/DrawingCanvas";
import { connect, sendMsg } from "./utils/WebSocketService";
import { serverPort, websocketPort } from "./macro/MacroServer";
import "./css/PictionaryPage.css";
import { User } from "./type/User";
import { checkRoomStatus, updatePresentRoomInfo } from "./utils/RoomOperation";
import { RoomStatus } from "./type/RoomStatus";
import { refreshTime } from "./macro/MacroConst";
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import { Timer } from "./timer/Timer";

const PictionaryPage = () => {
  const location = useLocation();
  const [externalDrawing, setExternalDrawing] = useState<DrawingMessage>();
  const user: User = location.state?.user;
  const userID = user?.userID;
  // const isDrawer = user?.isPresenter;
  const isDrawer = location.state?.isPresenter;
  const displayName = user?.displayName;
  const roomCode = user?.roomCode;
  const admin = location.state?.admin;
  const presenter: User = location.state?.presenter;
  const guests = location.state?.guests;
  const isPresenter = location.state?.isPresenter;
  const presentRoomInfo = location.state?.presentRoomInfo;
  const fieldName = location.state?.selectedField;
  const [targetWord, setTargetWord] = useState("");
  const [roomStatus, setRoomStatus] = useState<RoomStatus>(
    RoomStatus.PICTURING
  );
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
      throw new Error(`HTTP error when getTarget! Status: ${response.status}`);
    }
  };

  // Handle navigation
  useEffect(() => {
    // Define an IIFE to handle async operation
    (async () => {
      try {
        const data = await checkRoomStatus({ roomCode });
        if (data && data.roomStatus) {
          setRoomStatus(data.roomStatus);
        }
      } catch (error) {
        console.error("Error fetching getPlayers:", error);
      }
    })();

    // Setup the interval for refreshing the data
    const intervalId = setInterval(async () => {
      try {
        const data = await checkRoomStatus({ roomCode });
        if (data && data.roomStatus) {
          setRoomStatus(data.roomStatus);
        }
      } catch (error) {
        console.error("Error fetching getPlayers on interval:", error);
      }
    }, refreshTime);

    // Navigate to PresentPage
    // Assume info has been revealed when navigating back to present room, update presentRoomInfo
    const newPresentRoomInfo: PresentRoomInfo = {
      ...presentRoomInfo,
      [fieldName]: true,
    };
    updatePresentRoomInfo({ roomCode, newPresentRoomInfo });
    if (roomStatus === RoomStatus.PRESENTING) {
      navigate("/PresentPage", {
        state: { user, admin, presenter, guests },
      });
    }
    // Clear timer and count again
    return () => clearInterval(intervalId);
    // Add other navigation conditions if needed
  }, [roomStatus, user]);

  const handleReceivedDrawing = useCallback((data: DrawingMessage) => {
    setExternalDrawing(data);
  }, []);

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
        <div className="word-display">
          {isPresenter || (admin && userID === admin.userID) ? (
            <span>Target Word: {targetWord}</span> // Show the target word to the presenter and admin
          ) : (
            <span className="underscore-display">
              {"_ ".repeat(targetWord.length).trim()}
            </span>
          )}
        </div>
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
