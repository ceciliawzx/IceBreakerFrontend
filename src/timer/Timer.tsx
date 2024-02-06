import React, { useState, useEffect, useCallback } from "react";
import { connect, sendMsg } from "../utils/WebSocketService";
import { serverPort, websocketPort } from "../macro/MacroServer";
import { User } from "../type/User";
import { TimerMessage } from "../type/Timer";
import { RoomStatus } from "../type/RoomStatus";
import "../css/Timer.css";

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
  // Use a string state to handle the input directly
  const [inputValue, setInputValue] = useState<string>(defaultTime.toString());
  const userID = user.userID;

  const socketUrl = `${serverPort}/chat?userId=${userID}`;
  const websocketUrl = `${websocketPort}/chat?userId=${userID}`;

  const onTimerMessageReceived = useCallback((msg: number) => {
    setTimeLeft(msg);
  }, []);

  useEffect(() => {
    // Connect to WebSocket and set up subscription
    const topic = `/topic/room/${roomCode}/timer`;
    connect(socketUrl, websocketUrl, topic, onTimerMessageReceived);
    setInputValue(defaultTime.toString());
  }, []);
  

  const startTimer = useCallback(() => {
    const seconds = inputValue.trim() === "" ? defaultTime : Number(inputValue);
    const destination = `/app/room/${roomCode}/startTimer`;
    const timerMessage: TimerMessage = {
      roomCode: roomCode,
      roomStatus: roomStatus,
      seconds: seconds,
    };
    sendMsg(destination, timerMessage);
  }, [roomCode, roomStatus, inputValue, defaultTime]);

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
    <div className="timerContainer">
      <div>
        Time Left:{" "}
        {timeLeft !== null ? `${timeLeft}s` : "Waiting for timer..."}
      </div>
      {user.isAdmin && (
        <div
          style={{ display: "flex", flexDirection: "column", rowGap: "5px" }}
        >
          <div>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Set time"
              style={{maxWidth: '80%'}}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", rowGap: "2px" }}>
            <button onClick={startTimer}>Start Timer</button>
            <button onClick={() => modifyTimer(20)}>Add 20 Seconds</button>
            <button onClick={stopTimer}>Skip Timer</button>
          </div>
        </div>
      )}
    </div>
  );
};
