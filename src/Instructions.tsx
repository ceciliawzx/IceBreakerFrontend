import React, { useState } from 'react';
import "./css/Instructions.css";

// Define a type for the instruction data
type InstructionPic = {
  img: string;
  text: string;
};

type InstructionsProps = {
  instructionPics: InstructionPic[];
};

const Instructions: React.FC<InstructionsProps> = ({ instructionPics }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentInstructionPage, setCurrentInstructionPage] = useState(0);
 
   const showPrevInstruction = () => {
     setCurrentInstructionPage(prev => prev > 0 ? prev - 1 : 0);
   };
   
   const showNextInstruction = () => {
     setCurrentInstructionPage(prev => prev < instructionPics.length - 1 ? prev + 1 : prev);
   };
   
 
 

  return (
    <div>
      {/* Instruction Button */}
      <button className="instruction-button" onClick={() => setShowInstructions(true)}>
        ?
      </button>

      {/* Instruction Popup */}
      {showInstructions && (
        <div className="instruction-modal">
          <div className="instruction-content">
            <img src={instructionPics[currentInstructionPage].img} alt={`Instruction ${currentInstructionPage + 1}`} />
            <p>{instructionPics[currentInstructionPage].text}</p>
            <div className="instruction-navigation">
              <button onClick={showPrevInstruction} disabled={currentInstructionPage === 0}>
                Prev
              </button>
              <button onClick={showNextInstruction} disabled={currentInstructionPage === instructionPics.length - 1}>
                Next
              </button>
            </div>
            <button className="close-instruction" onClick={() => setShowInstructions(false)}>
              &times; {/* This is the 'X' character */}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instructions;
