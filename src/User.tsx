export { User };

class User {
  roomCode: string;
  userID: string;
  displayName: string;
  isAdmin: boolean;
  isPresenter: boolean;
  profileImage: string;

  constructor(
    roomCode: string,
    userID: string,
    displayName: string,
    isAdmin: boolean,
    isPresenter: boolean,
    profileImage: string
  ) {
    this.roomCode = roomCode;
    this.userID = userID;
    this.displayName = displayName;
    this.isAdmin = isAdmin;
    this.isPresenter = isPresenter;
    this.profileImage = profileImage;
  }
}
