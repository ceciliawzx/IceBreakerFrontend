import React from 'react';
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
  newPresentRoomInfo,
}: {
  roomCode: string;
  newPresentRoomInfo: PresentRoomInfo;
}) => {
  const url = `${serverPort}/setPresentRoomInfo?roomCode=${roomCode}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newPresentRoomInfo),
    });
  } catch (error) {
    console.error("Error setting presentRoomInfo in backend: ", error);
  }
};
