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
import { websocketPort, serverPort } from "../macro/MacroServer";

export const Timer = ({
  user,
  roomCode,
  roomStatus,
  defaultTime,
  useFloatTimer = false,
  
}: {
  user: User;
  roomCode: string;
  roomStatus: RoomStatus;
  defaultTime: number;
  useFloatTimer?: boolean;
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>(defaultTime.toString());
  const userID = user.userID;
  // Track if the timer has started
  const [isTimerStarted, setIsTimerStarted] = useState<boolean>(false);
  const [render, setRender] = useState<boolean>(false);
  const [showTimerModal, setShowTimerModal] = useState<boolean>();

  // Initially check for showTimerModal
  useEffect(() => {
    checkShowTimerModal();
  }, [render]);

  const checkShowTimerModal = async () => {
    const url = `${serverPort}/getShowTimerModal?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data) {
        setShowTimerModal(data.showTimerModal);
      }
    } catch (error) {
      console.error("Error fetching player:", error);
    }
  };

  const onTimerMessageReceived = useCallback(
    (msg: TimerMessage | TimerModalMessage) => {
      if ("show" in msg) {
        checkShowTimerModal();
      } 
      else {
        if (msg.started) {
          setIsTimerStarted(true);
        }
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

  const calculateProgress = () => {
    if (timeLeft === null || timeLeft === 0) return 0;
    const percentageLeft = (timeLeft / defaultTime) * 100;
    return Math.min(percentageLeft, 100);
  };

  // Timer component
  const TimerContent = () => {
    return (
      <div className="timerContainer">
        <div>
          {timeLeft !== null ? (
            <div>
              <strong><span>Time Left: {timeLeft}s</span></strong>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${calculateProgress()}%`,
                  }}
                ></div>
              </div>
            </div>
          ) : (
            "Waiting for timer..."
          )}
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
                className="button small-button admin-only-button"
                onClick={() => modifyTimer(20)}
                disabled={!isTimerStarted}
              >
                + 20 Seconds
              </button>
              <button
                className="button small-button admin-only-button"
                onClick={stopTimer}
                disabled={!isTimerStarted}
              >
                Skip Timer
              </button>
            </div>
          </div>
        )}
      </div>
    );
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

      {useFloatTimer && (
        <div className="float-timer">
          <TimerContent />
        </div>
      )}

      {!useFloatTimer && <TimerContent />}
    </>
  );
};
