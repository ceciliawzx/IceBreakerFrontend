export { User };

class User {
  roomCode: string;
  userID: string;
  displayName: string;
  isAdmin: boolean;
  isPresenter: boolean;
  profileImage: string;
  completed: boolean;
  constructor(
    roomCode: string,
    userID: string,
    displayName: string,
    isAdmin: boolean,
    isPresenter: boolean,
    profileImage: string,
    completed: boolean
  ) {
    this.roomCode = roomCode;
    this.userID = userID;
    this.displayName = displayName;
    this.isAdmin = isAdmin;
    this.isPresenter = isPresenter;
    this.profileImage = profileImage;
    this.completed = completed;
  }
}
