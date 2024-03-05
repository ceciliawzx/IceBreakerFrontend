import React, { useState } from "react";

/* CSS */
import "./css/Instructions.css";

/* Type for instrctions */
type InstructionPic = {
  img: string;
  text: string;
};

type InstructionsProps = {
  instructionPics: InstructionPic[];
  onlyShowPopup?: boolean;
  closeButtonFunction?: any;
};

const Instructions: React.FC<InstructionsProps> = ({
  instructionPics,
  onlyShowPopup = false,
  closeButtonFunction = null,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentInstructionPage, setCurrentInstructionPage] = useState(0);

  /* -------- Button Handler ---------- */

  /* When click PrevPage button */
  const handlePrevInstruction = () => {
    setCurrentInstructionPage((prev) => (prev > 0 ? prev - 1 : 0));
  };

  /* When click NextPage button */
  const handleNextInstruction = () => {
    setCurrentInstructionPage((prev) =>
      prev < instructionPics.length - 1 ? prev + 1 : prev
    );
  };

  /* -------- UI Component ---------- */

  /* The popup component of instruction */
  const InstructionPopup = () => {
    return (
      <div>
        {/* Instruction Popup */}
        <div className="instruction-modal">
          <div className="instruction-content">
            <img
              src={instructionPics[currentInstructionPage].img}
              alt={`Instruction ${currentInstructionPage + 1}`}
            />

            <div className="page-indicator">
              {currentInstructionPage + 1} / {instructionPics.length}
            </div>
            <div className="instruction-navigation">
              {currentInstructionPage !== 0 && (
                <button
                  className="button common-button"
                  onClick={handlePrevInstruction}
                  disabled={currentInstructionPage === 0}
                >
                  Prev
                </button>
              )}
              {currentInstructionPage !== instructionPics.length - 1 && (
                <button
                  className="button common-button"
                  onClick={handleNextInstruction}
                  disabled={
                    currentInstructionPage === instructionPics.length - 1
                  }
                >
                  Next
                </button>
              )}
            </div>
            <button
              className="button red-button close-instruction-container"
              onClick={() =>
                closeButtonFunction !== null
                  ? closeButtonFunction()
                  : setShowInstructions(false)
              }
              style={{}}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* Main renderer */
  return (
    <>
      {onlyShowPopup ? (
        <InstructionPopup />
      ) : (
        <div style={{ zIndex: "var(--instruction-layer)" }}>
          {/* Instruction Button */}
          <button
            className="instruction-button"
            onClick={() => setShowInstructions(true)}
          >
            i
          </button>
          {/* Instruction Popup */}
          {showInstructions && <InstructionPopup />}
        </div>
      )}
    </>
  );
};

export default Instructions;
