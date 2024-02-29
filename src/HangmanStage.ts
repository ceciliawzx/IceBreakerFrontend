const hangmanStages: string[] = [
  // ASCII art for different stages of the hangman
  `
    _______
    |     |
    |      
    |      
    |      
    |      
    |      
  _______ 
  `,
  `
    _______
    |     | 
    |     O 
    |       
    |       
    |       
    |       
  _______ 
  `,
  `
    _______
    |     |
    |     O
    |     |
    |      
    |      
    |      
  _______
  `,
  `
    _______
    |     |
    |     O
    |    /|
    |      
    |      
    |      
  _______ 
  `,
  `
    _______
    |     |
    |     O
     |    /|\\
    |      
    |      
    |      
  _______
  `,
  `
    _______
    |     |
    |     O
     |    /|\\
    |    / 
    |      
    |      
  _______
  `,
  `
    _______
    |     |
    |     O
    |    /|\\
    |    / \\
    |      
    |      
  _______ 
  `,
];

export default hangmanStages;
