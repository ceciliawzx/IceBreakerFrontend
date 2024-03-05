import React, { useState } from "react";

// Only the admin can click continue, other users will be navigated automatically
export const Modal = ({
  onClose,
  isAdmin,
  modalContent,
}: {
  onClose: any;
  isAdmin: boolean;
  modalContent: JSX.Element;
}) => (
  <div className="overlay-popup">
    <div className="modal">
      {modalContent}
      {isAdmin && (
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
  const min = 1;
  const max = 86400;
  const [inputError, setInputError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Allow clearing the input
    if (newValue.trim() === "") {
      setInputValue("");
    }

    // Check if the newValue is strictly a positive integer using regex
    if (/^\d+$/.test(newValue)) {
      // \d matches any digit [0-9]
      setInputValue(newValue);
    } else {
      setInputError("Please enter a valid positive integer.");
      return;
    }

    // Check if the value is within the allowed range
    if (Number(newValue) < min) {
      setInputError(`The time must be at least ${min} second.`);
    } else if (Number(newValue) > max) {
      setInputError(`The time must be less than ${max} seconds.`);
    } else {
      setInputError(""); // Clear error message if the value is valid
    }
  };

  return (
    <div className="overlay-popup">
      <div className="modal">
        {isAdmin && (
          <>
            <h3>Set time limit for the game</h3>
            <div style={{ marginBottom: "10px" }}></div>
            <div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e)}
                placeholder="Set time"
                style={{ maxWidth: "25%" }}
                min={1}
                max={86400}
              />
              <span style={{ marginLeft: "5px" }}>seconds</span>
            </div>
            <div style={{ marginBottom: "10px" }}></div>
            <div>
              <button className="button admin-only-button" onClick={startTimer}>
                Start Timer
              </button>
            </div>
            {inputError && (
              <div style={{ color: "red", marginTop: "10px" }}>
                {inputError}
              </div>
            )}
          </>
        )}
        {!isAdmin && <h2>Waiting for the Timer</h2>}
      </div>
    </div>
  );
};
