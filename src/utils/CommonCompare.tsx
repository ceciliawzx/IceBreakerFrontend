import { User } from "../type/User"; // Update the path accordingly

export const isSameUser = (self: User | null, other: User | null) =>
  self?.userID === other?.userID;
