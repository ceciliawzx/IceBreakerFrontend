import React, { useEffect, useCallback, useState } from 'react';
import DrawingCanvas from './DrawingCanvas';
import { useLocation } from 'react-router-dom';
import { DrawingMessage } from '../utils/DrawingCanvasConstants';
import { connect, sendMsg } from '../utils/ChatService';
import { serverPort, websocketPort } from '../MacroConst';

const PictionaryPage = () => {
  const location = useLocation();
  const [externalDrawing, setExternalDrawing] = useState<DrawingMessage>();
  const isDrawer = location.state?.isDrawer;

  const user = location.state?.user;
  const userId = user?.userID;
  const displayName = user?.displayName;
  const roomCode = user?.roomCode;

  const handleReceivedDrawing = useCallback((data: DrawingMessage) => {
    setExternalDrawing(data);
  }, []);

  const socketUrl = `${serverPort}/chat?userId=${userId}`;
  const websocketUrl = `${websocketPort}/chat?userId=${userId}`;
  const topic = `/topic/room/${roomCode}/drawing`;
  const destination = `/app/room/${roomCode}/sendDrawing`;

  useEffect(() => {
    connect(socketUrl, websocketUrl, topic, handleReceivedDrawing);
  }, []);

  const handleDraw = useCallback(
    ({ x, y, drawing }: { x: number; y: number; drawing: boolean }) => {
      const drawingData = {
        x,
        y,
        drawing,
        color: 'black', 
        strokeWidth: 2, 
      };
      sendMsg(destination, {
        roomCode,
        drawingData,
        timestamp: new Date().toISOString(),
        drawer: userId,
      });
    },
    [roomCode]
  );


  // Now pass externalDrawing to DrawingCanvas
  return (
    <div className='App'>
      <header className='App-header'>
        <DrawingCanvas isDrawer={isDrawer} onDraw={handleDraw} externalDrawing={externalDrawing} />
      </header>
    </div>
  );
};

export default PictionaryPage;
