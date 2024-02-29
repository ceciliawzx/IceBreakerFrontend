import React from "react";

// Only the admin can click continue, other users will be navigated automatically
export const Modal = ({
  onClose,
  targetWord,
  userID,
  adminID,
}: {
  onClose: any;
  targetWord: string;
  userID: string;
  adminID: string;
}) => (
  <div className="overlay-popup">
    <div className="modal">
      {targetWord === "" && <h2>Back to PresentRoom</h2>}
      {targetWord !== "" && (
        <>
          <h2>Target Word Revealed!</h2>
          <p>
            The target word was: <strong>{targetWord}</strong>
          </p>
        </>
      )}
      {userID === adminID && (
        <button className="button admin-only-button" onClick={onClose}>
          Continue
        </button>
      )}
    </div>
  </div>
);

// TimerModal as a separate component
export const TimerModal = ({
  isAdmin,
  inputValue,
  setInputValue,
  startTimer,
}: {
  isAdmin: boolean;
  inputValue: string;
  setInputValue: any;
  startTimer: any;
}) => {
  return (
    <div className="overlay-popup">
      <div className="modal">
        {isAdmin && (
          <>
            <h3>Set time limit for the game</h3>
            <div style={{ marginBottom: "10px" }}></div>
            <div>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Set time"
                style={{ maxWidth: "25%" }}
              />
              <span style={{ marginLeft: "5px" }}>seconds</span>
            </div>
            <div style={{ marginBottom: "10px" }}></div>
            <div>
              <button className="button admin-only-button" onClick={startTimer}>
                Start Timer
              </button>
            </div>
          </>
        )}
        {!isAdmin && <h2>Waiting for the Timer</h2>}
      </div>
    </div>
  );
};
