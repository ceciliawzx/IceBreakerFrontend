export enum LetterStatus {
  UNCHECKED = "UNCHECKED",
  GREY = "GREY",
  YELLOW = "YELLOW",
  GREEN = "GREEN",
}

export class WordleLetter {
  private value: string;
  private status: LetterStatus;

  constructor(value: string, status: LetterStatus) {
    this.value = value;
    this.status = status;
  }

  // Getter for the value
  getValue(): string {
    return this.value;
  }

  // Setter for the value
  setValue(newValue: string): void {
    this.value = newValue;
  }

  // Getter for the status
  getStatus(): LetterStatus {
    return this.status;
  }

  // Setter for the status
  setStatus(newStatus: LetterStatus): void {
    this.status = newStatus;
  }
}
