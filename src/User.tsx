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

// Example usage:
const user1 = new User("123", "user1", "cyber", true);
console.log(user1.roomCode);    // Output: 123
console.log(user1.userID);      // Output: user1
console.log(user1.displayName)  // Output: cyber
console.log(user1.isAdmin); // Output: true
