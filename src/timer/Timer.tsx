import React, { useState, useEffect, useCallback } from "react";

/* Macro and Type */
import { serverPort } from "../macro/MacroServer";
import { User } from "../type/User";
import { RoomStatus } from "../type/RoomStatus";

/* Web socket */
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "../utils/WebSocketService";
import { TimerMessage } from "../type/Timer";

/* Modal */
import { TimerModal } from "../utils/Modal";

/* CSS */
import "../css/Timer.css";

export const Timer = ({
  user,
  roomCode,
  roomStatus,
  defaultTime,
  timerClassName,
}: {
  user: User;
  roomCode: string;
  roomStatus: RoomStatus;
  defaultTime: number;
  timerClassName?: string;
}) => {
  /* Timer related */
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>(defaultTime.toString());
  const [isTimerStarted, setIsTimerStarted] = useState<boolean>(false);

  /* Modal */
  const [showTimerModal, setShowTimerModal] = useState<boolean>();

  /* UI render */
  const [render, setRender] = useState<boolean>(false);

  /* -------- Use Effect ---------- */

  /* When mount, connect to websocket */
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

  /* When rendered, initial pull */
  useEffect(() => {
    checkShowTimerModal();
  }, [render]);

  /* When get default time, set input time value */
  useEffect(() => {
    setInputValue(defaultTime.toString());
  }, [defaultTime]);

  /* -------- Web Socket ---------- */

  /* When receive message from websocket */
  const onTimerMessageReceived = useCallback((msg: TimerMessage) => {
    if (msg.started) {
      setShowTimerModal(false);
      setIsTimerStarted(true);
    }
    setTimeLeft(msg.seconds);
  }, []);

  /* -------- Button Handler ---------- */

  /* When admin click StartTimer button */
  const handleStartTimer = useCallback(() => {
    const seconds = inputValue.trim() === "" ? defaultTime : Number(inputValue);
    const destination = `/app/room/${roomCode}/startTimer`;
    const timerMessage: TimerMessage = {
      roomCode,
      roomStatus,
      seconds,
    };
    sendMsg(destination, timerMessage);
  }, [roomCode, roomStatus, inputValue, defaultTime]);

  /* When admin modify timer or click +20Second button */
  // Ensure the functions modifyTimer and stopTimer also respect the isTimerStarted state if needed
  const handleModifyTimer = (seconds: number) => {
    if (!isTimerStarted) return; // Prevent modification if timer hasn't started
    const destination = `/app/room/${roomCode}/modifyTimer`;
    const timerMessage: TimerMessage = {
      roomCode: roomCode,
      roomStatus: roomStatus,
      seconds: seconds,
    };
    sendMsg(destination, timerMessage);
  };

  /* When admin click SkipTimer button */
  const handleSkipTimer = () => {
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

  /* -------- Check status ---------- */

  /* Check if need to show modal */
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

  /* -------- Helper function ---------- */

  /* Calculate the width of progress bar */
  const calculateProgress = () => {
    if (timeLeft === null || timeLeft === 0) return 0;
    const percentageLeft = (timeLeft / defaultTime) * 100;
    return Math.min(percentageLeft, 100);
  };

  /* -------- UI Component ---------- */

  /* Timer component */
  const TimerContent = () => {
    return (
      <div className="timerContainer">
        <div>
          {timeLeft !== null ? (
            <div>
              <strong>
                <span>Time Left: {timeLeft}s</span>
              </strong>
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
                onClick={() => handleModifyTimer(20)}
                disabled={!isTimerStarted}
              >
                + 20 Seconds
              </button>
              <button
                className="button small-button admin-only-button"
                onClick={handleSkipTimer}
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

  /* Main renderer */
  return (
    <>
      {showTimerModal && (
        <TimerModal
          isAdmin={user.isAdmin}
          inputValue={inputValue}
          setInputValue={setInputValue}
          startTimer={handleStartTimer}
        />
      )}

      <div className={timerClassName ? timerClassName : ""}>
        <TimerContent />
      </div>
    </>
  );
};
