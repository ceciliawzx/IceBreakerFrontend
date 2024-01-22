export {User};

class User {
  roomCode: string;
  userID: string;
  displayName: string;
  isAdmin: boolean;

  constructor(
    roomCode: string,
    userID: string,
    displayName: string,
    isAdmin: boolean
  ) {
    this.roomCode = roomCode;
    this.userID = userID;
    this.displayName = displayName;
    this.isAdmin = isAdmin;
  }
}
