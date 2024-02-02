import React, { useEffect, useCallback, useState } from 'react';
import DrawingCanvas from './pictionary/DrawingCanvas';
import ChatRoom from './ChatRoomPage';
import { useLocation } from 'react-router-dom';
import { DrawingData, DrawingMessage } from './type/DrawingCanvas';
import { connect, sendMsg } from './utils/ChatService';
import { serverPort, websocketPort } from './macro/MacroServer';
import './css/PictionaryPage.css';
import { User } from './type/User';

const PictionaryPage = () => {
  const location = useLocation();
  const [externalDrawing, setExternalDrawing] = useState<DrawingMessage>();
  const user: User = location.state?.user;
  const userId = user?.userID;
  // const isDrawer = user?.isPresenter;
  const isDrawer = location.state?.isPresenter;
  const displayName = user?.displayName;
  const roomCode = user?.roomCode;

  const handleReceivedDrawing = useCallback((data: DrawingMessage) => {
    setExternalDrawing(data);
  }, []);

  useEffect(() => {
    console.log('location info', location.state);
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

  return (
    <div className='pictionary-page'>
      <div className='chat-room-container'>
        <ChatRoom />
      </div>
      <div className='drawing-canvas-container'>
        <DrawingCanvas
          isDrawer={isDrawer}
          onDraw={handleDraw}
          externalDrawing={externalDrawing}
        />
      </div>
    </div>
  );
};

export default PictionaryPage;
