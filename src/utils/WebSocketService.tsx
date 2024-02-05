import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let client: Client | null = null;

const connect = (
  socketUrl: string,
  webSocketUrl: string,
  subscriptions: { topic: string, onMessageReceived: (msg: any) => void }[]
) => {
  const socket = new SockJS(socketUrl);
  const client = new Client({
    brokerURL: webSocketUrl,
    webSocketFactory: () => socket,
    onConnect: () => {
      console.log("Connected to STOMP server");
      subscriptions.forEach((sub) => {
        setTimeout(() => {
          if (client && client.connected) {
            console.log(`Subscribing to topic ${sub.topic}`);
            client.subscribe(sub.topic, (message) => {
              sub.onMessageReceived(JSON.parse(message.body));
            });
          } else {
            console.error("STOMP client is not connected");
          }
        }, 1000); // Delay of 1 second to ensure subscriptions are set up properly
      });
    },
    onStompError: (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    },
  });

  client.activate();
  return client; // Returning client
};


const sendMsg = (destination: string, msg: any) => {
  if (client && client.connected) {
    client.publish({ destination: destination, body: JSON.stringify(msg) });
  }
};

export { connect, sendMsg };
