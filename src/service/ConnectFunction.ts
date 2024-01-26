import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { serverPort, websocketPort } from "../macro/MacroServer";

export interface ChatMessage {
  roomCode: string;
  content: string;
  timestamp: string;
  sender: string;
  senderId: string;
}

const connect = (
  onMessageReceived: (msg: any) => void,
  roomCode: string,
  userID: string
) => {
  const socketUrl = `${serverPort}/chat?userId=${userID}`;
  const websocketUrl = `${websocketPort}/chat?userId=${userID}`;

  const socket = new SockJS(socketUrl);
  const client = new Client({
    brokerURL: websocketUrl,
    webSocketFactory: () => socket,
    onConnect: () => {
      console.log("Connected to STOMP server"); // Logging connection
      setTimeout(() => {
        if (client && client.connected) {
          console.log("Subscribing to /topic/room");
          client.subscribe(`/topic/room/${roomCode}`, (message) => {
            onMessageReceived(JSON.parse(message.body));
          });
        } else {
          console.error("STOMP client is not connected");
        }
      }, 1000); // Delay of 1 second
    },
    onStompError: (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    },
  });

  client.activate();

  console.log("client activate");
  return client;
};

const sendMsg = (msg: any, client: Client) => {
  if (client && client.connected) {
    client.publish({
      destination: `/app/room/${msg.roomCode}/sendMessage`,
      body: JSON.stringify(msg),
    });
  }
};

export { connect, sendMsg };
