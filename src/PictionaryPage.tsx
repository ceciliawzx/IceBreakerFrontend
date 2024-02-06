import React, { useEffect, useCallback, useState } from "react";
import DrawingCanvas from "./pictionary/DrawingCanvas";
import ChatRoom from "./ChatRoomPage";
import { useLocation, useNavigate } from "react-router-dom";
import { DrawingData, DrawingMessage } from "./type/DrawingCanvas";
import { connect, sendMsg } from "./utils/ChatService";
import { serverPort, websocketPort } from "./macro/MacroServer";
import "./css/PictionaryPage.css";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";

const PictionaryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [externalDrawing, setExternalDrawing] = useState<DrawingMessage>();
  const user: User = location.state?.user;
  const userId = user?.userID;
  // const isDrawer = user?.isPresenter;
  const isDrawer = location.state?.isPresenter;
  const displayName = user?.displayName;
  const roomCode = user?.roomCode;
  const isAdmin = user?.isAdmin;
  const presenter: UserProfile = location.state?.presenter;
  const admin: User = location.state?.admin;
  const guests: UserProfile[] = location.state?.guests;

  const handleReceivedDrawing = useCallback((data: DrawingMessage) => {
    setExternalDrawing(data);
  }, []);

  useEffect(() => {
    console.log("location info", location.state);
    const socketUrl = `${serverPort}/chat?userId=${userId}`;
    const websocketUrl = `${websocketPort}/chat?userId=${userId}`;
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
        drawer: userId,
      };
      // console.log('Sending drawing data', drawingData);
      sendMsg(destination, drawingMessage);
    },
    [roomCode]
  );

  const handleBack = async () => {
    const url = `${serverPort}/backToPresentRoom?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
      });
      if (response.ok) {
        navigate("/PresentPage", {
          state: { user, admin, presenter, guests },
        });
      }
    } catch (error) {
      console.error("Error returning to PresentRoom:", error);
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
      </div>
      <div>
        {isAdmin && (
          <button className="admin-only-button" onClick={() => handleBack()}>
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default PictionaryPage;
