export {};

class User {
  roomCode: string;
  userId: string;

  constructor(roomCode: string, userId: string) {
    this.roomCode = roomCode;
    this.userId = userId;
  }

}

// Example usage:
const user1 = new User("123", "user1");
console.log(user1.roomCode); // Output: 123
console.log(user1.userId); // Output: user1
