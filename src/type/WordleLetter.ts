/* Letter Status used in Wordle and GeoGuesser */
export enum LetterStatus {
  UNCHECKED = "UNCHECKED",
  GREY = "GREY",
  YELLOW = "YELLOW",
  GREEN = "GREEN",
}

export class WordleLetter {
  letter: string;
  state: LetterStatus;

  constructor(value: string, status: LetterStatus) {
    this.letter = value;
    this.state = status;
  }

  // Setter for the value
  setLetter(newValue: string): void {
    this.letter = newValue;
  }

  // Setter for the status
  setState(newStatus: LetterStatus): void {
    this.state = newStatus;
  }
}
