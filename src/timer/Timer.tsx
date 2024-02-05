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
  const [timeLeft, setTimeLeft] = useState(null);
  const userID = user.userID;
  const socketUrl = `${serverPort}/chat?userId=${userID}`;
  const websocketUrl = `${websocketPort}/chat?userId=${userID}`;

  // Callback function to handle incoming timer messages
  const onTimerMessageReceived = useCallback((msg: any) => {
    setTimeLeft(msg);
  }, []);

  // Connect to websocket and start timer
  useEffect(() => {
    // Define the topic to subscribe to for timer updates
    const topic = `/topic/room/${roomCode}/timer`;
    // Connect to WebSocket and subscribe to the timer topic
    const client = connect(socketUrl, websocketUrl, topic, onTimerMessageReceived);

    // Start the timer automatically
    startTimer(defaultTime);

    return () => {
      if (client) {
        client.deactivate(); // Clean up on component unmount
      }
    };
  }, []);

  // Function to start the timer
  const startTimer = (seconds: number) => {
    const destination = `/app/room/${roomCode}/startTimer`;
    const timerMessage = {
      roomCode,
      roomStatus,
      seconds,
    };
    sendMsg(destination, timerMessage);
  };

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
          <button onClick={() => modifyTimer(30)}>Add 30 Seconds</button>
          <button onClick={stopTimer}>Skip Timer</button>
        </div>
      )}
    </div>
  );
};
