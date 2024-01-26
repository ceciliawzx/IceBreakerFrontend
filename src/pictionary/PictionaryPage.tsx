import React, { useEffect, useCallback, useState } from 'react';
import DrawingCanvas from './DrawingCanvas';
import { useLocation } from 'react-router-dom';
import { DrawingMessage } from '../utils/DrawingCanvasConstants';
import { connect, sendMsg } from '../utils/ChatService';
import { serverPort, websocketPort } from '../MacroConst';

const PictionaryPage = () => {
  const location = useLocation();
  const [externalDrawing, setExternalDrawing] = useState<DrawingMessage>();
  const user = location.state?.user;
  const userId = user?.userID;
  const isDrawer = user?.isPresenter;
  const displayName = user?.displayName;
  const roomCode = user?.roomCode;


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

  const handleDraw = useCallback(
    ({ x, y, drawing }: { x: number; y: number; drawing: boolean }) => {
      const destination = `/app/room/${roomCode}/sendDrawing`;
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
    <div className='drawing-canvas'>
      <DrawingCanvas
        isDrawer={isDrawer}
        onDraw={handleDraw}
        externalDrawing={externalDrawing}
      />
    </div>
  );
};

export default PictionaryPage;
