import React, { useState, useEffect, useCallback } from "react";
import { connect, sendMsg } from "../utils/WebSocketService";
import { serverPort, websocketPort } from "../macro/MacroServer";
import { User } from "../type/User";
import { TimerMessage } from "../type/Timer";
import { RoomStatus } from "../type/RoomStatus";

// roomStatus: when timer stops, what status should the room go to
// defaultTime: set the timer to defaultTime at beginning
export const Timer = ({
  user,
  roomCode,
  roomStatus,
  defaultTime,
}: {
  user: User;
  roomCode: string;
  roomStatus: RoomStatus;
  defaultTime: number;
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const userID = user.userID;
  const [isConnected, setIsConnected] = useState(false); // Use to track connection status

  const socketUrl = `${serverPort}/chat?userId=${userID}`;
  const websocketUrl = `${websocketPort}/chat?userId=${userID}`;

  const onTimerMessageReceived = useCallback((msg: number) => {
    setTimeLeft(msg);
  }, []);

  useEffect(() => {
    // Connect to WebSocket and set up subscription
    const topic = `/topic/room/${roomCode}/timer`;
    connect(socketUrl, websocketUrl, topic, onTimerMessageReceived);
    setIsConnected(true);
  }, []);
  

  // Function to start the timer
  const startTimer = (seconds: number) => {
    const destination = `/app/room/${roomCode}/startTimer`;
    const timerMessage: TimerMessage = {
      roomCode: roomCode,
      roomStatus: roomStatus,
      seconds: seconds,
    };
    sendMsg(destination, timerMessage);
  };

//   useEffect(() => {
//     // Once connected, attempt to start the timer after a brief delay
//     if (isConnected) {
//       const delay = 2000; // Delay in milliseconds
//       setTimeout(() => startTimer(defaultTime), delay);
//     }
//   }, [isConnected]);

  // Function to send a message to modify the timer
  const modifyTimer = (seconds: number) => {
    const destination = `/app/room/${roomCode}/modifyTimer`;
    const timerMessage: TimerMessage = {
      roomCode: roomCode,
      roomStatus: roomStatus,
      seconds: seconds,
    };
    sendMsg(destination, timerMessage);
  };

  // Function to send a message to stop the timer
  const stopTimer = () => {
    const destination = `/app/room/${roomCode}/stopTimer`;
    const timerMessage: TimerMessage = {
      roomCode: roomCode,
      roomStatus: roomStatus,
      seconds: 0,
    };
    sendMsg(destination, timerMessage);
  };

  return (
    <div>
      <div>
        Timer:{" "}
        {timeLeft !== null ? `${timeLeft} seconds` : "Waiting for timer..."}
      </div>
      {user.isAdmin && (
        <div>
          <button onClick={() => startTimer(40)}>Start Timer</button>
          <button onClick={() => modifyTimer(30)}>Add 30 Seconds</button>
          <button onClick={stopTimer}>Skip Timer</button>
        </div>
      )}
    </div>
  );
};
