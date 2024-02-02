export enum LetterStatus {
  UNCHECKED = "UNCHECKED",
  GREY = "GREY",
  YELLOW = "YELLOW",
  GREEN = "GREEN",
}

export class WordleLetter {
  private letter: string;
  private state: LetterStatus;

  constructor(value: string, status: LetterStatus) {
    this.letter = value;
    this.state = status;
  }

  // Getter for the value
  getLetter(): string {
    return this.letter;
  }

  // Setter for the value
  setLetter(newValue: string): void {
    this.letter = newValue;
  }

  // Getter for the status
  getState(): LetterStatus {
    return this.state;
  }

  // Setter for the status
  setState(newStatus: LetterStatus): void {
    this.state = newStatus;
  }
}
