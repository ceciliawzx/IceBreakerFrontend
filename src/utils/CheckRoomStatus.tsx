import { serverPort } from "../macro/MacroServer";

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
