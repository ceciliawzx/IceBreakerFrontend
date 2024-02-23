import React, { useState, useEffect, useCallback } from "react";
import { connect, sendMsg } from "../utils/WebSocketService";
import { serverPort, websocketPort } from "../macro/MacroServer";
import { User } from "../type/User";
import { TimerMessage } from "../type/Timer";
import { RoomStatus } from "../type/RoomStatus";
import "../css/Timer.css";

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
  const [inputValue, setInputValue] = useState<string>(defaultTime.toString());
  const userID = user.userID;

  // New state to track if the timer has started
  const [isTimerStarted, setIsTimerStarted] = useState<boolean>(false);

  const socketUrl = `${serverPort}/chat?userId=${userID}`;
  const websocketUrl = `${websocketPort}/chat?userId=${userID}`;

  const [render, setRender] = useState(false);

  const onTimerMessageReceived = useCallback((msg: number) => {
    setTimeLeft(msg);
  }, []);

  // Connect to websokect
  useEffect(() => {
    const topic = `/topic/room/${roomCode}/timer`;
    const cleanup = connect(
      socketUrl,
      websocketUrl,
      topic,
      onTimerMessageReceived,
      setRender
    );
    return cleanup;
  }, []);

  // Set input time value
  useEffect(() => {
    setInputValue(defaultTime.toString());
  }, [defaultTime]);

  const startTimer = useCallback(() => {
    const seconds = inputValue.trim() === "" ? defaultTime : Number(inputValue);
    const destination = `/app/room/${roomCode}/startTimer`;
    const timerMessage: TimerMessage = {
      roomCode,
      roomStatus,
      seconds,
    };
    sendMsg(destination, timerMessage);
    setIsTimerStarted(true); // Set the timer as started
  }, [roomCode, roomStatus, inputValue, defaultTime]);

  // Ensure the functions modifyTimer and stopTimer also respect the isTimerStarted state if needed
  const modifyTimer = (seconds: number) => {
    if (!isTimerStarted) return; // Prevent modification if timer hasn't started
    const destination = `/app/room/${roomCode}/modifyTimer`;
    const timerMessage: TimerMessage = {
      roomCode: roomCode,
      roomStatus: roomStatus,
      seconds: seconds,
    };
    sendMsg(destination, timerMessage);
  };

  const stopTimer = () => {
    if (!isTimerStarted) return; // Prevent stopping if timer hasn't started
    const destination = `/app/room/${roomCode}/stopTimer`;
    const timerMessage: TimerMessage = {
      roomCode: roomCode,
      roomStatus: roomStatus,
      seconds: 0,
    };
    setIsTimerStarted(false); // reset the timer start state
    sendMsg(destination, timerMessage);
  };

  return (
    <div className="timerContainer">
      <div>
        Time Left: {timeLeft !== null ? `${timeLeft}s` : "Waiting for timer..."}
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
              style={{ maxWidth: "80%" }}
            />
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", rowGap: "2px" }}
          >
            <button onClick={startTimer}>Start Timer</button>
            <button onClick={() => modifyTimer(20)} disabled={!isTimerStarted}>
              Add 20 Seconds
            </button>
            <button onClick={stopTimer} disabled={!isTimerStarted}>
              Skip Timer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
