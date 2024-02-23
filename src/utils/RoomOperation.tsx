import React from "react";
import { serverPort } from "../macro/MacroServer";
import { PresentRoomInfo } from "../type/PresentRoomInfo";

export const checkRoomStatus = async ({ roomCode }: { roomCode: string }) => {
  const url = `${serverPort}/getPlayers?roomCode=${roomCode}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Room cannot be found");
    }
    const data = await response.json();
    if (data) {
      return data;
    }
  } catch (error) {
    console.error("Error fetching getPlayers:", error);
  }
};

// To reveal information in PresentPage when returning from a game
export const updatePresentRoomInfo = async ({
  roomCode,
  field,
}: {
  roomCode: string;
  field: keyof PresentRoomInfo;
}) => {
  if (!roomCode || !field) return;
  const url = `${serverPort}/setPresentRoomInfo?roomCode=${roomCode}&field=${field}`;
  try {
    const response = await fetch(url, {
      method: "POST",
    });
  } catch (error) {
    console.error("Error setting presentRoomInfo in backend: ", error);
  }
};
