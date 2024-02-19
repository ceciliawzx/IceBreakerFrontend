import { User } from "../type/User"; // Update the path accordingly

export const isSameUser = (self: User, other: User) =>
  self.userID === other.userID;
