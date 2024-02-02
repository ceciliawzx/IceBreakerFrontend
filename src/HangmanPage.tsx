import React, { useState, useEffect } from "react";

interface HangmanProps {
  word: string; // The word to be guessed, possibly set by the presenter
}

const hangmanStages: string[] = [
  // ASCII art for different stages of the hangman
  `
  _______
  |     |
  |     
  |      
  |     
  |    
  `,
  `
   _______
  |     |
  |     O
  |      
  |     
  |    
  `,
  `
   _______
  |     |
  |     O
  |     |
  |     
  |    
  `,
  `
   _______
  |     |
  |     O
  |    /|
  |     
  |    
  `,
  `
   _______
  |     |
  |     O
  |    /| \\
  |     
  |    
  `,
  `
   _______
  |     |
  |     O
  |    /|\\
  |    / 
  |    
  `,
  `
   _______
  |     |
  |     O
  |    /|\\
  |    / \\
  |    
  `,
];

const Hangman: React.FC<HangmanProps> = ({ word }) => {
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);

  const guessLetter = (letter: string) => {
    if (!guessedLetters.includes(letter)) {
      setGuessedLetters([...guessedLetters, letter]);
      if (!word.includes(letter)) {
        setMistakes(mistakes + 1);
      }
    }
  };

  const displayWord = word
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  return (
    <div>
      <div id="hangman-container">
        <pre id="hangman-ascii">
          <p>{hangmanStages[mistakes]}</p>
        </pre>
      </div>

      <p>{displayWord}</p>
      <div>
        {"abcdefghijklmnopqrstuvwxyz".split("").map((letter) => (
          <button
            key={letter}
            onClick={() => guessLetter(letter)}
            disabled={guessedLetters.includes(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Hangman;
