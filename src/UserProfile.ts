import { User } from "./User";

export { UserProfile };

class UserProfile {
  displayName: string;
  roomCode: string;
  userID: string;
  profileImage: string;

  firstName: string;
  lastName: string;
  country: string;
  city: string;

  feeling: string;
  favFood: string;
  favActivity: string;

  constructor(
    user: User,
    firstName: string,
    lastName: string,
    country: string,
    city: string,
    felling: string,
    favFood: string,
    favActivity: string,
    profileImage: string
  ) {
    this.roomCode = user.roomCode;
    this.userID = user.userID;
    this.displayName = user.displayName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.country = country;
    this.city = city;
    this.feeling = felling;
    this.favFood = favFood;
    this.favActivity = favActivity;
    this.profileImage = profileImage;
  }
}
