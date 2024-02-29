import React, { useState, useEffect, useCallback } from "react";
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "../utils/WebSocketService";
import { User } from "../type/User";
import { TimerMessage } from "../type/Timer";
import { RoomStatus } from "../type/RoomStatus";
import "../css/Timer.css";
import { TimerModal } from "../utils/Modal";
import { TimerModalMessage } from "../type/TimerModalMessage";

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
  // Track if the timer has started
  const [isTimerStarted, setIsTimerStarted] = useState<boolean>(false);
  const [render, setRender] = useState<boolean>(false);
  // Show TimerModal initially
  const [showTimerModal, setShowTimerModal] = useState<boolean>(true);

  const onTimerMessageReceived = useCallback(
    (msg: TimerMessage | TimerModalMessage) => {
      if ("show" in msg) {
        setShowTimerModal(msg.show);
      } else {
        setTimeLeft(msg.seconds);
      }
    },
    []
  );

  // Connect to Timer websokect
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
    <>
      {showTimerModal && (
        <TimerModal
          isAdmin={user.isAdmin}
          inputValue={inputValue}
          setInputValue={setInputValue}
          startTimer={startTimer}
        />
      )}
      <div className="timerContainer">
        <div>
          Time Left:{" "}
          {timeLeft !== null ? `${timeLeft}s` : "Waiting for timer..."}
        </div>
        {user.isAdmin && (
          <div
            style={{ display: "flex", flexDirection: "column", rowGap: "5px" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                rowGap: "2px",
              }}
            >
              {/* <button onClick={startTimer}>Start Timer</button> */}
              <button
                onClick={() => modifyTimer(20)}
                disabled={!isTimerStarted}
              >
                Add 20 Seconds
              </button>
              <button onClick={stopTimer} disabled={!isTimerStarted}>
                Skip Timer
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
