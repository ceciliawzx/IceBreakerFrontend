import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let client: Client | null = null;

const connect = (
  socketUrl: string,
  webSocketUrl: string,
  topic: string,
  onMessageReceived: (msg: any) => void,
  setRender: (render: boolean) => void
) => {
  const socket = new SockJS(socketUrl);
  client = new Client({
    brokerURL: webSocketUrl,
    webSocketFactory: () => socket,
    onConnect: () => {
      console.log("Connected to STOMP server"); // Logging connection
      setTimeout(() => {
        if (client && client.connected) {
          setRender(true);
          console.log(`Subscribing to topic ${topic}`);
          client.subscribe(topic, (message) => {
            console.log("receiving message ", message.body);
            onMessageReceived(JSON.parse(message.body));
          });
        } else {
          console.error("STOMP client is not connected");
        }
      }, 100); // Delay of 0.1 second
    },
    onStompError: (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
    },
  });
  client.activate();
  return client;
};

const sendMsg = (destination: string, msg: any) => {
  if (client && client.connected) {
    client.publish({ destination: destination, body: JSON.stringify(msg) });
  }
};

export { connect, sendMsg };
