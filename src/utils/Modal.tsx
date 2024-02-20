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
